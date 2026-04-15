// ══════════════════════════════════════════════
// DealerOS — Auto Trader page
// ══════════════════════════════════════════════
import { state, saveToStorage } from '../state.js';
import { escHtml, escJs, normP } from '../utils.js';
import { openM, closeM, updateNavBadges } from '../nav.js';

export const AT_DEFAULT_HASHTAGS = '#usedcars #london #mpmotors #carsofinstagram #ukcar #forsale #dealership';
export const PHOTO_ORDER_TEMPLATE = ['front-angle','front','side','rear-angle','rear','dashboard','front-seats','rear-seats','mileage','screen','service-history','wheels','boot','engine-bay','damage','keys'];
export const PHOTO_TAG_LABELS = {
  'front-angle':'Front Angle','front':'Front','side':'Side','rear-angle':'Rear Angle','rear':'Rear',
  'dashboard':'Dashboard','front-seats':'Front Seats','rear-seats':'Rear Seats','mileage':'Mileage',
  'screen':'Screen','service-history':'Service History','wheels':'Wheels','boot':'Boot',
  'engine-bay':'Engine Bay','damage':'Damage','keys':'Keys'
};

export function atStatusLabel(s) {
  return { not_started:'Not Started', draft:'Draft', needs_review:'Needs Review', ready:'Ready', live:'Live ✓', failed:'Failed' }[s] || s;
}

export function filterAT(f, el) {
  state.atFilter = f;
  document.querySelectorAll('#page-autotrader .tab').forEach(t => t.classList.remove('active'));
  if (el) el.classList.add('active');
  renderAutoTrader();
}

export function renderAutoTrader() {
  const listings = state.atListings;
  const live     = listings.filter(l => l.status === 'live').length;
  const drafts   = listings.filter(l => l.status === 'draft').length;
  const ready    = listings.filter(l => l.status === 'ready').length;
  const review   = listings.filter(l => l.status === 'needs_review').length;

  document.getElementById('at-conn-label').innerHTML =
    '· <span class="badge ' + (state.atSettings.mode === 'demo' ? 'bg' : 'ba') + '">' +
    (state.atSettings.mode === 'demo' ? 'Demo Mode' : 'Connected') + '</span>';

  const statsEl = document.getElementById('at-stats');
  if (statsEl) statsEl.innerHTML = `
    <div class="stat green"><div class="sl">Live</div><div class="sv">${live}</div></div>
    <div class="stat amber"><div class="sl">Needs Review</div><div class="sv">${review}</div></div>
    <div class="stat purple"><div class="sl">Ready</div><div class="sv">${ready}</div></div>
    <div class="stat blue"><div class="sl">Drafts</div><div class="sv">${drafts}</div></div>
    <div class="stat red"><div class="sl">Total</div><div class="sv">${listings.length}</div></div>`;

  let shown = state.atFilter === 'all' ? listings : listings.filter(l => l.status === state.atFilter);
  const gridEl = document.getElementById('at-listing-grid');
  if (gridEl) gridEl.innerHTML = shown.length
    ? shown.map(l => renderATCard(l)).join('')
    : '<div style="color:var(--text3);text-align:center;padding:30px;font-size:13px;">No listings in this view</div>';

  updateNavBadges();
}

