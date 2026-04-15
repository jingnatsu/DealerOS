// ══════════════════════════════════════════════
// DealerOS — Reports & Analytics page
// ══════════════════════════════════════════════
import { state } from '../state.js';
import { fmt, fmt0, fmtD, mLabel, escHtml } from '../utils.js';
import { renderProfitChart } from './dashboard.js';

export function renderReports() {
  const monthFilter = document.getElementById('report-month')?.value || 'all';
  let sold = state.soldData || [];

  // Populate month selector
  const months = [...new Set(sold.map(v => (v.dateSold || v.month || '').slice(0, 7)).filter(Boolean))].sort().reverse();
  const sel = document.getElementById('report-month');
  if (sel && sel.options.length <= 1) {
    months.forEach(m => {
      const o = document.createElement('option'); o.value = m; o.textContent = mLabel(m + '-01'); sel.appendChild(o);
    });
  }

  if (monthFilter !== 'all') sold = sold.filter(v => (v.dateSold || v.month || '').slice(0, 7) === monthFilter);

  const totalProfit  = sold.reduce((a, v) => a + (v.grossProfit || v.profit || 0), 0);
  const totalRevenue = sold.reduce((a, v) => a + (v.soldPrice   || v.sold_price || 0), 0);
  const avgProfit    = sold.length ? totalProfit / sold.length : 0;
  const avgDays      = sold.filter(v => v.daysInStock).reduce((a, v) => a + (v.daysInStock || 0), 0) / (sold.filter(v => v.daysInStock).length || 1);

  const kpisEl = document.getElementById('report-kpis');
  if (kpisEl) kpisEl.innerHTML = `
    <div class="stat green"><div class="sl">Total Profit</div><div class="sv">${fmt0(totalProfit)}</div></div>
    <div class="stat blue"><div class="sl">Revenue</div><div class="sv">${fmt0(totalRevenue)}</div></div>
    <div class="stat amber"><div class="sl">Cars Sold</div><div class="sv">${sold.length}</div></div>
    <div class="stat purple"><div class="sl">Avg Profit/Car</div><div class="sv">${fmt0(avgProfit)}</div></div>
    <div class="stat cyan"><div class="sl">Avg Days to Sell</div><div class="sv">${Math.round(avgDays)}d</div></div>`;

  // AI insight
  const aiEl = document.getElementById('report-ai');
  if (aiEl) {
    const best  = [...sold].sort((a, b) => (b.grossProfit||b.profit||0) - (a.grossProfit||a.profit||0))[0];
    const worst = [...sold].sort((a, b) => (a.grossProfit||a.profit||0) - (b.grossProfit||b.profit||0))[0];
    aiEl.innerHTML = `<div class="ailabel">📊 Performance Insight</div><div class="aitext">
      ${sold.length} vehicles sold${monthFilter !== 'all' ? ' this period' : ' all time'} — total profit ${fmt(totalProfit)}, avg ${fmt0(avgProfit)}/car.
      ${best ? ` Best performer: <strong>${escHtml(best.plate||'')} ${escHtml(best.make||'')} ${escHtml(best.model||'')}</strong> at ${fmt(best.grossProfit||best.profit||0)}.` : ''}
      ${worst && sold.length > 1 ? ` Lowest: <strong>${escHtml(worst.plate||'')} ${escHtml(worst.make||'')} ${escHtml(worst.model||'')}</strong> at ${fmt(worst.grossProfit||worst.profit||0)}.` : ''}
    </div>`;
  }

  // Top profit bars
  const topSold  = [...sold].sort((a, b) => (b.grossProfit||b.profit||0) - (a.grossProfit||a.profit||0)).slice(0, 10);
  const maxProfit = topSold[0] ? (topSold[0].grossProfit || topSold[0].profit || 1) : 1;
  const barsEl = document.getElementById('report-bars');
  if (barsEl) barsEl.innerHTML = topSold.map(v => {
    const p   = v.grossProfit || v.profit || 0;
    const pct = Math.round((p / maxProfit) * 100);
    return `<div class="pbar">
      <div style="width:75px;font-family:'DM Mono',monospace;font-size:10px;color:var(--text3);flex-shrink:0;">${escHtml(v.plate||'')}</div>
      <div style="flex:1;font-size:11px;color:var(--text2);flex-shrink:0;width:130px;">${escHtml(v.make||'')} ${escHtml(v.model||'')}</div>
      <div class="ptrack"><div class="pfill" style="width:${pct}%;background:var(--green);"></div></div>
      <div style="font-family:'DM Mono',monospace;font-size:11px;color:var(--green);width:65px;text-align:right;">${fmt0(p)}</div>
    </div>`;
  }).join('') || '<div style="color:var(--text3);padding:12px;">No data</div>';

  renderProfitChart('report-chart', sold);

  // Recommendations
  const recEl = document.getElementById('recommendations');
  if (recEl) {
    const recs = [];
    if ((state.stockData||[]).some(v => !v.listedAutoTrader)) recs.push({ icon: '🌐', text: 'List remaining stock on Auto Trader to increase visibility' });
    if ((state.fines||[]).some(f => f.status !== 'Paid')) recs.push({ icon: '⚠️', text: 'Clear outstanding fines to avoid escalation costs' });
    if (avgDays > 60) recs.push({ icon: '📉', text: 'Average days to sell is high — consider price adjustments on aged stock' });
    if ((state.stockData||[]).some(v => { const d = v.motExpiry ? (new Date(v.motExpiry)-new Date())/864e5 : 999; return d < 30; })) recs.push({ icon: '🔍', text: 'Book MOTs for vehicles expiring within 30 days' });
    recEl.innerHTML = recs.length
      ? recs.map(r => `<div class="li"><div class="ldot" style="background:var(--blue)"></div><div class="lc"><div class="lt">${r.icon} ${r.text}</div></div></div>`).join('')
      : '<div style="color:var(--green);padding:12px;">✓ No immediate actions needed</div>';
  }
}
