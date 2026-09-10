import type { CurrencyBreakdownRow, TypeBreakdownRow } from '../lib/calculations'
import { currencyColor, typeColor } from '../lib/palette'
import { usePrefersDark } from '../lib/useTheme'
import { fromUsd } from '../lib/fx'
import { fmtMoney } from '../lib/format'
import type { Currency } from '../lib/types'
import { BarRow } from './BarRow'

const TYPE_LABELS: Record<string, string> = {
  stock: 'Stocks',
  etf: 'ETFs / Funds',
  crypto: 'Crypto',
  fixed_income: 'Fixed income',
  cash: 'Cash / savings',
  other: 'Other',
}

interface CurrencyPanelProps {
  rows: CurrencyBreakdownRow[]
  displayCurrency: Currency
  rates: Record<Currency, number>
}

export function CurrencyPanel({ rows, displayCurrency, rates }: CurrencyPanelProps) {
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
            valueLabel={fmtMoney(fromUsd(r.usdTotal, displayCurrency, rates), displayCurrency)}
            pctOfMax={(r.usdTotal / max) * 100}
            color={currencyColor(r.currency, dark ? 'dark' : 'light')}
          />
        ))}
      </div>
    </div>
  )
}

interface TypePanelProps {
  rows: TypeBreakdownRow[]
  displayCurrency: Currency
  rates: Record<Currency, number>
}

export function TypePanel({ rows, displayCurrency, rates }: TypePanelProps) {
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
            valueLabel={fmtMoney(fromUsd(r.usdTotal, displayCurrency, rates), displayCurrency)}
            pctOfMax={(r.usdTotal / max) * 100}
            color={typeColor(r.type, dark ? 'dark' : 'light')}
          />
        ))}
      </div>
    </div>
  )
}
