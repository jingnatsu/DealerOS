// ══════════════════════════════════════════════
// DealerOS — Receipts & AI Scan page
// ══════════════════════════════════════════════
import { state, persistOpsState } from '../state.js';
import { fmt, fmtD, escHtml, normP, today } from '../utils.js';
import { closeM } from '../nav.js';

export function renderReceipts() {
  const receipts = state.receipts;
  const total = receipts.reduce((a, r) => a + (r.amount || 0), 0);

  const statsEl = document.getElementById('receipt-stats');
  if (statsEl) statsEl.innerHTML = `
    <div class="stat blue"><div class="sl">Total Receipts</div><div class="sv">${receipts.length}</div></div>
    <div class="stat amber"><div class="sl">Total Value</div><div class="sv" style="font-size:16px;">${fmt(total)}</div></div>
    <div class="stat green"><div class="sl">With Photo</div><div class="sv">${receipts.filter(r=>r.imgUrl).length}</div></div>
    <div class="stat purple"><div class="sl">AI Scanned</div><div class="sv">${receipts.filter(r=>r.aiScanned).length}</div></div>`;

  const grid = document.getElementById('receipts-grid');
  if (!grid) return;
  grid.innerHTML = receipts.map(r => `
    <div class="receipt-card">
      <div class="receipt-thumb">${r.imgUrl ? `<img src="${r.imgUrl}" alt="">` : '🧾'}</div>
      <div class="receipt-info">
        <div class="receipt-title">${escHtml(r.desc || r.notes || 'Receipt')}</div>
        <div class="receipt-meta">
          ${r.plate ? `🚗 ${escHtml(r.plate)} · ` : ''}${escHtml(r.cat || '')} · ${fmtD(r.date)}<br>
          <strong style="color:var(--amber);">${fmt(r.amount || 0)}</strong>
          ${r.aiScanned ? ' · <span style="color:var(--green);font-size:10px;">✨ AI Scanned</span>' : ''}
        </div>
      </div>
    </div>`).join('') || '<div style="color:var(--text3);text-align:center;padding:20px;">No receipts yet</div>';
}

export function handleReceiptFile(input) {
  if (!input.files[0]) return;
  state.receiptFile = input.files[0];
  const url = URL.createObjectURL(input.files[0]);
  const prev = document.getElementById('receipt-preview');
  const img  = document.getElementById('receipt-preview-img');
  if (prev) prev.style.display = 'block';
  if (img)  img.src = url;
}

export function handleModalReceiptFile(input) {
  if (!input.files[0]) return;
  state.modalReceiptFile = input.files[0];
  const url = URL.createObjectURL(input.files[0]);
  const prev = document.getElementById('modal-preview');
  const img  = document.getElementById('modal-preview-img');
  if (prev) prev.style.display = 'block';
  if (img)  img.src = url;
}

export async function processReceipt() {
  const plate  = document.getElementById('r-plate')?.value.trim().toUpperCase();
  const cat    = document.getElementById('r-cat')?.value;
  const notes  = document.getElementById('r-notes')?.value;
  const amount = parseFloat(document.getElementById('r-amount')?.value) || 0;
  const btn    = document.getElementById('receipt-btn');

  if (!state.receiptFile && !amount) { alert('Upload a receipt or enter an amount.'); return; }

  if (btn) { btn.textContent = '⏳ Processing…'; btn.disabled = true; }

  // Simulate AI processing delay
  await new Promise(r => setTimeout(r, 800));

  const imgUrl = state.receiptFile ? URL.createObjectURL(state.receiptFile) : null;
  const receipt = {
    id: 'r' + Date.now(), date: today(), plate, cat, notes,
    amount: amount || Math.round(Math.random() * 200 + 10), // demo: random if not entered
    imgUrl, aiScanned: !!state.receiptFile, desc: notes || cat
  };
  state.receipts.unshift(receipt);
  persistOpsState();

  // Also add to finance log
  state.finLog.unshift({
    id: receipt.id, date: receipt.date, plate: receipt.plate,
    model: '', desc: (receipt.cat || 'Receipt') + (receipt.notes ? ' · ' + receipt.notes : ''),
    cat: receipt.cat, amount: receipt.amount, direction: 'out'
  });

  if (btn) { btn.textContent = '✨ Process Receipt'; btn.disabled = false; }
  state.receiptFile = null;
  ['r-plate','r-notes','r-amount'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
  const prev = document.getElementById('receipt-preview');
  if (prev) prev.style.display = 'none';
  renderReceipts();
}

export function saveModalReceipt() {
  const plate  = document.getElementById('mr-plate')?.value.trim().toUpperCase();
  const cat    = document.getElementById('mr-cat')?.value;
  const amount = parseFloat(document.getElementById('mr-amount')?.value) || 0;
  const notes  = document.getElementById('mr-notes')?.value;
  if (!amount) { alert('Enter an amount.'); return; }

  const imgUrl = state.modalReceiptFile ? URL.createObjectURL(state.modalReceiptFile) : null;
  const receipt = { id: 'r' + Date.now(), date: today(), plate, cat, notes, amount, imgUrl, aiScanned: false, desc: notes || cat };
  state.receipts.unshift(receipt);
  state.finLog.unshift({ id: receipt.id, date: today(), plate, model: '', desc: (cat||'Receipt')+(notes?' · '+notes:''), cat, amount, direction: 'out' });
  persistOpsState();

  closeM('addreceipt');
  state.modalReceiptFile = null;
  ['mr-plate','mr-amount','mr-notes'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
  const prev = document.getElementById('modal-preview');
  if (prev) prev.style.display = 'none';
  renderReceipts();
}
