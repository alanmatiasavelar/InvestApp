import { useEffect, useMemo, useState } from 'react'
import { InvestmentForm } from './components/InvestmentForm'
import { InvestmentList } from './components/InvestmentList'
import { PortfolioModeToggle } from './components/PortfolioModeToggle'
import { SummaryCards } from './components/SummaryCards'
import { CurrencyPanel, TypePanel } from './components/AllocationPanels'
import { BenchmarkPanel } from './components/BenchmarkPanel'
import { AdviceTab } from './components/AdviceTab'
import { loadPortfolio, savePortfolio } from './lib/storage'
import { fetchUsdRates, type FxRates } from './lib/fx'
import { fetchCryptoReturn, fetchSp500Return, fetchStockReturn } from './lib/marketData'
import { currencyBreakdown, resolveInvestments, totalUsd, typeBreakdown, weightedApy } from './lib/calculations'
import { generateAdvice } from './lib/advice'
import type { Currency, Investment, InvestmentType } from './lib/types'

function makeId(): string {
  return crypto.randomUUID()
}

async function fetchRateFor(inv: Investment) {
  if (inv.type === 'stock' || inv.type === 'etf') return fetchStockReturn(inv.ticker || inv.name, inv.purchaseDate)
  if (inv.type === 'crypto') return fetchCryptoReturn(inv.ticker || inv.name, inv.purchaseDate)
  return null // fixed_income / cash / other rely on manual rate
}

export default function App() {
  const [portfolio, setPortfolio] = useState(loadPortfolio)
  const [fx, setFx] = useState<FxRates | null>(null)
  const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set())
  const [sp500, setSp500] = useState<{ apy: number | null }>({ apy: null })
  const [tab, setTab] = useState<'portfolio' | 'advice'>('portfolio')

  useEffect(() => {
    savePortfolio(portfolio)
  }, [portfolio])

  useEffect(() => {
    fetchUsdRates().then(setFx)
  }, [])

  useEffect(() => {
    const earliest = portfolio.investments
      .map((i) => i.purchaseDate)
      .filter((d): d is string => !!d)
      .sort()[0]
    fetchSp500Return(earliest).then((r) => setSp500({ apy: r.annualRatePct }))
  }, [portfolio.investments])

  function updateRate(id: string, inv: Investment) {
    setLoadingIds((prev) => new Set(prev).add(id))
    fetchRateFor(inv)
      .then((rate) => {
        if (!rate) return
        setPortfolio((p) => ({
          ...p,
          investments: p.investments.map((i) => (i.id === id ? { ...i, rate } : i)),
        }))
      })
      .finally(() => {
        setLoadingIds((prev) => {
          const next = new Set(prev)
          next.delete(id)
          return next
        })
      })
  }

  function addInvestment(input: {
    name: string
    ticker?: string
    type: InvestmentType
    currency: Currency
    value: number
    percent?: number
    manualRatePct?: number
    purchaseDate?: string
  }) {
    const inv: Investment = {
      id: makeId(),
      createdAt: new Date().toISOString(),
      ...input,
      rate:
        input.manualRatePct != null
          ? { annualRatePct: input.manualRatePct, source: 'manual' }
          : undefined,
    }
    setPortfolio((p) => ({ ...p, investments: [...p.investments, inv] }))
    if (input.manualRatePct == null && (input.type === 'stock' || input.type === 'etf' || input.type === 'crypto')) {
      updateRate(inv.id, inv)
    }
  }

  function removeInvestment(id: string) {
    setPortfolio((p) => ({ ...p, investments: p.investments.filter((i) => i.id !== id) }))
  }

  function refreshRate(id: string) {
    const inv = portfolio.investments.find((i) => i.id === id)
    if (inv) updateRate(id, inv)
  }

  const rates = fx?.rates
  const resolved = useMemo(() => (rates ? resolveInvestments(portfolio, rates) : []), [portfolio, rates])
  const currencyRows = useMemo(() => currencyBreakdown(resolved), [resolved])
  const typeRows = useMemo(() => typeBreakdown(resolved), [resolved])
  const total = useMemo(() => totalUsd(resolved), [resolved])
  const { apy, coveragePct } = useMemo(() => weightedApy(resolved), [resolved])
  const advice = useMemo(
    () => generateAdvice(resolved, currencyRows, typeRows, apy, sp500.apy),
    [resolved, currencyRows, typeRows, apy, sp500.apy],
  )

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">InvestApp</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Track your investments across currencies, pull live rates, and compare against the market.
        </p>
      </header>

      <nav className="mb-6 flex gap-1 rounded-lg bg-gray-100 p-1 dark:bg-gray-900">
        {(['portfolio', 'advice'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium capitalize transition ${
              tab === t
                ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-800 dark:text-gray-100'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
          >
            {t}
          </button>
        ))}
      </nav>

      {!fx ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">Loading exchange rates…</p>
      ) : tab === 'portfolio' ? (
        <div className="flex flex-col gap-4">
          <SummaryCards totalUsd={total} apy={apy} coveragePct={coveragePct} investmentCount={resolved.length} fx={fx} />

          <PortfolioModeToggle
            entryMode={portfolio.entryMode}
            totalValue={portfolio.totalValue}
            totalCurrency={portfolio.totalCurrency}
            onChangeMode={(mode) => setPortfolio((p) => ({ ...p, entryMode: mode }))}
            onChangeTotal={(value, currency) =>
              setPortfolio((p) => ({ ...p, totalValue: value, totalCurrency: currency }))
            }
          />

          <InvestmentForm entryMode={portfolio.entryMode} onAdd={addInvestment} />

          <InvestmentList
            investments={resolved}
            entryMode={portfolio.entryMode}
            loadingIds={loadingIds}
            onRemove={removeInvestment}
            onRefreshRate={refreshRate}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <CurrencyPanel rows={currencyRows} />
            <TypePanel rows={typeRows} />
          </div>

          <BenchmarkPanel portfolioApy={apy} coveragePct={coveragePct} sp500Apy={sp500.apy} />
        </div>
      ) : (
        <AdviceTab items={advice} />
      )}

      <footer className="mt-10 text-center text-xs text-gray-400 dark:text-gray-600">
        Data from Frankfurter (FX), Stooq (stocks/ETFs/S&amp;P 500), and CoinGecko (crypto). Rates may be delayed or
        unavailable. Not financial advice.
      </footer>
    </div>
  )
}
