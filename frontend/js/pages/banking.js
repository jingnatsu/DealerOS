// ══════════════════════════════════════════════
// DealerOS — Routes & Planning (Banking) page
// ══════════════════════════════════════════════
import { state } from '../state.js';
import { fmt, fmtD, escHtml } from '../utils.js';

export function renderBanking() {
  const txs    = state.bankTxs;
  const filter = document.getElementById('tx-filter')?.value || '';
  let shown = txs;
  if (filter === 'unmatched') shown = txs.filter(t => !t.matched);
  if (filter === 'in')        shown = txs.filter(t => t.amount > 0);
  if (filter === 'out')       shown = txs.filter(t => t.amount < 0);

  const ins  = txs.filter(t => t.amount > 0).reduce((a, t) => a + t.amount, 0);
  const outs = txs.filter(t => t.amount < 0).reduce((a, t) => a + Math.abs(t.amount), 0);

  const accountsEl = document.getElementById('bank-accounts');
  if (accountsEl) accountsEl.innerHTML = `
    <div class="irow" style="padding:8px 0;"><span class="lbl">Current Account</span><span class="val" style="color:var(--green);">${fmt(ins - outs)}</span></div>
    <div class="irow" style="padding:8px 0;"><span class="lbl">Total In</span><span class="val">${fmt(ins)}</span></div>
    <div class="irow" style="padding:8px 0;"><span class="lbl">Total Out</span><span class="val" style="color:var(--red);">${fmt(outs)}</span></div>
    <div style="margin-top:10px;"><div class="alert alt-b" style="font-size:11px;">🏦 Connect Barclays Open Banking for live feed. Requires OAuth + FCA authorisation.</div></div>`;

  const reconEl = document.getElementById('recon-status');
  if (reconEl) {
    const matched   = txs.filter(t => t.matched).length;
    const unmatched = txs.filter(t => !t.matched).length;
    reconEl.innerHTML = `
      <div class="irow" style="padding:8px 0;"><span class="lbl">Matched</span><span class="val" style="color:var(--green);">${matched}</span></div>
      <div class="irow" style="padding:8px 0;"><span class="lbl">Unmatched</span><span class="val" style="color:var(--amber);">${unmatched}</span></div>`;
  }

  const txsEl = document.getElementById('bank-txs');
  if (txsEl) txsEl.innerHTML = shown.map(t => {
    const icon = t.amount > 0 ? '💰' : '💸';
    const col  = t.amount > 0 ? 'var(--green)' : 'var(--red)';
    return `<div class="bank-tx">
      <div class="bank-icon" style="background:var(--s3);">${icon}</div>
      <div style="flex:1;">
        <div class="bank-desc">${escHtml(t.desc || '')}</div>
        <div class="bank-date">${fmtD(t.date)} ${t.ref ? '· ' + escHtml(t.ref) : ''}</div>
      </div>
      ${!t.matched ? `<button class="btn btn-g btn-xs" onclick="allocateTx('${escHtml(t.id)}')">Match</button>` : '<span class="badge bg" style="font-size:9px;">✓</span>'}
      <div class="bank-amt" style="color:${col};">${t.amount > 0 ? '+' : ''}${fmt(t.amount)}</div>
    </div>`;
  }).join('') || '<div style="color:var(--text3);padding:16px;text-align:center;">No transactions</div>';

  // Investor payout
  const payoutsEl = document.getElementById('investor-payouts');
  if (payoutsEl) {
    const investors = state.investors || [];
    payoutsEl.innerHTML = investors.length
      ? investors.map(inv => `<div class="irow" style="padding:7px 0;">
          <span class="lbl">${escHtml(inv.name || '')}</span>
          <span class="val">${fmt(inv.totalProfit || inv.total_profit || 0)}</span>
          <button class="btn btn-g btn-xs" style="margin-left:8px;" onclick="initiatePayment('${escHtml(inv.name||'')}',${inv.totalProfit||0})">Pay</button>
        </div>`).join('')
      : '<div style="color:var(--text3);font-size:12px;">No investors</div>';
  }
}

export function connectBarclays() {
  alert('🏦 Barclays Open Banking\n\nTo connect a live bank feed:\n1. Register at developer.barclays.com\n2. Implement OAuth consent flow\n3. Use the Account Information API\n\nThis requires FCA authorisation as a registered AISP.');
}

export function allocateTx(id) {
  const t = state.bankTxs.find(t => t.id === id);
  if (t) { t.matched = true; renderBanking(); }
}

export function initiatePayment(name, amount) {
  alert(`💳 Payment Initiation\n\nRecipient: ${name}\nAmount: ${fmt(amount)}\n\nTo enable real payments, implement the Barclays Payment Initiation Service API.\nRequires FCA authorisation and Barclays consent flows.\n\ndeveloper.barclays.com`);
}
