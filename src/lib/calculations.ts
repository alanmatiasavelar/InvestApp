import type { Currency, Investment, Portfolio } from './types'
import { toUsd } from './fx'

export interface ResolvedInvestment extends Investment {
  usdValue: number
  effectiveRatePct: number | null
}

/**
 * Resolves each investment's USD value and its value in its own currency.
 * In 'percent' mode, each investment's percent is a share of the portfolio's total USD-equivalent
 * value, which is then converted into whatever currency that investment is held in — so slices can
 * span multiple currencies even though the percentages are all relative to one overall total.
 */
export function resolveInvestments(portfolio: Portfolio, usdRates: Record<Currency, number>): ResolvedInvestment[] {
  const { entryMode, totalValue, totalCurrency, investments } = portfolio
  const totalUsdValue =
    entryMode === 'percent' && totalValue && totalCurrency ? toUsd(totalValue, totalCurrency, usdRates) : 0

  return investments.map((inv) => {
    let usdValue: number
    let ownValue: number
    if (entryMode === 'percent') {
      usdValue = totalUsdValue * ((inv.percent ?? 0) / 100)
      ownValue = usdValue * (usdRates[inv.currency] ?? 1)
    } else {
      ownValue = inv.value
      usdValue = toUsd(inv.value, inv.currency, usdRates)
    }

    const effectiveRatePct = inv.manualRatePct != null ? inv.manualRatePct : (inv.rate?.annualRatePct ?? null)

    return {
      ...inv,
      value: ownValue,
      usdValue,
      effectiveRatePct,
    }
  })
}

export interface CurrencyBreakdownRow {
  currency: Currency
  nativeTotal: number
  usdTotal: number
  percentOfPortfolio: number
}

export function currencyBreakdown(resolved: ResolvedInvestment[]): CurrencyBreakdownRow[] {
  const totals = new Map<Currency, { native: number; usd: number }>()
  let grandTotalUsd = 0
  for (const inv of resolved) {
    const entry = totals.get(inv.currency) ?? { native: 0, usd: 0 }
    entry.native += inv.value
    entry.usd += inv.usdValue
    totals.set(inv.currency, entry)
    grandTotalUsd += inv.usdValue
  }
  return Array.from(totals.entries())
    .map(([currency, { native, usd }]) => ({
      currency,
      nativeTotal: native,
      usdTotal: usd,
      percentOfPortfolio: grandTotalUsd > 0 ? (usd / grandTotalUsd) * 100 : 0,
    }))
    .sort((a, b) => b.usdTotal - a.usdTotal)
}

export function totalUsd(resolved: ResolvedInvestment[]): number {
  return resolved.reduce((sum, inv) => sum + inv.usdValue, 0)
}

/** Value-weighted average annualized return across investments that have a known rate. */
export function weightedApy(resolved: ResolvedInvestment[]): { apy: number | null; coveragePct: number } {
  const withRate = resolved.filter((inv) => inv.effectiveRatePct != null)
  const totalWeighted = resolved.reduce((sum, inv) => sum + inv.usdValue, 0)
  const covered = withRate.reduce((sum, inv) => sum + inv.usdValue, 0)
  if (totalWeighted <= 0 || withRate.length === 0) return { apy: null, coveragePct: 0 }
  const apy = withRate.reduce((sum, inv) => sum + (inv.effectiveRatePct as number) * inv.usdValue, 0) / covered
  return { apy, coveragePct: (covered / totalWeighted) * 100 }
}

export interface TypeBreakdownRow {
  type: Investment['type']
  usdTotal: number
  percentOfPortfolio: number
}

export function typeBreakdown(resolved: ResolvedInvestment[]): TypeBreakdownRow[] {
  const totals = new Map<Investment['type'], number>()
  let grand = 0
  for (const inv of resolved) {
    totals.set(inv.type, (totals.get(inv.type) ?? 0) + inv.usdValue)
    grand += inv.usdValue
  }
  return Array.from(totals.entries())
    .map(([type, usdTotal]) => ({ type, usdTotal, percentOfPortfolio: grand > 0 ? (usdTotal / grand) * 100 : 0 }))
    .sort((a, b) => b.usdTotal - a.usdTotal)
}
