import { CURRENCIES, type Currency, type EntryMode } from '../lib/types'

interface Props {
  entryMode: EntryMode
  totalValue?: number
  totalCurrency?: Currency
  onChangeMode: (mode: EntryMode) => void
  onChangeTotal: (value: number | undefined, currency: Currency) => void
}

export function PortfolioModeToggle({ entryMode, totalValue, totalCurrency, onChangeMode, onChangeTotal }: Props) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
      <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-100">How do you want to enter your portfolio?</h3>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => onChangeMode('value')}
          className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
            entryMode === 'value'
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
          }`}
        >
          Enter each investment's value
        </button>
        <button
          onClick={() => onChangeMode('percent')}
          className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
            entryMode === 'percent'
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
          }`}
        >
          Enter total + % per investment
        </button>
      </div>

      {entryMode === 'percent' && (
        <div className="mt-3 flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1 text-xs font-medium text-gray-600 dark:text-gray-400">
            Total portfolio value
            <input
              value={totalValue ?? ''}
              onChange={(e) => onChangeTotal(e.target.value ? Number(e.target.value) : undefined, totalCurrency ?? 'USD')}
              inputMode="decimal"
              placeholder="100000"
              className="rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-sm text-gray-900 outline-none focus:border-indigo-500 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium text-gray-600 dark:text-gray-400">
            Currency
            <select
              value={totalCurrency ?? 'USD'}
              onChange={(e) => onChangeTotal(totalValue, e.target.value as Currency)}
              className="rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-sm text-gray-900 outline-none focus:border-indigo-500 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
            >
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <p className="max-w-sm text-xs text-gray-500 dark:text-gray-400">
            Each investment below takes a % of this total. You can still hold each slice in a different currency —
            percentages are of the total's USD-equivalent value.
          </p>
        </div>
      )}
    </div>
  )
}
