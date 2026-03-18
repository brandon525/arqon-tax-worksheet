// =============================================
// TAX DATA — Update each October when IRS
// publishes new year brackets (Rev. Proc.)
// Source: IRS Rev. Proc. 2024-61 (2025 year)
//         IRS Rev. Proc. 2023-34 (2024 year)
// Last updated: March 2026
// =============================================

export const TAX_YEARS = [2025, 2024] as const
export type TaxYear = typeof TAX_YEARS[number]

type Bracket = { min: number; max: number; rate: number }

const BRACKETS: Record<TaxYear, { single: Bracket[]; mfj: Bracket[]; hoh: Bracket[] }> = {
  2025: {
    single: [
      { min: 0,      max: 11925,   rate: 0.10 },
      { min: 11925,  max: 48475,   rate: 0.12 },
      { min: 48475,  max: 103350,  rate: 0.22 },
      { min: 103350, max: 197300,  rate: 0.24 },
      { min: 197300, max: 250525,  rate: 0.32 },
      { min: 250525, max: 626350,  rate: 0.35 },
      { min: 626350, max: Infinity, rate: 0.37 },
    ],
    mfj: [
      { min: 0,      max: 23850,   rate: 0.10 },
      { min: 23850,  max: 96950,   rate: 0.12 },
      { min: 96950,  max: 206700,  rate: 0.22 },
      { min: 206700, max: 394600,  rate: 0.24 },
      { min: 394600, max: 501050,  rate: 0.32 },
      { min: 501050, max: 751600,  rate: 0.35 },
      { min: 751600, max: Infinity, rate: 0.37 },
    ],
    hoh: [
      { min: 0,      max: 17000,   rate: 0.10 },
      { min: 17000,  max: 64850,   rate: 0.12 },
      { min: 64850,  max: 103350,  rate: 0.22 },
      { min: 103350, max: 197300,  rate: 0.24 },
      { min: 197300, max: 250500,  rate: 0.32 },
      { min: 250500, max: 626350,  rate: 0.35 },
      { min: 626350, max: Infinity, rate: 0.37 },
    ],
  },
  2024: {
    single: [
      { min: 0,      max: 11600,   rate: 0.10 },
      { min: 11600,  max: 47150,   rate: 0.12 },
      { min: 47150,  max: 100525,  rate: 0.22 },
      { min: 100525, max: 191950,  rate: 0.24 },
      { min: 191950, max: 243725,  rate: 0.32 },
      { min: 243725, max: 609350,  rate: 0.35 },
      { min: 609350, max: Infinity, rate: 0.37 },
    ],
    mfj: [
      { min: 0,      max: 23200,   rate: 0.10 },
      { min: 23200,  max: 94300,   rate: 0.12 },
      { min: 94300,  max: 201050,  rate: 0.22 },
      { min: 201050, max: 383900,  rate: 0.24 },
      { min: 383900, max: 487450,  rate: 0.32 },
      { min: 487450, max: 731200,  rate: 0.35 },
      { min: 731200, max: Infinity, rate: 0.37 },
    ],
    hoh: [
      { min: 0,      max: 16550,   rate: 0.10 },
      { min: 16550,  max: 63100,   rate: 0.12 },
      { min: 63100,  max: 100500,  rate: 0.22 },
      { min: 100500, max: 191950,  rate: 0.24 },
      { min: 191950, max: 243700,  rate: 0.32 },
      { min: 243700, max: 609350,  rate: 0.35 },
      { min: 609350, max: Infinity, rate: 0.37 },
    ],
  },
}

// Standard deductions
// 2025 source: IRS Publication 501, Table 1 (under 65)
// 2024 source: Rev. Proc. 2023-34
export const STANDARD_DEDUCTION: Record<TaxYear, { single: number; mfj: number; hoh: number }> = {
  2025: { single: 15750, mfj: 31500, hoh: 23625 },
  2024: { single: 14600, mfj: 29200, hoh: 21900 },
}

export type FilingStatus = 'single' | 'mfj' | 'hoh'

export interface TaxInput {
  taxYear: TaxYear
  filingStatus: FilingStatus
  // Income — 1040 boxes
  wages: number           // Box 1a
  otherIncome: number     // Box 8 (business, rental, etc.)
  agi: number             // Box 11 (user enters from return)
  // Deductions — Box 12
  useStandardDeduction: boolean
  itemizedDeduction: number
  // Credits
  childTaxCredit: number  // Box 19
  otherCredits: number    // Box 32
  // Payments — Box 23
  totalPayments: number
}

export interface TaxResult {
  taxYear: TaxYear
  filingStatus: FilingStatus
  // Calculated fields
  grossIncome: number       // 1a + 8
  agi: number               // Box 11
  standardDeduction: number
  deductionUsed: number     // Box 12
  taxableIncome: number     // Box 15
  federalTax: number        // Box 16
  totalCredits: number      // Box 19 + 32
  totalTaxAfterCredits: number // Box 24
  totalPayments: number     // Box 23
  refund: number            // Box 34
  amountOwed: number        // Box 37
  effectiveRate: number
  marginalRate: number
  bracket: string
  // Gap analysis
  additionalDeductionsToBreakEven: number
  additionalDeductionsFor500More: number
  recommendations: string[]
}

