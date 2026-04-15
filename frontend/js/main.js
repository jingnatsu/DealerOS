// ══════════════════════════════════════════════
// DealerOS — Entry point
// ══════════════════════════════════════════════
import { state, saveToStorage, loadFromStorage, persistOpsState } from './state.js';
import { normP, today, mLabel, setInner, setText } from './utils.js';
import { nav, toggleSB, closeSB, openM, closeM, updateNavBadges } from './nav.js';
import { LOGO } from './logo.js';
import { APP_DATA } from './app-data.js';
import { api } from './api.js';

// ── Page modules ─────────────────────────────
import { renderDashboard }                                      from './pages/dashboard.js';
import { filterStock, renderStock, openStockBreakdown,
         addVehicle, exportStock }                             from './pages/stock.js';
import { renderSold, showSoldBreakdown, exportSold }           from './pages/sold.js';
import { renderCollections, addCollection }                    from './pages/collections.js';
import { renderServiceHistory, addService,
         printServiceInvoice }                                 from './pages/servicehistory.js';
import { renderMOT, checkDVSA, checkAllMOT }                  from './pages/mot.js';
import { renderInsurance, checkInsurance, checkIns }          from './pages/insurance.js';
import { renderViewings, updateViewingStatus, renderCal,
         calPrev, calNext, calDayClick, addViewing }          from './pages/viewings.js';
import { searchReg, updateCalc, generateInvoice, printInv,
         renderInvoiceList, reView, rePrint,
         prefillSell, quickSell }                             from './pages/sellcar.js';
import { renderTasks, addTask }                               from './pages/tasks.js';
import { renderFines, addFine, markFinePaid,
         appealFine }                                         from './pages/fines.js';
import { renderFinance, quickLog, logExpModal,
         delExp, prefillExp, exportFinance }                  from './pages/finance.js';
import { renderReceipts, handleReceiptFile,
         handleModalReceiptFile, processReceipt,
         saveModalReceipt }                                   from './pages/receipts.js';
import { renderBanking, connectBarclays,
         allocateTx, initiatePayment }                        from './pages/banking.js';
import { renderInvestors, editInvestorBudget }                from './pages/investors.js';
import { renderWages, addStaff as addStaffMember,
         openPayModal, addOwed, logPayment }                  from './pages/wages.js';
import { renderVAT }                                          from './pages/vat.js';
import { renderReports }                                      from './pages/reports.js';
import { filterAT, renderAutoTrader, createATListing,
         openATFromStock, openATEdit, showATStep,
         saveATDetails, saveATDesc, atApproveDesc,
         atRegenDesc, toggleSpecConfirmed, saveATSpec,
         addCustomSpec, markATReady,
         publishATListingFromModal, publishATListing,
         atUploadPhotos, takeDownATListing, connectAutoTrader,
         saveATSettings, populateATNewSelect }               from './pages/autotrader.js';
import { filterIG, renderInstagram, igSelectVehicle,
         igGenCaption, igUseATDesc, saveIGDraft,
         postToInstagram, openIGFromStock, editIGPost,
         publishIGPost, deleteIGPost, saveIGSettings,
         connectInstagram, populateIGNewSelect }             from './pages/instagram.js';
import { openMediaManager, refreshMediaModal,
         handleMediaUpload, handleATPhotoUpload,
         setCoverPhoto, setPhotoTag, deletePhoto,
         autoOrderPhotos, dragPhotoStart,
         dragPhotoDrop }                                     from './media.js';

