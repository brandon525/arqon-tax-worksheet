// =============================================
// TAX DATA — Update each October when IRS
// publishes new year brackets (Rev. Proc.)
// Last updated: March 2026 (covers 2024 & 2025)
// =============================================

export const TAX_YEARS = [2025, 2024] as const
export type TaxYear = typeof TAX_YEARS[number]

type Bracket = { min: number; max: number; rate: number }

const BRACKETS: Record<TaxYear, { single: Bracket[]; mfj: Bracket[]; hoh: Bracket[] }> = {
  2025: {
    single: [
      { min: 0,       max: 11925,   rate: 0.10 },
      { min: 11925,   max: 48475,   rate: 0.12 },
      { min: 48475,   max: 103350,  rate: 0.22 },
      { min: 103350,  max: 197300,  rate: 0.24 },
      { min: 197300,  max: 250525,  rate: 0.32 },
      { min: 250525,  max: 626350,  rate: 0.35 },
      { min: 626350,  max: Infinity, rate: 0.37 },
    ],
    mfj: [
      { min: 0,       max: 23850,   rate: 0.10 },
      { min: 23850,   max: 96950,   rate: 0.12 },
      { min: 96950,   max: 206700,  rate: 0.22 },
      { min: 206700,  max: 394600,  rate: 0.24 },
      { min: 394600,  max: 501050,  rate: 0.32 },
      { min: 501050,  max: 751600,  rate: 0.35 },
      { min: 751600,  max: Infinity, rate: 0.37 },
    ],
    hoh: [
      { min: 0,       max: 17000,   rate: 0.10 },
      { min: 17000,   max: 64850,   rate: 0.12 },
      { min: 64850,   max: 103350,  rate: 0.22 },
      { min: 103350,  max: 197300,  rate: 0.24 },
      { min: 197300,  max: 250500,  rate: 0.32 },
      { min: 250500,  max: 626350,  rate: 0.35 },
      { min: 626350,  max: Infinity, rate: 0.37 },
    ],
  },
  2024: {
    single: [
      { min: 0,       max: 11600,   rate: 0.10 },
      { min: 11600,   max: 47150,   rate: 0.12 },
      { min: 47150,   max: 100525,  rate: 0.22 },
      { min: 100525,  max: 191950,  rate: 0.24 },
      { min: 191950,  max: 243725,  rate: 0.32 },
      { min: 243725,  max: 609350,  rate: 0.35 },
      { min: 609350,  max: Infinity, rate: 0.37 },
    ],
    mfj: [
      { min: 0,       max: 23200,   rate: 0.10 },
      { min: 23200,   max: 94300,   rate: 0.12 },
      { min: 94300,   max: 201050,  rate: 0.22 },
      { min: 201050,  max: 383900,  rate: 0.24 },
      { min: 383900,  max: 487450,  rate: 0.32 },
      { min: 487450,  max: 731200,  rate: 0.35 },
      { min: 731200,  max: Infinity, rate: 0.37 },
    ],
    hoh: [
      { min: 0,       max: 16550,   rate: 0.10 },
      { min: 16550,   max: 63100,   rate: 0.12 },
      { min: 63100,   max: 100500,  rate: 0.22 },
      { min: 100500,  max: 191950,  rate: 0.24 },
      { min: 191950,  max: 243700,  rate: 0.32 },
      { min: 243700,  max: 609350,  rate: 0.35 },
      { min: 609350,  max: Infinity, rate: 0.37 },
    ],
  },
}

const STANDARD_DEDUCTION: Record<TaxYear, { single: number; mfj: number; hoh: number }> = {
  2025: { single: 15000, mfj: 30000, hoh: 22500 },
  2024: { single: 14600, mfj: 29200, hoh: 21900 },
}

export type FilingStatus = 'single' | 'mfj' | 'hoh'

export interface TaxInput {
  taxYear: TaxYear
  filingStatus: FilingStatus
  grossIncome: number
  otherIncome: number
  mortgageInterest: number
  charitableContributions: number
  stateTaxesPaid: number
  businessExpenses: number
  retirementContributions: number
  healthInsurancePremiums: number
  studentLoanInterest: number
  otherDeductions: number
  childTaxCredit: number
  otherCredits: number
}

