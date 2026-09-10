import { useMemo, useRef, useState } from 'react'
import type { Snapshot } from '../lib/snapshots'
import type { PricePoint } from '../lib/marketData'
import { CATEGORICAL_SLOTS } from '../lib/palette'
import { usePrefersDark } from '../lib/useTheme'

interface Props {
  snapshots: Snapshot[]
  sp500History: PricePoint[]
}

interface IndexedPoint {
  day: number
  idx: number
  date: string
}

const DAY_MS = 86_400_000
const dayNum = (d: string) => Math.floor(new Date(d).getTime() / DAY_MS)

const WIDTH = 640
const HEIGHT = 220
const PAD_L = 44
const PAD_R = 12
const PAD_T = 16
const PAD_B = 24
const PLOT_W = WIDTH - PAD_L - PAD_R
const PLOT_H = HEIGHT - PAD_T - PAD_B

function nearest(points: IndexedPoint[], day: number): IndexedPoint {
  return points.reduce((best, p) => (Math.abs(p.day - day) < Math.abs(best.day - day) ? p : best), points[0])
}

export function GrowthChart({ snapshots, sp500History }: Props) {
  const dark = usePrefersDark()
  const mode = dark ? 'dark' : 'light'
  const svgRef = useRef<SVGSVGElement>(null)
  const [hoverDay, setHoverDay] = useState<number | null>(null)

  const data = useMemo(() => {
    if (snapshots.length < 2) return null
    const startDay = dayNum(snapshots[0].date)
    const endDay = dayNum(snapshots[snapshots.length - 1].date)
    const portfolioPoints: IndexedPoint[] = snapshots.map((s) => ({
      day: dayNum(s.date),
      idx: (s.usdValue / snapshots[0].usdValue) * 100,
      date: s.date,
    }))

    const inRange = sp500History.filter((p) => dayNum(p.date) >= startDay && dayNum(p.date) <= endDay)
    const sp500Points: IndexedPoint[] =
      inRange.length > 0 ? inRange.map((p) => ({ day: dayNum(p.date), idx: (p.close / inRange[0].close) * 100, date: p.date })) : []

    return { portfolioPoints, sp500Points, startDay, endDay }
  }, [snapshots, sp500History])

  if (!data) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
        <h3 className="mb-1 text-sm font-semibold text-gray-900 dark:text-gray-100">Growth over time</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          InvestApp records a snapshot of your portfolio's total once a day. Come back after a day or two to see
          growth plotted against the S&amp;P 500.
        </p>
      </div>
    )
  }

  const { portfolioPoints, sp500Points, startDay, endDay } = data
  const spanDays = Math.max(1, endDay - startDay)

  const allIdx = [...portfolioPoints.map((p) => p.idx), ...sp500Points.map((p) => p.idx)]
  const minIdx = Math.min(100, ...allIdx)
  const maxIdx = Math.max(100, ...allIdx)
  const pad = (maxIdx - minIdx) * 0.15 || 5
  const yMin = minIdx - pad
  const yMax = maxIdx + pad

  const x = (day: number) => PAD_L + ((day - startDay) / spanDays) * PLOT_W
  const y = (idx: number) => PAD_T + (1 - (idx - yMin) / (yMax - yMin)) * PLOT_H
  const toPath = (pts: IndexedPoint[]) => pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${x(p.day).toFixed(1)} ${y(p.idx).toFixed(1)}`).join(' ')

  const portfolioColor = CATEGORICAL_SLOTS[0][mode]
  const sp500Color = CATEGORICAL_SLOTS[1][mode]

  function handleMove(e: React.MouseEvent<SVGSVGElement>) {
    const svg = svgRef.current
    if (!svg) return
    const rect = svg.getBoundingClientRect()
    const px = ((e.clientX - rect.left) / rect.width) * WIDTH
    const day = startDay + ((px - PAD_L) / PLOT_W) * spanDays
    setHoverDay(Math.min(endDay, Math.max(startDay, Math.round(day))))
  }

  const hoverPortfolio = hoverDay == null ? null : nearest(portfolioPoints, hoverDay)
  const hoverSp500 = hoverDay == null || sp500Points.length === 0 ? null : nearest(sp500Points, hoverDay)

  const portfolioReturn = portfolioPoints[portfolioPoints.length - 1].idx - 100
  const sp500Return = sp500Points.length > 0 ? sp500Points[sp500Points.length - 1].idx - 100 : null

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
      <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Growth over time</h3>
        <div className="flex items-center gap-3 text-xs text-gray-700 dark:text-gray-300">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: portfolioColor }} />
            Portfolio {portfolioReturn >= 0 ? '+' : ''}
            {portfolioReturn.toFixed(1)}%
          </span>
          {sp500Return != null && (
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: sp500Color }} />
              S&amp;P 500 {sp500Return >= 0 ? '+' : ''}
              {sp500Return.toFixed(1)}%
            </span>
          )}
        </div>
      </div>
      <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">
        Indexed to 100 at your first recorded snapshot ({snapshots[0].date}). Portfolio points are once-daily
        snapshots since you started using InvestApp, not a reconstructed price history.
      </p>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        role="img"
        aria-label="Portfolio growth indexed against the S&P 500"
        className="w-full touch-none"
        onMouseMove={handleMove}
        onMouseLeave={() => setHoverDay(null)}
      >
        <line x1={PAD_L} y1={y(100)} x2={WIDTH - PAD_R} y2={y(100)} stroke="#898781" strokeDasharray="3 3" strokeWidth={1} />
        {sp500Points.length > 1 && <path d={toPath(sp500Points)} fill="none" stroke={sp500Color} strokeWidth={2} />}
        <path d={toPath(portfolioPoints)} fill="none" stroke={portfolioColor} strokeWidth={2} />
        {portfolioPoints.map((p) => (
          <circle key={p.day} cx={x(p.day)} cy={y(p.idx)} r={3} fill={portfolioColor} />
        ))}
        {hoverDay != null && <line x1={x(hoverDay)} y1={PAD_T} x2={x(hoverDay)} y2={HEIGHT - PAD_B} stroke="#898781" strokeWidth={1} />}
        {hoverPortfolio && (
          <circle cx={x(hoverPortfolio.day)} cy={y(hoverPortfolio.idx)} r={4} fill={portfolioColor} stroke="white" strokeWidth={1.5} />
        )}
        {hoverSp500 && <circle cx={x(hoverSp500.day)} cy={y(hoverSp500.idx)} r={4} fill={sp500Color} stroke="white" strokeWidth={1.5} />}
      </svg>
      <div className="mt-1 flex h-4 justify-between text-xs text-gray-500 dark:text-gray-400">
        {hoverPortfolio && (
          <>
            <span>{hoverPortfolio.date}</span>
            <span>
              Portfolio {hoverPortfolio.idx.toFixed(1)}
              {hoverSp500 && ` · S&P 500 ${hoverSp500.idx.toFixed(1)}`}
            </span>
          </>
        )}
      </div>
    </div>
  )
}