function renderATCard(l) {
  const v     = (state.stockData || []).find(v => normP(v.plate) === normP(l.plate)) || { model: l.plate, plate: l.plate };
  const pics  = (state.vehiclePhotos[normP(l.plate)] || []);
  const cover = pics.find(p => p.cover) || pics[0];
  const statusCls = { draft:'at-draft', needs_review:'at-review', ready:'at-ready', live:'at-live', failed:'at-failed' }[l.status] || 'at-none';
  const safeP = escJs(l.plate);
  return `<div class="listing-card" onclick="openATEdit('${safeP}')">
    <div style="display:flex;gap:12px;align-items:flex-start;">
      <div style="width:70px;height:52px;border-radius:6px;overflow:hidden;background:var(--s3);flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:22px;">
        ${cover && cover.url ? `<img src="${cover.url}" style="width:100%;height:100%;object-fit:cover;">` : '🚗'}
      </div>
      <div style="flex:1;">
        <div class="listing-card-plate">${escHtml(l.plate)}</div>
        <div class="listing-card-model">${escHtml(v.make || '')} ${escHtml(v.model || '')}</div>
        <div style="display:flex;gap:5px;align-items:center;">
          <span class="at-status ${statusCls}">${atStatusLabel(l.status)}</span>
          ${l.price ? `<span style="font-family:'DM Mono',monospace;font-size:11px;color:var(--green);">£${Number(l.price).toLocaleString()}</span>` : ''}
          ${l.mileage ? `<span style="font-size:10.5px;color:var(--text3);">${Number(l.mileage).toLocaleString()} mi</span>` : ''}
        </div>
      </div>
    </div>
    <div class="listing-actions">
      <button class="btn btn-g btn-xs" onclick="event.stopPropagation();openATEdit('${safeP}')">Edit</button>
      ${l.status === 'ready' ? `<button class="btn btn-p btn-xs" onclick="event.stopPropagation();publishATListing('${safeP}')">Publish</button>` : ''}
      ${l.status === 'live'  ? `<button class="btn btn-red btn-xs" onclick="event.stopPropagation();takeDownATListing('${safeP}')">Take Down</button>` : ''}
      <button class="btn btn-amber btn-xs" onclick="event.stopPropagation();openMediaManager('${safeP}','${escJs(v.make||'')} ${escJs(v.model||'')}')">📷 Photos</button>
    </div>
  </div>`;
}

export function createATListing() {
  const plate   = document.getElementById('at-new-plate')?.value;
  const price   = parseFloat(document.getElementById('at-new-price')?.value) || 0;
  const mileage = parseInt(document.getElementById('at-new-miles')?.value) || 0;
  if (!plate) { alert('Select a vehicle.'); return; }
  if (state.atListings.find(l => normP(l.plate) === normP(plate))) { alert('Listing already exists for this vehicle.'); return; }
  state.atListings.push({ id: 'AT-' + Date.now(), plate, price, mileage, status: 'draft', createdAt: new Date().toISOString() });
  saveToStorage();
  closeM('at-new');
  renderAutoTrader();
}

export function openATFromStock(plate) {
  populateATNewSelect();
  setTimeout(() => {
    const sel = document.getElementById('at-new-plate');
    if (sel) sel.value = plate;
    openM('at-new');
  }, 50);
}

export function openATEdit(plate) {
  const l = state.atListings.find(l => normP(l.plate) === normP(plate));
  if (!l) { openATFromStock(plate); return; }
  state.currentATListing = l;
  const v = (state.stockData || []).find(v => normP(v.plate) === normP(plate)) || {};
  const titleEl = document.getElementById('at-edit-title');
  const subEl   = document.getElementById('at-edit-sub');
  if (titleEl) titleEl.textContent = `Edit Listing — ${v.make||''} ${v.model||''}`;
  if (subEl)   subEl.textContent   = plate;
  showATStep('details');
  openM('at-edit');
}

