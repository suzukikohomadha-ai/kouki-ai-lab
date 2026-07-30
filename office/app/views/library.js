// office/app/views/library.js
// P1・簡易横断検索（フロントエンド上の絞り込みのみ）。実データ（タスク/成果物/エージェント）＋モック（リサーチ/クリエイティブ等）を束ねて表示する。
import { store } from "../store.js";
import { getTasks, getDeliverables, getAgentCards } from "../adapters.js";
import { MOCK_LIBRARY, MOCK_ENABLED } from "../mock-data.js";
import { esc } from "../utils.js";
import { emptyState } from "../components/empty-state.js";
import { mockBadge } from "../components/status-badge.js";
import { registerView } from "../router.js";

function buildIndex(state, company) {
  const items = [];
  getTasks(state).forEach((t) => items.push({ kind: "タスク", title: t.title, business: t.business, isMock: false }));
  getDeliverables(state).forEach((d) => items.push({ kind: "成果物", title: d.title, business: d.business, isMock: false }));
  getAgentCards(state, company).forEach((a) => items.push({ kind: "エージェント", title: `${a.name}（${a.role}）`, business: "common", isMock: false }));
  if (MOCK_ENABLED) MOCK_LIBRARY.forEach((m) => items.push({ kind: m.kind, title: m.title, business: m.business, isMock: true }));
  return items;
}

function row(it) {
  return (
    '<div class="op-card" style="padding:12px 16px">' +
      '<div style="display:flex;align-items:center;gap:10px">' +
        `<span class="op-tag">${esc(it.kind)}</span>` +
        `<span style="flex:1;font-size:13px">${esc(it.title)}</span>` +
        (it.isMock ? mockBadge() : "") +
      '</div>' +
    '</div>'
  );
}

function render(container) {
  const state = store.state || {};
  const company = store.company || {};
  const all = buildIndex(state, company);

  container.innerHTML = (
    '<div class="op-view">' +
      '<div class="op-view-head"><h1>ライブラリ</h1><span class="op-view-sub">案件・タスク・成果物・リサーチ・エージェント等を横断検索できます（簡易版）</span></div>' +
      '<div class="op-filterbar"><input type="search" data-libsearch placeholder="キーワードで絞り込み" style="background:var(--op-surface-2);border:1px solid var(--op-border);color:var(--op-text);border-radius:8px;padding:7px 11px;font-size:12.5px;flex:1;max-width:320px"></div>' +
      '<div data-liblist></div>' +
    '</div>'
  );

  const listEl = container.querySelector("[data-liblist]");
  function paint(filterText) {
    const f = (filterText || "").trim().toLowerCase();
    const rows = f ? all.filter((it) => it.title.toLowerCase().indexOf(f) !== -1) : all;
    listEl.innerHTML = rows.length ? rows.map(row).join("") : emptyState({ ic: "\u{1F4DA}", title: "該当する項目が見つかりません" });
  }
  paint("");
  container.querySelector("[data-libsearch]").addEventListener("input", (e) => paint(e.target.value));
}

registerView("library", { render });
