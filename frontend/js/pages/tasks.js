// ══════════════════════════════════════════════
// DealerOS — Tasks page
// ══════════════════════════════════════════════
import { state } from '../state.js';
import { fmtD, escHtml, dc } from '../utils.js';
import { closeM } from '../nav.js';

export function renderTasks() {
  const stock = state.stockData || [];

  // Not listed
  const nlEl = document.getElementById('tasks-nl');
  if (nlEl) {
    const notListed = stock.filter(v => !v.listedAutoTrader && !v.listedWebsite);
    nlEl.innerHTML = notListed.length
      ? notListed.map(v => `<div class="li">
          <div class="ldot" style="background:var(--red)"></div>
          <div class="lc">
            <div class="lt">${escHtml(v.make||'')} ${escHtml(v.model||'')}</div>
            <div class="lm">Not listed anywhere</div>
            <div class="lv">🚗 ${escHtml(v.plate||'')}</div>
          </div>
          <button class="btn btn-b btn-xs" onclick="openATFromStock('${escHtml(v.plate||'')}')">AT</button>
        </div>`).join('')
      : '<div style="color:var(--green);padding:10px;font-size:12px;">✓ All vehicles listed</div>';
  }

  // 45+ days
  const ageEl = document.getElementById('tasks-age');
  if (ageEl) {
    const old = stock.filter(v => {
      const days = v.daysInStock ?? (v.dateAcquired ? Math.floor((Date.now() - new Date(v.dateAcquired)) / 864e5) : 0);
      return days >= 45;
    });
    ageEl.innerHTML = old.length
      ? old.map(v => {
          const days = v.daysInStock ?? Math.floor((Date.now() - new Date(v.dateAcquired)) / 864e5);
          return `<div class="li">
            <div class="ldot" style="background:var(--amber)"></div>
            <div class="lc">
              <div class="lt">${escHtml(v.make||'')} ${escHtml(v.model||'')}</div>
              <div class="lm">In stock <span class="${dc(days)}">${days} days</span></div>
              <div class="lv">🚗 ${escHtml(v.plate||'')}</div>
            </div>
          </div>`;
        }).join('')
      : '<div style="color:var(--green);padding:10px;font-size:12px;">✓ All stock under 45 days</div>';
  }
}

export function addTask() {
  const t  = document.getElementById('t-title')?.value.trim();
  const pr = document.getElementById('t-pri')?.value;
  const dt = document.getElementById('t-date')?.value;
  if (!t) { alert('Enter a task.'); return; }

  const colour = pr === 'Urgent' ? 'var(--red)' : pr === 'High' ? 'var(--amber)' : 'var(--blue)';
  const badgeCls = pr === 'Urgent' ? 'br' : pr === 'High' ? 'ba' : 'bb';
  const ct = document.getElementById('custom-tasks');
  if (ct) {
    ct.innerHTML = `<div class="li">
      <div class="ldot" style="background:${colour}"></div>
      <div class="lc">
        <div class="lt">${escHtml(t)}</div>
        <div class="lm">${dt ? fmtD(dt) : 'No due date'} · ${pr}</div>
      </div>
      <span class="badge ${badgeCls}">${pr}</span>
    </div>` + ct.innerHTML;
  }

  closeM('addtask');
  ['t-title','t-date','t-notes'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
}
