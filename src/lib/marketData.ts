import type { RateInfo } from './types'

function withTimeout(ms: number): { signal: AbortSignal; cancel: () => void } {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), ms)
  return { signal: controller.signal, cancel: () => clearTimeout(timer) }
}

export interface PricePoint {
  date: string // YYYY-MM-DD
  close: number
}

/** Annualizes a total return over an arbitrary number of days. */
function annualize(totalReturn: number, days: number): number {
  if (days <= 0) return totalReturn
  if (days < 30) return totalReturn // too short a window to meaningfully annualize
  return Math.pow(1 + totalReturn, 365 / days) - 1
}

function pickReturnWindow(history: PricePoint[], sinceDate?: string): { from: PricePoint; to: PricePoint } | null {
  if (history.length < 2) return null
  const to = history[history.length - 1]
  let from: PricePoint
  if (sinceDate) {
    const target = new Date(sinceDate).getTime()
    from = history.reduce((best, p) =>
      Math.abs(new Date(p.date).getTime() - target) < Math.abs(new Date(best.date).getTime() - target) ? p : best,
    )
  } else {
    from = history[0] // furthest back available (up to ~1y)
  }
  if (from.date === to.date) return null
  return { from, to }
}

/** Parses Stooq's daily CSV history format: Date,Open,High,Low,Close,Volume */
function parseStooqCsv(csv: string): PricePoint[] {
  const lines = csv.trim().split('\n')
  if (lines.length < 2) return []
  const points: PricePoint[] = []
  for (const line of lines.slice(1)) {
    const cols = line.split(',')
    if (cols.length < 5) continue
    const close = Number(cols[4])
    if (!cols[0] || Number.isNaN(close)) continue
    points.push({ date: cols[0], close })
  }
  return points
}

async function fetchStooqHistory(symbol: string): Promise<PricePoint[]> {
  const { signal, cancel } = withTimeout(8000)
  try {
    const res = await fetch(`https://stooq.com/q/d/l/?s=${encodeURIComponent(symbol)}&i=d`, { signal })
    if (!res.ok) throw new Error(`Stooq fetch failed: ${res.status}`)
    const text = await res.text()
    if (text.includes('Exceeded') || text.toLowerCase().includes('no data')) return []
    return parseStooqCsv(text)
  } finally {
    cancel()
  }
}

/** Fetches an annualized return for a stock/ETF ticker via Stooq daily history (free, no API key). */
export async function fetchStockReturn(ticker: string, sinceDate?: string): Promise<RateInfo> {
  const symbol = ticker.trim().toLowerCase()
  const candidates = symbol.includes('.') ? [symbol] : [`${symbol}.us`, symbol]
  for (const candidate of candidates) {
    try {
      const history = await fetchStooqHistory(candidate)
      const window = pickReturnWindow(history, sinceDate)
      if (!window) continue
      const days = (new Date(window.to.date).getTime() - new Date(window.from.date).getTime()) / 86_400_000
      const totalReturn = window.to.close / window.from.close - 1
      return {
        annualRatePct: annualize(totalReturn, days),
        source: 'live',
        note: `${candidate.toUpperCase()} ${window.from.date} -> ${window.to.date}`,
        fetchedAt: new Date().toISOString(),
      }
    } catch {
      // try next candidate symbol
    }
  }
  return { annualRatePct: null, source: 'unavailable', note: 'Could not fetch live price for this ticker' }
}

const CRYPTO_ID_MAP: Record<string, string> = {
  btc: 'bitcoin',
  eth: 'ethereum',
  sol: 'solana',
  ada: 'cardano',
  doge: 'dogecoin',
  xrp: 'ripple',
  bnb: 'binancecoin',
  usdt: 'tether',
  usdc: 'usd-coin',
  matic: 'matic-network',
  dot: 'polkadot',
  ltc: 'litecoin',
  avax: 'avalanche-2',
  link: 'chainlink',
  trx: 'tron',
  shib: 'shiba-inu',
  atom: 'cosmos',
}

/** Fetches an annualized return for a crypto ticker via CoinGecko's public market_chart API (free, no API key). */
export async function fetchCryptoReturn(ticker: string, sinceDate?: string): Promise<RateInfo> {
  const key = ticker.trim().toLowerCase()
  const coinId = CRYPTO_ID_MAP[key] ?? key
  const { signal, cancel } = withTimeout(8000)
  try {
    const res = await fetch(
      `https://api.coingecko.com/api/v3/coins/${encodeURIComponent(coinId)}/market_chart?vs_currency=usd&days=365&interval=daily`,
      { signal },
    )
    if (!res.ok) throw new Error(`CoinGecko fetch failed: ${res.status}`)
    const json = (await res.json()) as { prices: [number, number][] }
    const history: PricePoint[] = json.prices.map(([ts, price]) => ({
      date: new Date(ts).toISOString().slice(0, 10),
      close: price,
    }))
    const window = pickReturnWindow(history, sinceDate)
    if (!window) throw new Error('Not enough price history')
    const days = (new Date(window.to.date).getTime() - new Date(window.from.date).getTime()) / 86_400_000
    const totalReturn = window.to.close / window.from.close - 1
    return {
      annualRatePct: annualize(totalReturn, days),
      source: 'live',
      note: `${coinId} ${window.from.date} -> ${window.to.date}`,
      fetchedAt: new Date().toISOString(),
    }
  } catch {
    return { annualRatePct: null, source: 'unavailable', note: 'Could not fetch live price for this coin' }
  } finally {
    cancel()
  }
}

/** Fetches the S&P 500's annualized return over the same lookback window, for benchmarking. Uses SPY (a highly liquid ETF tracking the index) via Stooq. */
export async function fetchSp500Return(sinceDate?: string): Promise<RateInfo> {
  return fetchStockReturn('spy', sinceDate)
}

/** Fetches SPY's full daily price history, for plotting a growth-over-time comparison. */
export async function fetchSp500History(): Promise<PricePoint[]> {
  try {
    return await fetchStooqHistory('spy.us')
  } catch {
    return []
  }
}
