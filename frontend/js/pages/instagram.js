// ══════════════════════════════════════════════
// DealerOS — Instagram page
// ══════════════════════════════════════════════
import { state, saveToStorage } from '../state.js';
import { escHtml, escJs, normP } from '../utils.js';
import { openM, closeM, updateNavBadges } from '../nav.js';
import { AT_DEFAULT_HASHTAGS, renderPhotoGrid } from './autotrader.js';

export function igStatusLabel(s) {
  return { draft: 'Draft', scheduled: 'Scheduled', posted: 'Posted ✓', failed: 'Failed' }[s] || s;
}

export function filterIG(f, el) {
  state.igFilter = f;
  document.querySelectorAll('#page-instagram .tab').forEach(t => t.classList.remove('active'));
  if (el) el.classList.add('active');
  renderInstagram();
}

export function renderInstagram() {
  const posts     = state.igPosts;
  const posted    = posts.filter(p => p.status === 'posted');
  const drafts    = posts.filter(p => p.status === 'draft');
  const sched     = posts.filter(p => p.status === 'scheduled');
  const thisWeek  = posts.filter(p => p.status === 'posted' && p.postedAt && (Date.now() - new Date(p.postedAt)) < 7 * 864e5);

  document.getElementById('ig-conn-label').innerHTML =
    '· <span class="badge ' + (state.igSettings.mode === 'demo' ? 'bg' : 'ba') + '">' +
    (state.igSettings.mode === 'demo' ? 'Demo Mode' : state.igSettings.handle || 'Not connected') + '</span>';

  const statsEl = document.getElementById('ig-stats');
  if (statsEl) statsEl.innerHTML = `
    <div class="stat green"><div class="sl">Posted</div><div class="sv">${posted.length}</div></div>
    <div class="stat amber"><div class="sl">Drafts</div><div class="sv">${drafts.length}</div></div>
    <div class="stat blue"><div class="sl">Scheduled</div><div class="sv">${sched.length}</div></div>
    <div class="stat purple"><div class="sl">This Week</div><div class="sv">${thisWeek.length}</div></div>`;

  let shown = state.igFilter === 'all' ? posts : posts.filter(p => p.status === state.igFilter);
  const gridEl = document.getElementById('ig-post-grid');
  if (gridEl) gridEl.innerHTML = shown.length
    ? shown.map(p => renderIGCard(p)).join('')
    : '<div style="color:var(--text3);text-align:center;padding:30px;font-size:13px;">No posts in this view</div>';

  updateNavBadges();
}

function renderIGCard(p) {
  const v       = (state.stockData || []).find(v => normP(v.plate) === normP(p.plate)) || { model: p.plate, plate: p.plate };
  const pics    = (p.photoIds || []).map(id => (state.vehiclePhotos[normP(p.plate)] || []).find(ph => ph.id === id)).filter(Boolean);
  const statusCls = { draft:'ig-draft', scheduled:'ba', posted:'ig-posted', failed:'br' }[p.status] || 'bk';
  const safeId  = escJs(p.id);
  return `<div class="ig-post-card" style="margin-bottom:8px;">
    <div class="ig-thumb">
      ${pics[0]?.url ? `<img src="${pics[0].url}" alt="">` : '📷'}
      ${pics.length > 1 ? `<div class="ig-count">+${pics.length}</div>` : ''}
    </div>
    <div style="flex:1;">
      <div style="font-size:13px;font-weight:700;margin-bottom:2px;">${escHtml(v.make||'')} ${escHtml(v.model||'')}</div>
      <div style="font-size:10.5px;color:var(--text3);margin-bottom:5px;font-family:'DM Mono',monospace;">${escHtml(p.plate)}</div>
      <span class="badge ${statusCls}" style="margin-bottom:6px;">${igStatusLabel(p.status)}</span>
      ${p.status === 'draft' ? `<span class="badge bb" style="margin-bottom:6px;margin-left:4px;">${escHtml(p.type||'')}</span>` : ''}
      <div style="font-size:11px;color:var(--text3);margin-top:4px;white-space:pre-wrap;max-height:48px;overflow:hidden;">${escHtml((p.caption||'').slice(0,100))}</div>
    </div>
    <div style="display:flex;flex-direction:column;gap:5px;flex-shrink:0;">
      <button class="btn btn-b btn-xs" onclick="editIGPost('${safeId}')">Edit</button>
      ${p.status === 'draft' ? `<button class="btn btn-p btn-xs" onclick="publishIGPost('${safeId}')">Post</button>` : ''}
      <button class="btn btn-red btn-xs" onclick="deleteIGPost('${safeId}')">Del</button>
    </div>
  </div>`;
}

