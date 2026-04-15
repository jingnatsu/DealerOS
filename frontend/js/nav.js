// ══════════════════════════════════════════════
// DealerOS — Navigation, modals, search, badges
// ══════════════════════════════════════════════
import { state } from './state.js';

// Page-title map
const PAGE_TITLES = {
  dashboard: 'Dashboard', stock: 'Current Stock', sold: 'Sold History',
  collections: 'Collections & Deliveries', servicehistory: 'Service History',
  mot: 'MOT Tracker', insurance: 'Insurance & SORN', viewings: 'Viewings',
  sellcar: 'Sell a Car', tasks: 'Tasks', fines: 'Fines & Penalties',
  expenses: 'Finance Log', receipts: 'Receipts & AI Scan', banking: 'Routes & Planning',
  invoices: 'Investor Invoices', investors: 'Investor Ledger', wages: 'Staff & Wages',
  vat: 'VAT Tracker', reports: 'Reports & Analytics',
  autotrader: 'Auto Trader', instagram: 'Instagram',
};

// Called from inline onclick="nav('stock', this)"
export function nav(id, el) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.ni').forEach(n => n.classList.remove('active'));
  document.querySelectorAll('.mni').forEach(n => n.classList.remove('active'));

  const page = document.getElementById('page-' + id);
  if (page) page.classList.add('active');
  if (el) el.classList.add('active');

  const titleEl = document.getElementById('tb-title');
  if (titleEl) titleEl.textContent = PAGE_TITLES[id] || id;

  closeSB();

  // Trigger page render
  window.dispatchEvent(new CustomEvent('dealeros:nav', { detail: id }));
}

export function toggleSB() {
  document.getElementById('sidebar').classList.toggle('open');
  document.getElementById('soverlay').classList.toggle('open');
}
export function closeSB() {
  document.getElementById('sidebar')?.classList.remove('open');
  document.getElementById('soverlay')?.classList.remove('open');
}

export function openM(id) {
  document.getElementById('m-' + id)?.classList.add('open');
}
export function closeM(id) {
  document.getElementById('m-' + id)?.classList.remove('open');
}

export function updateNavBadges() {
  const outstanding = state.fines.filter(f => f.status !== 'Paid').length;
  const upcoming    = state.viewings.filter(v => v.status === 'Confirmed' || v.status === 'Pending').length;
  const pendingAT   = state.atListings.filter(l => l.status === 'draft' || l.status === 'needs_review').length;
  const pendingIG   = state.igPosts.filter(p => p.status === 'draft').length;
  const motSoon     = (state.stockData || []).filter(v => {
    if (!v.motExpiry) return false;
    const days = (new Date(v.motExpiry) - new Date()) / 864e5;
    return days >= 0 && days <= 90;
  }).length;

  const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  set('nb-stock',    (state.stockData || []).length);
  set('nb-mot',      motSoon);
  set('nb-viewings', upcoming);
  set('nb-fines',    outstanding);
  set('nb-at',       pendingAT);
  set('nb-ig',       pendingIG);
}
