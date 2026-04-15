// ══════════════════════════════════════════════
// DealerOS — Sell a Car page + Invoice generation
// ══════════════════════════════════════════════
import { state } from '../state.js';
import { fmt, fmtD, fmtDL, escHtml, normP, today } from '../utils.js';
import { api } from '../api.js';
import { LOGO } from '../logo.js';

export function searchReg(val) {
  const plate = val.trim().toUpperCase();
  const v = (state.stockData || []).find(x => normP(x.plate) === normP(plate));
  const resultEl = document.getElementById('reg-result');
  const formEl   = document.getElementById('sell-form');
  const outEl    = document.getElementById('invoice-output');
  if (outEl) outEl.style.display = 'none';

  if (!v) {
    if (resultEl) resultEl.style.display = 'none';
    if (formEl)   formEl.style.display   = 'none';
    return;
  }

  state.currentVehicle = v;
  const days = v.daysInStock ?? (v.dateAcquired ? Math.floor((Date.now() - new Date(v.dateAcquired)) / 864e5) : '—');

  if (resultEl) {
    resultEl.style.display = 'block';
    const rModel    = document.getElementById('rr-model');
    const rPlate    = document.getElementById('rr-plate');
    const rCost     = document.getElementById('rr-cost');
    const rInvestor = document.getElementById('rr-investor');
    const rSource   = document.getElementById('rr-source');
    const rDays     = document.getElementById('rr-days');
    if (rModel)    rModel.textContent    = `${v.make||''} ${v.model||''}`;
    if (rPlate)    rPlate.textContent    = v.plate || '';
    if (rCost)     rCost.textContent     = fmt(v.totalCost || v.total_cost || 0);
    if (rInvestor) rInvestor.textContent = v.investor || 'SA';
    if (rSource)   rSource.textContent   = v.source   || '—';
    if (rDays)     rDays.textContent     = days + 'd';

    // Cost breakdown
    const costsEl = document.getElementById('rr-costs');
    if (costsEl) costsEl.innerHTML = `
      <div style="display:flex;gap:16px;font-size:11.5px;">
        <span>Purchase: <strong>${fmt(v.purchasePrice||v.purchase_price||0)}</strong></span>
        <span>Recon: <strong>${fmt(v.reconCost||v.recon_cost||0)}</strong></span>
        <span>Other: <strong>${fmt(v.additionalCosts||v.additional_costs||0)}</strong></span>
      </div>`;
  }

  if (formEl) {
    formEl.style.display = 'block';
    // Pre-fill investor & share
    const invEl   = document.getElementById('sell-investor');
    const shareEl = document.getElementById('sell-share');
    if (invEl   && v.investor)       invEl.value   = v.investor;
    if (shareEl && v.investorSharePct) shareEl.value = String(v.investorSharePct);
    // Pre-fill date
    const dateEl = document.getElementById('sell-date');
    if (dateEl) dateEl.value = today();
  }
  updateCalc();
}

export function updateCalc() {
  const v      = state.currentVehicle;
  if (!v) return;
  const price  = parseFloat(document.getElementById('sell-price')?.value) || 0;
  const sharePct = parseInt(document.getElementById('sell-share')?.value) || 0;
  const cost   = v.totalCost || v.total_cost || 0;
  const profit = price - cost;
  const invAmt = profit * sharePct / 100;

  const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  set('c-sale',   price  > 0 ? fmt(price)  : '—');
  set('c-cost',   fmt(cost));
  set('c-profit', price  > 0 ? fmt(profit) : '—');
  set('c-inv',    price  > 0 ? fmt(invAmt) : '—');
  set('c-pct',    sharePct);
  const profitEl = document.getElementById('c-profit');
  if (profitEl) profitEl.style.color = profit >= 0 ? 'var(--green)' : 'var(--red)';
}

