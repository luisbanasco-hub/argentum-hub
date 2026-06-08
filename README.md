# ⚔️ Argentum Hub

A unified web dashboard for the entire **Argentum Investments** ecosystem.
One URL Luis opens every morning — ATLAS intelligence, MIDAS portfolio
health, and MAX trading performance, all in one Bloomberg-terminal-style
view. No Telegram commands, no dashboard switching.

**Stack:** pure HTML / CSS / vanilla JS. No frameworks, no build tools.
Hosted free on GitHub Pages. Data pulled live from Supabase REST (read-only
anon keys) with a mock-data fallback on every query, so the dashboard always
renders even if Supabase is unreachable.

## Pages

| Page | What it shows |
|------|---------------|
| `index.html` | Command center — agent status, market pulse, macro signals, alerts |
| `max.html`   | MAX v2 — P&L, open/closed trades, funding rates, risk state, equity curve |
| `midas.html` | MIDAS — portfolio value, allocation donut, positions, performance history |
| `atlas.html` | ATLAS — sentiment, prices, macro-signal timeline, news source health |

## Data sources

- **MAX v2** Supabase (`ulvfapkcexhdvmmrxnix`): `directional_trades`,
  `hedge_positions`, `risk_state_v2`, `funding_rate_history`, `macro_signals`,
  `error_log`
- **MIDAS** Supabase (`mlwxrlhpzlhssccnwkjk`): `portfolio_snapshots`,
  `asset_positions`, `data_source_health`, `trade_executions`
- **Prices**: CoinGecko public API (no auth)

> Some tables are currently empty (e.g. `funding_rate_history`, `macro_signals`
> on MAX). The hub automatically shows clearly-labelled 🟡 MOCK data for those
> until they populate, then switches to 🟢 LIVE.

## Configuration

The read-only Supabase anon keys are already filled in at the top of
[`assets/hub.js`](assets/hub.js). They are public by design (anon = read-only
client access). To point at different projects, edit:

```js
const SUPABASE_MAX   = { url: 'https://<max-ref>.supabase.co',   key: '<anon-key>' };
const SUPABASE_MIDAS = { url: 'https://<midas-ref>.supabase.co', key: '<anon-key>' };
```

Get a project's anon key from Supabase dashboard → Project Settings → API.

> **Security note:** these tables currently have Row Level Security **disabled**,
> so the anon key can read every row. That is fine for a read-only public
> dashboard, but anyone with the key can read the data. If any table should be
> private, enable RLS with a read policy in Supabase. The hub never writes.

## Run locally

No build step. Serve the folder over HTTP (file:// blocks `fetch`):

```bash
cd argentum-hub
python3 -m http.server 8080
# open http://localhost:8080
```

## Add to phone home screen

1. Open the GitHub Pages URL in **Safari** (iOS) or **Chrome** (Android).
2. **iOS:** Share → *Add to Home Screen*. **Android:** ⋮ → *Add to Home screen*.
3. The ⚔️ icon launches it full-screen like a native app.

## Deploy

Pushing to `main` auto-deploys via GitHub Actions
([`.github/workflows/deploy.yml`](.github/workflows/deploy.yml)).

One-time setup: repo **Settings → Pages → Build and deployment → Source:
GitHub Actions**. Live URL:

```
https://luisbanasco-hub.github.io/argentum-hub/
```

---
*MAX v2.0.0-rc1 · MIDAS v0.3 · ATLAS v2.0 — Argentum Investments*
