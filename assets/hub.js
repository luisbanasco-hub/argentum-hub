/* ===================================================================
   ARGENTUM HUB — Shared utilities + Supabase client
   Pure vanilla JS. Read-only. Mock fallback on every query.
   =================================================================== */

/* ---------- Supabase projects (read-only anon keys) ----------
   MAX v2  → project ulvfapkcexhdvmmrxnix
   MIDAS   → project mlwxrlhpzlhssccnwkjk
   Anon keys are public by design (read-only client access).         */
const SUPABASE_MAX = {
  url: 'https://ulvfapkcexhdvmmrxnix.supabase.co',
  key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVsdmZhcGtjZXhoZHZtbXJ4bml4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk3MTI3MzYsImV4cCI6MjA5NTI4ODczNn0.E6GTyDzcWWUl3NNIcvqITdXLK_EeM0f6Sv5BqSQ84WM'
};
const SUPABASE_MIDAS = {
  url: 'https://mlwxrlhpzlhssccnwkjk.supabase.co',
  key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1sd3hybGhwemxoc3NjY253a2prIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk3NDU3NTEsImV4cCI6MjA5NTMyMTc1MX0.K8RSPpgauKhfMKVqmqaBp3_7SlFPyWOZ3z9hESeI8jU'
};

/* Paper-trading anchors (single source of truth for countdowns) */
const PAPER = {
  maxStart: '2026-06-01T00:00:00Z',   // MAX paper Day 1
  maxDays: 14,
  maxGoLive: '2026-06-20',
  midasGoLive: '2026-07-01'
};

/* ===================================================================
   FETCH
   =================================================================== */

/**
 * fetchSupabase(project, table, params)
 *   project: SUPABASE_MAX | SUPABASE_MIDAS
 *   table:   table name
 *   params:  PostgREST query string (e.g. 'order=opened_at.desc&limit=10')
 * Returns { ok:true, data:[...] } or { ok:false, error }.
 */
async function fetchSupabase(project, table, params = '') {
  const q = params ? '?' + params : '';
  const url = `${project.url}/rest/v1/${table}${q}`;
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 8000);
    const res = await fetch(url, {
      headers: { apikey: project.key, Authorization: `Bearer ${project.key}` },
      signal: ctrl.signal
    });
    clearTimeout(t);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return { ok: true, data };
  } catch (err) {
    console.warn(`[hub] Supabase fetch failed (${table}):`, err.message);
    return { ok: false, error: err.message };
  }
}

/**
 * loadData — wraps a Supabase fetch with mock fallback.
 * Returns { rows, source } where source ∈ 'live' | 'mock'.
 * Uses mock when the fetch fails OR returns an empty set (and a mock exists).
 */
async function loadData(project, table, params, mock) {
  const r = await fetchSupabase(project, table, params);
  if (r.ok && Array.isArray(r.data) && r.data.length > 0) {
    return { rows: r.data, source: 'live' };
  }
  if (r.ok && Array.isArray(r.data) && r.data.length === 0 && mock === undefined) {
    return { rows: [], source: 'live' };   // genuinely empty, no mock needed
  }
  return { rows: mock || [], source: 'mock' };
}

/* CoinGecko public prices (no auth). Returns null on failure. */
async function fetchPrices(ids = ['bitcoin', 'ethereum', 'solana', 'ripple']) {
  const url = `https://api.coingecko.com/api/v3/simple/price?ids=${ids.join(',')}` +
              `&vs_currencies=usd&include_24hr_change=true`;
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 8000);
    const res = await fetch(url, { signal: ctrl.signal });
    clearTimeout(t);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return { ok: true, data: await res.json() };
  } catch (err) {
    console.warn('[hub] CoinGecko failed:', err.message);
    return { ok: false, error: err.message };
  }
}

/* ===================================================================
   FORMATTERS
   =================================================================== */