export function igSelectVehicle(plate) {
  if (!plate) { const el = document.getElementById('ig-photo-picker'); if (el) el.innerHTML = ''; return; }
  const v   = (state.stockData || []).find(v => normP(v.plate) === normP(plate));
  const atL = state.atListings.find(l => normP(l.plate) === normP(plate));
  const pics = state.vehiclePhotos[normP(plate)] || [];

  const capEl  = document.getElementById('ig-new-caption');
  const hashEl = document.getElementById('ig-new-hashtags');
  if (v && capEl  && !capEl.value)  capEl.value  = generateInstagramCaption(v, atL);
  if (v && hashEl && !hashEl.value) hashEl.value = generateInstagramHashtags(v);

  const picker = document.getElementById('ig-photo-picker');
  if (!picker) return;
  if (!pics.length) {
    picker.innerHTML = `<div style="color:var(--text3);font-size:12px;padding:10px;">No photos yet. <button class="btn btn-g btn-xs" onclick="closeM('ig-new');openMediaManager('${escJs(plate)}','${escJs(v?v.model:plate)}')">Add Photos</button></div>`;
    return;
  }
  picker.innerHTML = pics.map(ph =>
    `<label style="display:flex;align-items:center;gap:8px;cursor:pointer;padding:5px;border-radius:6px;border:1px solid var(--border);background:var(--s2);">
      <input type="checkbox" checked style="accent-color:var(--accent);width:14px;height:14px;" data-photo-id="${escHtml(ph.id)}">
      ${ph.url ? `<img src="${ph.url}" style="width:48px;height:36px;object-fit:cover;border-radius:4px;">` : `<div style="width:48px;height:36px;background:var(--s3);border-radius:4px;display:flex;align-items:center;justify-content:center;font-size:16px;">📷</div>`}
      <div style="flex:1;"><div style="font-size:11px;font-weight:600;">${escHtml(ph.tag||'Photo')}</div>${ph.cover?'<span class="badge ba" style="font-size:9px;">Cover</span>':''}</div>
    </label>`).join('');
}

export function igGenCaption() {
  const plate = document.getElementById('ig-new-plate')?.value;
  const v     = (state.stockData || []).find(v => normP(v.plate) === normP(plate));
  if (!v) return;
  const atL   = state.atListings.find(l => normP(l.plate) === normP(plate));
  const el    = document.getElementById('ig-new-caption');
  if (el) el.value = generateInstagramCaption(v, atL);
}

export function igUseATDesc() {
  const plate = document.getElementById('ig-new-plate')?.value;
  const desc  = state.listingDescriptions[normP(plate)];
  if (desc?.body) {
    const short = desc.body.split('\n\n')[0] + '\n\nCall 07440 603950 or visit 64 Nile Street, London N1 7SR.';
    const el = document.getElementById('ig-new-caption');
    if (el) el.value = short.slice(0, 2200);
  } else {
    alert('No Auto Trader description for this vehicle yet. Create one first.');
  }
}

export function saveIGDraft() {
  const plate = document.getElementById('ig-new-plate')?.value;
  if (!plate) { alert('Select a vehicle.'); return; }
  const picks  = [...document.querySelectorAll('#ig-photo-picker input[type=checkbox]:checked')].map(cb => cb.dataset.photoId).filter(Boolean);
  const atL    = state.atListings.find(l => normP(l.plate) === normP(plate));
  const post   = {
    id: 'IG-' + Date.now(), plate,
    caption:    document.getElementById('ig-new-caption')?.value || '',
    hashtags:   document.getElementById('ig-new-hashtags')?.value || '',
    photoIds:   picks,
    status:     'draft',
    type:       document.getElementById('ig-new-type')?.value || 'carousel',
    createdAt:  new Date().toISOString(),
    scheduledAt:document.getElementById('ig-new-schedule')?.value || null,
    postedAt:   null,
    linkedListingId: atL ? atL.id : null
  };
  state.igPosts.unshift(post);
  saveToStorage();
  closeM('ig-new');
  renderInstagram();
  updateNavBadges();
}

export async function postToInstagram() {
  const plate = document.getElementById('ig-new-plate')?.value;
  if (!plate) { alert('Select a vehicle.'); return; }
  const btn = document.querySelector('#m-ig-new .btn-p:last-child');
  if (btn) { btn.textContent = '⏳ Posting…'; btn.disabled = true; }

  const picks   = [...document.querySelectorAll('#ig-photo-picker input[type=checkbox]:checked')].map(cb => cb.dataset.photoId).filter(Boolean);
  const caption = document.getElementById('ig-new-caption')?.value || '';
  const res     = await postVehicleToInstagram({ plate, caption });

  if (res.success) {
    const atL = state.atListings.find(l => normP(l.plate) === normP(plate));
    const post = {
      id: 'IG-' + Date.now(), plate, caption,
      hashtags:   document.getElementById('ig-new-hashtags')?.value || '',
      photoIds:   picks,
      status:     'posted',
      type:       document.getElementById('ig-new-type')?.value || 'carousel',
      createdAt:  new Date().toISOString(),
      scheduledAt:null,
      postedAt:   new Date().toISOString(),
      linkedListingId: atL ? atL.id : null,
      externalId: res.postId || ''
    };
    state.igPosts.unshift(post);
    saveToStorage();
    closeM('ig-new');
    renderInstagram();
    updateNavBadges();
    if (btn) { btn.textContent = '📱 Post Now'; btn.disabled = false; }
    alert('✅ Posted to Instagram' + (state.igSettings.mode === 'demo' ? ' (demo)' : '') + '!');
  } else {
    if (btn) { btn.textContent = '📱 Post Now'; btn.disabled = false; }
    alert('Post failed: ' + (res.error || 'unknown error'));
  }
}

