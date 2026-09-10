import type { Currency } from './types'

export function fmtMoney(amount: number, currency: Currency, maximumFractionDigits = 0): string {
  return amount.toLocaleString('en-US', { style: 'currency', currency, maximumFractionDigits })
}