// ══════════════════════════════════════════════
// Expose all functions to window (inline onclick)
// ══════════════════════════════════════════════
Object.assign(window, {
  // nav
  nav, toggleSB, closeSB, openM, closeM,

  // pages
  renderDashboard,
  filterStock, renderStock, openStockBreakdown, addVehicle, exportStock,
  renderSold, showSoldBreakdown, exportSold,
  renderCollections, addCollection,
  renderServiceHistory, addService, printServiceInvoice,
  renderMOT, checkDVSA, checkAllMOT,
  renderInsurance, checkInsurance, checkIns,
  renderViewings, updateViewingStatus, renderCal, calPrev, calNext, calDayClick, addViewing,
  searchReg, updateCalc, generateInvoice, printInv,
  renderInvoiceList, reView, rePrint, prefillSell, quickSell,
  renderTasks, addTask,
  renderFines, addFine, markFinePaid, appealFine,
  renderFinance, quickLog, logExpModal, delExp, prefillExp, exportFinance,
  renderReceipts, handleReceiptFile, handleModalReceiptFile, processReceipt, saveModalReceipt,
  renderBanking, connectBarclays, allocateTx, initiatePayment,
  renderInvestors, editInvestorBudget,
  renderWages,
  addStaff: addStaffMember,  // maps to HTML onclick="addStaff()"
  openPayModal, addOwed, logPayment,
  renderVAT,
  renderReports,

  // autotrader
  filterAT, renderAutoTrader, createATListing,
  openATFromStock, openATEdit, showATStep,
  saveATDetails, saveATDesc, atApproveDesc, atRegenDesc,
  toggleSpecConfirmed, saveATSpec, addCustomSpec,
  markATReady, publishATListingFromModal, publishATListing,
  atUploadPhotos, takeDownATListing, connectAutoTrader, saveATSettings, populateATNewSelect,

  // instagram
  filterIG, renderInstagram, igSelectVehicle, igGenCaption,
  igUseATDesc, saveIGDraft, postToInstagram, openIGFromStock,
  editIGPost, publishIGPost, deleteIGPost, saveIGSettings,
  connectInstagram, populateIGNewSelect,

  // media
  openMediaManager, refreshMediaModal,
  handleMediaUpload, handleATPhotoUpload,
  setCoverPhoto, setPhotoTag, deletePhoto,
  autoOrderPhotos, dragPhotoStart, dragPhotoDrop,
});

// ══════════════════════════════════════════════
// Fallback — seed state từ APP_DATA (khi backend offline)
// ══════════════════════════════════════════════
function seedFromAppData() {
  state.stockData = (APP_DATA.stock || []).map(v => Object.assign({}, v));
  state.soldData  = (APP_DATA.sold  || []).map(v => Object.assign({}, v));
  state.investors = (APP_DATA.investors || []).map(v => Object.assign({}, v));

  state.finLog = [];
  (APP_DATA.expenses || []).forEach((e, i) => {
    const m = ((e.notes || '') + ' ' + (e.from || '')).match(/[A-Z]{2}\d{2}\s?[A-Z]{3}/i);
    const plate = m ? m[0].replace(/\s+/, ' ').trim().toUpperCase() : '';
    const vehicle = plate
      ? state.stockData.find(v => normP(v.plate) === normP(plate))
        || state.soldData.find(v => normP(v.plate) === normP(plate))
      : null;
    state.finLog.push({
      id: 'h' + i, date: (e.month || '').slice(0, 10), plate,
      model: vehicle ? ((vehicle.make || '') + ' ' + (vehicle.model || '')).trim() : '',
      desc: [e.from || '', e.notes || e.category || ''].filter(Boolean).join(' · '),
      cat: e.category || 'Other', amount: e.amount || 0, direction: 'out',
    });
  });
  (APP_DATA.money_in || []).forEach((e, i) => {
    const vehicle = e.plate
      ? state.stockData.find(v => normP(v.plate) === normP(e.plate))
        || state.soldData.find(v => normP(v.plate) === normP(e.plate))
      : null;
    state.finLog.push({
      id: 'mi' + i, date: e.date || e.month, plate: e.plate || '',
      model: vehicle ? ((vehicle.make || '') + ' ' + (vehicle.model || '')).trim() : '',
      desc: (e.category || 'Money In') + (e.notes ? ' · ' + e.notes : ''),
      cat: 'Money In', amount: -(e.amount || 0), direction: 'in',
    });
  });
  (APP_DATA.money_out || []).forEach((e, i) => {
    state.finLog.push({
      id: 'mo' + i, date: e.date || e.month, plate: '', model: '',
      desc: (e.category || 'Money Out') + (e.notes ? ' · ' + e.notes : ''),
      cat: 'Money Out', amount: e.amount || 0, direction: 'out',
    });
  });
  state.monthly = APP_DATA.monthly || [];
}

