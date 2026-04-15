// ══════════════════════════════════════════════
// DealerOS — Media Manager
// ══════════════════════════════════════════════
import { state, saveToStorage } from './state.js';
import { normP, escHtml, escJs, setInner, setText } from './utils.js';
import { openM, closeM } from './nav.js';
import { PHOTO_ORDER_TEMPLATE, PHOTO_TAG_LABELS, atStatusLabel, openATFromStock, renderPhotoGrid } from './pages/autotrader.js';
import { openIGFromStock } from './pages/instagram.js';

let currentMediaPlate = '';
let dragSrcIdx = null;

export function openMediaManager(plate, model) {
  currentMediaPlate = plate;
  setText('media-title', (model || plate) + ' — Media');
  setText('media-sub', plate);
  refreshMediaModal();
  openM('media');
}

export function refreshMediaModal() {
  const plate = currentMediaPlate;
  const pics = state.vehiclePhotos[normP(plate)] || [];
  setText('media-photo-count', '(' + pics.length + ')');
  setInner('media-photo-grid',
    renderPhotoGrid(plate) +
    (pics.length < 20
      ? `<div class="ph-empty" onclick="document.getElementById('media-file-input').click()"><div style="font-size:22px;">+</div><div>Add photo</div></div>`
      : ''));

  const atL  = state.atListings.find(l => normP(l.plate) === normP(plate));
  const igP  = state.igPosts.filter(p => normP(p.plate) === normP(plate));
  const atUploaded = pics.filter(p => p.atUploaded).length;

  setInner('media-listing-status',
    `<div class="irow" style="padding:6px 0;"><span class="lbl">AT Status</span><span class="val"><span class="at-status ${atL ? 'at-' + atL.status : 'at-none'}">${atL ? atStatusLabel(atL.status) : 'No listing'}</span></span></div>` +
    `<div class="irow" style="padding:6px 0;"><span class="lbl">AT Photos</span><span class="val">${atUploaded} / ${pics.length} pushed</span></div>` +
    `<div class="irow" style="padding:6px 0;"><span class="lbl">IG Posts</span><span class="val">${igP.length} post${igP.length !== 1 ? 's' : ''} (${igP.filter(p => p.status === 'posted').length} live)</span></div>` +
    `<div class="irow" style="padding:6px 0;"><span class="lbl">Cover Photo</span><span class="val">${pics.find(p => p.cover) ? '✓ Set' : '⚠️ Not set'}</span></div>`);

  setInner('media-quick-actions',
    `<button class="btn btn-b" style="width:100%;" onclick="openATFromStock('${escJs(plate)}')">🌐 Auto Trader Listing</button>` +
    `<button class="btn btn-amber" style="width:100%;" onclick="closeM('media');openIGFromStock('${escJs(plate)}')">📱 Post to Instagram</button>` +
    `<button class="btn btn-g" style="width:100%;" onclick="autoOrderPhotos()">🔁 Auto Order Photos</button>` +
    `<button class="btn btn-g" style="width:100%;" onclick="document.getElementById('media-file-input').click()">+ Add More Photos</button>`);
}

export function handleMediaUpload(input) {
  const plate = currentMediaPlate;
  if (!plate || !input.files.length) return;
  const np = normP(plate);
  if (!state.vehiclePhotos[np]) state.vehiclePhotos[np] = [];
  const pics = state.vehiclePhotos[np];
  [...input.files].forEach((file, i) => {
    const url = URL.createObjectURL(file);
    const tag = PHOTO_ORDER_TEMPLATE[pics.length] || 'front';
    pics.push({ id: 'ph-' + Date.now() + '-' + i, url, tag, cover: pics.length === 0, order: pics.length, atUploaded: false, igUsed: false });
  });
  state.vehiclePhotos[np] = pics;
  saveToStorage();
  refreshMediaModal();
}

