import type { ResolvedInvestment } from '../lib/calculations'
import { RateBadge } from './RateBadge'

interface Props {
  investments: ResolvedInvestment[]
  entryMode: 'percent' | 'value'
  loadingIds: Set<string>
  onRemove: (id: string) => void
  onRefreshRate: (id: string) => void
}

const fmtUsd = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
const fmtNative = (n: number, currency: string) =>
  n.toLocaleString('en-US', { style: 'currency', currency, maximumFractionDigits: 0 })

export function InvestmentList({ investments, entryMode, loadingIds, onRemove, onRefreshRate }: Props) {
  if (investments.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
        No investments yet — add one above to get started.
      </p>
    )
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
      <table className="min-w-full divide-y divide-gray-200 text-sm dark:divide-gray-800">
        <thead className="bg-gray-50 dark:bg-gray-900">
          <tr className="text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            <th className="px-3 py-2">Name</th>
            <th className="px-3 py-2">Type</th>
            {entryMode === 'percent' && <th className="px-3 py-2 text-right">%</th>}
            <th className="px-3 py-2 text-right">Value</th>
            <th className="px-3 py-2 text-right">USD</th>
            <th className="px-3 py-2">Rate</th>
            <th className="px-3 py-2" />
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 bg-white dark:divide-gray-800 dark:bg-gray-950">
          {investments.map((inv) => (
            <tr key={inv.id}>
              <td className="px-3 py-2">
                <div className="font-medium text-gray-900 dark:text-gray-100">{inv.name}</div>
                {inv.ticker && <div className="text-xs text-gray-500 dark:text-gray-400">{inv.ticker}</div>}
              </td>
              <td className="px-3 py-2 text-gray-600 dark:text-gray-400">{inv.type.replace('_', ' ')}</td>
              {entryMode === 'percent' && (
                <td className="px-3 py-2 text-right text-gray-600 dark:text-gray-400">{inv.percent?.toFixed(1)}%</td>
              )}
              <td className="px-3 py-2 text-right text-gray-900 dark:text-gray-100">{fmtNative(inv.value, inv.currency)}</td>
              <td className="px-3 py-2 text-right font-medium text-gray-900 dark:text-gray-100">{fmtUsd(inv.usdValue)}</td>
              <td className="px-3 py-2">
                <button onClick={() => onRefreshRate(inv.id)} className="cursor-pointer" title="Refresh rate">
                  <RateBadge rate={inv.rate} loading={loadingIds.has(inv.id)} />
                </button>
              </td>
              <td className="px-3 py-2 text-right">
                <button
                  onClick={() => onRemove(inv.id)}
                  className="rounded-md px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
                >
                  Remove
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
