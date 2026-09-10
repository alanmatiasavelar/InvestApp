import { useState } from 'react'
import { CURRENCIES, INVESTMENT_TYPES, type Currency, type EntryMode, type Investment, type InvestmentType } from '../lib/types'

interface Props {
  entryMode: EntryMode
  onAdd: (input: {
    name: string
    ticker?: string
    type: InvestmentType
    currency: Currency
    value: number
    percent?: number
    manualRatePct?: number
    purchaseDate?: string
  }) => void
}

const needsTicker = (t: InvestmentType) => t === 'stock' || t === 'etf' || t === 'crypto'
const needsManualRate = (t: InvestmentType) => t === 'fixed_income' || t === 'cash' || t === 'other'

export function InvestmentForm({ entryMode, onAdd }: Props) {
  const [name, setName] = useState('')
  const [ticker, setTicker] = useState('')
  const [type, setType] = useState<InvestmentType>('stock')
  const [currency, setCurrency] = useState<Currency>('USD')
  const [amount, setAmount] = useState('')
  const [manualRate, setManualRate] = useState('')
  const [purchaseDate, setPurchaseDate] = useState('')
  const [error, setError] = useState<string | null>(null)

  function reset() {
    setName('')
    setTicker('')
    setAmount('')
    setManualRate('')
    setPurchaseDate('')
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const amountNum = Number(amount)
    if (!name.trim()) return setError('Give the investment a name.')
    if (!amount || Number.isNaN(amountNum) || amountNum <= 0) {
      return setError(entryMode === 'percent' ? 'Enter a valid percent (0-100).' : 'Enter a valid value greater than 0.')
    }
    if (entryMode === 'percent' && amountNum > 100) return setError('Percent cannot exceed 100.')
    if (needsTicker(type) && !ticker.trim()) return setError('Add a ticker symbol so a live rate can be fetched (e.g. AAPL, SPY, BTC).')

    setError(null)
    onAdd({
      name: name.trim(),
      ticker: ticker.trim() || undefined,
      type,
      currency,
      value: entryMode === 'percent' ? 0 : amountNum,
      percent: entryMode === 'percent' ? amountNum : undefined,
      manualRatePct: manualRate ? Number(manualRate) / 100 : undefined,
      purchaseDate: purchaseDate || undefined,
    })
    reset()
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
      <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-100">Add investment</h3>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <label className="col-span-2 flex flex-col gap-1 text-xs font-medium text-gray-600 dark:text-gray-400">
          Name
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Apple Inc."
            className="rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-sm text-gray-900 outline-none focus:border-indigo-500 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
          />
        </label>

        <label className="flex flex-col gap-1 text-xs font-medium text-gray-600 dark:text-gray-400">
          Type
          <select
            value={type}
            onChange={(e) => setType(e.target.value as InvestmentType)}
            className="rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-sm text-gray-900 outline-none focus:border-indigo-500 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
          >
            {INVESTMENT_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-xs font-medium text-gray-600 dark:text-gray-400">
          Currency
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value as Currency)}
            className="rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-sm text-gray-900 outline-none focus:border-indigo-500 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
          >
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>

        {needsTicker(type) && (
          <label className="flex flex-col gap-1 text-xs font-medium text-gray-600 dark:text-gray-400">
            Ticker
            <input
              value={ticker}
              onChange={(e) => setTicker(e.target.value.toUpperCase())}
              placeholder={type === 'crypto' ? 'BTC' : 'AAPL'}
              className="rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-sm text-gray-900 outline-none focus:border-indigo-500 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
            />
          </label>
        )}

        <label className="flex flex-col gap-1 text-xs font-medium text-gray-600 dark:text-gray-400">
          {entryMode === 'percent' ? '% of total' : `Value (${currency})`}
          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            inputMode="decimal"
            placeholder={entryMode === 'percent' ? '25' : '10000'}
            className="rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-sm text-gray-900 outline-none focus:border-indigo-500 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
          />
        </label>

        <label className="flex flex-col gap-1 text-xs font-medium text-gray-600 dark:text-gray-400">
          Purchase date
          <input
            type="date"
            value={purchaseDate}
            onChange={(e) => setPurchaseDate(e.target.value)}
            max={new Date().toISOString().slice(0, 10)}
            className="rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-sm text-gray-900 outline-none focus:border-indigo-500 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
          />
        </label>

        <label className="flex flex-col gap-1 text-xs font-medium text-gray-600 dark:text-gray-400">
          {needsManualRate(type) ? 'Annual rate %' : 'Rate override % (optional)'}
          <input
            value={manualRate}
            onChange={(e) => setManualRate(e.target.value)}
            inputMode="decimal"
            placeholder={needsManualRate(type) ? '5.0' : 'leave blank to fetch live'}
            className="rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-sm text-gray-900 outline-none focus:border-indigo-500 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
          />
        </label>
      </div>

      {error && <p className="mt-2 text-xs font-medium text-red-600 dark:text-red-400">{error}</p>}

      <button
        type="submit"
        className="mt-3 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500"
      >
        Add investment
      </button>
    </form>
  )
}

export type { Investment }