export function handleATPhotoUpload(input) {
  const plate = state.currentATListing ? state.currentATListing.plate : '';
  if (!plate || !input.files.length) return;
  const np = normP(plate);
  if (!state.vehiclePhotos[np]) state.vehiclePhotos[np] = [];
  const pics = state.vehiclePhotos[np];
  [...input.files].forEach((file, i) => {
    const url = URL.createObjectURL(file);
    const tag = PHOTO_ORDER_TEMPLATE[pics.length] || 'front';
    pics.push({ id: 'ph-' + Date.now() + '-' + i, url, tag, cover: pics.length === 0, order: pics.length, atUploaded: false, igUsed: false });
  });
  state.vehiclePhotos[np] = pics;
  saveToStorage();
  setInner('at-photo-grid', renderPhotoGrid(plate));
}

export function setCoverPhoto(np, idx) {
  const pics = state.vehiclePhotos[np];
  if (!pics) return;
  pics.forEach((p, i) => p.cover = (i === idx));
  state.vehiclePhotos[np] = pics;
  saveToStorage();
  if (currentMediaPlate && normP(currentMediaPlate) === np) refreshMediaModal();
  if (state.currentATListing && normP(state.currentATListing.plate) === np) setInner('at-photo-grid', renderPhotoGrid(state.currentATListing.plate));
}

export function setPhotoTag(np, idx, tag) {
  const pics = state.vehiclePhotos[np];
  if (!pics || !pics[idx]) return;
  pics[idx].tag = tag;
  state.vehiclePhotos[np] = pics;
  saveToStorage();
}

export function deletePhoto(np, idx) {
  const pics = state.vehiclePhotos[np];
  if (!pics) return;
  pics.splice(idx, 1);
  if (pics.length && !pics.some(p => p.cover)) pics[0].cover = true;
  state.vehiclePhotos[np] = pics;
  saveToStorage();
  if (currentMediaPlate && normP(currentMediaPlate) === np) refreshMediaModal();
  if (state.currentATListing && normP(state.currentATListing.plate) === np) setInner('at-photo-grid', renderPhotoGrid(state.currentATListing.plate));
}

export function autoOrderPhotos() {
  const np = state.currentATListing
    ? normP(state.currentATListing.plate)
    : (currentMediaPlate ? normP(currentMediaPlate) : '');
  if (!np) return;
  const pics = state.vehiclePhotos[np] || [];
  pics.sort((a, b) => {
    const ai = PHOTO_ORDER_TEMPLATE.indexOf(a.tag);
    const bi = PHOTO_ORDER_TEMPLATE.indexOf(b.tag);
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });
  pics.forEach((p, i) => p.order = i);
  state.vehiclePhotos[np] = pics;
  saveToStorage();
  if (state.currentATListing && normP(state.currentATListing.plate) === np) setInner('at-photo-grid', renderPhotoGrid(state.currentATListing.plate));
  if (currentMediaPlate && normP(currentMediaPlate) === np) refreshMediaModal();
}

export function dragPhotoStart(e, idx) {
  dragSrcIdx = idx;
  e.dataTransfer.effectAllowed = 'move';
}

export function dragPhotoDrop(e, idx) {
  e.preventDefault();
  const np = state.currentATListing
    ? normP(state.currentATListing.plate)
    : (currentMediaPlate ? normP(currentMediaPlate) : '');
  if (!np || dragSrcIdx === null || dragSrcIdx === idx) return;
  const pics = state.vehiclePhotos[np] || [];
  const moved = pics.splice(dragSrcIdx, 1)[0];
  pics.splice(idx, 0, moved);
  pics.forEach((p, i) => { p.order = i; p.cover = (i === 0); });
  state.vehiclePhotos[np] = pics;
  saveToStorage();
  if (state.currentATListing && normP(state.currentATListing.plate) === np) setInner('at-photo-grid', renderPhotoGrid(state.currentATListing.plate));
  if (currentMediaPlate && normP(currentMediaPlate) === np) refreshMediaModal();
  dragSrcIdx = null;
}
