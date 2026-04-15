// ══════════════════════════════════════════════
// DealerOS — Service History page
// ══════════════════════════════════════════════
import { state, persistOpsState } from '../state.js';
import { fmtD, escHtml, normP, today } from '../utils.js';
import { closeM } from '../nav.js';
import { LOGO } from '../logo.js';

export function renderServiceHistory() {
  const tbody = document.getElementById('service-tbody');
  if (!tbody) return;
  tbody.innerHTML = state.serviceRecords.map((r, i) => `<tr>
    <td class="tdm">${escHtml(r.model || r.plate || '')}</td>
    <td><span class="mono">${escHtml(r.plate || '')}</span></td>
    <td>${escHtml(r.type || '')}</td>
    <td style="font-size:11px;">${fmtD(r.date)}</td>
    <td class="mono">${r.mileage ? Number(r.mileage).toLocaleString() : '—'}</td>
    <td class="mono" style="font-size:10.5px;">${escHtml(r.ref || '—')}</td>
    <td style="font-size:11px;color:var(--text3);">${escHtml(r.notes || '')}</td>
    <td><button class="btn btn-g btn-xs" onclick="printServiceInvoice(${i})">🖨️ Print</button></td>
  </tr>`).join('') || '<tr><td colspan="8" style="text-align:center;color:var(--text3);padding:20px;">No service records</td></tr>';
}

export function addService() {
  const plate  = document.getElementById('svc-plate')?.value.trim().toUpperCase();
  const type   = document.getElementById('svc-type')?.value;
  const date   = document.getElementById('svc-date')?.value;
  const miles  = parseInt(document.getElementById('svc-miles')?.value) || null;
  const stamps = parseInt(document.getElementById('svc-stamps')?.value) || null;
  const notes  = document.getElementById('svc-notes')?.value;
  if (!plate) { alert('Enter a reg plate.'); return; }
  const v = (state.stockData || []).find(x => normP(x.plate) === normP(plate));
  const ref = 'SVC-' + Date.now().toString().slice(-6);
  state.serviceRecords.push({ id: 's' + Date.now(), plate, model: v ? (v.make||'')+' '+(v.model||'') : '', type, date, mileage: miles, stamps, notes, ref });
  persistOpsState();
  closeM('addservice');
  ['svc-plate','svc-date','svc-miles','svc-stamps','svc-notes'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
  renderServiceHistory();
}

export function printServiceInvoice(i) {
  const r = state.serviceRecords[i];
  if (!r) return;
  const w = window.open('', '_blank');
  w.document.write(`<!DOCTYPE html><html><head><title>Service Invoice — ${r.plate}</title>
    <style>body{font-family:Arial,sans-serif;margin:30px;color:#111;}h2{font-weight:300;letter-spacing:2px;}.row{display:flex;gap:20px;margin-bottom:8px;}.lbl{color:#666;width:140px;font-size:11px;text-transform:uppercase;}.val{font-weight:600;}@media print{body{margin:10px;}}</style>
    </head><body>
    <img src="${LOGO}" style="height:55px;margin-bottom:16px;">
    <h2>SERVICE INVOICE</h2>
    <div class="row"><div class="lbl">Reg Plate</div><div class="val">${r.plate}</div></div>
    <div class="row"><div class="lbl">Vehicle</div><div class="val">${r.model||'—'}</div></div>
    <div class="row"><div class="lbl">Type</div><div class="val">${r.type||''}</div></div>
    <div class="row"><div class="lbl">Date</div><div class="val">${fmtD(r.date)}</div></div>
    <div class="row"><div class="lbl">Mileage</div><div class="val">${r.mileage ? Number(r.mileage).toLocaleString()+' miles' : '—'}</div></div>
    <div class="row"><div class="lbl">Stamps</div><div class="val">${r.stamps||'—'}</div></div>
    <div class="row"><div class="lbl">Reference</div><div class="val">${r.ref||'—'}</div></div>
    <div class="row"><div class="lbl">Notes</div><div class="val">${r.notes||'—'}</div></div>
    <div style="margin-top:20px;font-size:10px;color:#999;border-top:1px solid #ddd;padding-top:10px;">SA Motors · 64 Nile Street, London N1 7SR · 07440 603950</div>
    </body></html>`);
  w.document.close();
  setTimeout(() => w.print(), 400);
}
