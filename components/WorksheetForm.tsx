'use client'

import { useState, useEffect } from 'react'
import {
  calculateTax,
  STANDARD_DEDUCTION,
  type TaxInput,
  type TaxResult,
  type FilingStatus,
  type TaxYear,
  TAX_YEARS,
} from '@/lib/tax'

const FILING_STATUS_LABELS: Record<FilingStatus, string> = {
  single: 'Single',
  mfj: 'Married Filing Jointly',
  hoh: 'Head of Household',
}

function fmt(n: number) {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
}

function pct(n: number) {
  return (n * 100).toFixed(1) + '%'
}

const defaultInput: TaxInput = {
  taxYear: 2025,
  filingStatus: 'single',
  wages: 0,
  otherIncome: 0,
  agi: 0,
  useStandardDeduction: true,
  itemizedDeduction: 0,
  childTaxCredit: 0,
  otherCredits: 0,
  totalPayments: 0,
}

interface Props {
  onComplete: (input: TaxInput, result: TaxResult) => void
}

export default function WorksheetForm({ onComplete }: Props) {
  const [step, setStep] = useState(0)
  const [input, setInput] = useState<TaxInput>(defaultInput)
  const [result, setResult] = useState<TaxResult | null>(null)

  // Live preview calc for steps 1–3
  const [preview, setPreview] = useState<TaxResult | null>(null)
  useEffect(() => {
    if (step >= 1 && (input.wages > 0 || input.otherIncome > 0 || input.agi > 0)) {
      const r = calculateTax(input)
      setPreview(r)
    }
  }, [input, step])

  function set<K extends keyof TaxInput>(field: K, value: TaxInput[K]) {
    setInput(prev => ({ ...prev, [field]: value }))
  }

  function setNum(field: keyof TaxInput, value: string) {
    setInput(prev => ({ ...prev, [field]: Number(value.replace(/[^0-9.]/g, '')) || 0 }))
  }

  function handleCalculate() {
    const r = calculateTax(input)
    setResult(r)
    setStep(5)
    onComplete(input, r)
  }

  const stdDed = STANDARD_DEDUCTION[input.taxYear][input.filingStatus]

  return (
    <div className="max-w-xl mx-auto">
      {step < 5 && (
        <StepIndicator current={step} total={4} />
      )}

      {/* Step 0: Setup */}
      {step === 0 && (
        <Section>
          <SectionHeader label="Get Started" sub="Select your tax year and filing status." />

          <div className="mb-5">
            <label className="block text-xs font-semibold text-[#0a1628]/50 uppercase tracking-wide mb-2">Tax Year</label>
            <div className="flex gap-2">
              {TAX_YEARS.map(y => (
                <button
                  key={y}
                  onClick={() => set('taxYear', y)}
                  className={`flex-1 py-2.5 rounded-lg font-bold text-sm border-2 transition-all ${input.taxYear === y ? 'bg-[#c9a84c] border-[#c9a84c] text-[#0a1628]' : 'border-[#0a1628]/20 text-[#0a1628]/50 hover:border-[#c9a84c]/40'}`}
                >
                  {y}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-xs font-semibold text-[#0a1628]/50 uppercase tracking-wide mb-2">Filing Status</label>
            <div className="space-y-2">
              {(['single', 'mfj', 'hoh'] as FilingStatus[]).map(s => (
                <button
                  key={s}
                  onClick={() => set('filingStatus', s)}
                  className={`w-full flex items-center justify-between p-3.5 rounded-xl border-2 transition-all text-left ${input.filingStatus === s ? 'border-[#c9a84c] bg-[#c9a84c]/8' : 'border-[#0a1628]/15 hover:border-[#c9a84c]/40'}`}
                >
                  <span className="font-medium text-[#0a1628] text-sm">{FILING_STATUS_LABELS[s]}</span>
                  <span className="text-xs text-[#0a1628]/40">
                    Std. deduction: {fmt(STANDARD_DEDUCTION[input.taxYear][s])}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <ContinueBtn onClick={() => setStep(1)} />
        </Section>
      )}

      {/* Step 1: Income */}
      {step === 1 && (
        <Section>
          <SectionHeader
            label="Income"
            sub="Enter the numbers directly from your Form 1040."
          />

          <BoxInput
            box="1a"
            label="Wages, salaries, tips"
            hint="From your W-2 box 1. Add multiple W-2s together."
            value={input.wages}
            onChange={v => setNum('wages', v)}
          />
          <BoxInput
            box="8"
            label="Business / Rental income"
            hint="Schedule C, E, or F. Enter 0 if none."
            value={input.otherIncome}
            onChange={v => setNum('otherIncome', v)}
          />

          {/* Live subtotal */}
          <TotalRow
            label="Gross Income"
            value={input.wages + input.otherIncome}
            sub="Box 1a + Box 8"
          />

          <div className="flex gap-3 mt-6">
            <BackBtn onClick={() => setStep(0)} />
            <ContinueBtn
              onClick={() => setStep(2)}
              disabled={input.wages + input.otherIncome === 0}
            />
          </div>
        </Section>
      )}

      {/* Step 2: AGI */}
      {step === 2 && (
        <Section>
          <SectionHeader
            label="Adjusted Gross Income"
            sub="Line 11 on your Form 1040. This is after any above-the-line adjustments."
          />

          <div className="bg-[#0a1628]/4 rounded-xl p-3 mb-4 flex items-start gap-2">
            <span className="text-[#c9a84c] text-sm mt-0.5">ℹ</span>
            <p className="text-xs text-[#0a1628]/60">
              AGI is your total income minus adjustments like 401(k) contributions, student loan interest, HSA, and educator expenses. Find it on line 11 of your 1040.
              {input.wages + input.otherIncome > 0 && (
                <> Your gross income was {fmt(input.wages + input.otherIncome)} — your AGI will be equal to or less than this.</>
              )}
            </p>
          </div>

          <BoxInput
            box="11"
            label="Adjusted Gross Income (AGI)"
            hint="Copy this directly from line 11 of your Form 1040."
            value={input.agi}
            onChange={v => setNum('agi', v)}
          />

          {preview && input.agi > 0 && (
            <div className="flex justify-between items-center py-2 border-t border-[#0a1628]/10 mt-2">
              <span className="text-xs text-[#0a1628]/50">Effective rate so far</span>
              <span className="text-sm font-semibold text-[#0a1628]">{pct(preview.effectiveRate)}</span>
            </div>
          )}

          <div className="flex gap-3 mt-6">
            <BackBtn onClick={() => setStep(1)} />
            <ContinueBtn
              onClick={() => setStep(3)}
              disabled={input.agi === 0 && input.wages + input.otherIncome === 0}
            />
          </div>
        </Section>
      )}

      {/* Step 3: Deductions */}
      {step === 3 && (
        <Section>
          <SectionHeader
            label="Deductions"
            sub="Box 12 on your 1040. Standard or itemized — whichever is higher."
          />

          {/* Standard vs Itemized toggle */}
          <div className="mb-4">
            <label className="block text-xs font-semibold text-[#0a1628]/50 uppercase tracking-wide mb-2">Deduction Type</label>
            <div className="flex gap-2">
              <button
                onClick={() => set('useStandardDeduction', true)}
                className={`flex-1 py-2.5 rounded-lg text-sm font-semibold border-2 transition-all ${input.useStandardDeduction ? 'bg-[#0a1628] border-[#0a1628] text-white' : 'border-[#0a1628]/20 text-[#0a1628]/50 hover:border-[#0a1628]/40'}`}
              >
                Standard
              </button>
              <button
                onClick={() => set('useStandardDeduction', false)}
                className={`flex-1 py-2.5 rounded-lg text-sm font-semibold border-2 transition-all ${!input.useStandardDeduction ? 'bg-[#0a1628] border-[#0a1628] text-white' : 'border-[#0a1628]/20 text-[#0a1628]/50 hover:border-[#0a1628]/40'}`}
              >
                Itemized
              </button>
            </div>
          </div>

          {input.useStandardDeduction ? (
            <div className="bg-[#c9a84c]/10 border border-[#c9a84c]/40 rounded-xl p-4 mb-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-xs font-semibold text-[#0a1628]/50 uppercase tracking-wide">Box 12 · Standard Deduction</p>
                  <p className="text-xl font-bold text-[#0a1628] mt-0.5">{fmt(stdDed)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-[#0a1628]/40">{FILING_STATUS_LABELS[input.filingStatus]}</p>
                  <p className="text-xs text-[#0a1628]/40">{input.taxYear} IRS rate</p>
                </div>
              </div>
            </div>
          ) : (
            <BoxInput
              box="12"
              label="Itemized Deductions"
              hint="From Schedule A. Must exceed standard deduction to benefit you."
              value={input.itemizedDeduction}
              onChange={v => setNum('itemizedDeduction', v)}
            />
          )}

          {/* Live taxable income preview */}
          {preview && (
            <TotalRow
              label="Taxable Income (Box 15)"
              value={preview.taxableIncome}
              sub={`AGI ${fmt(preview.agi)} − deductions ${fmt(preview.deductionUsed)}`}
              accent
            />
          )}

          <div className="flex gap-3 mt-6">
            <BackBtn onClick={() => setStep(2)} />
            <ContinueBtn onClick={() => setStep(4)} />
          </div>
        </Section>
      )}

      {/* Step 4: Tax, Credits & Payments */}
      {step === 4 && (
        <Section>
          <SectionHeader
            label="Tax, Credits & Payments"
            sub="Enter your credits and what you've already paid in."
          />

          {/* Box 16 auto-calculated */}
          {preview && (
            <div className="bg-[#0a1628] rounded-xl p-4 mb-5">
              <p className="text-xs font-semibold text-white/50 uppercase tracking-wide mb-1">Box 16 · Federal Income Tax</p>
              <p className="text-2xl font-bold text-[#c9a84c]">{fmt(preview.federalTax)}</p>
              <p className="text-xs text-white/40 mt-1">
                Calculated from {input.taxYear} IRS brackets · {preview.bracket} · {pct(preview.effectiveRate)} effective rate
              </p>
            </div>
          )}

          <BoxInput
            box="19"
            label="Child Tax Credit / Other Dependents"
            hint="$2,000 per qualifying child under 17. $500 for other dependents."
            value={input.childTaxCredit}
            onChange={v => setNum('childTaxCredit', v)}
          />
          <BoxInput
            box="32"
            label="Other Refundable Credits"
            hint="Earned income credit, education credits, etc."
            value={input.otherCredits}
            onChange={v => setNum('otherCredits', v)}
          />

          {preview && (
            <TotalRow
              label="Total Tax After Credits (Box 24)"
              value={preview.totalTaxAfterCredits}
              sub={`Box 16 ${fmt(preview.federalTax)} − credits ${fmt(preview.totalCredits)}`}
            />
          )}

          <div className="my-4 border-t border-[#0a1628]/10" />

          <BoxInput
            box="23"
            label="Total Tax Payments"
            hint="W-2 withholdings + any estimated payments you made."
            value={input.totalPayments}
            onChange={v => setNum('totalPayments', v)}
          />

          {/* Live refund/owed preview */}
          {preview && input.totalPayments > 0 && (
            <div className={`rounded-xl p-4 mt-4 ${preview.refund > 0 ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
              <p className={`text-xs font-semibold uppercase tracking-wide mb-1 ${preview.refund > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {preview.refund > 0 ? `Box 34 · Estimated Refund` : `Box 37 · Estimated Amount Owed`}
              </p>
              <p className={`text-2xl font-bold ${preview.refund > 0 ? 'text-green-700' : 'text-red-700'}`}>
                {preview.refund > 0 ? fmt(preview.refund) : fmt(preview.amountOwed)}
              </p>
            </div>
          )}

          <div className="flex gap-3 mt-6">
            <BackBtn onClick={() => setStep(3)} />
            <button
              onClick={handleCalculate}
              className="flex-1 py-3 bg-[#c9a84c] text-[#0a1628] rounded-xl font-bold hover:bg-[#e8c96b] transition-colors"
            >
              See My Full Results
            </button>
          </div>
        </Section>
      )}

      {/* Step 5: Results */}
      {step === 5 && result && (
        <Results result={result} input={input} onReset={() => { setStep(0); setInput(defaultInput); setResult(null); setPreview(null) }} />
      )}
    </div>
  )
}

// ===== SUB-COMPONENTS =====

function StepIndicator({ current, total }: { current: number; total: number }) {
  const labels = ['Setup', 'Income', 'AGI', 'Deductions', 'Credits']
  return (
    <div className="flex items-center gap-1 mb-6">
      {Array.from({ length: total + 1 }, (_, i) => (
        <div key={i} className="flex items-center gap-1 flex-1">
          <div className={`h-1.5 flex-1 rounded-full transition-all ${i < current ? 'bg-[#c9a84c]' : i === current ? 'bg-[#0a1628]' : 'bg-[#0a1628]/15'}`} />
          {i === current && (
            <span className="text-xs font-medium text-[#0a1628] whitespace-nowrap shrink-0">{labels[i]}</span>
          )}
        </div>
      ))}
    </div>
  )
}

function Section({ children }: { children: React.ReactNode }) {
  return <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#0a1628]/8">{children}</div>
}

function SectionHeader({ label, sub }: { label: string; sub: string }) {
  return (
    <div className="mb-5">
      <h2 className="text-xl font-bold text-[#0a1628]">{label}</h2>
      <p className="text-sm text-[#0a1628]/50 mt-0.5">{sub}</p>
    </div>
  )
}

function BoxInput({ box, label, hint, value, onChange }: {
  box: string; label: string; hint: string; value: number; onChange: (v: string) => void
}) {
  return (
    <div className="mb-4">
      <div className="flex items-start gap-3">
        <div className="shrink-0 mt-0.5">
          <span className="inline-flex items-center justify-center w-9 h-6 rounded text-xs font-bold bg-[#0a1628] text-[#c9a84c]">
            {box}
          </span>
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-[#0a1628] leading-tight">{label}</p>
          <p className="text-xs text-[#0a1628]/40 mt-0.5">{hint}</p>
        </div>
        <div className="relative shrink-0">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#0a1628]/40 text-sm">$</span>
          <input
            type="number"
            min="0"
            value={value || ''}
            placeholder="0"
            onChange={e => onChange(e.target.value)}
            className="w-32 pl-7 pr-3 py-2 border border-[#0a1628]/20 rounded-lg text-right text-sm text-[#0a1628] bg-[#f9f7f4] focus:outline-none focus:border-[#c9a84c] focus:ring-1 focus:ring-[#c9a84c] focus:bg-white"
          />
        </div>
      </div>
    </div>
  )
}

function TotalRow({ label, value, sub, accent }: { label: string; value: number; sub?: string; accent?: boolean }) {
  return (
    <div className={`flex items-center justify-between py-3 px-4 rounded-xl mt-3 ${accent ? 'bg-[#0a1628]/5' : 'bg-[#f9f7f4]'}`}>
      <div>
        <p className="text-sm font-semibold text-[#0a1628]">{label}</p>
        {sub && <p className="text-xs text-[#0a1628]/40 mt-0.5">{sub}</p>}
      </div>
      <p className={`text-lg font-bold ${accent ? 'text-[#c9a84c]' : 'text-[#0a1628]'}`}>{fmt(value)}</p>
    </div>
  )
}

function ContinueBtn({ onClick, disabled }: { onClick: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex-1 py-3 bg-[#0a1628] text-white rounded-xl font-semibold hover:bg-[#0a1628]/90 transition-colors disabled:opacity-30"
    >
      Continue →
    </button>
  )
}

function BackBtn({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="px-5 py-3 border-2 border-[#0a1628]/15 text-[#0a1628]/50 rounded-xl font-semibold hover:border-[#0a1628]/30 hover:text-[#0a1628] transition-colors"
    >
      ←
    </button>
  )
}

function Results({ result, input, onReset }: { result: TaxResult; input: TaxInput; onReset: () => void }) {
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [checkoutError, setCheckoutError] = useState('')
  const [email, setEmail] = useState('')
  const [showUpgrade, setShowUpgrade] = useState(false)

  async function handleUpgrade() {
    setCheckoutLoading(true)
    setCheckoutError('')
    try {
      const res = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        setCheckoutError(data.error || 'Could not start checkout. Please try again.')
      }
    } catch {
      setCheckoutError('Network error. Please check your connection and try again.')
    } finally {
      setCheckoutLoading(false)
    }
  }

  const isRefund = result.refund > 0

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-[#0a1628] rounded-2xl p-6 text-white">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-white/50 text-xs uppercase tracking-wide font-semibold">{input.taxYear} Federal Tax Summary</p>
            <p className="text-white/70 text-sm mt-0.5">{result.filingStatus === 'mfj' ? 'Married Filing Jointly' : result.filingStatus === 'hoh' ? 'Head of Household' : 'Single'}</p>
          </div>
          <span className="text-xs bg-white/10 px-2 py-1 rounded-full text-white/60">{result.bracket}</span>
        </div>

        {/* Refund / Owed */}
        <div className={`rounded-xl p-4 mb-4 ${isRefund ? 'bg-green-400/20 border border-green-400/30' : 'bg-red-400/20 border border-red-400/30'}`}>
          <p className={`text-xs font-semibold uppercase tracking-wide mb-1 ${isRefund ? 'text-green-300' : 'text-red-300'}`}>
            {isRefund ? '↓ Box 34 · Refund' : '↑ Box 37 · Amount Owed'}
          </p>
          <p className={`text-4xl font-bold ${isRefund ? 'text-green-300' : 'text-red-300'}`}>
            {fmt(isRefund ? result.refund : result.amountOwed)}
          </p>
        </div>

        {/* 1040 flow summary */}
        <div className="space-y-2">
          <FlowLine box="11" label="Adjusted Gross Income" value={fmt(result.agi)} />
          <FlowLine box="12" label="Deductions" value={`− ${fmt(result.deductionUsed)}`} />
          <FlowLine box="15" label="Taxable Income" value={fmt(result.taxableIncome)} highlight />
          <FlowLine box="16" label="Federal Tax" value={fmt(result.federalTax)} />
          {result.totalCredits > 0 && (
            <FlowLine box="19/32" label="Credits" value={`− ${fmt(result.totalCredits)}`} />
          )}
          <FlowLine box="24" label="Total Tax" value={fmt(result.totalTaxAfterCredits)} highlight />
          {result.totalPayments > 0 && (
            <FlowLine box="23" label="Total Payments" value={`− ${fmt(result.totalPayments)}`} />
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 mt-4">
          <div className="bg-white/8 rounded-lg p-3">
            <p className="text-white/50 text-xs">Effective Rate</p>
            <p className="text-white font-bold text-lg">{pct(result.effectiveRate)}</p>
          </div>
          <div className="bg-white/8 rounded-lg p-3">
            <p className="text-white/50 text-xs">Marginal Rate</p>
            <p className="text-[#c9a84c] font-bold text-lg">{pct(result.marginalRate)}</p>
          </div>
        </div>
      </div>

      {/* Gap Analysis */}
      <div className="bg-white rounded-2xl p-6 border border-[#0a1628]/8 shadow-sm">
        <h3 className="font-bold text-[#0a1628] mb-1">Your Deduction Opportunity</h3>
        <p className="text-sm text-[#0a1628]/50 mb-4">Based on your {result.bracket}, here&apos;s what additional deductions could do for you.</p>

        {result.amountOwed > 0 && (
          <div className="bg-[#c9a84c]/10 border border-[#c9a84c]/30 rounded-xl p-4 mb-3">
            <p className="text-xs font-semibold text-[#0a1628]/50 uppercase tracking-wide">To eliminate your balance</p>
            <p className="text-2xl font-bold text-[#0a1628] mt-1">{fmt(result.additionalDeductionsToBreakEven)}</p>
            <p className="text-xs text-[#0a1628]/50 mt-1">in additional deductions would bring your balance to $0</p>
          </div>
        )}

        <div className="bg-[#0a1628]/5 rounded-xl p-4 mb-4">
          <p className="text-xs font-semibold text-[#0a1628]/50 uppercase tracking-wide">To get $500 more in refund</p>
          <p className="text-2xl font-bold text-[#0a1628] mt-1">{fmt(result.additionalDeductionsFor500More)}</p>
          <p className="text-xs text-[#0a1628]/50 mt-1">in additional deductions at your {pct(result.marginalRate)} rate</p>
        </div>

        <ul className="space-y-2">
          {result.recommendations.map((r, i) => (
            <li key={i} className="flex gap-2 text-sm text-[#0a1628]/70">
              <span className="text-[#c9a84c] shrink-0 mt-0.5">→</span>
              <span>{r}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* CTA */}
      <div className="bg-[#0a1628] rounded-2xl p-6">
        <h3 className="font-bold text-white mb-1">Want an advisor to find these deductions for you?</h3>
        <p className="text-sm text-white/60 mb-4">
          The Arqon Tax team looks at your actual return, finds what you&apos;re missing, and builds a plan. First call is free — no obligation.
        </p>
        <a
          href="https://calendly.com/brandon-arqontax/arqon-tax-discovery-call"
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full py-3 text-center bg-[#c9a84c] text-[#0a1628] rounded-xl font-bold hover:bg-[#e8c96b] transition-colors mb-2"
        >
          Book a Free Call
        </a>
        <p className="text-xs text-center text-white/30">1 hour · completely free · no commitment</p>
      </div>

      {/* Pro upgrade */}
      {!showUpgrade ? (
        <button
          onClick={() => setShowUpgrade(true)}
          className="w-full py-3 border-2 border-[#0a1628]/15 text-[#0a1628]/50 rounded-xl text-sm hover:border-[#0a1628]/30 hover:text-[#0a1628] transition-colors"
        >
          Save & track my results year over year — $2.99/yr
        </button>
      ) : (
        <div className="bg-white border-2 border-[#0a1628]/15 rounded-2xl p-5">
          <p className="font-semibold text-[#0a1628] mb-1 text-sm">Save your results</p>
          <p className="text-xs text-[#0a1628]/50 mb-3">Track your tax picture year over year for $2.99/yr.</p>
          <input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full px-3 py-2.5 border border-[#0a1628]/20 rounded-lg mb-3 text-sm focus:outline-none focus:border-[#c9a84c]"
          />
          <button
            onClick={handleUpgrade}
            disabled={!email || checkoutLoading}
            className="w-full py-2.5 bg-[#c9a84c] text-[#0a1628] rounded-lg font-semibold hover:bg-[#e8c96b] transition-colors disabled:opacity-40"
          >
            {checkoutLoading ? 'Redirecting…' : 'Unlock for $2.99/year'}
          </button>
          {checkoutError && (
            <p className="text-red-600 text-xs mt-2">{checkoutError}</p>
          )}
        </div>
      )}

      <button onClick={onReset} className="w-full py-2 text-[#0a1628]/30 text-sm hover:text-[#0a1628] transition-colors">
        Start over
      </button>
    </div>
  )
}

function FlowLine({ box, label, value, highlight }: { box: string; label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`flex items-center justify-between py-1.5 ${highlight ? 'border-t border-white/10 mt-1 pt-2' : ''}`}>
      <div className="flex items-center gap-2">
        <span className="text-xs bg-white/10 text-white/50 px-1.5 py-0.5 rounded font-mono">{box}</span>
        <span className={`text-sm ${highlight ? 'text-white font-semibold' : 'text-white/60'}`}>{label}</span>
      </div>
      <span className={`text-sm font-semibold ${highlight ? 'text-[#c9a84c]' : 'text-white/70'}`}>{value}</span>
    </div>
  )
}
