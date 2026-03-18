// 2024 Federal Tax Brackets (Single)
const BRACKETS_SINGLE_2024 = [
  { min: 0, max: 11600, rate: 0.10 },
  { min: 11600, max: 47150, rate: 0.12 },
  { min: 47150, max: 100525, rate: 0.22 },
  { min: 100525, max: 191950, rate: 0.24 },
  { min: 191950, max: 243725, rate: 0.32 },
  { min: 243725, max: 609350, rate: 0.35 },
  { min: 609350, max: Infinity, rate: 0.37 },
]

// 2024 Federal Tax Brackets (Married Filing Jointly)
const BRACKETS_MFJ_2024 = [
  { min: 0, max: 23200, rate: 0.10 },
  { min: 23200, max: 94300, rate: 0.12 },
  { min: 94300, max: 201050, rate: 0.22 },
  { min: 201050, max: 383900, rate: 0.24 },
  { min: 383900, max: 487450, rate: 0.32 },
  { min: 487450, max: 731200, rate: 0.35 },
  { min: 731200, max: Infinity, rate: 0.37 },
]

// 2024 Standard Deductions
const STANDARD_DEDUCTION = {
  single: 14600,
  mfj: 29200,
  hoh: 21900,
}

export type FilingStatus = 'single' | 'mfj' | 'hoh'

export interface TaxInput {
  filingStatus: FilingStatus
  grossIncome: number
  otherIncome: number
  // Deductions
  mortgageInterest: number
  charitableContributions: number
  stateTaxesPaid: number
  businessExpenses: number
  retirementContributions: number
  healthInsurancePremiums: number
  studentLoanInterest: number
  otherDeductions: number
  // Credits
  childTaxCredit: number
  otherCredits: number
}

export interface TaxResult {
  grossIncome: number
  totalIncome: number
  standardDeduction: number
  itemizedDeductions: number
  deductionUsed: number
  taxableIncome: number
  federalTax: number
  effectiveRate: number
  marginalRate: number
  // Gaps
  deductionGap: number
  potentialSavings: number
  recommendations: string[]
}

function calcFederalTax(taxable: number, status: FilingStatus): number {
  const brackets = status === 'mfj' ? BRACKETS_MFJ_2024 : BRACKETS_SINGLE_2024
  let tax = 0
  for (const bracket of brackets) {
    if (taxable <= bracket.min) break
    const taxable_in_bracket = Math.min(taxable, bracket.max) - bracket.min
    tax += taxable_in_bracket * bracket.rate
  }
  return Math.round(tax)
}

function getMarginalRate(taxable: number, status: FilingStatus): number {
  const brackets = status === 'mfj' ? BRACKETS_MFJ_2024 : BRACKETS_SINGLE_2024
  for (const bracket of [...brackets].reverse()) {
    if (taxable > bracket.min) return bracket.rate
  }
  return 0.10
}

export function calculateTax(input: TaxInput): TaxResult {
  const totalIncome = input.grossIncome + input.otherIncome

  const standardDeduction = STANDARD_DEDUCTION[input.filingStatus] ?? STANDARD_DEDUCTION.single

  const itemizedDeductions =
    input.mortgageInterest +
    Math.min(input.charitableContributions, totalIncome * 0.6) +
    Math.min(input.stateTaxesPaid, 10000) + // SALT cap
    input.businessExpenses +
    input.retirementContributions +
    input.healthInsurancePremiums +
    Math.min(input.studentLoanInterest, 2500) +
    input.otherDeductions

  const deductionUsed = Math.max(standardDeduction, itemizedDeductions)
  const taxableIncome = Math.max(0, totalIncome - deductionUsed)
  const federalTax = Math.max(0, calcFederalTax(taxableIncome, input.filingStatus) - input.childTaxCredit - input.otherCredits)
  const effectiveRate = totalIncome > 0 ? federalTax / totalIncome : 0
  const marginalRate = getMarginalRate(taxableIncome, input.filingStatus)

  // Gap analysis: how much more they could deduct vs what they're using
  const deductionGap = Math.max(0, itemizedDeductions - standardDeduction)
  const potentialSavings = Math.round(deductionGap * marginalRate)

  const recommendations = buildRecommendations(input, itemizedDeductions, standardDeduction, marginalRate, taxableIncome)

  return {
    grossIncome: input.grossIncome,
    totalIncome,
    standardDeduction,
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

  if (itemized < standard) {
    recs.push(`You're currently better off with the standard deduction ($${standard.toLocaleString()}). Bunching deductions in alternating years could help you itemize.`)
  } else {
    recs.push(`You benefit from itemizing — you're saving $${Math.round((itemized - standard) * marginalRate).toLocaleString()} more than the standard deduction.`)
  }

  if (input.retirementContributions < 23000) {
    const room = 23000 - input.retirementContributions
    recs.push(`You have $${room.toLocaleString()} of unused 401(k) space. Maxing it out could save ~$${Math.round(room * marginalRate).toLocaleString()} in federal taxes.`)
  }

  if (input.stateTaxesPaid >= 10000) {
    recs.push(`Your state taxes hit the $10,000 SALT cap. A tax advisor may identify other deduction strategies to offset this limitation.`)
  }

  if (input.businessExpenses > 0 && input.filingStatus !== 'mfj') {
    recs.push(`Business expenses of $${input.businessExpenses.toLocaleString()} are claimed — make sure these are properly documented with receipts for any IRS inquiry.`)
  }

  if (taxableIncome > 191950 && input.filingStatus === 'single') {
    recs.push(`At your income level (32%+ bracket), strategies like Roth conversions, QBI deductions, or charitable DAFs can meaningfully reduce your tax burden.`)
  }

  if (input.charitableContributions > 0 && input.charitableContributions < 5000) {
    recs.push(`Consider a Donor-Advised Fund to bunch several years of charitable giving into one deduction-maximizing year.`)
  }

  return recs
}
