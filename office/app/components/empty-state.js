// office/app/components/empty-state.js
import { esc } from "../utils.js";

export function emptyState({ ic, title, desc } = {}) {
  return (
    '<div class="op-state">' +
      `<div class="op-state__ic" aria-hidden="true">${ic || "🗂"}</div>` +
      `<div class="op-state__title">${esc(title || "まだデータがありません")}</div>` +
      (desc ? `<div class="op-state__desc">${esc(desc)}</div>` : "") +
    '</div>'
  );
}

export function loadingState(label) {
  return (
    '<div class="op-state">' +
      '<div class="op-spinner" aria-hidden="true"></div>' +
      `<div class="op-state__title">${esc(label || "読み込み中…")}</div>` +
    '</div>'
  );
}

export function errorState({ title, desc } = {}) {
  return (
    '<div class="op-state op-state--error">' +
      '<div class="op-state__ic" aria-hidden="true">⚠️</div>' +
      `<div class="op-state__title">${esc(title || "表示できませんでした")}</div>` +
      (desc ? `<div class="op-state__desc">${esc(desc)}</div>` : "") +
    '</div>'
  );
}
