// ══════════════════════════════════════════════
// DealerOS — Shared utilities (pure, no side-effects)
// ══════════════════════════════════════════════

export function fmt(n) {
  return '£' + (n || 0).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
export function fmt0(n) {
  return '£' + Math.round(n || 0).toLocaleString('en-GB');
}
export function pc(p) {
  return p > 0 ? 'var(--green)' : p < 0 ? 'var(--red)' : 'var(--text3)';
}
export function dc(d) {
  return d > 90 ? 'dw' : d > 45 ? 'da' : 'dg';
}
export function fmtD(s) {
  if (!s || s.length < 6) return '—';
  try { return new Date(s).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' }); }
  catch (e) { return s; }
}
export function fmtDL(s) {
  if (!s) s = new Date().toISOString().slice(0, 10);
  try { return new Date(s).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }); }
  catch (e) { return s; }
}
export function mLabel(m) {
  return m ? new Date(m).toLocaleDateString('en-GB', { month: 'short', year: '2-digit' }) : '—';
}
export function normP(p) {
  return (p || '').replace(/\s/g, '').toUpperCase();
}
export function today() {
  return new Date().toISOString().slice(0, 10);
}
export function escHtml(v) {
  return String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
export function escJs(v) {
  return String(v ?? '').replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}
export function dlCSV(rows, name) {
  const csv = rows.map(r => r.map(c => '"' + (c || '').toString().replace(/"/g, '""') + '"').join(',')).join('\n');
  const a = document.createElement('a');
  a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
  a.download = name;
  a.click();
}
export function setInner(id, html) {
  const el = document.getElementById(id);
  if (el) el.innerHTML = html;
}
export function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}
