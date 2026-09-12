# InvestApp

An investment portfolio manager. Portfolio data lives client-side in
`localStorage`; accounts, the free trial, and billing are backed by a
dedicated Supabase project (Postgres + Auth + Edge Functions) and Stripe.

## Accounts & billing

- **1 month free, then $2/month per account.** Signing up starts a 30-day
  trial (`profiles.trial_ends_at`, set automatically on signup). Once it
  ends, the app shows a paywall with an "Upgrade" button until the user
  subscribes.
- **Auth**: Supabase email/password auth (`src/components/AuthScreen.tsx`).
- **Trial/subscription state**: a `profiles` table (one row per user, RLS
  restricted to the owner) tracks `trial_ends_at` and `subscription_status`
  (`trialing` / `active` / `past_due` / `canceled`). Only a signup trigger and
  the Stripe webhook (both elevated-privilege, server-side) can write to it —
  the client can only read its own row.
- **Billing**: Stripe Checkout. `supabase/functions/create-checkout-session`
  creates a Checkout Session for the logged-in user (creating a Stripe
  Customer on first use); `supabase/functions/stripe-webhook` verifies
  Stripe's signature and updates `subscription_status` on
  `checkout.session.completed` / `customer.subscription.updated` /
  `customer.subscription.deleted`.

### One-time setup (for whoever deploys this)

1. **Supabase**: create a project, then apply the schema in
   `supabase/migrations/`. Copy `.env.example` to `.env.local` and fill in
   `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` (Project Settings → API —
   both are safe to expose client-side).
2. **Stripe**: create a recurring Price for $2.00/month (Product catalog →
   Add product). In Supabase, deploy the two functions in
   `supabase/functions/` and set these **Edge Function secrets** (Project
   Settings → Edge Functions → Secrets — never put these in `.env` files or
   commit them):
   - `STRIPE_SECRET_KEY` — your Stripe secret key
   - `STRIPE_PRICE_ID` — the Price ID from the product you created
   - `STRIPE_WEBHOOK_SECRET` — shown when you add the webhook endpoint below
3. In the Stripe Dashboard, add a webhook endpoint pointing at
   `<your-supabase-url>/functions/v1/stripe-webhook`, subscribed to
   `checkout.session.completed`, `customer.subscription.updated`, and
   `customer.subscription.deleted`.

## Features

- **Two ways to enter your portfolio**: enter each investment's value directly,
  or enter a total portfolio value and allocate it by percentage across
  investments (each slice can still be held in its own currency).
- **Live market rates**: stocks/ETFs and the S&P 500 benchmark come from
  [Stooq](https://stooq.com), crypto from [CoinGecko](https://www.coingecko.com/en/api),
  and FX rates from [Frankfurter](https://www.frankfurter.app) (ECB reference
  rates) — all free, no API key. Fixed income and cash use a manually entered
  annual rate, since those are contractual rather than market-priced.
- **Multi-currency support**: hold investments in different currencies; the
  app converts everything to USD at the current exchange rate for the
  portfolio total and breakdowns.
- **Blended APY & S&P 500 comparison**: a value-weighted annualized return
  across whatever investments have a known rate, benchmarked against the
  S&P 500's return over the same lookback window.
- **Advice tab**: rule-based observations on concentration risk, currency
  exposure, asset-type diversification, and benchmark comparison. Not
  financial advice — just prompts to think about.

If a live rate can't be fetched (network hiccup, unknown ticker, or the API is
unreachable from your browser), the app falls back to letting you enter a
manual rate rather than failing silently.

## Development

```bash
npm install
npm run dev      # start the dev server
npm run build    # typecheck + production build
```

Built with Vite, React, TypeScript, and Tailwind CSS.
