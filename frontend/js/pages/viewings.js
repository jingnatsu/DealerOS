// ══════════════════════════════════════════════
// DealerOS — Viewings page + calendar
// ══════════════════════════════════════════════
import { state, persistOpsState } from '../state.js';
import { fmtD, escHtml, today } from '../utils.js';
import { closeM, openM } from '../nav.js';

export function renderViewings() {
  const viewings = state.viewings;

  // Stats
  const upcoming   = viewings.filter(v => v.status !== 'Sold' && v.status !== 'Cancelled' && v.status !== 'No Show').length;
  const thisWeek   = viewings.filter(v => { const d = new Date(v.date); const now = new Date(); return (d - now) / 864e5 <= 7 && (d - now) / 864e5 >= -1; }).length;
  const confirmed  = viewings.filter(v => v.status === 'Confirmed').length;
  const sold       = viewings.filter(v => v.status === 'Sold').length;

  const statsEl = document.getElementById('viewing-stats');
  if (statsEl) statsEl.innerHTML = `
    <div class="stat blue"><div class="sl">Upcoming</div><div class="sv">${upcoming}</div></div>
    <div class="stat green"><div class="sl">This Week</div><div class="sv">${thisWeek}</div></div>
    <div class="stat amber"><div class="sl">Confirmed</div><div class="sv">${confirmed}</div></div>
    <div class="stat purple"><div class="sl">Converted</div><div class="sv">${sold}</div></div>`;

  // Upcoming list
  const upcoming7 = viewings
    .filter(v => v.status !== 'Cancelled')
    .sort((a, b) => new Date(a.date + 'T' + (a.time || '00:00')) - new Date(b.date + 'T' + (b.time || '00:00')))
    .slice(0, 6);

  const listEl = document.getElementById('viewings-list');
  if (listEl) listEl.innerHTML = upcoming7.map(v => `
    <div class="vc">
      <div class="vc-time">${v.time || '—'}</div>
      <div class="vc-name">${escHtml(v.customerName || v.name || '')}</div>
      <div class="vc-car">${escHtml(v.vehicleLabel || v.plate || '')} · ${fmtD(v.date)}</div>
      ${v.notes ? `<div class="vc-note">${escHtml(v.notes)}</div>` : ''}
      <div style="display:flex;gap:4px;margin-top:7px;">
        <span class="badge ${v.status==='Confirmed'?'bg':v.status==='Sold'?'bp':v.status==='No Show'?'br':'ba'}">${escHtml(v.status||'Pending')}</span>
        ${v.financeInterest === 'Yes' ? '<span class="badge bb">Finance</span>' : ''}
        ${v.deliveryRequired === 'Yes' ? '<span class="badge bc">Delivery</span>' : ''}
      </div>
    </div>`).join('') || '<div style="color:var(--text3);padding:10px;font-size:12px;">No upcoming viewings</div>';

  // All viewings table
  const tbody = document.getElementById('viewings-tbody');
  if (tbody) tbody.innerHTML = [...viewings].reverse().map((v, i) => `<tr>
    <td style="font-size:11px;">${fmtD(v.date)}</td>
    <td style="font-size:11px;">${v.time || '—'}</td>
    <td class="tdm">${escHtml(v.customerName || v.name || '')}</td>
    <td style="font-size:11px;">${escHtml(v.phone || '—')}</td>
    <td style="font-size:11px;">${escHtml(v.vehicleLabel || v.plate || '—')}</td>
    <td><span class="badge ${v.status==='Confirmed'?'bg':v.status==='Sold'?'bp':v.status==='No Show'?'br':'ba'}">${escHtml(v.status||'Pending')}</span></td>
    <td style="font-size:11px;color:var(--text3);">${escHtml(v.notes || '')}</td>
    <td>
      <select class="fs" style="padding:3px 6px;font-size:11px;width:auto;" onchange="updateViewingStatus(${viewings.length-1-i},this.value)">
        ${['Pending','Confirmed','No Show','Sold','Cancelled'].map(s => `<option${v.status===s?' selected':''}>${s}</option>`).join('')}
      </select>
    </td>
  </tr>`).join('') || '<tr><td colspan="8" style="text-align:center;color:var(--text3);padding:16px;">No viewings</td></tr>';

  renderCal();
  populateVehicleSelect();
}

