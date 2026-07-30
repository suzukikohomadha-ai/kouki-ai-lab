// office/app/utils.js
// 既存 index.html のインラインscriptにある esc()/escAttr() と同じ考え方の小さいヘルパー群。
// 既存コードは変更せず、ここに独立実装を持つ（依存を作らないための重複はあえて許容）。

export function esc(s) {
  return String(s == null ? "" : s).replace(/[&<>"]/g, (m) => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[m]
  ));
}

export function trunc(s, n) {
  s = String(s || "");
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}

export function fmtYen(v) {
  v = Number(v) || 0;
  return v >= 10000 ? (Math.round(v / 1000) / 10) + "万円" : v.toLocaleString() + "円";
}

export function fmtDate(iso) {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return String(iso);
    return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}`;
  } catch { return String(iso); }
}

export function h(html) {
  const t = document.createElement("template");
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
}

export function qs(root, sel) { return (root || document).querySelector(sel); }
export function qsa(root, sel) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

export function on(root, selector, event, handler) {
  root.addEventListener(event, (ev) => {
    const target = ev.target.closest(selector);
    if (target && root.contains(target)) handler(ev, target);
  });
}

// クリップボードコピー（既存 index.html の copyText と同じフォールバック方式の独立実装）
export function copyText(text) {
  if (navigator.clipboard && navigator.clipboard.writeText && window.isSecureContext) {
    return navigator.clipboard.writeText(text).then(() => true).catch(() => fallbackCopy(text));
  }
  return Promise.resolve(fallbackCopy(text));
}
function fallbackCopy(text) {
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed"; ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.focus(); ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  } catch { return false; }
}

export function flashButton(btn, okText, defaultText, ok) {
  const prev = btn.textContent;
  btn.textContent = ok ? (okText || "コピーしました ✓") : "⌘C でコピー";
  setTimeout(() => { btn.textContent = defaultText || prev; }, ok ? 1500 : 2200);
}
