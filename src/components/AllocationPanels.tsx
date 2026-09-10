import type { CurrencyBreakdownRow, TypeBreakdownRow } from '../lib/calculations'
import { currencyColor, typeColor } from '../lib/palette'
import { usePrefersDark } from '../lib/useTheme'
import { BarRow } from './BarRow'

const fmtUsd = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
const TYPE_LABELS: Record<string, string> = {
  stock: 'Stocks',
  etf: 'ETFs / Funds',
  crypto: 'Crypto',
  fixed_income: 'Fixed income',
  cash: 'Cash / savings',
  other: 'Other',
}

export function CurrencyPanel({ rows }: { rows: CurrencyBreakdownRow[] }) {
  const dark = usePrefersDark()
  if (rows.length === 0) return null
  const max = Math.max(...rows.map((r) => r.usdTotal))
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
      <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-100">By currency</h3>
      <div className="flex flex-col gap-2.5">
        {rows.map((r) => (
          <BarRow
            key={r.currency}
            label={r.currency}
            sublabel={`${r.percentOfPortfolio.toFixed(0)}%`}
            valueLabel={fmtUsd(r.usdTotal)}
            pctOfMax={(r.usdTotal / max) * 100}
            color={currencyColor(r.currency, dark ? 'dark' : 'light')}
          />
        ))}
      </div>
    </div>
  )
}

export function TypePanel({ rows }: { rows: TypeBreakdownRow[] }) {
  const dark = usePrefersDark()
  if (rows.length === 0) return null
  const max = Math.max(...rows.map((r) => r.usdTotal))
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
      <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-100">By asset type</h3>
      <div className="flex flex-col gap-2.5">
        {rows.map((r) => (
          <BarRow
            key={r.type}
            label={TYPE_LABELS[r.type] ?? r.type}
            sublabel={`${r.percentOfPortfolio.toFixed(0)}%`}
            valueLabel={fmtUsd(r.usdTotal)}
            pctOfMax={(r.usdTotal / max) * 100}
            color={typeColor(r.type, dark ? 'dark' : 'light')}
          />
        ))}
      </div>
    </div>
  )
}
