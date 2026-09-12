import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './lib/supabaseClient'
import { fetchProfile, isEntitled, type Profile } from './lib/billing'
import { AuthScreen } from './components/AuthScreen'
import { Paywall } from './components/Paywall'
import { TrialBanner } from './components/TrialBanner'
import PortfolioApp from './PortfolioApp'

function LoadingScreen() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center text-sm text-gray-500 dark:text-gray-400">
      Loading…
    </div>
  )
}

export default function App() {
  const [session, setSession] = useState<Session | null | undefined>(undefined) // undefined = not yet checked
  const [profile, setProfile] = useState<Profile | null>(null)
  const [profileLoading, setProfileLoading] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!session) {
      setProfile(null)
      return
    }
    let cancelled = false
    setProfileLoading(true)
    fetchProfile(session.user.id).then((p) => {
      if (!cancelled) {
        setProfile(p)
        setProfileLoading(false)
      }
    })
    return () => {
      cancelled = true
    }
  }, [session])

  // After a Stripe Checkout redirect, the webhook may take a moment to land — refetch once.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('checkout') === 'success' && session) {
      const timer = setTimeout(() => {
        fetchProfile(session.user.id).then(setProfile)
      }, 2000)
      window.history.replaceState({}, '', window.location.pathname)
      return () => clearTimeout(timer)
    }
  }, [session])

  if (session === undefined) return <LoadingScreen />
  if (!session) return <AuthScreen />
  if (profileLoading || !profile) return <LoadingScreen />
  if (!isEntitled(profile)) return <Paywall />

  return <PortfolioApp onLogout={() => supabase.auth.signOut()} banner={<TrialBanner profile={profile} />} />
}
