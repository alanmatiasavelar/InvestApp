import { supabase } from './supabaseClient'

export type SubscriptionStatus = 'trialing' | 'active' | 'past_due' | 'canceled'

export interface Profile {
  id: string
  email: string
  trial_ends_at: string
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  subscription_status: SubscriptionStatus
  created_at: string
  updated_at: string
}

export async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single()
  if (error || !data) return null
  return data as Profile
}

/** Whether this user currently has access: an active paid subscription, or still inside the free trial window. */
export function isEntitled(profile: Profile): boolean {
  if (profile.subscription_status === 'active') return true
  if (profile.subscription_status === 'trialing') return new Date(profile.trial_ends_at).getTime() > Date.now()
  return false
}

export function daysLeftInTrial(profile: Profile): number {
  const ms = new Date(profile.trial_ends_at).getTime() - Date.now()
  return Math.max(0, Math.ceil(ms / 86_400_000))
}

/** Calls the create-checkout-session Edge Function and returns the Stripe Checkout URL to redirect to. */
export async function startCheckout(): Promise<{ url?: string; error?: string }> {
  const { data: sessionData } = await supabase.auth.getSession()
  const token = sessionData.session?.access_token
  if (!token) return { error: 'Not signed in.' }

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  try {
    const res = await fetch(`${supabaseUrl}/functions/v1/create-checkout-session`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    })
    const json = await res.json()
    if (!res.ok) return { error: json.error ?? `Checkout failed (${res.status})` }
    return { url: json.url }
  } catch {
    return { error: 'Could not reach the billing service. Check your connection and try again.' }
  }
}
