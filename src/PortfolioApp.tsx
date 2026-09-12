import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { InvestmentForm, type InvestmentInput } from './components/InvestmentForm'
import { InvestmentList } from './components/InvestmentList'
import { PortfolioModeToggle } from './components/PortfolioModeToggle'
import { AllocationStatus } from './components/AllocationStatus'
import { SummaryCards } from './components/SummaryCards'
import { DisplayCurrencySelector } from './components/DisplayCurrencySelector'
import { CurrencyPanel, TypePanel } from './components/AllocationPanels'
import { BenchmarkPanel } from './components/BenchmarkPanel'
import { GrowthChart } from './components/GrowthChart'
import { AdviceTab } from './components/AdviceTab'
import { loadPortfolio, savePortfolio } from './lib/storage'
import { fetchUsdRates, type FxRates } from './lib/fx'
import { fetchCryptoReturn, fetchSp500History, fetchSp500Return, fetchStockReturn, type PricePoint } from './lib/marketData'
import { currencyBreakdown, resolveInvestments, totalUsd, typeBreakdown, weightedApy } from './lib/calculations'
import { generateAdvice } from './lib/advice'
import { loadSnapshots, recordSnapshot, type Snapshot } from './lib/snapshots'
import { exportBackupFile, parseBackupFile } from './lib/backup'
import type { Investment, RateInfo } from './lib/types'

function makeId(): string {
  return crypto.randomUUID()
}

async function fetchRateFor(type: Investment['type'], ticker: string | undefined, name: string, purchaseDate?: string): Promise<RateInfo | null> {
  if (type === 'stock' || type === 'etf') return fetchStockReturn(ticker || name, purchaseDate)
  if (type === 'crypto') return fetchCryptoReturn(ticker || name, purchaseDate)
  return null // fixed_income / cash / other rely on manual rate
}

function percentTotalExcluding(investments: Investment[], excludeId: string | null): number {
  return investments.reduce((sum, i) => (i.id === excludeId ? sum : sum + (i.percent ?? 0)), 0)
}

interface Props {
  onLogout: () => void
  banner?: ReactNode
}

