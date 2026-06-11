# Argentum Hub — Build Log

## [2026-06-10 21:35 ET] — Phase FORTRESS / Mission 3 (Dashboard v2)
- WHAT: live ops panels on index.html — Service Health (service_heartbeats,
  both projects, ✅/🔴/⚪ with graceful "stale" state until the DDL lands),
  Paper P&L equity curve (inline SVG sparkline from directional_trades +
  equity_trades pnl_usd), Funding Rates snapshot (BTC/ETH/SOL from
  funding_rate_history), merged two-project error feed, gate/go-live
  countdown chip. macro_signals now reads its canonical home (MAX project)
  with shared-project fallback until the anon grant + ATLAS env vars land.
  60s auto-refresh unchanged; every panel degrades to a "stale" state —
  the page never white-screens.
- VERIFIED: local preview against LIVE Supabase — equity curve renders
  (12 closed MAX paper trades), funding panel live (rows 15m old), signals
  live via fallback, mobile layout (375px) clean.
- LIVE FINDINGS while testing: ATLAS macro baselines are landing in the
  SHARED project (MAX_SUPABASE_URL still unset on atlas-eu); repeating
  `TelegramHandler getUpdates HTTP 409` errors in error_log (two pollers
  sharing one bot token) — both escalated in the session STATUS REPORT.
- FILES: index.html, assets/hub.js, .gitignore, BUILD_LOG.md
- TESTS: node --check on hub.js; manual preview desktop + mobile; all four
  new panels verified live or gracefully degraded.
- COMMIT: (this commit — "Phase FORTRESS: Hub live ops dashboard v2")

## [2026-06-11 ~17:45 ET] — Phase GLADIUS / Mission 3.3
- WHAT: A2 line in the Paper P&L panel — per-strategy split of
  directional_trades (strategy=eq.a2_trend): net, closed count, open count.
  Degrades to "pending (migration 005)" on 400 and to a friendly
  "no trades yet" when the engine is fresh — the page never breaks.
- VERIFIED: live preview — renders "per-strategy stats pending
  (migration 005)" against the real DB (column not yet applied), exactly the
  designed degradation.
- FILES: index.html, BUILD_LOG.md
- TESTS: manual live preview verification (panel + degradation path).
- COMMIT: (this commit — "Phase GLADIUS: Hub A2 per-strategy line")

## [2026-06-11 ~08:25 ET] — Phase AEGIS / Mission 3
- WHAT: full per-strategy panel — A2 line (enabled flag + evals from live
  heartbeat meta), legacy (retired) line, funding-book line with F7
  orphan-row warning. VERIFIED live against production: A2 🟢 3 evals/0
  trades, legacy $0.04/12 closed, funding $0.20/1 closed/7 open rows with
  the orphan warning correctly firing.
- FILES: index.html, BUILD_LOG.md
- TESTS: live preview verification (real data, all three lines).
- COMMIT: (this commit — "Phase AEGIS: Hub per-strategy panel + F7 warning")
