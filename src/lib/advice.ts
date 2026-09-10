import type { ResolvedInvestment, CurrencyBreakdownRow, TypeBreakdownRow } from './calculations'

export interface AdviceItem {
  level: 'warning' | 'tip' | 'info'
  title: string
  body: string
}

export function generateAdvice(
  resolved: ResolvedInvestment[],
  currencyRows: CurrencyBreakdownRow[],
  typeRows: TypeBreakdownRow[],
  apy: number | null,
  sp500Apy: number | null,
): AdviceItem[] {
  const items: AdviceItem[] = []
  const totalUsd = resolved.reduce((s, i) => s + i.usdValue, 0)

  if (resolved.length === 0) {
    return [
      {
        level: 'info',
        title: 'Add your first investment',
        body: 'Once you enter a few investments, this tab will surface diversification, concentration, and currency-risk observations tailored to your portfolio.',
      },
    ]
  }

  // Concentration risk: any single investment over 40% of total
  const biggest = [...resolved].sort((a, b) => b.usdValue - a.usdValue)[0]
  if (biggest && totalUsd > 0) {
    const pct = (biggest.usdValue / totalUsd) * 100
    if (pct >= 40) {
      items.push({
        level: 'warning',
        title: `${biggest.name} is ${pct.toFixed(0)}% of your portfolio`,
        body: 'A single position this large means your overall outcome is mostly determined by one asset. Consider whether that concentration is intentional (high conviction) or something to trim over time.',
      })
    }
  }

  // Currency concentration
  const nonUsdBig = currencyRows.find((r) => r.currency !== 'USD' && r.percentOfPortfolio >= 60)
  if (nonUsdBig) {
    items.push({
      level: 'warning',
      title: `${nonUsdBig.percentOfPortfolio.toFixed(0)}% of your portfolio is held in ${nonUsdBig.currency}`,
      body: `Your USD net worth will move with the ${nonUsdBig.currency}/USD exchange rate, on top of the investments themselves. If your future spending is mostly in another currency, that may be fine — otherwise it's an extra layer of risk worth naming explicitly.`,
    })
  } else if (currencyRows.length >= 2) {
    items.push({
      level: 'info',
      title: 'Multi-currency exposure',
      body: `Your holdings span ${currencyRows.length} currencies (${currencyRows.map((r) => r.currency).join(', ')}). This can be a natural hedge, but remember FX swings affect your USD total even when local values are flat.`,
    })
  }

  // Asset type diversification
  const equityLike = typeRows.filter((r) => r.type === 'stock' || r.type === 'etf' || r.type === 'crypto')
  const equityPct = equityLike.reduce((s, r) => s + r.percentOfPortfolio, 0)
  const cashPct = typeRows.find((r) => r.type === 'cash')?.percentOfPortfolio ?? 0
  const fixedPct = typeRows.find((r) => r.type === 'fixed_income')?.percentOfPortfolio ?? 0

  if (equityPct >= 90) {
    items.push({
      level: 'tip',
      title: 'Fully invested in market-risk assets',
      body: 'Stocks, ETFs, and crypto make up nearly all of your portfolio, with little in cash or fixed income. That maximizes long-run growth potential but means a downturn hits your whole portfolio — worth confirming that matches your time horizon and risk tolerance.',
    })
  } else if (cashPct + fixedPct >= 70) {
    items.push({
      level: 'tip',
      title: 'Conservative allocation',
      body: 'Most of your portfolio sits in cash and fixed income. That protects against volatility but historically trails equities over long horizons — reasonable if you need the money soon or prioritize stability over growth.',
    })
  }

  const cryptoPct = typeRows.find((r) => r.type === 'crypto')?.percentOfPortfolio ?? 0
  if (cryptoPct >= 20) {
    items.push({
      level: 'warning',
      title: `Crypto is ${cryptoPct.toFixed(0)}% of your portfolio`,
      body: 'Crypto assets are meaningfully more volatile than stocks or bonds. A large allocation amplifies both upside and drawdowns — make sure the sizing reflects how much volatility you can tolerate.',
    })
  }

  // Benchmark comparison
  if (apy != null && sp500Apy != null) {
    const diff = (apy - sp500Apy) * 100
    if (diff <= -3) {
      items.push({
        level: 'info',
        title: `Trailing the S&P 500 by ${Math.abs(diff).toFixed(1)} pts/yr`,
        body: 'Your blended annualized return is running below a simple S&P 500 index over the same lookback window. That\'s not necessarily bad — lower volatility or a shorter horizon can justify it — but it\'s worth knowing what you\'re giving up for whatever benefit you\'re getting.',
      })
    } else if (diff >= 3) {
      items.push({
        level: 'info',
        title: `Outpacing the S&P 500 by ${diff.toFixed(1)} pts/yr`,
        body: 'Your blended return is running ahead of a simple index benchmark. Worth checking whether that\'s from genuine skill/conviction or from concentration in a few positions that happened to do well — the latter carries more risk going forward.',
      })
    }
  } else if (apy == null) {
    items.push({
      level: 'info',
      title: 'Add rates to unlock return tracking',
      body: 'Once tickers resolve to a live price history (or you enter a manual rate for fixed income/cash), this tab can compare your blended return against the S&P 500.',
    })
  }

  items.push({
    level: 'info',
    title: 'Not financial advice',
    body: 'These are general, rule-based observations about diversification and concentration — not a recommendation to buy, sell, or hold anything. Rates are estimates from public market data and may be delayed, incomplete, or wrong. Consider talking to a licensed financial advisor for decisions specific to your situation.',
  })

  return items
}