export default function PortfolioApp({ onLogout, banner }: Props) {
  const [portfolio, setPortfolio] = useState(loadPortfolio)
  const [snapshots, setSnapshots] = useState<Snapshot[]>(loadSnapshots)
  const [fx, setFx] = useState<FxRates | null>(null)
  const [sp500History, setSp500History] = useState<PricePoint[]>([])
  const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set())
  const [sp500, setSp500] = useState<{ apy: number | null }>({ apy: null })
  const [tab, setTab] = useState<'portfolio' | 'advice'>('portfolio')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [importError, setImportError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    savePortfolio(portfolio)
  }, [portfolio])

  useEffect(() => {
    fetchUsdRates().then(setFx)
    fetchSp500History().then(setSp500History)
  }, [])

  useEffect(() => {
    const earliest = portfolio.investments
      .map((i) => i.purchaseDate)
      .filter((d): d is string => !!d)
      .sort()[0]
    fetchSp500Return(earliest).then((r) => setSp500({ apy: r.annualRatePct }))
  }, [portfolio.investments])

  function updateRate(id: string, type: Investment['type'], ticker: string | undefined, name: string, purchaseDate?: string) {
    setLoadingIds((prev) => new Set(prev).add(id))
    fetchRateFor(type, ticker, name, purchaseDate)
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

  function saveInvestment(input: InvestmentInput) {
    const needsFetch = input.manualRatePct == null && (input.type === 'stock' || input.type === 'etf' || input.type === 'crypto')
    const manualRate: RateInfo | undefined =
      input.manualRatePct != null ? { annualRatePct: input.manualRatePct, source: 'manual' } : undefined

    if (editingId) {
      const id = editingId
      setPortfolio((p) => ({
        ...p,
        investments: p.investments.map((i) => {
          if (i.id !== id) return i
          // Keep the existing (about-to-be-refetched) rate for ticker types; otherwise a blanked
          // rate field means the user wants to clear it (e.g. no longer a manual cash rate).
          const rate = manualRate ?? (needsFetch ? i.rate : undefined)
          return { ...i, ...input, rate }
        }),
      }))
      setEditingId(null)
      if (needsFetch) updateRate(id, input.type, input.ticker, input.name, input.purchaseDate)
    } else {
      const inv: Investment = { id: makeId(), createdAt: new Date().toISOString(), ...input, rate: manualRate }
      setPortfolio((p) => ({ ...p, investments: [...p.investments, inv] }))
      if (needsFetch) updateRate(inv.id, inv.type, inv.ticker, inv.name, inv.purchaseDate)
    }
  }

  function removeInvestment(id: string) {
    setPortfolio((p) => ({ ...p, investments: p.investments.filter((i) => i.id !== id) }))
    if (editingId === id) setEditingId(null)
  }

  function refreshRate(id: string) {
    const inv = portfolio.investments.find((i) => i.id === id)
    if (inv) updateRate(inv.id, inv.type, inv.ticker, inv.name, inv.purchaseDate)
  }

  function handleExport() {
    exportBackupFile(portfolio, snapshots)
  }

  function handleImportClick() {
    fileInputRef.current?.click()
  }

  function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    file.text().then((text) => {
      const result = parseBackupFile(text)
      if (!result) {
        setImportError('That file doesn\'t look like an InvestApp backup.')
        return
      }
      if (!window.confirm('Importing will replace your current portfolio and history. Continue?')) return
      setPortfolio(result.portfolio)
      setSnapshots(result.snapshots)
      setEditingId(null)
      setImportError(null)
    })
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
  const editingInvestment = editingId ? portfolio.investments.find((i) => i.id === editingId) : undefined
  const otherPercentTotal = percentTotalExcluding(portfolio.investments, editingId)
  const displayCurrency = portfolio.displayCurrency ?? 'USD'

  // Record one snapshot of today's total once FX rates (and therefore an accurate total) are available.
  useEffect(() => {
    if (!rates) return
    setSnapshots(recordSnapshot(total))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [total, !!rates])

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <header className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">InvestApp</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Track your investments across currencies, pull live rates, and compare against the market.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input ref={fileInputRef} type="file" accept="application/json" onChange={handleImportFile} className="hidden" />
          <button
            onClick={handleImportClick}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            Import backup
          </button>
          <button
            onClick={handleExport}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            Export backup
          </button>
          <button
            onClick={onLogout}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            Log out
          </button>
        </div>
      </header>

      {banner}

      {importError && (
        <p className="mb-4 rounded-lg border border-red-300 bg-red-50 p-2 text-xs font-medium text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
          {importError}
        </p>
      )}

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
          <div className="flex justify-end">
            <DisplayCurrencySelector
              value={displayCurrency}
              onChange={(c) => setPortfolio((p) => ({ ...p, displayCurrency: c }))}
            />
          </div>

          <SummaryCards
            totalUsd={total}
            apy={apy}
            coveragePct={coveragePct}
            investmentCount={resolved.length}
            fx={fx}
            displayCurrency={displayCurrency}
          />

          <PortfolioModeToggle
            entryMode={portfolio.entryMode}
            totalValue={portfolio.totalValue}
            totalCurrency={portfolio.totalCurrency}
            onChangeMode={(mode) => setPortfolio((p) => ({ ...p, entryMode: mode }))}
            onChangeTotal={(value, currency) =>
              setPortfolio((p) => ({ ...p, totalValue: value, totalCurrency: currency }))
            }
          />

          {portfolio.entryMode === 'percent' && (
            <AllocationStatus totalPercent={percentTotalExcluding(portfolio.investments, null)} />
          )}

          <InvestmentForm
            entryMode={portfolio.entryMode}
            initial={editingInvestment}
            otherPercentTotal={otherPercentTotal}
            onSubmit={saveInvestment}
            onCancel={() => setEditingId(null)}
          />

          <InvestmentList
            investments={resolved}
            entryMode={portfolio.entryMode}
            loadingIds={loadingIds}
            editingId={editingId}
            displayCurrency={displayCurrency}
            rates={fx.rates}
            onRemove={removeInvestment}
            onEdit={setEditingId}
            onRefreshRate={refreshRate}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <CurrencyPanel rows={currencyRows} displayCurrency={displayCurrency} rates={fx.rates} />
            <TypePanel rows={typeRows} displayCurrency={displayCurrency} rates={fx.rates} />
          </div>

          <GrowthChart snapshots={snapshots} sp500History={sp500History} />

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