export function showATStep(step) {
  ['details','desc','spec','photos','publish'].forEach(s => {
    const el = document.getElementById('step-' + s);
    if (el) el.className = 'step' + (s === step ? ' active' : '');
  });

  const l = state.currentATListing;
  const v = l ? (state.stockData || []).find(v => normP(v.plate) === normP(l.plate)) || {} : {};
  const body = document.getElementById('at-edit-body');
  if (!body) return;

  if (step === 'details') {
    body.innerHTML = `<div class="g2">
      <div class="fg"><label class="fl">Asking Price (£)</label><input class="fi" id="at-price" type="number" value="${l?.price || ''}"></div>
      <div class="fg"><label class="fl">Mileage</label><input class="fi" id="at-mileage" type="number" value="${l?.mileage || v.mileage || ''}"></div>
    </div>
    <div class="g2">
      <div class="fg"><label class="fl">Year</label><input class="fi" id="at-year" type="number" value="${l?.year || v.year || ''}"></div>
      <div class="fg"><label class="fl">Colour</label><input class="fi" id="at-colour" value="${l?.colour || v.colour || ''}"></div>
    </div>
    <div class="fg"><label class="fl">Title</label><input class="fi" id="at-title-input" value="${escHtml(l?.title || generateATTitle(v,l||{}))}"></div>
    <div style="display:flex;justify-content:flex-end;margin-top:10px;">
      <button class="btn btn-p" onclick="saveATDetails();showATStep('desc')">Next: Description →</button>
    </div>`;
  } else if (step === 'desc') {
    const desc = (state.listingDescriptions[normP(l?.plate||'')] || {}).body || generateATDescription(v, l||{});
    body.innerHTML = `<div class="fg"><label class="fl">Description</label><textarea class="fta" id="at-desc" style="min-height:220px;">${escHtml(desc)}</textarea></div>
    <div style="display:flex;gap:7px;flex-wrap:wrap;margin-bottom:11px;">
      <button class="btn btn-g btn-sm" onclick="atRegenDesc()">✨ Regenerate</button>
      <button class="btn btn-amber btn-sm" onclick="atApproveDesc()">✓ Approve</button>
    </div>
    <div style="display:flex;justify-content:space-between;margin-top:10px;">
      <button class="btn btn-g" onclick="showATStep('details')">← Back</button>
      <button class="btn btn-p" onclick="saveATDesc();showATStep('spec')">Next: Spec →</button>
    </div>`;
  } else if (step === 'spec') {
    const specs = buildSpecListForAT(v);
    body.innerHTML = `<div id="spec-list-edit">${specs.map((s, i) =>
      `<div class="spec-item"><input type="checkbox" class="spec-cb" ${s.confirmed?'checked':''} onchange="toggleSpecConfirmed(${i},this.checked)"><span class="spec-label">${escHtml(s.label)}</span>${s.uncertain?'<span class="spec-uncertain">?</span>':''}</div>`
    ).join('')}</div>
    <div style="display:flex;gap:7px;margin-top:11px;">
      <input class="fi" id="spec-custom" placeholder="Add custom spec..." style="flex:1;">
      <button class="btn btn-g" onclick="addCustomSpec()">+ Add</button>
    </div>
    <div style="display:flex;justify-content:space-between;margin-top:13px;">
      <button class="btn btn-g" onclick="showATStep('desc')">← Back</button>
      <button class="btn btn-p" onclick="saveATSpec();showATStep('photos')">Next: Photos →</button>
    </div>`;
  } else if (step === 'photos') {
    body.innerHTML = `<div class="photo-grid" id="at-photo-grid">${renderPhotoGrid(l?.plate||'')}</div>
    <div style="margin-top:10px;display:flex;gap:7px;flex-wrap:wrap;">
      <button class="btn btn-g btn-sm" onclick="document.getElementById('at-photo-upload').click()">+ Add Photos</button>
      <button class="btn btn-amber btn-sm" onclick="autoOrderPhotos()">🔁 Auto-Order</button>
    </div>
    <input type="file" id="at-photo-upload" multiple accept="image/*" style="display:none;" onchange="handleATPhotoUpload(this)">
    <div style="display:flex;justify-content:space-between;margin-top:13px;">
      <button class="btn btn-g" onclick="showATStep('spec')">← Back</button>
      <button class="btn btn-p" onclick="showATStep('publish')">Next: Publish →</button>
    </div>`;
  } else if (step === 'publish') {
    const pics = (state.vehiclePhotos[normP(l?.plate||'')] || []);
    body.innerHTML = `<div class="g2" style="margin-bottom:13px;">
      <div class="invc"><div class="invc-name">Listing Summary</div>
        <div class="irow"><span class="lbl">Price</span><span class="val">${l?.price ? '£'+Number(l.price).toLocaleString() : '—'}</span></div>
        <div class="irow"><span class="lbl">Mileage</span><span class="val">${l?.mileage ? Number(l.mileage).toLocaleString()+' mi' : '—'}</span></div>
        <div class="irow"><span class="lbl">Photos</span><span class="val">${pics.length}</span></div>
        <div class="irow"><span class="lbl">Status</span><span class="val"><span class="at-status at-${l?.status||'draft'}">${atStatusLabel(l?.status||'draft')}</span></span></div>
      </div>
      <div class="invc"><div class="invc-name">Checklist</div>
        <div class="irow"><span class="lbl">Title</span><span class="val" style="color:${l?.title?'var(--green)':'var(--red)'};">${l?.title?'✓':'✗'}</span></div>
        <div class="irow"><span class="lbl">Description</span><span class="val" style="color:${(state.listingDescriptions[normP(l?.plate||'')]||{}).body?'var(--green)':'var(--amber)'};">${(state.listingDescriptions[normP(l?.plate||'')]||{}).body?'✓':'Draft'}</span></div>
        <div class="irow"><span class="lbl">Photos</span><span class="val" style="color:${pics.length>=4?'var(--green)':'var(--amber)'};">${pics.length>=4?'✓':pics.length+'/4 min'}</span></div>
        <div class="irow"><span class="lbl">Price</span><span class="val" style="color:${l?.price?'var(--green)':'var(--red)'};">${l?.price?'✓':'✗'}</span></div>
      </div>
    </div>
    <div style="display:flex;justify-content:space-between;">
      <button class="btn btn-g" onclick="showATStep('photos')">← Back</button>
      <div style="display:flex;gap:7px;">
        <button class="btn btn-g" onclick="markATReady()">Mark as Ready</button>
        <button class="btn btn-p" onclick="publishATListingFromModal()">🌐 Publish to Auto Trader</button>
      </div>
    </div>`;
  }
}

