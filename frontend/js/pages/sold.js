// ══════════════════════════════════════════════
// DealerOS — Sold History page
// ══════════════════════════════════════════════
import { state } from '../state.js';
import { fmt, fmtD, mLabel, escHtml, dlCSV } from '../utils.js';

export function renderSold() {
  const filter = document.getElementById('sold-filter')?.value || '';
  const sold   = state.soldData || [];

  // Populate month filter
  const months = [...new Set(sold.map(v => (v.dateSold || v.month || '').slice(0, 7)).filter(Boolean))].sort().reverse();
  const sel = document.getElementById('sold-filter');
  if (sel && sel.options.length <= 1) {
    months.forEach(m => {
      const o = document.createElement('option');
      o.value = m; o.textContent = mLabel(m + '-01');
      sel.appendChild(o);
    });
  }

  const rows = filter ? sold.filter(v => (v.dateSold || v.month || '').slice(0, 7) === filter) : sold;
  const tbody = document.getElementById('sold-tbody');
  if (!tbody) return;

  tbody.innerHTML = rows.map((v, i) => {
    const profit = v.grossProfit ?? v.profit ?? 0;
    const profitColor = profit >= 0 ? 'var(--green)' : 'var(--red)';
    return `<tr>
      <td style="font-size:11px;color:var(--text3);">${mLabel((v.dateSold || v.month || '').slice(0,7)+'-01')}</td>
      <td class="tdm">${escHtml(v.make||'')} ${escHtml(v.model||'')}</td>
      <td><span class="mono">${escHtml(v.plate||'')}</span></td>
      <td style="font-size:11px;">${fmtD(v.dateAcquired||v.date_acquired)}</td>
      <td style="font-size:11px;">${fmtD(v.dateSold||v.date_sold)}</td>
      <td style="font-size:11px;">${escHtml(v.source||'—')}</td>
      <td style="font-size:11px;">${v.daysInStock ?? v.days_in_stock ?? '—'}d</td>
      <td class="mono">${fmt(v.totalCost||v.total_cost||0)}</td>
      <td class="mono">${fmt(v.soldPrice||v.sold_price||0)}</td>
      <td class="mono" style="color:${profitColor};font-weight:700;">${fmt(profit)}</td>
      <td style="font-size:11px;">${escHtml(v.investor||'SA')}</td>
      <td><button class="btn btn-g btn-xs" onclick="showSoldBreakdown(${i})">Detail</button></td>
    </tr>`;
  }).join('') || '<tr><td colspan="12" style="text-align:center;color:var(--text3);padding:20px;">No sales</td></tr>';
}

export function showSoldBreakdown(i) {
  const v = (state.soldData || [])[i];
  if (!v) return;
  const profit   = v.grossProfit ?? v.profit ?? 0;
  const invShare = v.investorProfit ?? v.investor_profit ?? 0;
  const saShare  = v.saProfit ?? v.mp_profit ?? (profit - invShare);
  alert(
    `${v.make||''} ${v.model||''}\n${v.plate||''}\n\n` +
    `Date acquired: ${fmtD(v.dateAcquired||v.date_acquired)}\n` +
    `Date sold: ${fmtD(v.dateSold||v.date_sold)}\n` +
    `Source: ${v.source||'—'}\nPlatform: ${v.platform||'—'}\n\n` +
    `Cost in: ${fmt(v.totalCost||v.total_cost||0)}\n` +
    `Sold: ${fmt(v.soldPrice||v.sold_price||0)}\n` +
    `Profit: ${fmt(profit)}\n\n` +
    `Investor: ${v.investor||'SA'}\n` +
    `Investor share: ${fmt(invShare)}\n` +
    `SA share: ${fmt(saShare)}`
  );
}

export function exportSold() {
  const rows = [['Month','Plate','Model','Cost','Sold','Profit','Investor']];
  (state.soldData || []).forEach(v => rows.push([
    (v.dateSold||v.month||'').slice(0,7), v.plate||'',
    (v.make||'')+' '+(v.model||''),
    v.totalCost||v.total_cost||0,
    v.soldPrice||v.sold_price||0,
    v.grossProfit||v.profit||0,
    v.investor||'SA'
  ]));
  dlCSV(rows, 'sold.csv');
}
