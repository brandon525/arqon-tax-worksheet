import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const { email, name, input, result } = await req.json()

    if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 })

    const supabaseAdmin = getSupabaseAdmin()

    await supabaseAdmin
      .from('worksheet_users')
      .upsert({ email, name, updated_at: new Date().toISOString() }, { onConflict: 'email' })

    const { error } = await supabaseAdmin
      .from('worksheet_assessments')
      .insert({ email, name, input, result, created_at: new Date().toISOString() })

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json({ error: 'Failed to save' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
