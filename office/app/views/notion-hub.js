// office/app/views/notion-hub.js
// Notion「🚀 事業開発ハブ」のタスク管理DBを、サーバー経由（/api/tasks・server/lib/notion.js）でライブ取得して表示する。
// 内部のタスクボード（state.js の tasks、社員の進捗管理）とは別物。あくまでNotion側の実タスクの閲覧専用。
import { store } from "../store.js";
import { esc } from "../utils.js";
import { businessBadge } from "../components/status-badge.js";
import { loadingState, errorState, emptyState } from "../components/empty-state.js";
import { registerView } from "../router.js";

const HUB_URL = "https://pricey-legume-14e.notion.site/3a9040888e9781efab1ccbf858f14c0e";
const NOTION_BIZ_TO_ID = { "コホマダ": "kohomada", "DKN": "kinoto", "FP": "fp" };
const ID_TO_NOTION_BIZ = { kohomada: "コホマダ", kinoto: "DKN", fp: "FP" };
const ORDER = ["コホマダ", "DKN", "FP"];

const STATUS_BADGE = {
  "未着手": '<span class="op-badge op-badge--idle op-badge--dot">未着手</span>',
  "進行中": '<span class="op-badge op-badge--doing op-badge--dot">進行中</span>',
  "完了": '<span class="op-badge op-badge--success op-badge--dot">完了</span>',
};

function taskCardHtml(t) {
  const bizId = NOTION_BIZ_TO_ID[t.business] || null;
  return (
    '<div class="op-card">' +
      '<div class="op-card__head">' +
        `<div style="flex:1"><div class="op-card__title">${esc(t.title)}</div>` +
        `<div class="op-card__meta">${[t.type, t.priority ? "優先度：" + t.priority : "", t.due_date ? "期限：" + t.due_date : ""].filter(Boolean).map(esc).join(" ・ ")}</div></div>` +
        (bizId ? businessBadge(bizId, false) : "") +
      '</div>' +
      (STATUS_BADGE[t.status] || "") + " " +
      (t.owner ? `<span class="op-hint">担当：${esc(t.owner)}</span>` : "") +
      (t.requested_by ? `<span class="op-hint" style="margin-left:8px">依頼元：${esc(t.requested_by)}</span>` : "") +
      (t.url ? `<div style="margin-top:10px"><a class="op-btn op-btn--sm" href="${esc(t.url)}" target="_blank" rel="noopener">Notionで開く ↗</a></div>` : "") +
    '</div>'
  );
}

function paint(listMount, state) {
  if (state.kind === "loading") { listMount.innerHTML = loadingState("事業開発ハブから最新タスクを取得中…"); return; }
  if (state.kind === "error") { listMount.innerHTML = errorState({ title: "取得できませんでした", desc: state.message }); return; }
  if (state.kind === "not-configured") {
    listMount.innerHTML = emptyState({ ic: "🚀", title: "本体（server/）未接続のため取得できません", desc: "ローカルで本体を起動すると、Notionの最新タスクがここに表示されます。" });
    return;
  }
  let rows = state.items;
  if (store.business !== "all") {
    const wanted = ID_TO_NOTION_BIZ[store.business];
    rows = wanted ? rows.filter((t) => t.business === wanted) : rows.filter((t) => !NOTION_BIZ_TO_ID[t.business]);
  }
  if (!rows.length) {
    listMount.innerHTML = emptyState({ ic: "🚀", title: "該当するタスクはありません", desc: "Notionの📋タスク管理DBに追加すると、ここに反映されます。" });
    return;
  }
  const groups = {};
  rows.forEach((t) => { (groups[t.business] = groups[t.business] || []).push(t); });
  const keys = ORDER.filter((b) => groups[b] && groups[b].length)
    .concat(Object.keys(groups).filter((b) => ORDER.indexOf(b) === -1));
  listMount.innerHTML = keys.map((b) => (
    '<div style="margin-bottom:20px">' +
      `<div class="op-orgchart__dept-title">${esc(b)}</div>` +
      `<div class="op-grid">${groups[b].map(taskCardHtml).join("")}</div>` +
    '</div>'
  )).join("");
}

let renderToken = 0;

function render(container) {
  const myToken = ++renderToken;
  container.innerHTML = (
    '<div class="op-view">' +
      '<div class="op-view-head"><h1>事業開発ハブ</h1><span class="op-view-sub">Notion「🚀 事業開発ハブ」📋タスク管理DBを、本体経由でライブ取得した一覧です（社内タスクボードとは別管理）</span></div>' +
      `<div class="op-filterbar"><a class="op-btn op-btn--sm" href="${esc(HUB_URL)}" target="_blank" rel="noopener">🚀 Notionでハブ全体を開く ↗</a></div>` +
      '<div data-list></div>' +
    '</div>'
  );
  const listMount = container.querySelector("[data-list]");
  paint(listMount, { kind: "loading" });

  const base = (window.AI_CONFIG || {}).apiBase;
  if (!base) { paint(listMount, { kind: "not-configured" }); return; }
  fetch(base.replace(/\/$/, "") + "/api/tasks")
    .then((r) => { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
    .then((data) => {
      if (myToken !== renderToken) return; // 別画面に移動済み
      if (!data || data.configured === false) { paint(listMount, { kind: "not-configured" }); return; }
      paint(listMount, { kind: "ok", items: data.items || [] });
    })
    .catch((e) => {
      if (myToken !== renderToken) return;
      paint(listMount, { kind: "error", message: e.message });
    });
}

registerView("notion-hub", { render });