// ══════════════════════════════════════════════
// Map API responses → state fields
// API trả về camelCase khớp với Java field names
// ══════════════════════════════════════════════

/** GET /api/vehicles → state.stockData */
function applyStock(vehicles) {
  // API trả về Vehicle entity — field names đã là camelCase (plate, make, model,
  // dateAcquired, totalCost, status, daysInStock…)
  state.stockData = vehicles.map(v => ({
    ...v,
    // Aliases cho các page dùng snake_case từ spreadsheet cũ
    date_acquired:  v.dateAcquired,
    total_cost:     v.totalCost     != null ? Number(v.totalCost)     : 0,
    purchase_price: v.purchasePrice != null ? Number(v.purchasePrice) : 0,
    days_in_stock:  v.daysInStock   ?? 0,
  }));
}

/** GET /api/sales/sold → state.soldData */
function applySold(sold) {
  // API trả về SoldVehicle entity
  state.soldData = sold.map(v => ({
    ...v,
    // Aliases
    date_acquired: v.dateAcquired,
    date_sold:     v.dateSold,
    days_in_stock: v.daysInStock  ?? 0,
    total_cost:    v.totalCost    != null ? Number(v.totalCost)    : 0,
    sold_price:    v.soldPrice    != null ? Number(v.soldPrice)    : 0,
    profit:        v.grossProfit  != null ? Number(v.grossProfit)  : 0,
    grossProfit:   v.grossProfit  != null ? Number(v.grossProfit)  : 0,
  }));
}

/** GET /api/investors → state.investors */
function applyInvestors(investors) {
  // API trả về Investor entity
  state.investors = investors.map(v => ({
    ...v,
    initial_balance:  v.initialBalance  != null ? Number(v.initialBalance)  : 0,
    capital_returned: v.capitalReturned != null ? Number(v.capitalReturned) : 0,
    total_balance:    v.totalBalance    != null ? Number(v.totalBalance)    : 0,
    purchased:        v.purchased       != null ? Number(v.purchased)       : 0,
    total_profit:     v.totalProfit     != null ? Number(v.totalProfit)     : 0,
    available:        v.available       != null ? Number(v.available)       : 0,
  }));
}

/** GET /api/finance → state.finLog */
function applyFinance(entries) {
  // API trả về FinanceEntry entity (id, stockId, plate, model, date, category, description, amount)
  state.finLog = entries.map(e => ({
    id:        e.id,
    date:      e.date,
    plate:     e.plate     || '',
    model:     e.model     || '',
    desc:      e.description || '',
    cat:       e.category  || 'Other',
    amount:    e.amount    != null ? Number(e.amount) : 0,
    direction: e.amount    != null && Number(e.amount) < 0 ? 'in' : 'out',
    stockId:   e.stockId   || '',
  }));
}

