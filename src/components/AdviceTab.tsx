import type { AdviceItem } from '../lib/advice'

const LEVEL_STYLES: Record<AdviceItem['level'], string> = {
  warning: 'border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30',
  tip: 'border-indigo-200 bg-indigo-50 dark:border-indigo-900 dark:bg-indigo-950/30',
  info: 'border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900',
}

const LEVEL_ICON: Record<AdviceItem['level'], string> = {
  warning: '⚠',
  tip: '💡',
  info: 'ℹ',
}

export function AdviceTab({ items }: { items: AdviceItem[] }) {
  return (
    <div className="flex flex-col gap-3">
      {items.map((item, i) => (
        <div key={i} className={`rounded-xl border p-4 ${LEVEL_STYLES[item.level]}`}>
          <div className="flex items-start gap-2">
            <span aria-hidden className="mt-0.5 text-base leading-none">
              {LEVEL_ICON[item.level]}
            </span>
            <div>
              <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{item.title}</h4>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{item.body}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
