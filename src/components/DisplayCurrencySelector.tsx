import { CURRENCIES, type Currency } from '../lib/types'

export function DisplayCurrencySelector({ value, onChange }: { value: Currency; onChange: (c: Currency) => void }) {
  return (
    <label className="flex items-center gap-2 text-xs font-medium text-gray-600 dark:text-gray-400">
      Display in
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as Currency)}
        className="rounded-lg border border-gray-300 bg-white px-2 py-1 text-sm text-gray-900 outline-none focus:border-indigo-500 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
      >
        {CURRENCIES.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>
    </label>
  )
}