function calcFederalTax(taxable: number, brackets: Bracket[]): number {
  let tax = 0
  for (const b of brackets) {
    if (taxable <= b.min) break
    tax += (Math.min(taxable, b.max) - b.min) * b.rate
  }
  return Math.round(tax)
}

function getMarginalRate(taxable: number, brackets: Bracket[]): number {
  for (const b of [...brackets].reverse()) {
    if (taxable > b.min) return b.rate
  }
  return 0.10
}

function getBracketLabel(rate: number): string {
  return `${(rate * 100).toFixed(0)}% bracket`
}

export function calculateTax(input: TaxInput): TaxResult {
  const brackets = BRACKETS[input.taxYear][input.filingStatus]
  const stdDed = STANDARD_DEDUCTION[input.taxYear][input.filingStatus]

  const grossIncome = input.wages + input.otherIncome
  const agi = input.agi > 0 ? input.agi : grossIncome
  const deductionUsed = input.useStandardDeduction
    ? stdDed
    : Math.max(input.itemizedDeduction, stdDed)

  const taxableIncome = Math.max(0, agi - deductionUsed)
  const federalTax = calcFederalTax(taxableIncome, brackets)
  const totalCredits = input.childTaxCredit + input.otherCredits
  const totalTaxAfterCredits = Math.max(0, federalTax - totalCredits)
  const totalPayments = input.totalPayments

  const balance = totalTaxAfterCredits - totalPayments
  const refund = balance < 0 ? Math.abs(balance) : 0
  const amountOwed = balance > 0 ? balance : 0

  const marginalRate = getMarginalRate(taxableIncome, brackets)
  const effectiveRate = agi > 0 ? totalTaxAfterCredits / agi : 0

  // Gap analysis: how much additional deductions to break even (owed → $0)
  const additionalDeductionsToBreakEven = amountOwed > 0
    ? Math.ceil(amountOwed / marginalRate)
    : 0

  // How much to get $500 more in refund
  const additionalDeductionsFor500More = Math.ceil(500 / marginalRate)

  const recommendations = buildRecommendations(
    input, deductionUsed, stdDed, marginalRate, taxableIncome, amountOwed, refund
  )

  return {
    taxYear: input.taxYear,
    filingStatus: input.filingStatus,
    grossIncome,
    agi,
    standardDeduction: stdDed,
    deductionUsed,
    taxableIncome,
    federalTax,
    totalCredits,
    totalTaxAfterCredits,
    totalPayments,
    refund,
    amountOwed,
    effectiveRate,
    marginalRate,
    bracket: getBracketLabel(marginalRate),
    additionalDeductionsToBreakEven,
    additionalDeductionsFor500More,
    recommendations,
  }
}

function buildRecommendations(
  input: TaxInput,
  deductionUsed: number,
  stdDed: number,
  marginalRate: number,
  taxableIncome: number,
  amountOwed: number,
  refund: number
): string[] {
  const recs: string[] = []
  const fmt = (n: number) => `$${Math.round(n).toLocaleString()}`
  const pct = (r: number) => `${(r * 100).toFixed(0)}%`

  if (amountOwed > 0) {
    const needed = Math.ceil(amountOwed / marginalRate)
    recs.push(`You owe ${fmt(amountOwed)}. Finding ${fmt(needed)} more in deductions at your ${pct(marginalRate)} rate would eliminate this balance entirely.`)
  } else if (refund > 0) {
    recs.push(`You're getting ${fmt(refund)} back. That means you overpaid throughout the year — adjusting your W-4 withholding could put that money in your pocket now instead of waiting for a refund.`)
  }

  if (input.useStandardDeduction) {
    recs.push(`You're using the standard deduction (${fmt(stdDed)}). If your itemized deductions — mortgage interest, state taxes, charitable giving — exceed this, you could pay less.`)
  } else if (deductionUsed > stdDed) {
    recs.push(`Itemizing saved you over the standard deduction. Make sure every deductible expense is captured — mortgage interest, donations, and state taxes up to $10,000.`)
  }

  const retirementCap = input.taxYear === 2025 ? 23500 : 23000
  recs.push(`At your ${pct(marginalRate)} bracket, every dollar contributed to a traditional 401(k) saves ${pct(marginalRate)} in federal taxes. The ${input.taxYear} limit is ${fmt(retirementCap)}.`)

  if (taxableIncome > (input.filingStatus === 'mfj' ? 200000 : 100000)) {
    recs.push(`At your income level, strategies like tax-loss harvesting, backdoor Roth conversions, or a Health Savings Account (HSA) can meaningfully reduce your liability.`)
  }

  return recs
}
