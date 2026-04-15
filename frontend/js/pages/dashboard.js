// ══════════════════════════════════════════════
// DealerOS — Dashboard page
// ══════════════════════════════════════════════
import { state } from '../state.js';
import { fmt, fmt0, fmtD, dc, mLabel, escHtml } from '../utils.js';

export function renderDashboard() {
  const d = document.getElementById('dash-date');
  if (d) d.textContent = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  const stock = state.stockData || [];
  const sold  = state.soldData  || [];

  // ── Stats ─────────────────────────────────
  const thisMonth = new Date().toISOString().slice(0, 7);
  const mSold   = sold.filter(v => (v.dateSold || v.month || '').slice(0, 7) === thisMonth);
  const mProfit = mSold.reduce((a, v) => a + (v.grossProfit || v.profit || 0), 0);
  const outstanding = state.fines.filter(f => f.status !== 'Paid').length;
  const upcoming    = state.viewings.filter(v => v.status !== 'Sold' && v.status !== 'Cancelled').length;
  const motSoon = stock.filter(v => {
    if (!v.motExpiry) return false;
    return (new Date(v.motExpiry) - new Date()) / 864e5 <= 90;
  }).length;

  const statsEl = document.getElementById('dash-stats');
  if (statsEl) statsEl.innerHTML = `
    <div class="stat red"><div class="si">🚗</div><div class="sl">In Stock</div><div class="sv">${stock.length}</div><div class="ss">${stock.filter(v => v.status === 'RESERVED').length} reserved</div></div>
    <div class="stat green"><div class="si">✅</div><div class="sl">Sold This Month</div><div class="sv">${mSold.length}</div><div class="ss">${fmt0(mProfit)} profit</div></div>
    <div class="stat amber"><div class="si">📅</div><div class="sl">Upcoming Viewings</div><div class="sv">${upcoming}</div></div>
    <div class="stat purple"><div class="si">⚠️</div><div class="sl">Outstanding Fines</div><div class="sv">${outstanding}</div></div>
    <div class="stat cyan"><div class="si">🔍</div><div class="sl">MOT Expiring Soon</div><div class="sv">${motSoon}</div><div class="ss">within 90 days</div></div>`;

  // ── Alerts ────────────────────────────────
  const alerts = [];
  if (motSoon > 0)   alerts.push(`<div class="alert alt-a">⚠️ ${motSoon} vehicle${motSoon > 1 ? 's' : ''} with MOT expiring within 90 days</div>`);
  if (outstanding > 0) alerts.push(`<div class="alert alt-r">🚨 ${outstanding} outstanding fine${outstanding > 1 ? 's' : ''} require attention</div>`);
  const noListing = stock.filter(v => !v.listedAutoTrader && !v.listedWebsite);
  if (noListing.length > 0) alerts.push(`<div class="alert alt-b">📢 ${noListing.length} vehicle${noListing.length > 1 ? 's' : ''} not listed anywhere</div>`);
  const alertsEl = document.getElementById('dash-alerts');
  if (alertsEl) alertsEl.innerHTML = alerts.join('');

  // ── Days in stock list ─────────────────────
  const sorted = [...stock].sort((a, b) => (b.daysInStock || 0) - (a.daysInStock || 0));
  const daysEl = document.getElementById('days-list');
  if (daysEl) daysEl.innerHTML = sorted.slice(0, 8).map(v => {
    const days = v.daysInStock || 0;
    return `<div class="pbar">
      <div style="width:90px;font-family:'DM Mono',monospace;font-size:10.5px;color:var(--text3);flex-shrink:0;">${escHtml(v.plate || v.stockId || '')}</div>
      <div style="flex:1;font-size:12px;color:var(--text);">${escHtml(v.model || v.make || '')}</div>
      <div class="${dc(days)}" style="font-family:'DM Mono',monospace;font-size:11px;width:45px;text-align:right;">${days}d</div>
    </div>`;
  }).join('') || '<div style="color:var(--text3);padding:10px;">No stock</div>';

  // ── Top profit ────────────────────────────
  const topSold = [...sold].sort((a, b) => (b.grossProfit || b.profit || 0) - (a.grossProfit || a.profit || 0));
  const max = topSold[0] ? (topSold[0].grossProfit || topSold[0].profit || 1) : 1;
  const topEl = document.getElementById('top-profit');
  if (topEl) topEl.innerHTML = topSold.slice(0, 6).map(v => {
    const p = v.grossProfit || v.profit || 0;
    const pct = Math.round((p / max) * 100);
    return `<div class="pbar">
      <div style="width:80px;font-family:'DM Mono',monospace;font-size:10.5px;color:var(--text3);flex-shrink:0;">${escHtml(v.plate || '')}</div>
      <div class="ptrack"><div class="pfill" style="width:${pct}%;background:var(--green);"></div></div>
      <div style="font-family:'DM Mono',monospace;font-size:11px;color:var(--green);width:65px;text-align:right;">${fmt0(p)}</div>
    </div>`;
  }).join('') || '<div style="color:var(--text3);padding:10px;">No sales yet</div>';

  // ── Monthly profit chart ──────────────────
  renderProfitChart('profit-chart', sold);
}

export function renderProfitChart(containerId, soldArr) {
  const el = document.getElementById(containerId);
  if (!el) return;
  // Build last 8 months
  const months = [];
  for (let i = 7; i >= 0; i--) {
    const d = new Date(); d.setMonth(d.getMonth() - i);
    months.push(d.toISOString().slice(0, 7));
  }
  const data = months.map(m => {
    const ms = (soldArr || []).filter(v => (v.dateSold || v.month || '').slice(0, 7) === m);
    return { m, profit: ms.reduce((a, v) => a + (v.grossProfit || v.profit || 0), 0) };
  });
  const max = Math.max(...data.map(d => d.profit), 1);
  el.innerHTML = data.map(d => {
    const h = Math.round((d.profit / max) * 96);
    return `<div class="bc2">
      <div class="bar" style="height:${h}px;background:${d.profit > 0 ? 'var(--accent)' : 'var(--s3)'};"></div>
      <div class="blbl">${mLabel(d.m + '-01')}</div>
    </div>`;
  }).join('');
}
