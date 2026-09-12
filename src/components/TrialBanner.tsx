import { daysLeftInTrial, type Profile } from '../lib/billing'

export function TrialBanner({ profile }: { profile: Profile }) {
  if (profile.subscription_status === 'active') {
    return (
      <div className="mb-4 rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300">
        InvestApp Pro is active — $2/month.
      </div>
    )
  }
  if (profile.subscription_status !== 'trialing') return null

  const days = daysLeftInTrial(profile)
  return (
    <div className="mb-4 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300">
      {days > 0
        ? `${days} day${days === 1 ? '' : 's'} left in your free trial. Then $2/month.`
        : "Your free trial has ended."}
    </div>
  )
}
