// office/app/views/routines.js
// コホマダ／KINOTO／FP事業のルーティン業務（note・Instagram・X等の定型運用）を、事業別・プラットフォーム別に一覧表示する。
import { store } from "../store.js";
import { getRoutines } from "../adapters.js";
import { esc } from "../utils.js";
import { bizMeta } from "../constants.js";
import { emptyState } from "../components/empty-state.js";
import { registerView } from "../router.js";

const ORDER = ["kohomada", "kinoto", "fp", "common"];

function routineCardHtml(r) {
  return (
    '<div class="op-card">' +
      '<div class="op-card__head">' +
        '<div style="font-size:20px" aria-hidden="true">🔁</div>' +
        `<div style="flex:1"><div class="op-card__title">${esc(r.platform)}</div>` +
        // URL未登録の場合のみ、アカウント名を見出し直下に出す（アカウントの区別がつくように）。
        // URLがある場合はボタン側にアカウント名を出すため、ここでは重複させない。
        (!r.url && r.accountLabel ? `<div class="op-card__meta">${esc(r.accountLabel)}</div>` : "") +
        (r.frequency ? `<div class="op-card__meta">${esc(r.frequency)}</div>` : "") +
        '</div>' +
      '</div>' +
      (r.detail ? `<div class="op-hint" style="margin:0 0 10px">${esc(r.detail)}</div>` : "") +
      (r.url
        ? `<a class="op-btn op-btn--primary op-btn--sm" href="${esc(r.url)}" target="_blank" rel="noopener">${esc(r.accountLabel || "アカウントを開く")} ↗</a>`
        : '<div class="op-hint">アカウントリンク未登録</div>') +
    '</div>'
  );
}

function render(container) {
  const state = store.state || {};
  let rows = getRoutines(state);
  if (store.business !== "all") rows = rows.filter((r) => r.business === store.business);

  container.innerHTML = (
    '<div class="op-view">' +
      '<div class="op-view-head"><h1>ルーティン業務</h1><span class="op-view-sub">note・Instagram・X等、事業ごとの定型運用と対象アカウントの一覧です</span></div>' +
      '<div data-list></div>' +
    '</div>'
  );

  const listMount = container.querySelector("[data-list]");
  if (!rows.length) {
    listMount.innerHTML = emptyState({
      ic: "🔁",
      title: "登録されたルーティン業務はまだありません",
      desc: "Claude Codeに「〇〇事業の△△運用をルーティン業務に登録して」と頼むと、ここに並びます。",
    });
    return;
  }

  const groups = {};
  rows.forEach((r) => { (groups[r.business] = groups[r.business] || []).push(r); });
  const keys = ORDER.filter((b) => groups[b] && groups[b].length)
    .concat(Object.keys(groups).filter((b) => ORDER.indexOf(b) === -1));

  listMount.innerHTML = keys.map((b) => (
    '<div style="margin-bottom:20px">' +
      `<div class="op-orgchart__dept-title">${esc(bizMeta(b).label)}</div>` +
      `<div class="op-grid">${groups[b].map(routineCardHtml).join("")}</div>` +
    '</div>'
  )).join("");
}

registerView("routines", { render });