export async function generateInvoice() {
  const v = state.currentVehicle;
  if (!v) { alert('Find a vehicle first.'); return; }
  const salePrice  = parseFloat(document.getElementById('sell-price')?.value) || 0;
  const investor   = document.getElementById('sell-investor')?.value || v.investor || '';
  const sharePct   = parseInt(document.getElementById('sell-share')?.value) || 0;
  const saleDate   = document.getElementById('sell-date')?.value || today();
  const customer   = document.getElementById('sell-customer')?.value || '';
  const payment    = document.getElementById('sell-payment')?.value || '';
  const warranty   = document.getElementById('sell-warranty')?.value || '';
  if (!salePrice)  { alert('Enter a sale price.'); return; }

  try {
    const inv = await api.sellVehicle({ stockId: v.stockId || v.stock_id, salePrice, investor, investorSharePct: sharePct, saleDate, customerName: customer, paymentMethod: payment, warranty });

    // Remove from stock, add to sold
    state.stockData = state.stockData.filter(x => normP(x.plate) !== normP(v.plate));
    state.soldData.unshift({ ...v, soldPrice: salePrice, grossProfit: inv.grossProfit, investorProfit: inv.investorAmount, saProfit: inv.saAmount, dateSold: saleDate, status: 'SOLD' });

    const html = buildInvoiceHTML(inv, v, salePrice, saleDate, customer, payment, warranty);
    state.savedInvoices.unshift({ invoiceNumber: inv.invoiceNumber, plate: v.plate, html, date: saleDate });

    const renderEl = document.getElementById('invoice-render');
    if (renderEl) renderEl.innerHTML = html;
    const outEl = document.getElementById('invoice-output');
    if (outEl) { outEl.style.display = 'block'; outEl.scrollIntoView({ behavior: 'smooth' }); }

    import('../nav.js').then(m => m.updateNavBadges());
    import('./stock.js').then(m => m.renderStock());
  } catch (e) {
    alert('Error: ' + e.message);
  }
}

function buildInvoiceHTML(inv, v, salePrice, saleDate, customer, payment, warranty) {
  const cost   = inv.totalCost || 0;
  const profit = inv.grossProfit || 0;
  const invAmt = inv.investorAmount || 0;
  const saAmt  = inv.saAmount || 0;
  return `<div class="inv-wrap">
    <div class="inv-top">
      <div>
        <img src="${LOGO}" class="inv-logo-img" alt="SA Motors">
        <div class="inv-addr-text">SA Motors (London) · 64 Nile Street, London N1 7SR<br>07440 603950 · sa-motors.co.uk</div>
      </div>
      <div class="inv-meta-block">
        <div class="inv-big-title">INVOICE</div>
        <div><strong>${inv.invoiceNumber || ''}</strong></div>
        <div>Invoice Date: ${fmtDL(saleDate)}</div>
        <div>Sale Date: ${fmtDL(saleDate)}</div>
      </div>
    </div>
    <table class="inv-table">
      <thead><tr><th>Description</th><th>Detail</th></tr></thead>
      <tbody>
        <tr><td>Vehicle</td><td>${escHtml(v.make||'')} ${escHtml(v.model||'')} (${escHtml(String(v.year||''))})</td></tr>
        <tr><td>Reg Plate</td><td>${escHtml(v.plate||'')}</td></tr>
        <tr><td>Colour</td><td>${escHtml(v.colour||'—')}</td></tr>
        <tr><td>Mileage</td><td>${v.mileage ? Number(v.mileage).toLocaleString()+' miles' : '—'}</td></tr>
        <tr><td>Customer</td><td>${escHtml(customer||'—')}</td></tr>
        <tr><td>Payment Method</td><td>${escHtml(payment||'—')}</td></tr>
        <tr><td>Warranty</td><td>${escHtml(warranty||'—')}</td></tr>
      </tbody>
    </table>
    <table class="inv-table">
      <thead><tr><th>Financials</th><th>Amount</th></tr></thead>
      <tbody>
        <tr><td>Purchase Price</td><td>${fmt(v.purchasePrice||v.purchase_price||0)}</td></tr>
        <tr><td>Reconditioning</td><td>${fmt(v.reconCost||v.recon_cost||0)}</td></tr>
        <tr><td>Additional Costs</td><td>${fmt(v.additionalCosts||v.additional_costs||0)}</td></tr>
        <tr class="row-total"><td>Total Cost In</td><td>${fmt(cost)}</td></tr>
        <tr><td>Sale Price</td><td>${fmt(salePrice)}</td></tr>
        <tr class="row-profit"><td>Gross Profit</td><td>${fmt(profit)}</td></tr>
        <tr class="row-investor"><td>Investor Share (${escHtml(inv.investorName||'')} — ${inv.investorSharePct||0}%)</td><td>${fmt(invAmt)}</td></tr>
        <tr class="row-total"><td>SA Motors Share</td><td>${fmt(saAmt)}</td></tr>
      </tbody>
    </table>
    <div class="inv-footer">SA Motors London · 64 Nile Street, London N1 7SR · 07440 603950 · sa-motors.co.uk<br>Thank you for your business. This invoice is valid for accounting purposes.</div>
  </div>`;
}

