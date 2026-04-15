// ══════════════════════════════════════════════
// DealerOS — VAT Tracker page
// ══════════════════════════════════════════════
import { state } from '../state.js';
import { fmt, fmtD, escHtml } from '../utils.js';

export function renderVAT() {
  const sold     = state.soldData  || [];
  const finLog   = state.finLog    || [];
  const expenses = state.expenses  || [];

  // Output tax: VAT collected on sales (20%)
  const salesThisQ = sold.filter(v => {
    const d = new Date(v.dateSold || v.date_sold || v.month || Date.now());
    const now = new Date();
    return d.getFullYear() === now.getFullYear();
  });
  const outputVAT = salesThisQ.reduce((a, v) => a + ((v.soldPrice || v.sold_price || 0) / 6), 0); // 1/6 of VAT-inclusive price

  // Input tax: VAT paid on purchases/expenses (approx)
  const inputVAT = finLog.filter(e => e.direction === 'out')
    .reduce((a, e) => a + ((e.amount || 0) / 6), 0);

  const netVAT = outputVAT - inputVAT;

  const statsEl = document.getElementById('vat-stats');
  if (statsEl) statsEl.innerHTML = `
    <div class="stat red"><div class="sl">Output VAT</div><div class="sv" style="font-size:16px;">${fmt(outputVAT)}</div><div class="ss">Collected on sales</div></div>
    <div class="stat green"><div class="sl">Input VAT</div><div class="sv" style="font-size:16px;">${fmt(inputVAT)}</div><div class="ss">Paid on purchases</div></div>
    <div class="stat amber"><div class="sl">Net VAT Owed</div><div class="sv" style="font-size:16px;">${fmt(netVAT)}</div><div class="ss">To HMRC</div></div>
    <div class="stat blue"><div class="sl">Sales This Year</div><div class="sv">${salesThisQ.length}</div></div>`;

  const outputEl = document.getElementById('vat-output');
  if (outputEl) outputEl.innerHTML = salesThisQ.slice(0, 8).map(v => `
    <div class="fin-row">
      <div class="fin-date">${fmtD(v.dateSold || v.date_sold)}</div>
      <div class="fin-plate">${escHtml(v.plate || '')}</div>
      <div class="fin-desc">${escHtml(v.make||'')} ${escHtml(v.model||'')}</div>
      <div class="fin-amt" style="color:var(--green);">${fmt((v.soldPrice || v.sold_price || 0) / 6)}</div>
    </div>`).join('') || '<div style="color:var(--text3);padding:12px;">No sales</div>';

  const inputEl = document.getElementById('vat-input');
  if (inputEl) inputEl.innerHTML = finLog.filter(e => e.direction === 'out').slice(0, 8).map(e => `
    <div class="fin-row">
      <div class="fin-date">${fmtD(e.date)}</div>
      <div class="fin-plate">${escHtml(e.plate || '')}</div>
      <div class="fin-desc">${escHtml(e.desc || '')}</div>
      <div class="fin-amt" style="color:var(--amber);">${fmt((e.amount || 0) / 6)}</div>
    </div>`).join('') || '<div style="color:var(--text3);padding:12px;">No expenses</div>';

  const qEl = document.getElementById('vat-quarter');
  if (qEl) qEl.innerHTML = `
    <div class="alert alt-b">📋 Always review VAT calculations with your accountant before submitting to HMRC. These figures are estimates based on a standard 20% VAT rate. Dealer margin schemes may apply differently.</div>
    <div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--border);font-size:13px;"><span>Output Tax (Sales VAT)</span><span style="font-weight:700;color:var(--green);">${fmt(outputVAT)}</span></div>
    <div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--border);font-size:13px;"><span>Input Tax (Purchase VAT)</span><span style="font-weight:700;color:var(--amber);">${fmt(inputVAT)}</span></div>
    <div style="display:flex;justify-content:space-between;padding:10px 0;font-size:14px;font-weight:800;"><span>Net VAT Payable</span><span style="color:${netVAT > 0 ? 'var(--red)' : 'var(--green)'};">${fmt(netVAT)}</span></div>`;
}
