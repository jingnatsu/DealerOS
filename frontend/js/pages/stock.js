// ══════════════════════════════════════════════
// DealerOS — Current Stock page
// ══════════════════════════════════════════════
import { state, persistOpsState } from '../state.js';
import { fmt, fmtD, dc, escHtml, escJs, normP, dlCSV, today } from '../utils.js';
import { api } from '../api.js';
import { openM, closeM } from '../nav.js';

export function filterStock(f, el) {
  state.stockFilter = f;
  document.querySelectorAll('#page-stock .tabs .tab').forEach(t => t.classList.remove('active'));
  if (el) el.classList.add('active');
  renderStock();
}

export function renderStock() {
  const all = state.stockData || [];
  const f   = state.stockFilter;

  let rows = all;
  if (f === 'website')    rows = all.filter(v => v.listedWebsite);
  if (f === 'autotrader') rows = all.filter(v => v.listedAutoTrader);
  if (f === 'needs')      rows = all.filter(v => !v.prepComplete);
  if (f === 'ready')      rows = all.filter(v => v.prepComplete);

  const countEl = document.getElementById('stock-count');
  if (countEl) countEl.textContent = `(${rows.length})`;

  const tbody = document.getElementById('stock-tbody');
  if (!tbody) return;

  tbody.innerHTML = rows.map(v => {
    const days = v.daysInStock != null ? v.daysInStock : (v.dateAcquired ? Math.floor((Date.now() - new Date(v.dateAcquired)) / 864e5) : '—');
    const dClass = typeof days === 'number' ? dc(days) : '';
    const statusBadge = v.status === 'RESERVED'
      ? '<span class="badge ba">Reserved</span>'
      : v.status === 'SOR' ? '<span class="badge bb">SOR</span>'
      : '<span class="badge bg">Stock</span>';
    const atBadge = v.listedAutoTrader
      ? '<span class="badge bb" style="font-size:9px;">AT✓</span>'
      : '<span class="badge bk" style="font-size:9px;">AT✗</span>';
    const webBadge = v.listedWebsite
      ? '<span class="badge bg" style="font-size:9px;">Web✓</span>'
      : '<span class="badge bk" style="font-size:9px;">Web✗</span>';
    const safeP = escJs(v.plate || v.stockId || '');
    return `<tr>
      <td><div class="tdm">${escHtml(v.make || '')} ${escHtml(v.model || '')}</div><div style="font-size:10px;color:var(--text3);">${escHtml(v.year || '')} · ${escHtml(v.colour || '')}</div></td>
      <td><span class="mono">${escHtml(v.plate || '')}</span></td>
      <td>${escHtml(v.source || '—')}</td>
      <td>${escHtml(v.investor || 'SA')}</td>
      <td class="mono">${fmt(v.totalCost || v.total_cost || 0)}</td>
      <td><span class="${dClass}">${days}d</span></td>
      <td>${webBadge}</td>
      <td>${atBadge}</td>
      <td style="font-size:11px;color:var(--amber);">${escHtml(v.prepNotes || v.todo?.join(', ') || '—')}</td>
      <td>
        <div style="display:flex;gap:4px;flex-wrap:wrap;">
          <button class="btn btn-g btn-xs" onclick="openStockBreakdown('${safeP}')">Detail</button>
          <button class="btn btn-amber btn-xs" onclick="prefillExp('${safeP}','${escJs(v.model||'')}')">💸 Cost</button>
          <button class="btn btn-p btn-xs" onclick="quickSell('${safeP}')">🔑 Sell</button>
          <button class="btn btn-b btn-xs" onclick="openATFromStock('${safeP}')">AT</button>
          <button class="btn btn-amber btn-xs" onclick="openMediaManager('${safeP}','${escJs((v.make||'')+' '+(v.model||''))}')">📷</button>
        </div>
      </td>
    </tr>`;
  }).join('') || '<tr><td colspan="10" style="text-align:center;color:var(--text3);padding:20px;">No stock</td></tr>';
}

export function openStockBreakdown(plate) {
  const v = (state.stockData || []).find(x => normP(x.plate) === normP(plate))
         || (state.soldData  || []).find(x => normP(x.plate) === normP(plate));
  if (!v) return;
  alert(`${v.make || ''} ${v.model || ''}\n${v.plate || ''}\n\nSource: ${v.source || '—'}\nInvestor: ${v.investor || 'SA'}\nDate acquired: ${fmtD(v.dateAcquired || v.date_acquired)}\nPurchase: ${fmt(v.purchasePrice || v.purchase_price || 0)}\nRecon: ${fmt(v.reconCost || v.recon_cost || 0)}\nTotal cost: ${fmt(v.totalCost || v.total_cost || 0)}\n\nStatus: ${v.status || 'In Stock'}`);
}

export async function addVehicle() {
  const plate = document.getElementById('nv-plate')?.value.trim().toUpperCase();
  const modelRaw = document.getElementById('nv-model')?.value.trim();
  const price = parseFloat(document.getElementById('nv-price')?.value) || 0;
  const source = document.getElementById('nv-source')?.value;
  const investor = document.getElementById('nv-investor')?.value;
  const recon = parseFloat(document.getElementById('nv-recon')?.value) || 0;
  const notes = document.getElementById('nv-notes')?.value;

  if (!plate) { alert('Enter a reg plate.'); return; }

  // Parse "Make Model" from single field
  const parts = modelRaw.split(' ');
  const make  = parts[0] || '';
  const model = parts.slice(1).join(' ') || modelRaw;

  try {
    const saved = await api.addVehicle({ plate, make, model, purchasePrice: price, reconCost: recon, source, investor, notes, status: 'STOCK' });
    state.stockData.push(saved);
    closeM('addvehicle');
    ['nv-plate','nv-model','nv-price','nv-recon','nv-notes'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
    renderStock();
    import('../nav.js').then(m => m.updateNavBadges());
  } catch (e) {
    alert('Error: ' + e.message);
  }
}

export function exportStock() {
  const rows = [['Plate','Model','Investor','Total Cost','Days','Status','Notes']];
  (state.stockData || []).forEach(v => rows.push([
    v.plate || '', (v.make||'')+' '+(v.model||''), v.investor || '', v.totalCost || 0,
    v.daysInStock || '', v.status || '', v.notes || ''
  ]));
  dlCSV(rows, 'stock.csv');
}