export interface TaxResult {
  taxYear: TaxYear
  grossIncome: number
  totalIncome: number
  standardDeduction: number
  itemizedDeductions: number
  deductionUsed: number
  taxableIncome: number
  federalTax: number
  effectiveRate: number
  marginalRate: number
  deductionGap: number
  potentialSavings: number
  recommendations: string[]
}

function calcFederalTax(taxable: number, brackets: Bracket[]): number {
  let tax = 0
  for (const bracket of brackets) {
    if (taxable <= bracket.min) break
    const amt = Math.min(taxable, bracket.max) - bracket.min
    tax += amt * bracket.rate
  }
  return Math.round(tax)
}

function getMarginalRate(taxable: number, brackets: Bracket[]): number {
  for (const bracket of [...brackets].reverse()) {
    if (taxable > bracket.min) return bracket.rate
  }
  return 0.10
}

export function calculateTax(input: TaxInput): TaxResult {
  const yearData = BRACKETS[input.taxYear]
  const brackets = yearData[input.filingStatus]
  const stdDed = STANDARD_DEDUCTION[input.taxYear][input.filingStatus]

  const totalIncome = input.grossIncome + input.otherIncome

  const itemizedDeductions =
    input.mortgageInterest +
    Math.min(input.charitableContributions, totalIncome * 0.6) +
    Math.min(input.stateTaxesPaid, 10000) +
    input.businessExpenses +
    input.retirementContributions +
    input.healthInsurancePremiums +
    Math.min(input.studentLoanInterest, 2500) +
    input.otherDeductions

  const deductionUsed = Math.max(stdDed, itemizedDeductions)
  const taxableIncome = Math.max(0, totalIncome - deductionUsed)
  const rawTax = calcFederalTax(taxableIncome, brackets)
  const federalTax = Math.max(0, rawTax - input.childTaxCredit - input.otherCredits)
  const effectiveRate = totalIncome > 0 ? federalTax / totalIncome : 0
  const marginalRate = getMarginalRate(taxableIncome, brackets)
  const deductionGap = Math.max(0, itemizedDeductions - stdDed)
  const potentialSavings = Math.round(deductionGap * marginalRate)

  const recommendations = buildRecommendations(input, itemizedDeductions, stdDed, marginalRate, taxableIncome)

  return {
    taxYear: input.taxYear,
    grossIncome: input.grossIncome,
    totalIncome,
    standardDeduction: stdDed,
    itemizedDeductions,
    deductionUsed,
    taxableIncome,
    federalTax,
    effectiveRate,
    marginalRate,
    deductionGap,
    potentialSavings,
    recommendations,
  }
}

function buildRecommendations(
  input: TaxInput,
  itemized: number,
  standard: number,
  marginalRate: number,
  taxableIncome: number
): string[] {
  const recs: string[] = []
  const fmt = (n: number) => `$${n.toLocaleString()}`

  if (itemized < standard) {
    recs.push(`You're better off with the standard deduction (${fmt(standard)}). Bunching deductions in alternating years could help you itemize.`)
  } else {
    recs.push(`You benefit from itemizing — saving ${fmt(Math.round((itemized - standard) * marginalRate))} more than the standard deduction.`)
  }

  const retirementCap = input.taxYear === 2025 ? 23500 : 23000
  if (input.retirementContributions < retirementCap) {
    const room = retirementCap - input.retirementContributions
    recs.push(`You have ${fmt(room)} of unused 401(k) space for ${input.taxYear}. Maxing it out could save ~${fmt(Math.round(room * marginalRate))} in federal taxes.`)
  }

  if (input.stateTaxesPaid >= 10000) {
    recs.push(`Your state taxes hit the $10,000 SALT cap. A tax advisor may identify other strategies to offset this limitation.`)
  }

  if (taxableIncome > (input.filingStatus === 'mfj' ? 383900 : 191950)) {
    recs.push(`At your income level, strategies like Roth conversions, QBI deductions, or charitable DAFs can meaningfully reduce your tax burden.`)
  }

  if (input.charitableContributions > 0 && input.charitableContributions < 5000) {
    recs.push(`Consider a Donor-Advised Fund to bunch several years of charitable giving into one year for a larger deduction.`)
  }

  return recs
}
