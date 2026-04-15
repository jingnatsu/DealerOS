// ══════════════════════════════════════════════
// DealerOS — Fines & Penalties page
// ══════════════════════════════════════════════
import { state, persistOpsState } from '../state.js';
import { fmt, fmtD, escHtml } from '../utils.js';
import { closeM } from '../nav.js';

export function renderFines() {
  const fines = state.fines;

  const total       = fines.reduce((a, f) => a + (f.amount || 0), 0);
  const outstanding = fines.filter(f => f.status !== 'Paid');
  const paid        = fines.filter(f => f.status === 'Paid');

  const statsEl = document.getElementById('fine-stats');
  if (statsEl) statsEl.innerHTML = `
    <div class="stat red"><div class="sl">Total Fines</div><div class="sv">${fines.length}</div></div>
    <div class="stat amber"><div class="sl">Outstanding</div><div class="sv">${outstanding.length}</div><div class="ss">${fmt(outstanding.reduce((a,f)=>a+(f.amount||0),0))}</div></div>
    <div class="stat green"><div class="sl">Paid</div><div class="sv">${paid.length}</div></div>
    <div class="stat blue"><div class="sl">Total Amount</div><div class="sv">${fmt(total)}</div></div>`;

  const tbody = document.getElementById('fine-tbody');
  if (!tbody) return;
  tbody.innerHTML = fines.map((f, i) => `<tr>
    <td style="font-size:11px;">${fmtD(f.dateIssued || f.date)}</td>
    <td><span class="mono">${escHtml(f.plate||'')}</span><div style="font-size:10px;color:var(--text3);">${escHtml(f.model||'')}</div></td>
    <td style="font-size:11px;">${escHtml(f.fineType||f.type||'')}</td>
    <td class="mono" style="color:var(--red);font-weight:700;">${fmt(f.amount||0)}</td>
    <td style="font-size:11px;">${fmtD(f.dueDate||f.due)}</td>
    <td><span class="badge ${f.status==='Paid'?'bg':f.status==='Appealing'?'ba':'br'}">${escHtml(f.status||'Outstanding')}</span></td>
    <td class="mono" style="font-size:10px;">${escHtml(f.reference||f.ref||'—')}</td>
    <td style="font-size:11px;color:var(--text3);">${escHtml(f.notes||'')}</td>
    <td>
      ${f.status !== 'Paid' ? `<button class="btn btn-green btn-xs" onclick="markFinePaid(${i})">Paid</button> ` : ''}
      ${f.status !== 'Appealing' ? `<button class="btn btn-amber btn-xs" onclick="appealFine(${i})">Appeal</button>` : ''}
    </td>
  </tr>`).join('') || '<tr><td colspan="9" style="text-align:center;color:var(--text3);padding:20px;">No fines logged</td></tr>';
}

export function addFine() {
  const plate  = document.getElementById('fn-plate')?.value.trim().toUpperCase();
  const type   = document.getElementById('fn-type')?.value;
  const date   = document.getElementById('fn-date')?.value;
  const amount = parseFloat(document.getElementById('fn-amount')?.value) || 0;
  const due    = document.getElementById('fn-due')?.value;
  const ref    = document.getElementById('fn-ref')?.value;
  const notes  = document.getElementById('fn-notes')?.value;
  if (!plate) { alert('Enter a reg plate.'); return; }
  const v = (state.stockData || []).find(x => x.plate?.toUpperCase() === plate);
  state.fines.push({ id: 'f' + Date.now(), plate, model: v ? (v.make||'')+' '+(v.model||'') : '', fineType: type, dateIssued: date, amount, dueDate: due, reference: ref, notes, status: 'Outstanding' });
  persistOpsState();
  closeM('addfine');
  ['fn-plate','fn-date','fn-amount','fn-due','fn-ref','fn-notes'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
  renderFines();
  import('../nav.js').then(m => m.updateNavBadges());
}

export function markFinePaid(i) {
  state.fines[i].status = 'Paid';
  persistOpsState();
  renderFines();
  import('../nav.js').then(m => m.updateNavBadges());
}
export function appealFine(i) {
  state.fines[i].status = 'Appealing';
  persistOpsState();
  renderFines();
}
