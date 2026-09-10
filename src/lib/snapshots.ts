const STORAGE_KEY = 'investapp.snapshots.v1'
const MAX_SNAPSHOTS = 730 // ~2 years of daily points

export interface Snapshot {
  date: string // YYYY-MM-DD
  usdValue: number
}

function isValidSnapshot(s: unknown): s is Snapshot {
  return (
    !!s &&
    typeof s === 'object' &&
    typeof (s as Snapshot).date === 'string' &&
    typeof (s as Snapshot).usdValue === 'number' &&
    Number.isFinite((s as Snapshot).usdValue)
  )
}

export function loadSnapshots(): Snapshot[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(isValidSnapshot)
  } catch {
    return []
  }
}

export function saveSnapshots(snapshots: Snapshot[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshots))
  } catch {
    // localStorage unavailable — silently skip persistence
  }
}

/** Replaces the whole snapshot history (used when restoring a backup), keeping only valid entries. */
export function replaceSnapshots(snapshots: unknown[]): Snapshot[] {
  const clean = snapshots.filter(isValidSnapshot).sort((a, b) => a.date.localeCompare(b.date))
  saveSnapshots(clean)
  return clean
}

/** Records today's total USD value — one snapshot per calendar day; later calls the same day overwrite it. */
export function recordSnapshot(usdValue: number): Snapshot[] {
  const today = new Date().toISOString().slice(0, 10)
  const withoutToday = loadSnapshots().filter((s) => s.date !== today)
  const next = [...withoutToday, { date: today, usdValue }].sort((a, b) => a.date.localeCompare(b.date))
  const trimmed = next.length > MAX_SNAPSHOTS ? next.slice(next.length - MAX_SNAPSHOTS) : next
  saveSnapshots(trimmed)
  return trimmed
}