// ══════════════════════════════════════════════
// DOMContentLoaded
// ══════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', async () => {
  // Logos
  const sLogo = document.getElementById('sidebar-logo');
  const dLogo = document.getElementById('dash-logo');
  if (sLogo) sLogo.src = LOGO;
  if (dLogo) dLogo.src = LOGO;

  // Today's date defaults
  ['exp-date', 'vw-date', 'wp-date', 'fn-date', 'fn-due', 'col-date', 'col-won', 'sell-date'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = today();
  });

  // ── Load data từ backend API, fallback về APP_DATA nếu offline ──
  try {
    const [vehicles, sold, investors, finance] = await Promise.all([
      api.getStock(),
      api.getSold(),
      api.getInvestors(),
      api.getFinance(),
    ]);

    applyStock(vehicles);
    applySold(sold);
    applyInvestors(investors);
    applyFinance(finance);

    // Nếu DB chưa có dữ liệu (mới khởi tạo), fall through sang APP_DATA
    if (!state.stockData.length && !state.soldData.length) {
      console.warn('[DealerOS] API trả về rỗng — dùng APP_DATA demo');
      seedFromAppData();
    }
  } catch (err) {
    console.warn('[DealerOS] Không kết nối được backend, dùng APP_DATA demo:', err.message);
    seedFromAppData();
  }

  // Demo bank transactions (chưa có API)
  state.bankTxs = [
    { id: 'tx1', date: '2026-04-05', desc: 'HONDA CRV SALE — KU13 FBF',    amount:  7995,    type: 'in',  matched: true,  ref: 'INV-001' },
    { id: 'tx2', date: '2026-04-04', desc: 'COPART UK AUCTION FEES',        amount:  -406.80, type: 'out', matched: false, ref: '' },
    { id: 'tx3', date: '2026-04-03', desc: 'Joseph INVESTOR DEPOSIT',       amount:  8000,    type: 'in',  matched: true,  ref: 'Joseph-IN' },
    { id: 'tx4', date: '2026-04-02', desc: 'AUTOTRADER SUBSCRIPTION',       amount:  -353.87, type: 'out', matched: true,  ref: 'OVERHEAD' },
    { id: 'tx5', date: '2026-04-01', desc: 'James — PROFIT PAYOUT',         amount:  -3500,   type: 'out', matched: false, ref: '' },
    { id: 'tx6', date: '2026-03-31', desc: 'FIAT 500 SALE — LK15 TJU',      amount:  6800,    type: 'in',  matched: true,  ref: 'INV-002' },
    { id: 'tx7', date: '2026-03-30', desc: 'COPART VEHICLE PURCHASE',       amount:  -5400,   type: 'out', matched: false, ref: '' },
    { id: 'tx8', date: '2026-03-28', desc: 'PCN — ULEZ CHARGE VE16TNO',     amount:  -12.50,  type: 'out', matched: false, ref: '' },
  ];

  // Load saved (localStorage) overrides: AT listings, IG posts, photos, settings
  loadFromStorage();

  // Populate sold filter months
  const months = [...new Set(state.soldData.map(v => (v.dateSold || v.month || '').slice(0, 7)).filter(Boolean))].sort().reverse();
  const soldSel = document.getElementById('sold-filter');
  if (soldSel) {
    months.forEach(m => {
      const o = document.createElement('option');
      o.value = m; o.textContent = mLabel(m + '-01');
      soldSel.appendChild(o);
    });
  }

  // Viewing vehicle select
  const vwSel = document.getElementById('vw-vehicle');
  if (vwSel) {
    vwSel.innerHTML = '<option value="">— Select —</option>' +
      state.stockData.map(v => `<option value="${v.plate}">${(v.make || '') + ' ' + (v.model || '')} · ${v.plate}</option>`).join('');
  }

  // AT / IG selects
  populateATNewSelect();
  populateIGNewSelect();

  // Modal overlay close-on-backdrop
  document.querySelectorAll('.moverlay').forEach(o =>
    o.addEventListener('click', e => { if (e.target === o) o.classList.remove('open'); })
  );

  // Nav event từ nav.js CustomEvent
  window.addEventListener('dealeros:nav', e => {
    const id = e.detail;
    const renders = {
      stock: renderStock, sold: renderSold,
      expenses: renderFinance, investors: renderInvestors,
      reports: renderReports, tasks: renderTasks,
      mot: renderMOT, insurance: renderInsurance,
      viewings: renderViewings, fines: renderFines,
      receipts: renderReceipts, banking: renderBanking,
      wages: renderWages, vat: renderVAT,
      collections: renderCollections, invoices: renderInvoiceList,
      servicehistory: renderServiceHistory,
      autotrader: renderAutoTrader, instagram: renderInstagram,
    };
    if (renders[id]) renders[id]();
  });

  // Initial render
  updateNavBadges();
  renderDashboard();
  renderStock();
  renderSold();
  renderCollections();
  renderServiceHistory();
  renderMOT();
  renderInsurance();
  renderViewings();
  renderFinance();
  renderReceipts();
  renderInvestors();
  renderWages();
  renderVAT();
  renderReports();
  renderBanking();
  persistOpsState();
});
