// ══════════════════════════════════════════════
// DealerOS — Collections & Deliveries page
// ══════════════════════════════════════════════
import { state, persistOpsState } from '../state.js';
import { fmtD, escHtml, today } from '../utils.js';
import { closeM } from '../nav.js';

export function renderCollections() {
  const all = [...state.deliveries, ...(state.collections || [])];

  // Stats
  const pending    = all.filter(c => c.status === 'Pending' || c.status === 'Booked').length;
  const completed  = all.filter(c => c.status === 'Collected' || c.status === 'Delivered').length;
  const collections = all.filter(c => (c.type||'').toLowerCase() === 'collection').length;
  const deliveries  = all.filter(c => (c.type||'').toLowerCase() === 'delivery').length;

  const statsEl = document.getElementById('col-stats');
  if (statsEl) statsEl.innerHTML = `
    <div class="stat blue"><div class="sl">Pending</div><div class="sv">${pending}</div></div>
    <div class="stat green"><div class="sl">Completed</div><div class="sv">${completed}</div></div>
    <div class="stat amber"><div class="sl">Collections</div><div class="sv">${collections}</div></div>
    <div class="stat purple"><div class="sl">Deliveries</div><div class="sv">${deliveries}</div></div>`;

  const pendingCols = all.filter(c => (c.type||'').toLowerCase() === 'collection' && (c.status === 'Pending' || c.status === 'Booked'));
  const pendingDels = all.filter(c => (c.type||'').toLowerCase() === 'delivery'   && (c.status === 'Pending' || c.status === 'Booked'));

  const renderItem = c => `<div class="li">
    <div class="ldot" style="background:${c.status==='Booked'?'var(--amber)':'var(--blue)'}"></div>
    <div class="lc">
      <div class="lt">${escHtml(c.model||c.plate||'')}</div>
      <div class="lm">${escHtml(c.address||c.addr||'—')} · ${fmtD(c.scheduledDate||c.collection_date||c.date)}</div>
      <div class="lv">🚗 ${escHtml(c.plate||'')}${c.driver ? ' · ' + escHtml(c.driver) : ''}</div>
    </div>
    <span class="badge ${c.status==='Booked'?'ba':'bb'}">${escHtml(c.status||'')}</span>
  </div>`;

  const colsEl = document.getElementById('collections-list');
  if (colsEl) colsEl.innerHTML = pendingCols.length ? pendingCols.map(renderItem).join('') : '<div style="color:var(--text3);padding:10px;font-size:12px;">No pending collections</div>';

  const delsEl = document.getElementById('deliveries-list');
  if (delsEl) delsEl.innerHTML = pendingDels.length ? pendingDels.map(renderItem).join('') : '<div style="color:var(--text3);padding:10px;font-size:12px;">No pending deliveries</div>';

  const tbody = document.getElementById('col-tbody');
  if (tbody) tbody.innerHTML = all.map(c => `<tr>
    <td><span class="badge ${(c.type||'').toLowerCase()==='delivery'?'bb':'bp'}">${escHtml(c.type||'')}</span></td>
    <td class="tdm">${escHtml(c.model||'—')}</td>
    <td><span class="mono">${escHtml(c.plate||'')}</span></td>
    <td style="font-size:11px;">${fmtD(c.scheduledDate||c.collection_date||c.date)}</td>
    <td style="font-size:11px;">${escHtml(c.address||c.addr||'—')}</td>
    <td>${escHtml(c.driver||'—')}</td>
    <td>${c.cost ? '£'+c.cost : '—'}</td>
    <td><span class="badge ${c.status==='Collected'||c.status==='Delivered'?'bg':c.status==='Booked'?'ba':'bb'}">${escHtml(c.status||'')}</span></td>
  </tr>`).join('') || '<tr><td colspan="8" style="text-align:center;color:var(--text3);padding:16px;">No entries</td></tr>';
}

export function addCollection() {
  const type    = document.getElementById('col-type')?.value;
  const plate   = document.getElementById('col-plate')?.value.trim().toUpperCase();
  const won     = document.getElementById('col-won')?.value;
  const date    = document.getElementById('col-date')?.value;
  const driver  = document.getElementById('col-driver')?.value;
  const link    = document.getElementById('col-link')?.value;
  const addr    = document.getElementById('col-addr')?.value;
  const cost    = parseFloat(document.getElementById('col-cost')?.value) || 0;
  const status  = document.getElementById('col-status')?.value;
  const notes   = document.getElementById('col-notes')?.value;

  const v = (state.stockData || []).find(v => v.plate?.toUpperCase() === plate);
  const entry = { id: 'c' + Date.now(), type, plate, model: v ? (v.make||'')+' '+(v.model||'') : '', dateWon: won, scheduledDate: date, driver, linkedPlates: link, address: addr, cost, status, notes };
  state.deliveries.push(entry);
  persistOpsState();
  closeM('addcollection');
  renderCollections();
  ['col-plate','col-won','col-date','col-driver','col-link','col-addr','col-cost','col-notes'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
}
