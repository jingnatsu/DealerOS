// ══════════════════════════════════════════════
// DealerOS — REST API wrappers  (/api/*)
// ══════════════════════════════════════════════

const BASE = '';  // same-origin — Spring Boot serves both FE and API

async function req(method, path, body) {
  const opts = { method, headers: { 'Content-Type': 'application/json' } };
  if (body !== undefined) opts.body = JSON.stringify(body);
  const res = await fetch(BASE + path, opts);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || res.statusText);
  }
  return res.status === 204 ? null : res.json();
}

// ── Vehicles ──────────────────────────────────
export const api = {
  // Stock
  getStock:         ()      => req('GET',    '/api/vehicles'),
  getAllVehicles:    ()      => req('GET',    '/api/vehicles/all'),
  getVehicle:       (sid)   => req('GET',    `/api/vehicles/${sid}`),
  searchVehicles:   (q)     => req('GET',    `/api/vehicles/search?q=${encodeURIComponent(q)}`),
  addVehicle:       (data)  => req('POST',   '/api/vehicles', data),
  updateVehicle:    (sid, d)=> req('PUT',    `/api/vehicles/${sid}`, d),
  updateStatus:     (sid, s)=> req('PATCH',  `/api/vehicles/${sid}/status`, { status: s }),
  addCost:          (sid, d)=> req('POST',   `/api/vehicles/${sid}/cost`, d),

  // Sales
  sellVehicle:      (data)  => req('POST',   '/api/sales/sell', data),
  getSold:          ()      => req('GET',    '/api/sales/sold'),
  getInvoices:      ()      => req('GET',    '/api/sales/invoices'),

  // Finance
  getFinance:       ()      => req('GET',    '/api/finance'),
  addFinance:       (data)  => req('POST',   '/api/finance', data),
  deleteFinance:    (id)    => req('DELETE', `/api/finance/${id}`),

  // Investors
  getInvestors:     ()      => req('GET',    '/api/investors'),
  updateInvestor:   (id, d) => req('PUT',    `/api/investors/${id}`, d),

  // Viewings
  getViewings:      ()      => req('GET',    '/api/viewings'),
  addViewing:       (data)  => req('POST',   '/api/viewings', data),
  updateViewing:    (id, d) => req('PATCH',  `/api/viewings/${id}`, d),

  // Collections
  getCollections:   ()      => req('GET',    '/api/collections'),
  addCollection:    (data)  => req('POST',   '/api/collections', data),

  // Service records
  getServices:      ()      => req('GET',    '/api/services'),
  addService:       (data)  => req('POST',   '/api/services', data),

  // Fines
  getFines:         ()      => req('GET',    '/api/fines'),
  addFine:          (data)  => req('POST',   '/api/fines', data),
  updateFine:       (id, d) => req('PATCH',  `/api/fines/${id}`, d),

  // Staff / wages
  getStaff:         ()      => req('GET',    '/api/staff'),
  addStaff:         (data)  => req('POST',   '/api/staff', data),
  getWagePayments:  ()      => req('GET',    '/api/wages'),
  addWagePayment:   (data)  => req('POST',   '/api/wages', data),

  // Dashboard
  getDashboard:     ()      => req('GET',    '/api/dashboard/stats'),
  getMonthlyTrend:  ()      => req('GET',    '/api/dashboard/monthly-trend'),

  // Excel sync
  importExcel:      (file)  => {
    const fd = new FormData(); fd.append('file', file);
    return fetch('/api/excel/import', { method: 'POST', body: fd }).then(r => r.json());
  },
  exportExcel:      ()      => fetch('/api/excel/export').then(r => r.blob()),

  // File upload
  uploadFile: (stockId, category, file) => {
    const fd = new FormData(); fd.append('file', file); fd.append('category', category);
    return fetch(`/api/vehicles/${stockId}/files`, { method: 'POST', body: fd }).then(r => r.json());
  },
};