export function saveATDetails() {
  if (!state.currentATListing) return;
  state.currentATListing.price   = parseFloat(document.getElementById('at-price')?.value) || state.currentATListing.price;
  state.currentATListing.mileage = parseInt(document.getElementById('at-mileage')?.value) || state.currentATListing.mileage;
  state.currentATListing.year    = parseInt(document.getElementById('at-year')?.value)    || state.currentATListing.year;
  state.currentATListing.colour  = document.getElementById('at-colour')?.value || state.currentATListing.colour;
  state.currentATListing.title   = document.getElementById('at-title-input')?.value || state.currentATListing.title;
  if (state.currentATListing.status === 'draft') state.currentATListing.status = 'needs_review';
  saveToStorage();
}

export function saveATDesc() {
  if (!state.currentATListing) return;
  const body = document.getElementById('at-desc')?.value || '';
  const np   = normP(state.currentATListing.plate);
  if (!state.listingDescriptions[np]) state.listingDescriptions[np] = {};
  state.listingDescriptions[np].body = body;
  saveToStorage();
}

export function atApproveDesc() {
  if (!state.currentATListing) return;
  const body = document.getElementById('at-desc')?.value || '';
  const np   = normP(state.currentATListing.plate);
  if (!state.listingDescriptions[np]) state.listingDescriptions[np] = {};
  state.listingDescriptions[np].body     = body;
  state.listingDescriptions[np].approved = true;
  if (state.currentATListing.status === 'needs_review') state.currentATListing.status = 'ready';
  saveToStorage();
  showATStep('spec');
}

export function atRegenDesc() {
  if (!state.currentATListing) return;
  const v = (state.stockData || []).find(v => normP(v.plate) === normP(state.currentATListing.plate)) || {};
  const desc = document.getElementById('at-desc');
  if (desc) desc.value = generateATDescription(v, state.currentATListing);
}

