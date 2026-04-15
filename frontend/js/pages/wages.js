// ══════════════════════════════════════════════
// DealerOS — Staff & Wages page
// ══════════════════════════════════════════════
import { state, persistOpsState } from '../state.js';
import { fmt, fmtD, escHtml, today } from '../utils.js';
import { openM, closeM } from '../nav.js';

export function renderWages() {
  const staff = state.staff;
  const payments = state.wagePayments;
  const totalOwed = staff.reduce((a, s) => a + (s.owed || 0), 0);
  const totalPaid = staff.reduce((a, s) => a + (s.paid || 0), 0);

  const statsEl = document.getElementById('wage-stats');
  if (statsEl) statsEl.innerHTML = `
    <div class="stat amber"><div class="sl">Total Owed</div><div class="sv">${fmt(totalOwed)}</div></div>
    <div class="stat green"><div class="sl">Total Paid</div><div class="sv">${fmt(totalPaid)}</div></div>
    <div class="stat blue"><div class="sl">Staff</div><div class="sv">${staff.length}</div></div>
    <div class="stat purple"><div class="sl">Payments</div><div class="sv">${payments.length}</div></div>`;

  const gridEl = document.getElementById('staff-grid');
  if (gridEl) gridEl.innerHTML = staff.map((s, i) => `
    <div class="wage-card">
      <div class="wage-name">${escHtml(s.name || '')}</div>
      <div style="font-size:11px;color:var(--text3);margin-bottom:8px;">${escHtml(s.role || '')} · ${escHtml(s.payType || '')} · ${fmt(s.rate || 0)}</div>
      <div class="irow"><span class="lbl">Owed</span><span class="val" style="color:var(--amber);">${fmt(s.owed || 0)}</span></div>
      <div class="irow"><span class="lbl">Paid Total</span><span class="val">${fmt(s.paid || 0)}</span></div>
      <div style="display:flex;gap:5px;margin-top:8px;">
        <button class="btn btn-p btn-xs" onclick="openPayModal(${i})">Pay</button>
        <button class="btn btn-g btn-xs" onclick="addOwed(${i})">+ Owed</button>
      </div>
    </div>`).join('') || '<div style="color:var(--text3);padding:16px;">No staff added</div>';

  // Populate staff select in pay modal
  const sel = document.getElementById('wp-staff');
  if (sel) sel.innerHTML = staff.map(s => `<option>${escHtml(s.name)}</option>`).join('');

  const tbody = document.getElementById('wage-tbody');
  if (tbody) tbody.innerHTML = [...payments].reverse().map(p => `<tr>
    <td class="tdm">${escHtml(p.name || '')}</td>
    <td style="font-size:11px;">${fmtD(p.date)}</td>
    <td class="mono" style="color:var(--green);">${fmt(p.amount || 0)}</td>
    <td style="font-size:11px;">${escHtml(p.period || '—')}</td>
    <td style="font-size:11px;">${escHtml(p.method || '—')}</td>
    <td style="font-size:11px;color:var(--text3);">${escHtml(p.notes || '')}</td>
  </tr>`).join('') || '<tr><td colspan="6" style="text-align:center;color:var(--text3);padding:16px;">No payments</td></tr>';
}

export function addStaff() {
  const name    = document.getElementById('st-name')?.value.trim();
  const role    = document.getElementById('st-role')?.value;
  const payType = document.getElementById('st-paytype')?.value;
  const rate    = parseFloat(document.getElementById('st-rate')?.value) || 0;
  const phone   = document.getElementById('st-phone')?.value;
  if (!name) { alert('Enter a name.'); return; }
  state.staff.push({ id: 's' + Date.now(), name, role, payType, rate, phone, owed: 0, paid: 0, linkedPlate: '' });
  persistOpsState();
  closeM('addstaff');
  ['st-name','st-role','st-rate','st-phone'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
  renderWages();
}

export function openPayModal(i) {
  const sel = document.getElementById('wp-staff');
  if (sel) sel.selectedIndex = i;
  const dateEl = document.getElementById('wp-date');
  if (dateEl) dateEl.value = today();
  openM('logpayment');
}

export function addOwed(i) {
  const a = parseFloat(prompt(`Amount owed to ${state.staff[i]?.name} (£):`));
  if (a > 0) { state.staff[i].owed = (state.staff[i].owed || 0) + a; persistOpsState(); renderWages(); }
}

export function logPayment() {
  const name   = document.getElementById('wp-staff')?.value;
  const amount = parseFloat(document.getElementById('wp-amount')?.value) || 0;
  const date   = document.getElementById('wp-date')?.value || today();
  const period = document.getElementById('wp-period')?.value;
  const method = document.getElementById('wp-method')?.value;
  if (!amount) { alert('Enter an amount.'); return; }
  const s = state.staff.find(st => st.name === name);
  if (s) { s.owed = Math.max(0, (s.owed || 0) - amount); s.paid = (s.paid || 0) + amount; }
  state.wagePayments.unshift({ name, amount, date, period, method, notes: '' });
  persistOpsState();
  closeM('logpayment');
  ['wp-amount','wp-period'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
  renderWages();
}