function formatUSD(n, dp) {
  const v = Number(n);
  if (!isFinite(v)) return '$0.00';
  const digits = dp !== undefined ? dp : (Math.abs(v) >= 1000 ? 2 : 2);
  return '$' + v.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

function formatNum(n, dp = 2) {
  const v = Number(n);
  if (!isFinite(v)) return '0';
  return v.toLocaleString('en-US', { minimumFractionDigits: dp, maximumFractionDigits: dp });
}

/* returns "+1.23%" string */
function formatPct(n, dp = 2) {
  const v = Number(n);
  if (!isFinite(v)) return '0.00%';
  const sign = v > 0 ? '+' : '';
  return `${sign}${v.toFixed(dp)}%`;
}

/* returns class name for a signed value */
function pnlClass(n) {
  const v = Number(n);
  if (!isFinite(v) || v === 0) return 'flat';
  return v > 0 ? 'pos' : 'neg';
}

/* coloured percent span */
function pctSpan(n, dp = 2) {
  return `<span class="${pnlClass(n)}">${formatPct(n, dp)}</span>`;
}

function timeAgo(ts) {
  if (!ts) return '—';
  const then = new Date(ts).getTime();
  if (isNaN(then)) return '—';
  const s = Math.floor((Date.now() - then) / 1000);
  if (s < 0) return 'just now';
  if (s < 45) return 'just now';
  if (s < 90) return '1m ago';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(ts).toLocaleDateString();
}

function daysBetween(fromISO, toISO) {
  const a = new Date(fromISO).getTime();
  const b = toISO ? new Date(toISO).getTime() : Date.now();
  return Math.floor((b - a) / 86400000);
}

/* MAX paper-trading day number (1-based, clamped) */
function paperDay() {
  const d = daysBetween(PAPER.maxStart) + 1;
  return Math.max(1, Math.min(PAPER.maxDays, d));
}

/* ===================================================================
   BADGES
   =================================================================== */

function statusBadge(status) {
  const s = String(status || '').toLowerCase();
  if (['live', 'ok', 'active', 'open'].includes(s))
    return `<span class="badge badge-live"><span class="dot"></span>${s.toUpperCase()}</span>`;
  if (['paper'].includes(s))
    return `<span class="badge badge-paper">PAPER</span>`;
  if (['suspended', 'halted', 'error', 'tripped', 'down'].includes(s))
    return `<span class="badge badge-suspended">${s.toUpperCase()}</span>`;
  if (['building', 'paused', 'pending'].includes(s))
    return `<span class="badge badge-building">${s.toUpperCase()}</span>`;
  return `<span class="badge badge-neutral">${(status || '—').toString().toUpperCase()}</span>`;
}

function sourceBadge(source) {
  const s = String(source || 'UNKNOWN').toUpperCase();
  const cls = 'src-' + s.toLowerCase();
  return `<span class="badge ${cls}">${s}</span>`;
}

/* small flag showing where data came from */
function dataFlag(source) {
  if (source === 'mock') return `<span class="data-flag mock" title="Supabase unreachable or empty — showing mock data">🟡 MOCK</span>`;
  if (source === 'err')  return `<span class="data-flag err">🔴 ERROR</span>`;
  return `<span class="data-flag live" title="Live data">🟢 LIVE</span>`;
}

function setFlag(id, source) {
  const el = document.getElementById(id);
  if (el) el.innerHTML = dataFlag(source);
}

/* ===================================================================
   HELPERS
   =================================================================== */

function el(id) { return document.getElementById(id); }
function setHTML(id, html) { const e = el(id); if (e) e.innerHTML = html; }

function autoRefresh(fn, seconds) {
  fn();
  return setInterval(fn, seconds * 1000);
}

function nowStamp() {
  return new Date().toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: false
  }) + ' local';
}

function tickClock(id) {
  const set = () => setHTML(id, nowStamp());
  set();
  setInterval(set, 30000);
}

/* normalize symbol like ETHUSDT -> ETH */
function baseSymbol(sym) {
  return String(sym || '').replace(/USDT$|USD$|PERP$/i, '') || sym;
}

/* ===================================================================
   MOCK DATA  (used when Supabase is unreachable or a table is empty)
   =================================================================== */
