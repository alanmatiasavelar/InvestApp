export function AllocationStatus({ totalPercent }: { totalPercent: number }) {
  const remaining = 100 - totalPercent
  const over = totalPercent > 100.05
  const complete = Math.abs(remaining) <= 0.5

  const style = over
    ? 'border-red-300 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300'
    : complete
      ? 'border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300'
      : 'border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300'

  const text = over
    ? `Allocations total ${totalPercent.toFixed(1)}% — that's over 100%. Reduce or remove something before adding more.`
    : complete
      ? `Fully allocated: ${totalPercent.toFixed(1)}% of your total.`
      : `Allocated ${totalPercent.toFixed(1)}% of your total — ${remaining.toFixed(1)}% still unallocated.`

  return <div className={`rounded-xl border p-3 text-sm font-medium ${style}`}>{text}</div>
}
