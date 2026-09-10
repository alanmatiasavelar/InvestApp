import { CATEGORICAL_SLOTS } from '../lib/palette'
import { usePrefersDark } from '../lib/useTheme'
import { BarRow } from './BarRow'

const SAVINGS_BASELINE = 0.045 // ~typical high-yield savings/cash benchmark, for context only

interface Props {
  portfolioApy: number | null
  coveragePct: number
  sp500Apy: number | null
}

export function BenchmarkPanel({ portfolioApy, coveragePct, sp500Apy }: Props) {
  const dark = usePrefersDark()
  const mode = dark ? 'dark' : 'light'
  const rows = [
    { label: 'Your portfolio', value: portfolioApy, color: CATEGORICAL_SLOTS[0][mode] },
    { label: 'S&P 500 (1y)', value: sp500Apy, color: CATEGORICAL_SLOTS[1][mode] },
    { label: 'Cash savings (ref.)', value: SAVINGS_BASELINE, color: CATEGORICAL_SLOTS[2][mode] },
  ]
  const known = rows.filter((r) => r.value != null) as { label: string; value: number; color: string }[]
  const maxAbs = Math.max(0.01, ...known.map((r) => Math.abs(r.value)))

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
      <h3 className="mb-1 text-sm font-semibold text-gray-900 dark:text-gray-100">Annualized return vs. benchmarks</h3>
      <p className="mb-3 text-xs text-gray-500 dark:text-gray-400">
        {portfolioApy != null
          ? `Blended from ${coveragePct.toFixed(0)}% of your portfolio's USD value with a known rate.`
          : 'Add tickers or manual rates to compute your blended return.'}
      </p>
      <div className="flex flex-col gap-2.5">
        {rows.map((r) => (
          <BarRow
            key={r.label}
            label={r.label}
            valueLabel={r.value != null ? `${(r.value * 100).toFixed(1)}%` : '—'}
            pctOfMax={r.value != null ? (Math.abs(r.value) / maxAbs) * 100 : 0}
            color={r.color}
          />
        ))}
      </div>
    </div>
  )
}
