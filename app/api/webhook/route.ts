import { NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { getSupabaseAdmin } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const stripe = getStripe()
  const supabaseAdmin = getSupabaseAdmin()

  const body = await req.text()
  const sig = req.headers.get('stripe-signature')!

  let event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err) {
    console.error('Webhook signature error:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as { customer_email?: string; subscription?: string }
    const email = session.customer_email
    const subscriptionId = session.subscription

    if (email) {
      await supabaseAdmin
        .from('worksheet_users')
        .upsert({ email, subscription_id: subscriptionId, subscribed: true, updated_at: new Date().toISOString() }, { onConflict: 'email' })
    }
  }

  if (event.type === 'customer.subscription.deleted') {
    const sub = event.data.object as { id: string }
    await supabaseAdmin
      .from('worksheet_users')
      .update({ subscribed: false, updated_at: new Date().toISOString() })
      .eq('subscription_id', sub.id)
  }

  return NextResponse.json({ received: true })
}