async function postVehicleToInstagram(postData) {
  if (state.igSettings.mode === 'demo') {
    await new Promise(r => setTimeout(r, 900));
    return { success: true, postId: 'IG-DEMO-' + Date.now() };
  }
  return { success: false, error: 'Live API not configured. Add Meta access token in settings.' };
}

export function openIGFromStock(plate) {
  const v = (state.stockData || []).find(v => normP(v.plate) === normP(plate));
  populateIGNewSelect();
  setTimeout(() => {
    const sel = document.getElementById('ig-new-plate');
    if (sel) sel.value = plate;
    igSelectVehicle(plate);
    openM('ig-new');
  }, 50);
}

export function editIGPost(id) {
  const p = state.igPosts.find(p => p.id === id);
  if (!p) return;
  populateIGNewSelect();
  setTimeout(() => {
    const sel = document.getElementById('ig-new-plate');
    if (sel) sel.value = p.plate;
    const capEl  = document.getElementById('ig-new-caption');
    const hashEl = document.getElementById('ig-new-hashtags');
    if (capEl)  capEl.value  = p.caption  || '';
    if (hashEl) hashEl.value = p.hashtags || '';
    igSelectVehicle(p.plate);
    openM('ig-new');
  }, 50);
}

export function publishIGPost(id) {
  const p = state.igPosts.find(p => p.id === id);
  if (!p) return;
  if (state.igSettings.mode === 'demo') {
    p.status = 'posted'; p.postedAt = new Date().toISOString();
    saveToStorage(); renderInstagram(); updateNavBadges();
  } else {
    alert('Connect Meta API in settings to publish live posts.');
  }
}

export function deleteIGPost(id) {
  if (!confirm('Delete this post?')) return;
  state.igPosts = state.igPosts.filter(p => p.id !== id);
  saveToStorage(); renderInstagram(); updateNavBadges();
}

export function saveIGSettings() {
  state.igSettings = {
    mode:   document.getElementById('ig-mode')?.value   || 'demo',
    handle: document.getElementById('ig-handle')?.value || '',
    appId:  document.getElementById('ig-appid')?.value  || '',
    token:  document.getElementById('ig-token')?.value  || ''
  };
  saveToStorage(); closeM('ig-settings'); renderInstagram();
}

export function connectInstagram() {
  if (state.igSettings.mode === 'demo') {
    document.getElementById('ig-conn-label').innerHTML = '· <span class="badge bg">Demo Mode Active</span>';
    alert('Demo mode: Instagram integration is simulated locally.');
  } else {
    alert('Connect Meta Business Account.\n\nSteps:\n1. Create a Meta App at developers.facebook.com\n2. Get Instagram Graph API credentials\n3. Add credentials in Settings above');
  }
}

export function populateIGNewSelect() {
  const sel = document.getElementById('ig-new-plate');
  if (!sel) return;
  sel.innerHTML = '<option value="">— Select vehicle —</option>' +
    (state.stockData || []).map(v =>
      `<option value="${escHtml(v.plate||'')}">${escHtml(v.make||'')} ${escHtml(v.model||'')} · ${escHtml(v.plate||'')}</option>`).join('');
}

function generateInstagramCaption(v, listing) {
  const price   = listing?.price ? '£' + listing.price.toLocaleString() : '';
  const mileage = listing?.mileage ? listing.mileage.toLocaleString() + ' miles' : '';
  return [
    '🚗 ' + (v.make||'') + ' ' + (v.model||''),
    price   ? '💰 ' + price   : '',
    mileage ? '📍 ' + mileage : '',
    '',
    'Ready to drive away, pristine condition.',
    'Call or DM us to arrange a viewing.',
    '📍 SA Motors London, 64 Nile Street, London N1',
    '📞 07440 603950'
  ].filter(Boolean).join('\n');
}

function generateInstagramHashtags(v) {
  const make = ((v.make || v.model || '').split(' ')[0] || '').toLowerCase();
  return [AT_DEFAULT_HASHTAGS, '#' + make, '#londondealer', '#samotor'].filter(Boolean).join(' ');
}