export function toggleSpecConfirmed(idx, checked) {
  if (!state.currentATListing) return;
  const specs = buildSpecListForAT((state.stockData || []).find(v => normP(v.plate) === normP(state.currentATListing.plate)) || {});
  const np = normP(state.currentATListing.plate);
  if (!state.listingDescriptions[np]) state.listingDescriptions[np] = {};
  const saved = state.listingDescriptions[np].specItems || specs;
  if (saved[idx]) { saved[idx].confirmed = checked; saved[idx].uncertain = false; }
  state.listingDescriptions[np].specItems = saved;
  saveToStorage();
}

export function saveATSpec() {
  if (!state.currentATListing) return;
  const np = normP(state.currentATListing.plate);
  const items = [...document.querySelectorAll('#spec-list-edit .spec-item')].map(el => ({
    label:     el.querySelector('.spec-label')?.textContent || '',
    confirmed: el.querySelector('.spec-cb')?.checked || false,
    uncertain: false
  }));
  if (!state.listingDescriptions[np]) state.listingDescriptions[np] = {};
  state.listingDescriptions[np].specItems = items;
  saveToStorage();
}

export function addCustomSpec() {
  const input = document.getElementById('spec-custom');
  const text  = input?.value.trim();
  if (!text) return;
  const container = document.getElementById('spec-list-edit');
  if (container) container.innerHTML += `<div class="spec-item"><input type="checkbox" class="spec-cb" checked><span class="spec-label">${escHtml(text)}</span></div>`;
  if (input) input.value = '';
}

export function markATReady() {
  if (!state.currentATListing) return;
  state.currentATListing.status = 'ready';
  saveToStorage();
  closeM('at-edit');
  renderAutoTrader();
}

export async function publishATListingFromModal() {
  if (!state.currentATListing) return;
  await publishATListing(state.currentATListing.plate);
  closeM('at-edit');
}

export async function publishATListing(plate) {
  const l = state.atListings.find(l => normP(l.plate) === normP(plate));
  if (!l) return;
  if (state.atSettings.mode === 'demo') {
    await new Promise(r => setTimeout(r, 700));
    l.status = 'live'; l.externalId = 'AT-DEMO-' + Date.now(); l.publishedAt = new Date().toISOString();
    saveToStorage(); renderAutoTrader(); updateNavBadges();
    alert('✅ Published to Auto Trader (Demo Mode)');
  } else {
    alert('Connect Auto Trader API in settings to publish live listings.');
  }
}

export async function atUploadPhotos() {
  const plate = state.currentATListing ? state.currentATListing.plate : '';
  const pics = state.vehiclePhotos[normP(plate)] || [];
  if (!pics.length) { alert('No photos to upload.'); return; }
  const btn = event.target;
  btn.textContent = '⏳ Uploading...'; btn.disabled = true;
  if (state.atSettings.mode === 'demo') {
    await new Promise(r => setTimeout(r, 800));
    pics.forEach(p => p.atUploaded = true);
    state.vehiclePhotos[normP(plate)] = pics;
    saveToStorage();
    btn.textContent = '✅ ' + pics.length + ' uploaded';
    btn.style.background = 'var(--green)';
  } else {
    btn.disabled = false; btn.textContent = '📤 Push to AT';
    alert('Live AT API not configured.');
  }
}

export function takeDownATListing(plate) {
  if (!confirm('Take down this listing?')) return;
  const l = state.atListings.find(l => normP(l.plate) === normP(plate));
  if (l) { l.status = 'draft'; saveToStorage(); renderAutoTrader(); updateNavBadges(); }
}

export function connectAutoTrader() {
  if (state.atSettings.mode === 'demo') {
    document.getElementById('at-conn-label').innerHTML = '· <span class="badge bg">Demo Mode Active</span>';
    alert('Demo mode: Auto Trader integration is simulated locally.');
  } else {
    document.getElementById('at-conn-label').innerHTML = '· <span class="badge ba">Connecting…</span>';
    setTimeout(() => { document.getElementById('at-conn-label').innerHTML = '· <span class="badge br">API key required — check settings</span>'; }, 1500);
  }
}