export function printInv() {
  const html = document.getElementById('invoice-render')?.innerHTML;
  if (!html) return;
  const w = window.open('', '_blank');
  w.document.write(`<!DOCTYPE html><html><head><title>SA Motors Invoice</title>
    <style>body{font-family:Arial,sans-serif;margin:20px;}.inv-wrap{max-width:800px;margin:0 auto;font-size:12px;color:#111;line-height:1.5;}.inv-top{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:22px;}.inv-logo-img{height:62px;object-fit:contain;}.inv-big-title{font-size:38px;font-weight:200;color:#333;letter-spacing:3px;margin-bottom:6px;}.inv-addr-text{font-size:10.5px;color:#444;line-height:1.8;margin-top:6px;}.inv-meta-block{text-align:right;font-size:11.5px;line-height:2;}.inv-table{width:100%;border-collapse:collapse;margin-bottom:13px;}th{background:#f0f0f0;padding:8px 11px;font-size:10.5px;font-weight:700;text-transform:uppercase;border:1px solid #ccc;text-align:left;}td{padding:7px 11px;border:1px solid #ddd;font-size:11.5px;}.row-total td{background:#e8e8e8;font-weight:800;}.row-profit td{background:#111;color:#fff;font-weight:800;font-size:13px;}.row-investor td{background:#1a3a1a;color:#4ade80;font-weight:800;}.inv-footer{text-align:center;font-size:10px;color:#888;margin-top:14px;border-top:1px solid #ddd;padding-top:11px;line-height:1.8;}@media print{body{margin:0;}}</style>
    </head><body>${html}</body></html>`);
  w.document.close();
  setTimeout(() => w.print(), 500);
}

export function renderInvoiceList() {
  const el = document.getElementById('inv-list');
  if (!el) return;
  if (!state.savedInvoices.length) {
    el.innerHTML = '<div style="color:var(--text3);font-size:13px;text-align:center;padding:22px;">No invoices yet — use <strong>Sell a Car</strong> to generate your first one.</div>';
    return;
  }
  el.innerHTML = state.savedInvoices.map((inv, i) => `
    <div style="display:flex;align-items:center;gap:11px;padding:10px 11px;border-bottom:1px solid var(--border);">
      <div style="flex:1;">
        <div style="font-size:13px;font-weight:700;">${escHtml(inv.invoiceNumber || '')}</div>
        <div style="font-size:11px;color:var(--text3);">${escHtml(inv.plate || '')} · ${fmtD(inv.date)}</div>
      </div>
      <button class="btn btn-g btn-sm" onclick="reView(${i})">View</button>
      <button class="btn btn-g btn-sm" onclick="rePrint(${i})">🖨️ Print</button>
    </div>`).join('');
}

export function reView(i) {
  import('../nav.js').then(m => m.nav('sellcar', document.querySelector('[onclick*=sellcar]')));
  setTimeout(() => {
    const renderEl = document.getElementById('invoice-render');
    if (renderEl && state.savedInvoices[i]) renderEl.innerHTML = state.savedInvoices[i].html;
    const outEl = document.getElementById('invoice-output');
    if (outEl) { outEl.style.display = 'block'; outEl.scrollIntoView({ behavior: 'smooth' }); }
  }, 120);
}

export function rePrint(i) {
  const inv = state.savedInvoices[i];
  if (!inv) return;
  const w = window.open('', '_blank');
  w.document.write(`<!DOCTYPE html><html><head><title>SA Motors Invoice</title>
    <style>body{font-family:Arial,sans-serif;margin:20px;}.inv-wrap{max-width:800px;margin:0 auto;}</style>
    </head><body>${inv.html}</body></html>`);
  w.document.close();
  setTimeout(() => w.print(), 500);
}

export function prefillSell(plate) {
  import('../nav.js').then(m => m.nav('sellcar', document.querySelector('[onclick*=sellcar]')));
  setTimeout(() => {
    const el = document.getElementById('sell-reg');
    if (el) { el.value = plate; searchReg(plate); }
  }, 120);
}
export function quickSell(plate) { prefillSell(plate); }
