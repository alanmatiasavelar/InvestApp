export type Currency = 'USD' | 'EUR' | 'GBP' | 'BRL' | 'JPY' | 'CAD' | 'AUD' | 'CHF'

export const CURRENCIES: Currency[] = ['USD', 'EUR', 'GBP', 'BRL', 'JPY', 'CAD', 'AUD', 'CHF']

export type InvestmentType = 'stock' | 'etf' | 'crypto' | 'fixed_income' | 'cash' | 'other'

export const INVESTMENT_TYPES: { value: InvestmentType; label: string }[] = [
  { value: 'stock', label: 'Stock' },
  { value: 'etf', label: 'ETF / Fund' },
  { value: 'crypto', label: 'Crypto' },
  { value: 'fixed_income', label: 'Fixed Income / Bond' },
  { value: 'cash', label: 'Cash / Savings' },
  { value: 'other', label: 'Other' },
]

/** How a single investment's value was supplied by the user. */
export type EntryMode = 'percent' | 'value'

export interface RateInfo {
  /** Annualized return rate, as a fraction (0.08 = 8%). */
  annualRatePct: number | null
  /** Where the rate came from. */
  source: 'live' | 'manual' | 'unavailable'
  /** Human-readable note, e.g. ticker price used, or why it's unavailable. */
  note?: string
  fetchedAt?: string
}

export interface Investment {
  id: string
  name: string
  ticker?: string
  type: InvestmentType
  currency: Currency
  /** Value in the investment's own currency. */
  value: number
  /** Only meaningful when the portfolio entryMode is 'percent'. */
  percent?: number
  /** Optional manual annual rate override (fraction, e.g. 0.05). */
  manualRatePct?: number
  purchaseDate?: string
  rate?: RateInfo
  createdAt: string
}

export interface Portfolio {
  entryMode: EntryMode
  /** Only used when entryMode === 'percent': the total portfolio value and its currency. */
  totalValue?: number
  totalCurrency?: Currency
  investments: Investment[]
}

export const emptyPortfolio: Portfolio = {
  entryMode: 'value',
  investments: [],
}