export function saveATSettings() {
  state.atSettings = {
    mode:     document.getElementById('at-mode')?.value     || 'demo',
    apiKey:   document.getElementById('at-apikey')?.value   || '',
    dealerId: document.getElementById('at-dealerid')?.value || '',
    env:      document.getElementById('at-env')?.value      || 'sandbox'
  };
  saveToStorage(); closeM('at-settings'); renderAutoTrader();
}

export function populateATNewSelect() {
  const sel = document.getElementById('at-new-plate');
  if (!sel) return;
  sel.innerHTML = (state.stockData || []).map(v =>
    `<option value="${escHtml(v.plate||'')}">${escHtml(v.make||'')} ${escHtml(v.model||'')} · ${escHtml(v.plate||'')}</option>`).join('');
}

// Helper — exported for use in media.js
export function generateATDescription(v, listing) {
  const miles = listing?.mileage ? listing.mileage.toLocaleString() + ' miles' : 'mileage to be confirmed';
  const price = listing?.price   ? '£' + listing.price.toLocaleString()        : 'priced to sell';
  return `${v.make||''} ${v.model||''} — ${price}\n\nA great example in excellent condition and ready to drive away. This car has covered ${miles} and has been carefully prepared by SA Motors London.\n\nAll vehicles come with a pre-sale inspection. Part exchange welcome. Finance subject to status.\n\nCall 07440 603950 or visit 64 Nile Street, London N1 7SR.\nSA Motors — Reg. 15699982`;
}
export function generateATTitle(v, listing) {
  const year = listing?.year || v.year || '';
  return [year, v.make||'', v.model||'', listing?.mileage ? '· '+Math.round(listing.mileage/1000)+'k Miles' : '', listing?.price ? '· £'+listing.price.toLocaleString() : ''].filter(Boolean).join(' ');
}
export function buildSpecListForAT(v) {
  const stored = (state.listingDescriptions[normP(v.plate||'')] || {}).specItems;
  if (stored?.length) return stored;
  return ['Air Conditioning','Central Locking','Electric Windows','Alloy Wheels','Bluetooth','DAB Radio','USB Connectivity','Parking Sensors']
    .map(s => ({ label: s, confirmed: false, uncertain: true }));
}

// Photo grid render — shared with media.js
export function renderPhotoGrid(plate) {
  const np   = normP(plate);
  const pics = state.vehiclePhotos[np] || [];
  return pics.map((ph, i) =>
    `<div class="photo-card${ph.cover?' cover':''}${ph.selected?' selected':''}" draggable="true" ondragstart="dragPhotoStart(event,${i})" ondragover="event.preventDefault()" ondrop="dragPhotoDrop(event,${i})">
      ${ph.url ? `<img src="${ph.url}" alt="${escHtml(ph.tag||'')}" onerror="this.style.display='none'">` : `<div style="width:100%;height:100%;background:var(--s3);display:flex;align-items:center;justify-content:center;font-size:22px;">📷</div>`}
      <div class="ph-overlay">
        <select class="ph-tag" style="background:rgba(0,0,0,.7);border:none;color:#fff;font-size:9px;font-weight:700;cursor:pointer;border-radius:4px;padding:1px 3px;" onchange="setPhotoTag('${np}',${i},this.value)">
          ${PHOTO_ORDER_TEMPLATE.map(t => `<option value="${t}"${ph.tag===t?' selected':''}>${escHtml(PHOTO_TAG_LABELS[t]||t)}</option>`).join('')}
        </select>
        <button class="ph-cover-btn" onclick="setCoverPhoto('${np}',${i})">${ph.cover ? '★ Cover' : '☆ Set Cover'}</button>
      </div>
      <div class="ph-order">${i+1}</div>
      <button class="ph-del" onclick="deletePhoto('${np}',${i})">✕</button>
    </div>`
  ).join('');
}
