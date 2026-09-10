import type { Currency, InvestmentType } from './types'

/** Fixed categorical slots (validated: adjacent-pair CVD Delta E >= 8, normal-vision >= 15). */
export const CATEGORICAL_SLOTS = [
  { light: '#2a78d6', dark: '#3987e5' }, // 1 blue
  { light: '#eb6834', dark: '#d95926' }, // 2 orange
  { light: '#1baf7a', dark: '#199e70' }, // 3 aqua
  { light: '#eda100', dark: '#c98500' }, // 4 yellow
  { light: '#e87ba4', dark: '#d55181' }, // 5 magenta
  { light: '#008300', dark: '#008300' }, // 6 green
  { light: '#4a3aa7', dark: '#9085e9' }, // 7 violet
  { light: '#e34948', dark: '#e66767' }, // 8 red
] as const

// Colors are tied to the entity (currency / type), not to sort rank, so they stay
// stable even as amounts (and therefore display order) change.
const CURRENCY_SLOT: Record<Currency, number> = {
  USD: 0,
  EUR: 1,
  GBP: 2,
  BRL: 3,
  JPY: 4,
  CAD: 5,
  AUD: 6,
  CHF: 7,
}

const TYPE_SLOT: Record<InvestmentType, number> = {
  stock: 0,
  etf: 1,
  crypto: 2,
  fixed_income: 3,
  cash: 4,
  other: 5,
}

export function currencyColor(currency: Currency, mode: 'light' | 'dark'): string {
  return CATEGORICAL_SLOTS[CURRENCY_SLOT[currency]][mode]
}

export function typeColor(type: InvestmentType, mode: 'light' | 'dark'): string {
  return CATEGORICAL_SLOTS[TYPE_SLOT[type]][mode]
}
