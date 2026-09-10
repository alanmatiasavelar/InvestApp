import type { Currency } from './types'

/** Units of each currency per 1 USD. Used as an offline fallback if the live FX fetch fails. */
const FALLBACK_USD_RATES: Record<Currency, number> = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.78,
  BRL: 5.4,
  JPY: 149,
  CAD: 1.36,
  AUD: 1.5,
  CHF: 0.88,
}

export interface FxRates {
  /** Units of currency per 1 USD. */
  rates: Record<Currency, number>
  source: 'live' | 'fallback'
  fetchedAt: string
}

let cached: { data: FxRates; expiresAt: number } | null = null

function withTimeout(ms: number): { signal: AbortSignal; cancel: () => void } {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), ms)
  return { signal: controller.signal, cancel: () => clearTimeout(timer) }
}

/** Fetches current FX rates (currency units per 1 USD) from the Frankfurter API (ECB reference rates, no API key required). */
export async function fetchUsdRates(): Promise<FxRates> {
  const now = Date.now()
  if (cached && cached.expiresAt > now) return cached.data

  const { signal, cancel } = withTimeout(8000)
  try {
    const res = await fetch('https://api.frankfurter.app/latest?from=USD', { signal })
    if (!res.ok) throw new Error(`FX fetch failed: ${res.status}`)
    const json = (await res.json()) as { rates: Record<string, number> }
    const rates: Record<Currency, number> = { ...FALLBACK_USD_RATES }
    for (const key of Object.keys(rates) as Currency[]) {
      if (key === 'USD') continue
      if (typeof json.rates[key] === 'number') rates[key] = json.rates[key]
    }
    const data: FxRates = { rates, source: 'live', fetchedAt: new Date().toISOString() }
    cached = { data, expiresAt: now + 10 * 60 * 1000 }
    return data
  } catch {
    const data: FxRates = { rates: FALLBACK_USD_RATES, source: 'fallback', fetchedAt: new Date().toISOString() }
    cached = { data, expiresAt: now + 60 * 1000 }
    return data
  } finally {
    cancel()
  }
}

/** Converts an amount in `currency` to USD using the given rate table (units of currency per 1 USD). */
export function toUsd(amount: number, currency: Currency, rates: Record<Currency, number>): number {
  const rate = rates[currency] ?? 1
  return amount / rate
}

/** Converts a USD amount into `currency` using the given rate table (units of currency per 1 USD). */
export function fromUsd(amountUsd: number, currency: Currency, rates: Record<Currency, number>): number {
  return amountUsd * (rates[currency] ?? 1)
}
