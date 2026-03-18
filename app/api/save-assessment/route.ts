import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { Resend } from 'resend'

function fmt(n: number) {
  return n?.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }) ?? '$0'
}

function pct(n: number) {
  return n != null ? (n * 100).toFixed(1) + '%' : '0%'
}

export async function POST(req: NextRequest) {
  try {
    const { email, name, input, result } = await req.json()

    if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 })

    const supabaseAdmin = getSupabaseAdmin()

    // Upsert user
    const { error: userError } = await supabaseAdmin
      .from('worksheet_users')
      .upsert({ email, name, updated_at: new Date().toISOString() }, { onConflict: 'email' })

    if (userError) console.error('Supabase user upsert error:', userError)

    // Save assessment
    const { error: assessmentError } = await supabaseAdmin
      .from('worksheet_assessments')
      .insert({ email, name, input, result, created_at: new Date().toISOString() })

    if (assessmentError) console.error('Supabase assessment error:', assessmentError)

    // Send email notification to Brandon
    if (process.env.RESEND_API_KEY) {
      const resend = new Resend(process.env.RESEND_API_KEY)
      try {
        await resend.emails.send({
          from: 'Tax Flow Worksheet <remi@arqontax.com>',
          to: 'brandon@arqontax.com',
          subject: `New worksheet lead: ${name || email}`,
          html: `
            <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
              <div style="background:#0a1628;padding:24px;border-radius:12px 12px 0 0;">
                <h2 style="color:#c9a84c;margin:0;">New Tax Flow Worksheet Lead</h2>
              </div>
              <div style="background:#fff;padding:24px;border:1px solid #e5e7eb;border-radius:0 0 12px 12px;">
                <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
                  <tr><td style="padding:6px 0;color:#6b7280;font-size:14px;width:80px;">Name</td><td style="padding:6px 0;font-weight:600;color:#0a1628;">${name || 'Not provided'}</td></tr>
                  <tr><td style="padding:6px 0;color:#6b7280;font-size:14px;">Email</td><td style="padding:6px 0;"><a href="mailto:${email}" style="color:#c9a84c;">${email}</a></td></tr>
                  <tr><td style="padding:6px 0;color:#6b7280;font-size:14px;">Tax Year</td><td style="padding:6px 0;color:#0a1628;">${result?.taxYear ?? '—'}</td></tr>
                  <tr><td style="padding:6px 0;color:#6b7280;font-size:14px;">Filing</td><td style="padding:6px 0;color:#0a1628;">${result?.filingStatus === 'mfj' ? 'Married Filing Jointly' : result?.filingStatus === 'hoh' ? 'Head of Household' : 'Single'}</td></tr>
                </table>

                <h3 style="color:#0a1628;border-bottom:2px solid #c9a84c;padding-bottom:8px;margin-bottom:16px;">Tax Summary</h3>
                <table style="width:100%;border-collapse:collapse;">
                  <tr style="background:#f9f7f4;"><td style="padding:8px 12px;font-size:14px;color:#6b7280;">AGI (Box 11)</td><td style="padding:8px 12px;font-weight:600;text-align:right;">${fmt(result?.agi)}</td></tr>
                  <tr><td style="padding:8px 12px;font-size:14px;color:#6b7280;">Deduction Used (Box 12)</td><td style="padding:8px 12px;font-weight:600;text-align:right;">${fmt(result?.deductionUsed)}</td></tr>
                  <tr style="background:#f9f7f4;"><td style="padding:8px 12px;font-size:14px;color:#6b7280;">Taxable Income (Box 15)</td><td style="padding:8px 12px;font-weight:600;text-align:right;">${fmt(result?.taxableIncome)}</td></tr>
                  <tr><td style="padding:8px 12px;font-size:14px;color:#6b7280;">Federal Tax (Box 16)</td><td style="padding:8px 12px;font-weight:600;text-align:right;">${fmt(result?.federalTax)}</td></tr>
                  <tr style="background:#f9f7f4;"><td style="padding:8px 12px;font-size:14px;color:#6b7280;">Effective Rate</td><td style="padding:8px 12px;font-weight:600;text-align:right;">${pct(result?.effectiveRate)}</td></tr>
                  <tr><td style="padding:8px 12px;font-size:14px;color:#6b7280;">Marginal Rate</td><td style="padding:8px 12px;font-weight:600;text-align:right;">${pct(result?.marginalRate)}</td></tr>
                  <tr style="background:${result?.refund > 0 ? '#f0fdf4' : '#fff1f2'};"><td style="padding:8px 12px;font-size:14px;font-weight:700;color:${result?.refund > 0 ? '#16a34a' : '#dc2626'};">${result?.refund > 0 ? 'Refund (Box 34)' : 'Amount Owed (Box 37)'}</td><td style="padding:8px 12px;font-weight:700;text-align:right;color:${result?.refund > 0 ? '#16a34a' : '#dc2626'};">${fmt(result?.refund > 0 ? result?.refund : result?.amountOwed)}</td></tr>
                </table>

                <div style="margin-top:24px;padding:16px;background:#f9f7f4;border-radius:8px;">
                  <p style="margin:0;font-size:13px;color:#6b7280;">Deduction gap: ${fmt(result?.additionalDeductionsToBreakEven)} more in deductions would eliminate any balance owed.</p>
                </div>
              </div>
            </div>
          `,
        })
      } catch (emailErr) {
        console.error('Resend error:', emailErr)
      }
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Save assessment error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
