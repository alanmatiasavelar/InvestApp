import type { FxRates } from '../lib/fx'

const fmtUsd = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })

interface Props {
  totalUsd: number
  apy: number | null
  coveragePct: number
  investmentCount: number
  fx: FxRates
}

function Card({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
      <div className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">{label}</div>
      <div className="mt-1 text-2xl font-semibold text-gray-900 dark:text-gray-100">{value}</div>
      {note && <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">{note}</div>}
    </div>
  )
}

export function SummaryCards({ totalUsd, apy, coveragePct, investmentCount, fx }: Props) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      <Card label="Total (USD)" value={fmtUsd(totalUsd)} note={`${investmentCount} investment${investmentCount === 1 ? '' : 's'}`} />
      <Card
        label="Blended APY"
        value={apy != null ? `${(apy * 100).toFixed(1)}%` : '—'}
        note={apy != null ? `${coveragePct.toFixed(0)}% of value has a known rate` : 'No rates resolved yet'}
      />
      <Card
        label="FX rates"
        value={fx.source === 'live' ? 'Live' : 'Offline'}
        note={fx.source === 'live' ? `as of ${new Date(fx.fetchedAt).toLocaleTimeString()}` : 'using approximate fallback rates'}
      />
    </div>
  )
}
