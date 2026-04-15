// ══════════════════════════════════════════════
// DealerOS — MOT Tracker page
// ══════════════════════════════════════════════
import { state } from '../state.js';
import { fmtD, escHtml, normP } from '../utils.js';

export function renderMOT() {
  const filter = document.getElementById('mot-filter')?.value || 'current';
  let vehicles = state.stockData || [];
  if (filter === 'sold')    vehicles = state.soldData || [];
  if (filter === 'all')     vehicles = [...(state.stockData||[]), ...(state.soldData||[])];

  const now = new Date();

  // Alerts
  const expiring = vehicles.filter(v => {
    if (!v.motExpiry) return false;
    const days = (new Date(v.motExpiry) - now) / 864e5;
    return days >= 0 && days <= 90;
  });
  const expired = vehicles.filter(v => v.motExpiry && new Date(v.motExpiry) < now);

  const alertsEl = document.getElementById('mot-alerts');
  if (alertsEl) {
    alertsEl.innerHTML =
      (expired.length  ? `<div class="alert alt-r">🚨 ${expired.length} vehicle${expired.length>1?'s':''} with expired MOT</div>` : '') +
      (expiring.length ? `<div class="alert alt-a">⚠️ ${expiring.length} vehicle${expiring.length>1?'s':''} MOT expiring within 90 days</div>` : '');
  }

  const grid = document.getElementById('mot-grid');
  if (!grid) return;

  grid.innerHTML = vehicles.map(v => {
    const expiry = v.motExpiry ? new Date(v.motExpiry) : null;
    const days   = expiry ? Math.floor((expiry - now) / 864e5) : null;
    const colour = days === null ? 'var(--text3)' : days < 0 ? 'var(--red)' : days < 30 ? 'var(--red)' : days < 90 ? 'var(--amber)' : 'var(--green)';
    const barPct = days === null ? 0 : Math.min(100, Math.max(0, Math.round(days / 365 * 100)));
    const safeP  = encodeURIComponent(v.plate || '');
    return `<div class="mot-card">
      <div class="mot-plate">${escHtml(v.plate||'')}</div>
      <div class="mot-model">${escHtml(v.make||'')} ${escHtml(v.model||'')}</div>
      <div class="mot-expiry" style="color:${colour};">${expiry ? fmtD(v.motExpiry) : '—'}</div>
      ${days !== null ? `<div style="font-size:10.5px;color:${colour};margin-top:3px;">${days < 0 ? 'EXPIRED' : days+'d remaining'}</div>` : ''}
      <div class="mot-bar"><div style="height:100%;width:${barPct}%;background:${colour};border-radius:3px;"></div></div>
      <button class="btn btn-g btn-xs" style="margin-top:8px;width:100%;" onclick="checkDVSA('${escHtml(v.plate||'')}')">🔍 DVSA Check</button>
    </div>`;
  }).join('') || '<div style="color:var(--text3);padding:20px;">No vehicles</div>';
}

export function checkDVSA(plate) {
  window.open('https://www.gov.uk/check-mot-history?registration=' + encodeURIComponent(plate), '_blank');
}
export function checkAllMOT() {
  window.open('https://www.gov.uk/check-mot-history', '_blank');
  alert('DVSA MOT history opens for each vehicle. To auto-populate via API, register at documentation.history.mot.api.dvsa.gov.uk for your free trade API key.');
}
