// office/app/components/detail-drawer.js
// 汎用の右スライドドロワー（案件/タスク詳細・成果物詳細などで再利用）。
import { esc } from "../utils.js";

let scrimEl = null;
let drawerEl = null;

function ensureMounted() {
  if (scrimEl && drawerEl) return;
  scrimEl = document.createElement("div");
  scrimEl.className = "op-drawer-scrim";
  drawerEl = document.createElement("div");
  drawerEl.className = "op-drawer";
  drawerEl.setAttribute("role", "dialog");
  drawerEl.setAttribute("aria-modal", "true");
  document.body.appendChild(scrimEl);
  document.body.appendChild(drawerEl);
  scrimEl.addEventListener("click", closeDrawer);
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeDrawer(); });
}

export function openDrawer(title, bodyHtml) {
  ensureMounted();
  drawerEl.innerHTML = (
    '<div class="op-drawer__head">' +
      `<div class="op-drawer__title">${esc(title)}</div>` +
      '<button class="op-iconbtn" data-drawerclose aria-label="閉じる">✕</button>' +
    '</div>' +
    `<div class="op-drawer__body">${bodyHtml}</div>`
  );
  drawerEl.querySelector("[data-drawerclose]").addEventListener("click", closeDrawer);
  requestAnimationFrame(() => {
    scrimEl.classList.add("is-open");
    drawerEl.classList.add("is-open");
  });
  const focusable = drawerEl.querySelector("button, [href], input, select, textarea");
  if (focusable) focusable.focus();
  return drawerEl;
}

export function closeDrawer() {
  if (!scrimEl || !drawerEl) return;
  scrimEl.classList.remove("is-open");
  drawerEl.classList.remove("is-open");
}
