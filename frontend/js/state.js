// ══════════════════════════════════════════════
// DealerOS — Mutable application state
// ══════════════════════════════════════════════
// All modules import this object and mutate it directly.
// No framework reactivity — renders are called explicitly after mutations.

export const state = {
  // ── Data (populated from API / APP_DATA at boot) ──────────
  stockData:  [],   // current stock vehicles
  soldData:   [],   // sold history
  investors:  [],   // investor budget rows
  expenses:   [],   // expense sheet rows
  collections: [],  // collection sheet rows
  moneyIn:    [],
  moneyOut:   [],

  // ── Finance log (built from multiple sources) ─────────────
  finLog: [],

  // ── Ops state (persisted to localStorage) ─────────────────
  viewings:       JSON.parse(localStorage.getItem('dealeros_viewings')      || '[]'),
  deliveries:     JSON.parse(localStorage.getItem('dealeros_deliveries')    || '[]'),
  serviceRecords: JSON.parse(localStorage.getItem('dealeros_service_records')|| '[]'),
  fines:          JSON.parse(localStorage.getItem('dealeros_fines')         || '[]'),
  receipts:       JSON.parse(localStorage.getItem('dealeros_receipts')      || '[]'),
  staff: JSON.parse(localStorage.getItem('dealeros_staff') || 'null') || [
    { id: 's1', name: 'Jatin',  role: 'Driver / Runner', payType: 'Per Job', rate: 80,  phone: '', owed: 0, paid: 0, linkedPlate: '' },
    { id: 's2', name: 'Ernest', role: 'Prep / Bodywork',  payType: 'Per Car', rate: 150, phone: '', owed: 0, paid: 0, linkedPlate: '' },
  ],
  wagePayments:   JSON.parse(localStorage.getItem('dealeros_wage_payments') || '[]'),
  savedInvoices:  JSON.parse(localStorage.getItem('dealeros_saved_invoices')|| '[]'),

  // ── Banking ───────────────────────────────────────────────
  bankTxs: [],
  bankConnected: false,

  // ── Calendar ──────────────────────────────────────────────
  calYear:  new Date().getFullYear(),
  calMonth: new Date().getMonth(),

  // ── Sell flow ─────────────────────────────────────────────
  currentVehicle: null,
  invSeq: 1,

  // ── Monthly trend (from APP_DATA, used by reports) ────────
  monthly: [],

  // ── Filters ───────────────────────────────────────────────
  stockFilter: 'all',

  // ── Receipt upload ────────────────────────────────────────
  receiptFile:      null,
  modalReceiptFile: null,

  // ── Media / listings ──────────────────────────────────────
  atListings:           [],
  igPosts:              [],
  vehiclePhotos:        {},
  listingDescriptions:  {},
  atSettings:  { mode: 'demo', apiKey: '', dealerId: '', env: 'sandbox' },
  igSettings:  { mode: 'demo', handle: '@mpmotorslondon', appId: '', token: '' },
  currentMediaPlate: '',
  currentATListing:  null,
  atFilter: 'all',
  igFilter: 'all',
};

export function persistOpsState() {
  localStorage.setItem('dealeros_viewings',        JSON.stringify(state.viewings));
  localStorage.setItem('dealeros_deliveries',      JSON.stringify(state.deliveries));
  localStorage.setItem('dealeros_service_records', JSON.stringify(state.serviceRecords));
  localStorage.setItem('dealeros_fines',           JSON.stringify(state.fines));
  localStorage.setItem('dealeros_receipts',        JSON.stringify(state.receipts));
  localStorage.setItem('dealeros_staff',           JSON.stringify(state.staff));
  localStorage.setItem('dealeros_wage_payments',   JSON.stringify(state.wagePayments));
  localStorage.setItem('dealeros_saved_invoices',  JSON.stringify(state.savedInvoices));
}

export function saveToStorage() {
  persistOpsState();
  localStorage.setItem('dealeros_at_listings',  JSON.stringify(state.atListings));
  localStorage.setItem('dealeros_ig_posts',     JSON.stringify(state.igPosts));
  localStorage.setItem('dealeros_photos',       JSON.stringify(state.vehiclePhotos));
  localStorage.setItem('dealeros_descriptions', JSON.stringify(state.listingDescriptions));
  localStorage.setItem('dealeros_at_settings',  JSON.stringify(state.atSettings));
  localStorage.setItem('dealeros_ig_settings',  JSON.stringify(state.igSettings));
}

export function loadFromStorage() {
  const atL   = localStorage.getItem('dealeros_at_listings');
  const igP   = localStorage.getItem('dealeros_ig_posts');
  const ph    = localStorage.getItem('dealeros_photos');
  const desc  = localStorage.getItem('dealeros_descriptions');
  const atSet = localStorage.getItem('dealeros_at_settings');
  const igSet = localStorage.getItem('dealeros_ig_settings');
  if (atL)   state.atListings           = JSON.parse(atL);
  if (igP)   state.igPosts              = JSON.parse(igP);
  if (ph)    state.vehiclePhotos        = JSON.parse(ph);
  if (desc)  state.listingDescriptions  = JSON.parse(desc);
  if (atSet) state.atSettings           = { ...state.atSettings, ...JSON.parse(atSet) };
  if (igSet) state.igSettings           = { ...state.igSettings, ...JSON.parse(igSet) };
}
