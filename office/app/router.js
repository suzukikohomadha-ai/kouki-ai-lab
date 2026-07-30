// office/app/router.js
// フレームワーク無しの簡易ハッシュルーター。オペレーションモード専用（#opshell内のみ）。

import { store, setView } from "./store.js";

const views = new Map(); // id -> { render(container), title }

export function registerView(id, def) {
  views.set(id, def);
}

export function getViewIds() { return Array.from(views.keys()); }
export function hasView(id) { return views.has(id); }

export function navigate(id) {
  if (!views.has(id)) id = "dashboard";
  if (location.hash !== "#/" + id) {
    location.hash = "#/" + id;
  } else {
    render(id);
  }
}

function currentIdFromHash() {
  const m = /^#\/(.+)$/.exec(location.hash || "");
  return m ? m[1] : null;
}

let containerEl = null;
let mountedId = null;

export function initRouter(container) {
  containerEl = container;
  window.addEventListener("hashchange", () => render(currentIdFromHash() || store.view));
  const initial = currentIdFromHash() || store.view || "dashboard";
  render(initial);
}

export function render(id) {
  if (!containerEl) return;
  if (!views.has(id)) id = "dashboard";
  mountedId = id;
  setView(id);
  const def = views.get(id);
  containerEl.innerHTML = "";
  try {
    def.render(containerEl);
  } catch (e) {
    console.error("[ops-router] view render error:", id, e);
    containerEl.innerHTML = (
      '<div class="op-state op-state--error">' +
        '<div class="op-state__ic">⚠️</div>' +
        '<div class="op-state__title">この画面の表示中にエラーが発生しました</div>' +
        '<div class="op-state__desc">' + (e && e.message ? String(e.message) : "詳細はコンソールを確認してください。") + '</div>' +
      '</div>'
    );
  }
}

export function rerenderCurrent() {
  if (mountedId) render(mountedId);
}

export function getMountedId() { return mountedId; }