export function updateViewingStatus(i, status) {
  state.viewings[i].status = status;
  persistOpsState();
  renderViewings();
}

export function renderCal() {
  const y = state.calYear, m = state.calMonth;
  const lblEl = document.getElementById('cal-lbl');
  if (lblEl) lblEl.textContent = new Date(y, m, 1).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });

  const firstDay = new Date(y, m, 1).getDay();
  const offset   = firstDay === 0 ? 6 : firstDay - 1; // Mon=0
  const daysInM  = new Date(y, m + 1, 0).getDate();
  const today    = new Date().toISOString().slice(0, 10);

  // Which days have viewings?
  const eventDays = new Set(
    state.viewings.filter(v => v.date?.slice(0, 7) === `${y}-${String(m+1).padStart(2,'0')}`)
      .map(v => parseInt(v.date?.slice(8, 10)))
  );

  let html = '';
  for (let i = 0; i < offset; i++) html += '<div class="cal-day other-month"></div>';
  for (let d = 1; d <= daysInM; d++) {
    const iso  = `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const cls  = [
      'cal-day',
      iso === today ? 'today' : '',
      eventDays.has(d) ? 'has-event' : '',
    ].filter(Boolean).join(' ');
    html += `<div class="${cls}" onclick="calDayClick(${d})">${d}</div>`;
  }

  const grid = document.getElementById('cal-grid');
  if (grid) grid.innerHTML = html;
}

export function calPrev() {
  state.calMonth--;
  if (state.calMonth < 0) { state.calMonth = 11; state.calYear--; }
  renderCal();
}
export function calNext() {
  state.calMonth++;
  if (state.calMonth > 11) { state.calMonth = 0; state.calYear++; }
  renderCal();
}
export function calDayClick(d) {
  const dateVal = `${state.calYear}-${String(state.calMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
  const el = document.getElementById('vw-date');
  if (el) el.value = dateVal;
  openM('addviewing');
}

export function addViewing() {
  const name     = document.getElementById('vw-name')?.value.trim();
  const phone    = document.getElementById('vw-phone')?.value.trim();
  const vehicle  = document.getElementById('vw-vehicle')?.value;
  const date     = document.getElementById('vw-date')?.value;
  const time     = document.getElementById('vw-time')?.value;
  const source   = document.getElementById('vw-source')?.value;
  const finance  = document.getElementById('vw-finance')?.value;
  const delivery = document.getElementById('vw-delivery')?.value;
  const notes    = document.getElementById('vw-notes')?.value;
  if (!name || !date) { alert('Enter customer name and date.'); return; }
  state.viewings.push({ id: 'v' + Date.now(), customerName: name, phone, vehicleLabel: vehicle, plate: vehicle, date, time, leadSource: source, financeInterest: finance, deliveryRequired: delivery, notes, status: 'Pending' });
  persistOpsState();
  closeM('addviewing');
  ['vw-name','vw-phone','vw-date','vw-time','vw-notes'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
  renderViewings();
  import('../nav.js').then(m => m.updateNavBadges());
}

function populateVehicleSelect() {
  const sel = document.getElementById('vw-vehicle');
  if (!sel) return;
  const stock = state.stockData || [];
  sel.innerHTML = '<option value="">— Select from stock —</option>' +
    stock.map(v => `<option value="${escHtml(v.plate||'')}">${escHtml(v.plate||'')} — ${escHtml(v.make||'')} ${escHtml(v.model||'')}</option>`).join('');
}
