interface Props {
  label: string
  sublabel?: string
  valueLabel: string
  pctOfMax: number // 0-100, bar fill width
  color: string
}

export function BarRow({ label, sublabel, valueLabel, pctOfMax, color }: Props) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-36 shrink-0 truncate text-sm font-medium text-gray-700 dark:text-gray-300" title={label}>
        {label}
        {sublabel && <span className="ml-1 text-xs font-normal text-gray-400 dark:text-gray-500">{sublabel}</span>}
      </div>
      <div className="h-4 flex-1 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
        <div
          className="h-full rounded-full transition-[width]"
          style={{ width: `${Math.max(2, Math.min(100, pctOfMax))}%`, backgroundColor: color }}
        />
      </div>
      <div className="w-24 shrink-0 text-right text-sm tabular-nums text-gray-900 dark:text-gray-100">{valueLabel}</div>
    </div>
  )
}
