import type { RateInfo } from '../lib/types'

export function RateBadge({ rate, loading }: { rate?: RateInfo; loading?: boolean }) {
  if (loading) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-500" />
        fetching…
      </span>
    )
  }
  if (!rate || rate.source === 'unavailable') {
    return (
      <span
        title={rate?.note}
        className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-400"
      >
        no rate
      </span>
    )
  }
  const pct = rate.annualRatePct != null ? `${(rate.annualRatePct * 100).toFixed(1)}%` : '—'
  if (rate.source === 'live') {
    return (
      <span
        title={rate.note}
        className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300"
      >
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        live {pct}
      </span>
    )
  }
  return (
    <span
      title={rate.note}
      className="inline-flex items-center gap-1 rounded-full bg-sky-100 px-2 py-0.5 text-xs font-medium text-sky-800 dark:bg-sky-900/40 dark:text-sky-300"
    >
      manual {pct}
    </span>
  )
}
