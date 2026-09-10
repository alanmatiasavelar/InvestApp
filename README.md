# InvestApp

A client-side investment portfolio manager. Everything runs in the browser and
persists to `localStorage` — there's no backend or account system.

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