const MOCK = {
  directional_trades: [
    { symbol: 'ETHUSDT', side: 'SHORT', usdt_amount: 50, entry_price: 1630.06, exit_price: 1564.85, stop_loss: 1662.66, take_profit: 1564.85, signal_score: -3, realized_pnl: 2.00, close_reason: 'take_profit', status: 'closed', opened_at: '2026-06-06T15:45:00Z', closed_at: '2026-06-07T18:40:00Z' },
    { symbol: 'BTCUSDT', side: 'SHORT', usdt_amount: 50, entry_price: 60683.7, exit_price: 58863.18, stop_loss: 61897.37, take_profit: 58863.18, signal_score: -2, realized_pnl: 1.50, close_reason: 'take_profit', status: 'closed', opened_at: '2026-06-06T23:11:00Z', closed_at: '2026-06-07T12:13:00Z' },
    { symbol: 'SOLUSDT', side: 'LONG', usdt_amount: 50, entry_price: 64.20, exit_price: 62.10, stop_loss: 62.00, take_profit: 70.0, signal_score: 2, realized_pnl: -1.63, close_reason: 'stop_loss', status: 'closed', opened_at: '2026-06-05T10:00:00Z', closed_at: '2026-06-05T19:30:00Z' }
  ],
  open_directional: [
    { symbol: 'ETHUSDT', side: 'SHORT', usdt_amount: 50, entry_price: 1631.6, stop_loss: 1664.23, take_profit: 1566.33, signal_score: -3, status: 'open', opened_at: '2026-06-07T15:44:00Z' }
  ],
  hedge_positions: [
    { symbol: 'BTC', usdt_amount: 200, spot_entry: 63100, futures_entry: 63180, funding_collected: 4.21, realized_pnl: 0, status: 'open', direction: 'long_spot_short_futures', opened_at: '2026-06-03T09:00:00Z' },
    { symbol: 'ETH', usdt_amount: 150, spot_entry: 1680, futures_entry: 1683, funding_collected: 2.88, realized_pnl: 0, status: 'open', direction: 'long_spot_short_futures', opened_at: '2026-06-04T11:00:00Z' }
  ],
  risk_state: [
    { agent: 'MAX_V2', daily_pnl: 0, monthly_pnl: 0, daily_exposure: 700, consecutive_losses: 0, halted: false, updated_at: new Date().toISOString() }
  ],
  funding_rates: [
    { symbol: 'BTC', bybit: 0.0100, binance: 0.0085 },
    { symbol: 'ETH', bybit: 0.0072, binance: 0.0090 },
    { symbol: 'SOL', bybit: 0.0125, binance: 0.0110 }
  ],
  macro_signals: [
    { symbol: 'BTC', bias: 'bullish', confidence: 0.78, source: 'ATLAS', updated_at: '2026-06-07T09:30:00Z' },
    { symbol: 'ETH', bias: 'bearish', confidence: 0.64, source: 'ATLAS_SENTIMENT', updated_at: '2026-06-07T08:15:00Z' },
    { symbol: 'CRYPTO', bias: 'bullish', confidence: 0.71, source: 'MIDAS', updated_at: '2026-06-07T06:00:00Z' },
    { symbol: 'BTC', bias: 'neutral', confidence: 0.55, source: 'ATLAS_ONCHAIN', updated_at: '2026-06-06T22:00:00Z' },
    { symbol: 'SOL', bias: 'bullish', confidence: 0.69, source: 'ATLAS', updated_at: '2026-06-06T18:30:00Z' }
  ],
  error_log: [
    { level: 'WARNING', logger_name: 'signal_executor', message: 'SL hit timeout — retry succeeded', occurred_at: '2026-06-07T20:10:00Z' },
    { level: 'ERROR', logger_name: 'funding_collector', message: 'Bybit API 429 rate limit', occurred_at: '2026-06-07T14:02:00Z' },
    { level: 'WARNING', logger_name: 'reconciler', message: 'Position reconciled on restart', occurred_at: '2026-06-07T12:13:00Z' }
  ],
  portfolio_snapshot: {
    total_usd: 23217.12, data_quality: 'partial',
    pillar_allocs: {
      crypto:      { usd_value: 14333.69, actual_pct: 61.74, target_pct: 55, deviation_pp: 6.74, in_band: true },
      tech:        { usd_value: 0, actual_pct: 0, target_pct: 30, deviation_pp: -30, in_band: false },
      real_assets: { usd_value: 0, actual_pct: 0, target_pct: 10, deviation_pp: -10, in_band: false },
      cash:        { usd_value: 8883.43, actual_pct: 38.26, target_pct: 5, deviation_pp: 33.26, in_band: false }
    },
    snapshot_at: new Date().toISOString()
  },
  asset_positions: [
    { symbol: 'XRP',  pillar: 'crypto', usd_value: 14100.02, pct_portfolio: 60.73, price_usd: 1.15,  sources: { cold_storage_trezor: 12260.88 } },
    { symbol: 'USDT', pillar: 'cash',   usd_value: 8883.43,  pct_portfolio: 38.26, price_usd: 0.9995, sources: { binance: 145.5, cold_storage_trust_spl: 8642 } },
    { symbol: 'ETH',  pillar: 'crypto', usd_value: 227.96,   pct_portfolio: 0.98,  price_usd: 1685.31, sources: { cold_storage_trezor: 0.135 } },
    { symbol: 'BTC',  pillar: 'crypto', usd_value: 2.24,     pct_portfolio: 0.01,  price_usd: 63199,  sources: { coinbase: 0.0000354 } }
  ],
  data_source_health: [
    { source: 'binance',  status: 'ok',    fetched_at: new Date().toISOString(), error_message: null },
    { source: 'kraken',   status: 'error', fetched_at: new Date().toISOString(), error_message: 'auth timeout' },
    { source: 'coinbase', status: 'ok',    fetched_at: new Date().toISOString(), error_message: null }
  ],
  trade_executions: [
    { created_at: '2026-06-06T12:00:00Z', exchange: 'kraken', symbol: 'XRP', action: 'BUY', usd_amount: 500, status: 'ok' },
    { created_at: '2026-06-05T09:30:00Z', exchange: 'binance', symbol: 'ETH', action: 'BUY', usd_amount: 250, status: 'ok' }
  ],
  prices: {
    bitcoin:  { usd: 67432, usd_24h_change: 2.31 },
    ethereum: { usd: 1685.3, usd_24h_change: -1.12 },
    solana:   { usd: 66.21,  usd_24h_change: 3.84 },
    ripple:   { usd: 1.15,   usd_24h_change: 0.92 }
  },
  perf_series: (() => {
    const out = []; const base = 22000;
    for (let i = 29; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      out.push({ snapshot_at: d.toISOString(), total_usd: base + Math.sin(i / 4) * 800 + (29 - i) * 40 });
    }
    return out;
  })()
};
