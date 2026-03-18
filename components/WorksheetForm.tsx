'use client'

import { useState } from 'react'
import { calculateTax, type TaxInput, type TaxResult, type FilingStatus } from '@/lib/tax'

const defaultInput: TaxInput = {
  filingStatus: 'single',
  grossIncome: 0,
  otherIncome: 0,
  mortgageInterest: 0,
  charitableContributions: 0,
  stateTaxesPaid: 0,
  businessExpenses: 0,
  retirementContributions: 0,
  healthInsurancePremiums: 0,
  studentLoanInterest: 0,
  otherDeductions: 0,
  childTaxCredit: 0,
  otherCredits: 0,
}

function fmt(n: number) {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
}

function pct(n: number) {
  return (n * 100).toFixed(1) + '%'
}

interface Props {
  onComplete: (input: TaxInput, result: TaxResult) => void
}

export default function WorksheetForm({ onComplete }: Props) {
  const [step, setStep] = useState(0)
  const [input, setInput] = useState<TaxInput>(defaultInput)
  const [result, setResult] = useState<TaxResult | null>(null)

  function set(field: keyof TaxInput, value: string | FilingStatus) {
    setInput(prev => ({
      ...prev,
      [field]: field === 'filingStatus' ? value : Number(value) || 0,
    }))
  }

  function handleCalculate() {
    const r = calculateTax(input)
    setResult(r)
    setStep(3)
    onComplete(input, r)
  }

  const steps = ['Filing Info', 'Income', 'Deductions & Credits']

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress */}
      <div className="flex items-center gap-2 mb-8">
        {steps.map((label, i) => (
          <div key={i} className="flex items-center gap-2 flex-1">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold shrink-0 transition-colors ${i <= step ? 'bg-[#c9a84c] text-[#0a1628]' : 'bg-[#0a1628]/20 text-[#0a1628]/50'}`}>
              {i + 1}
            </div>
            <span className={`text-sm hidden sm:block ${i <= step ? 'text-[#0a1628] font-medium' : 'text-[#0a1628]/50'}`}>{label}</span>
            {i < steps.length - 1 && <div className={`h-px flex-1 ${i < step ? 'bg-[#c9a84c]' : 'bg-[#0a1628]/20'}`} />}
          </div>
        ))}
      </div>

      {/* Step 0: Filing Status */}
      {step === 0 && (
        <div>
          <h2 className="text-2xl font-bold text-[#0a1628] mb-2">How do you file?</h2>
          <p className="text-[#0a1628]/60 mb-6">This determines your tax brackets and standard deduction.</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
            {(['single', 'mfj', 'hoh'] as FilingStatus[]).map(s => (
              <button
                key={s}
                onClick={() => set('filingStatus', s)}
                className={`p-4 rounded-xl border-2 text-left transition-all ${input.filingStatus === s ? 'border-[#c9a84c] bg-[#c9a84c]/10' : 'border-[#0a1628]/20 hover:border-[#c9a84c]/50'}`}
              >
                <div className="font-semibold text-[#0a1628]">
                  {s === 'single' ? 'Single' : s === 'mfj' ? 'Married Filing Jointly' : 'Head of Household'}
                </div>
                <div className="text-xs text-[#0a1628]/50 mt-1">
                  {s === 'single' ? 'Standard deduction: $14,600' : s === 'mfj' ? 'Standard deduction: $29,200' : 'Standard deduction: $21,900'}
                </div>
              </button>
            ))}
          </div>
          <button
            onClick={() => setStep(1)}
            className="w-full py-3 bg-[#0a1628] text-white rounded-xl font-semibold hover:bg-[#0a1628]/90 transition-colors"
          >
            Continue
          </button>
        </div>
      )}

      {/* Step 1: Income */}
      {step === 1 && (
        <div>
          <h2 className="text-2xl font-bold text-[#0a1628] mb-2">Your income</h2>
          <p className="text-[#0a1628]/60 mb-6">Estimates are fine. We&apos;ll use 2024 federal brackets.</p>
          <div className="space-y-4 mb-8">
            <InputRow
              label="W-2 / Self-employment income"
              hint="Your salary or business earnings before taxes"
              value={input.grossIncome}
              onChange={v => set('grossIncome', v)}
            />
            <InputRow
              label="Other income"
              hint="Rental income, dividends, capital gains, freelance, etc."
              value={input.otherIncome}
              onChange={v => set('otherIncome', v)}
            />
          </div>
          <div className="flex gap-3">
            <button onClick={() => setStep(0)} className="flex-1 py-3 border-2 border-[#0a1628]/20 text-[#0a1628] rounded-xl font-semibold hover:border-[#0a1628] transition-colors">
              Back
            </button>
            <button
              onClick={() => setStep(2)}
              disabled={input.grossIncome + input.otherIncome === 0}
              className="flex-1 py-3 bg-[#0a1628] text-white rounded-xl font-semibold hover:bg-[#0a1628]/90 transition-colors disabled:opacity-40"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Deductions */}
      {step === 2 && (
        <div>
          <h2 className="text-2xl font-bold text-[#0a1628] mb-2">Deductions & credits</h2>
          <p className="text-[#0a1628]/60 mb-6">Leave blank anything that doesn&apos;t apply. Zero is fine.</p>
          <div className="space-y-3 mb-8">
            <InputRow label="Mortgage interest paid" hint="From your Form 1098" value={input.mortgageInterest} onChange={v => set('mortgageInterest', v)} />
            <InputRow label="Charitable contributions" hint="Cash or non-cash donations to qualified orgs" value={input.charitableContributions} onChange={v => set('charitableContributions', v)} />
            <InputRow label="State & local taxes paid" hint="Property tax + state income or sales tax (capped at $10,000)" value={input.stateTaxesPaid} onChange={v => set('stateTaxesPaid', v)} />
            <InputRow label="Business / unreimbursed expenses" hint="Qualified business deductions" value={input.businessExpenses} onChange={v => set('businessExpenses', v)} />
            <InputRow label="Retirement contributions" hint="401(k), IRA, SEP — pre-tax only" value={input.retirementContributions} onChange={v => set('retirementContributions', v)} />
            <InputRow label="Health insurance premiums" hint="If you pay out of pocket (not employer-covered)" value={input.healthInsurancePremiums} onChange={v => set('healthInsurancePremiums', v)} />
            <InputRow label="Student loan interest" hint="Capped at $2,500" value={input.studentLoanInterest} onChange={v => set('studentLoanInterest', v)} />
            <InputRow label="Other deductions" hint="Alimony, educator expenses, HSA, etc." value={input.otherDeductions} onChange={v => set('otherDeductions', v)} />
            <InputRow label="Child tax credit" hint="$2,000 per qualifying child" value={input.childTaxCredit} onChange={v => set('childTaxCredit', v)} />
            <InputRow label="Other credits" hint="Child & dependent care, education credits, etc." value={input.otherCredits} onChange={v => set('otherCredits', v)} />
          </div>
          <div className="flex gap-3">
            <button onClick={() => setStep(1)} className="flex-1 py-3 border-2 border-[#0a1628]/20 text-[#0a1628] rounded-xl font-semibold hover:border-[#0a1628] transition-colors">
              Back
            </button>
            <button
              onClick={handleCalculate}
              className="flex-1 py-3 bg-[#c9a84c] text-[#0a1628] rounded-xl font-bold hover:bg-[#e8c96b] transition-colors"
            >
              Calculate My Taxes
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Results */}
      {step === 3 && result && (
        <Results result={result} input={input} onReset={() => { setStep(0); setInput(defaultInput); setResult(null) }} />
      )}
    </div>
  )
}

function InputRow({ label, hint, value, onChange }: { label: string; hint: string; value: number; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-4">
      <div className="flex-1">
        <label className="block text-sm font-medium text-[#0a1628]">{label}</label>
        <p className="text-xs text-[#0a1628]/50">{hint}</p>
      </div>
      <div className="relative w-36 shrink-0">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#0a1628]/40 text-sm">$</span>
        <input
          type="number"
          min="0"
          value={value || ''}
          placeholder="0"
          onChange={e => onChange(e.target.value)}
          className="w-full pl-7 pr-3 py-2 border border-[#0a1628]/20 rounded-lg text-right text-[#0a1628] bg-white focus:outline-none focus:border-[#c9a84c] focus:ring-1 focus:ring-[#c9a84c]"
        />
      </div>
    </div>
  )
}

function Results({ result, input, onReset }: { result: TaxResult; input: TaxInput; onReset: () => void }) {
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [showUpgrade, setShowUpgrade] = useState(false)

  async function handleUpgrade() {
    setCheckoutLoading(true)
    try {
      const res = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (data.url) window.location.href = data.url
    } catch {
      alert('Something went wrong. Please try again.')
    } finally {
      setCheckoutLoading(false)
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-[#0a1628] mb-1">Your 2024 Tax Estimate</h2>
      <p className="text-[#0a1628]/60 mb-6 text-sm">Based on {input.filingStatus === 'mfj' ? 'Married Filing Jointly' : input.filingStatus === 'hoh' ? 'Head of Household' : 'Single'} filing status.</p>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
        <Card label="Estimated Federal Tax" value={fmt(result.federalTax)} accent />
        <Card label="Effective Tax Rate" value={pct(result.effectiveRate)} />
        <Card label="Marginal Rate" value={pct(result.marginalRate)} />
        <Card label="Total Income" value={fmt(result.totalIncome)} />
        <Card label="Deduction Used" value={fmt(result.deductionUsed)} />
        <Card label="Taxable Income" value={fmt(result.taxableIncome)} />
      </div>

      {/* Deduction breakdown */}
      <div className="bg-white rounded-xl border border-[#0a1628]/10 p-4 mb-4">
        <h3 className="font-semibold text-[#0a1628] mb-3">Deduction Comparison</h3>
        <div className="space-y-2">
          <DeductionBar label="Standard Deduction" value={result.standardDeduction} max={Math.max(result.standardDeduction, result.itemizedDeductions)} />
          <DeductionBar label="Your Itemized Total" value={result.itemizedDeductions} max={Math.max(result.standardDeduction, result.itemizedDeductions)} highlight />
        </div>
        <p className="text-xs text-[#0a1628]/50 mt-3">
          {result.itemizedDeductions > result.standardDeduction
            ? `Itemizing saves you ${fmt(result.itemizedDeductions - result.standardDeduction)} more.`
            : `Standard deduction is ${fmt(result.standardDeduction - result.itemizedDeductions)} better for you right now.`}
        </p>
      </div>

      {/* Recommendations */}
      <div className="bg-[#0a1628] rounded-xl p-4 mb-6">
        <h3 className="font-semibold text-white mb-3">Potential Opportunities</h3>
        <ul className="space-y-2">
          {result.recommendations.map((r, i) => (
            <li key={i} className="flex gap-2 text-sm text-white/80">
              <span className="text-[#c9a84c] mt-0.5 shrink-0">→</span>
              <span>{r}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Upgrade CTA */}
      <div className="bg-[#c9a84c]/10 border border-[#c9a84c] rounded-xl p-5 mb-4">
        <h3 className="font-bold text-[#0a1628] mb-1">Want a real advisor to review this?</h3>
        <p className="text-sm text-[#0a1628]/70 mb-3">
          The Arqon Tax team can look at your actual numbers, find deductions you&apos;re missing, and build a real plan. The first call is free.
        </p>
        <a
          href="https://calendly.com/brandon-arqontax/arqon-tax-discovery-call"
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full py-3 text-center bg-[#0a1628] text-white rounded-lg font-semibold hover:bg-[#0a1628]/90 transition-colors mb-3"
        >
          Book a Free Call
        </a>
        <p className="text-xs text-center text-[#0a1628]/50">No obligation — 1 hour, completely free</p>
      </div>

      {/* Pro upgrade */}
      {!showUpgrade ? (
        <button
          onClick={() => setShowUpgrade(true)}
          className="w-full py-3 border-2 border-[#0a1628]/20 text-[#0a1628]/60 rounded-xl text-sm hover:border-[#0a1628] hover:text-[#0a1628] transition-colors"
        >
          Save & track my results year over year — $2.99/yr
        </button>
      ) : (
        <div className="border-2 border-[#0a1628]/20 rounded-xl p-4">
          <p className="text-sm font-medium text-[#0a1628] mb-2">Enter your email to continue</p>
          <input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full px-3 py-2 border border-[#0a1628]/20 rounded-lg mb-3 text-sm focus:outline-none focus:border-[#c9a84c]"
          />
          <button
            onClick={handleUpgrade}
            disabled={!email || checkoutLoading}
            className="w-full py-2.5 bg-[#c9a84c] text-[#0a1628] rounded-lg font-semibold hover:bg-[#e8c96b] transition-colors disabled:opacity-40"
          >
            {checkoutLoading ? 'Redirecting…' : 'Unlock for $2.99/year'}
          </button>
        </div>
      )}

      <button onClick={onReset} className="w-full mt-3 py-2 text-[#0a1628]/40 text-sm hover:text-[#0a1628] transition-colors">
        Start over
      </button>
    </div>
  )
}

function Card({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={`rounded-xl p-3 ${accent ? 'bg-[#0a1628] text-white' : 'bg-white border border-[#0a1628]/10 text-[#0a1628]'}`}>
      <p className={`text-xs mb-1 ${accent ? 'text-white/60' : 'text-[#0a1628]/50'}`}>{label}</p>
      <p className={`text-lg font-bold ${accent ? 'text-[#c9a84c]' : ''}`}>{value}</p>
    </div>
  )
}

function DeductionBar({ label, value, max, highlight }: { label: string; value: number; max: number; highlight?: boolean }) {
  const pct = max > 0 ? (value / max) * 100 : 0
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-[#0a1628]/70">{label}</span>
        <span className="font-medium text-[#0a1628]">{fmt(value)}</span>
      </div>
      <div className="h-2 bg-[#0a1628]/10 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${highlight ? 'bg-[#c9a84c]' : 'bg-[#0a1628]/40'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
