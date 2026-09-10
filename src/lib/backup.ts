import type { Portfolio } from './types'
import { replaceSnapshots, type Snapshot } from './snapshots'

export function exportBackupFile(portfolio: Portfolio, snapshots: Snapshot[]): void {
  const payload = { version: 1, exportedAt: new Date().toISOString(), portfolio, snapshots }
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `investapp-backup-${new Date().toISOString().slice(0, 10)}.json`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export interface ImportResult {
  portfolio: Portfolio
  snapshots: Snapshot[]
}

/** Parses a backup file's text. Accepts either a full backup ({ portfolio, snapshots }) or a raw portfolio object. */
export function parseBackupFile(text: string): ImportResult | null {
  try {
    const json = JSON.parse(text)
    const portfolioCandidate = json && typeof json === 'object' && json.portfolio ? json.portfolio : json
    if (!portfolioCandidate || !Array.isArray(portfolioCandidate.investments)) return null
    const snapshotsCandidate = Array.isArray(json.snapshots) ? json.snapshots : []
    return { portfolio: portfolioCandidate as Portfolio, snapshots: replaceSnapshots(snapshotsCandidate) }
  } catch {
    return null
  }
}
