// ══════════════════════════════════════════════
// DealerOS — Finance Log page
// ══════════════════════════════════════════════
import { state } from '../state.js';
import { fmt, fmtD, escHtml, escJs, normP, dlCSV, today } from '../utils.js';
import { openM, closeM } from '../nav.js';
import { api } from '../api.js';

export function renderFinance() {
  const filter  = document.getElementById('fin-filter')?.value || '';
  const entries = filter ? state.finLog.filter(e => e.cat === filter) : state.finLog;

  const total = entries.reduce((a, e) => a + (e.amount || 0), 0);
  const costs = entries.filter(e => e.direction !== 'in');
  const ins   = entries.filter(e => e.direction === 'in');

  const statsEl = document.getElementById('fin-stats');
  if (statsEl) statsEl.innerHTML = `
    <div class="stat red"><div class="sl">Total Spend</div><div class="sv">${fmt(costs.reduce((a,e)=>a+(e.amount||0),0))}</div></div>
    <div class="stat green"><div class="sl">Money In</div><div class="sv">${fmt(Math.abs(ins.reduce((a,e)=>a+(e.amount||0),0)))}</div></div>
    <div class="stat amber"><div class="sl">Entries</div><div class="sv">${entries.length}</div></div>
    <div class="stat blue"><div class="sl">Net</div><div class="sv" style="font-size:16px;">${fmt(total)}</div></div>`;

  const countEl = document.getElementById('fin-count');
  if (countEl) countEl.textContent = `(${entries.length})`;

  const logEl = document.getElementById('finance-log');
  if (!logEl) return;
  logEl.innerHTML = entries.length
    ? entries.map(e => `<div class="fin-row">
        <div class="fin-date">${fmtD(e.date)}</div>
        <div class="fin-plate">${escHtml(e.plate||'')}</div>
        <div class="fin-desc"><div style="color:var(--text);font-size:12px;">${escHtml(e.desc||'')}</div><div style="font-size:10px;color:var(--text3);">${escHtml(e.cat||'')}</div></div>
        <div class="fin-amt" style="color:${e.direction==='in'?'var(--green)':'var(--text)'};">${e.direction==='in'?'+':''}${fmt(Math.abs(e.amount||0))}</div>
        ${e.id && !e.id.startsWith('exp') && !e.id.startsWith('mi') && !e.id.startsWith('mo') ? `<button class="btn btn-red btn-xs" onclick="delExp('${escJs(e.id)}')">✕</button>` : ''}
      </div>`)
      .join('')
    : '<div style="color:var(--text3);padding:16px;text-align:center;">No entries</div>';
}

export async function quickLog() {
  const plate  = document.getElementById('ql-plate')?.value.trim().toUpperCase();
  const desc   = document.getElementById('ql-desc')?.value.trim();
  const amount = parseFloat(document.getElementById('ql-amount')?.value) || 0;
  const cat    = document.getElementById('ql-cat')?.value;
  if (!desc || !amount) { alert('Enter description and amount.'); return; }

  const v = (state.stockData || []).find(x => normP(x.plate) === normP(plate));
  const entry = { id: 'ql-' + Date.now(), date: today(), plate, model: v ? (v.make||'')+' '+(v.model||'') : '', desc, cat, amount, direction: 'out' };
  state.finLog.unshift(entry);

  // If plate matches a stock vehicle, also log via API to update total cost
  if (v) {
    try { await api.addCost(v.stockId || v.stock_id, { description: desc, amount, category: cat, date: today() }); }
    catch (_) { /* best-effort */ }
  }

  renderFinance();
  ['ql-plate','ql-desc','ql-amount'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
}

export async function logExpModal() {
  const plate  = document.getElementById('exp-plate')?.value.trim().toUpperCase();
  const cat    = document.getElementById('exp-cat')?.value;
  const desc   = document.getElementById('exp-desc')?.value.trim();
  const amount = parseFloat(document.getElementById('exp-amount')?.value) || 0;
  const date   = document.getElementById('exp-date')?.value || today();
  if (!desc || !amount) { alert('Enter description and amount.'); return; }

  const v = (state.stockData || []).find(x => normP(x.plate) === normP(plate));
  const entry = { id: 'exp-' + Date.now(), date, plate, model: v ? (v.make||'')+' '+(v.model||'') : '', desc, cat, amount, direction: 'out' };
  state.finLog.unshift(entry);

  if (v) {
    try { await api.addCost(v.stockId || v.stock_id, { description: desc, amount, category: cat, date }); }
    catch (_) { /* best-effort */ }
  }

  closeM('addexpense');
  ['exp-plate','exp-desc','exp-amount','exp-date'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
  renderFinance();
}

export function delExp(id) {
  state.finLog = state.finLog.filter(e => e.id !== id);
  renderFinance();
}

export function prefillExp(plate, model) {
  const el = document.getElementById('exp-plate');
  if (el) el.value = plate;
  openM('addexpense');
}

export function exportFinance() {
  const rows = [['Date','Plate','Model','Description','Category','Amount']];
  state.finLog.forEach(e => rows.push([e.date, e.plate, e.model, e.desc, e.cat, e.amount]));
  dlCSV(rows, 'finance_log.csv');
}
