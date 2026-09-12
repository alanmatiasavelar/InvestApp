import { useState } from 'react'
import { startCheckout } from '../lib/billing'
import { supabase } from '../lib/supabaseClient'

export function Paywall() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleUpgrade() {
    setError(null)
    setLoading(true)
    const { url, error: checkoutError } = await startCheckout()
    if (checkoutError) {
      setError(checkoutError)
      setLoading(false)
      return
    }
    if (url) window.location.href = url
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-sm flex-col items-center justify-center px-4 text-center">
      <h1 className="mb-2 text-xl font-semibold text-gray-900 dark:text-gray-100">Your free trial has ended</h1>
      <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
        Keep using InvestApp for $2/month — cancel anytime.
      </p>

      {error && (
        <p className="mb-3 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-xs font-medium text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
          {error}
        </p>
      )}

      <button
        onClick={handleUpgrade}
        disabled={loading}
        className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-60"
      >
        {loading ? 'Redirecting to checkout…' : 'Upgrade — $2/month'}
      </button>

      <button
        onClick={() => supabase.auth.signOut()}
        className="mt-4 text-xs font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
      >
        Log out
      </button>
    </div>
  )
}
