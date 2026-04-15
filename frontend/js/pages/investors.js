// ══════════════════════════════════════════════
// DealerOS — Investor Ledger page
// ══════════════════════════════════════════════
import { state } from '../state.js';
import { fmt, fmt0, fmtD, escHtml, mLabel } from '../utils.js';
import { renderProfitChart } from './dashboard.js';

export function renderInvestors() {
  const investors = state.investors || [];
  const total     = investors.reduce((a, i) => a + (i.totalProfit || i.total_profit || 0), 0);
  const avail     = investors.reduce((a, i) => a + (i.available || 0), 0);

  const summaryEl = document.getElementById('inv-summary');
  if (summaryEl) summaryEl.textContent = `${investors.length} investors · Total profit shared: ${fmt(total)} · Available capital: ${fmt(avail)}`;

  const cardsEl = document.getElementById('inv-cards');
  if (cardsEl) cardsEl.innerHTML = investors.map(inv => {
    const profit    = inv.totalProfit  || inv.total_profit  || 0;
    const balance   = inv.totalBalance || inv.total_balance || 0;
    const purchased = inv.purchased    || 0;
    const available = inv.available    || 0;
    const pct = balance > 0 ? Math.min(100, Math.round((purchased / balance) * 100)) : 0;
    return `<div class="invc">
      <div class="invc-name">${escHtml(inv.name || '')}</div>
      <div class="irow"><span class="lbl">Total Balance</span><span class="val">${fmt(balance)}</span></div>
      <div class="irow"><span class="lbl">Purchased</span><span class="val">${fmt(purchased)}</span></div>
      <div class="irow"><span class="lbl">Profit</span><span class="val" style="color:var(--green);">${fmt(profit)}</span></div>
      <div class="irow"><span class="lbl">Available</span><span class="val" style="color:var(--amber);">${fmt(available)}</span></div>
      <div class="prog"><div class="prog-fill" style="width:${pct}%;background:var(--accent);"></div></div>
    </div>`;
  }).join('') || '<div style="color:var(--text3);padding:16px;">No investors</div>';

  // Per-investor vehicle table
  const tbody = document.getElementById('inv-vehicle-tbody');
  if (tbody) {
    const rows = [];
    const allVehicles = [...(state.stockData || []), ...(state.soldData || [])];
    allVehicles.filter(v => v.investor).forEach(v => {
      const profit = v.grossProfit ?? v.profit ?? 0;
      const share  = v.investorSharePct || v.investor_share_pct || 0;
      const invAmt = profit * share / 100;
      rows.push(`<tr>
        <td>${escHtml(v.investor || '')}</td>
        <td class="tdm">${escHtml(v.make||'')} ${escHtml(v.model||'')}</td>
        <td><span class="mono">${escHtml(v.plate||'')}</span></td>
        <td class="mono">${fmt(v.totalCost||v.total_cost||0)}</td>
        <td class="mono">${v.soldPrice||v.sold_price ? fmt(v.soldPrice||v.sold_price) : '—'}</td>
        <td class="mono" style="color:${profit>=0?'var(--green)':'var(--red)'};">${profit !== 0 ? fmt(profit) : '—'}</td>
        <td class="mono" style="color:var(--purple);">${profit !== 0 ? fmt(invAmt) : '—'}</td>
        <td><span class="badge ${v.status==='SOLD'?'bg':v.status==='RESERVED'?'ba':'bb'}">${escHtml(v.status||'')}</span></td>
      </tr>`);
    });
    tbody.innerHTML = rows.join('') || '<tr><td colspan="8" style="text-align:center;color:var(--text3);padding:16px;">No vehicle assignments</td></tr>';
  }

  // Chart
  renderProfitChart('inv-chart', state.soldData || []);
}

export function editInvestorBudget() {
  const investors = state.investors || [];
  if (!investors.length) { alert('No investors loaded.'); return; }
  const names = investors.map((inv, i) => `${i + 1}. ${inv.name} — Balance: ${fmt(inv.totalBalance||inv.total_balance||0)}`).join('\n');
  alert('Investor Balances:\n\n' + names + '\n\nTo edit balances, use the Excel sync (import updated spreadsheet) or edit via the backend DB console at /h2-console.');
}
