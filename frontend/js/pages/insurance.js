// ══════════════════════════════════════════════
// DealerOS — Insurance & SORN page
// ══════════════════════════════════════════════
import { state } from '../state.js';
import { fmtD, escHtml } from '../utils.js';

export function renderInsurance() {
  const filter = document.getElementById('ins-filter')?.value || 'current';
  let vehicles = state.stockData || [];
  if (filter === 'sold') vehicles = state.soldData || [];
  if (filter === 'all')  vehicles = [...(state.stockData||[]), ...(state.soldData||[])];

  const tbody = document.getElementById('ins-tbody');
  if (!tbody) return;
  tbody.innerHTML = vehicles.map(v => `<tr>
    <td class="tdm">${escHtml(v.make||'')} ${escHtml(v.model||'')}</td>
    <td><span class="mono">${escHtml(v.plate||'')}</span></td>
    <td style="font-size:11px;">${fmtD(v.lastInsuranceCheck || v.last_insurance_check)}</td>
    <td>
      ${v.insuranceStatus === 'Insured'
        ? '<span class="badge bg">Insured</span>'
        : v.insuranceStatus === 'SORN'
        ? '<span class="badge ba">SORN</span>'
        : '<span class="badge bk">Unknown</span>'}
    </td>
    <td style="font-size:11px;color:var(--text3);">—</td>
    <td><button class="btn btn-b btn-xs" onclick="checkIns('${escHtml(v.plate||'')}')">Check</button></td>
  </tr>`).join('') || '<tr><td colspan="6" style="text-align:center;color:var(--text3);padding:16px;">No vehicles</td></tr>';
}

export function checkInsurance() {
  const plate = document.getElementById('ins-plate')?.value.trim().toUpperCase();
  if (!plate) { alert('Enter a reg plate.'); return; }
  const resultEl = document.getElementById('ins-result');
  if (resultEl) {
    resultEl.innerHTML = `<div class="alert alt-b">
      🔍 Checking <strong>${plate}</strong> via MIB Navigate portal…<br>
      <small>For live checks, use the MIB portal at <a href="https://enquiry.navigate.mib.org.uk/checkyourvehicle" target="_blank" style="color:var(--blue2);">enquiry.navigate.mib.org.uk</a>. Direct API access requires MIB partner agreement.</small>
    </div>`;
  }
}

export function checkIns(plate) {
  const el = document.getElementById('ins-plate');
  if (el) el.value = plate;
  checkInsurance();
}
