import type { Portfolio } from './types'
import { emptyPortfolio } from './types'

const STORAGE_KEY = 'investapp.portfolio.v1'

export function loadPortfolio(): Portfolio {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return structuredClone(emptyPortfolio)
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.investments)) {
      return structuredClone(emptyPortfolio)
    }
    return parsed as Portfolio
  } catch {
    return structuredClone(emptyPortfolio)
  }
}

export function savePortfolio(portfolio: Portfolio): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(portfolio))
  } catch {
    // localStorage unavailable (private mode, quota) — silently skip persistence
  }
}
