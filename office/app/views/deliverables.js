// office/app/views/deliverables.js
import { store } from "../store.js";
import { getDeliverables } from "../adapters.js";
import { deliverablesListHtml } from "../components/deliverable-card.js";
import { registerView } from "../router.js";

function openDeliverableViaExisting(d) {
  // 既存 index.html の openDeliverableSmart（URL/ローカルパスをOSで開く既存ロジック）を再利用する。
  // 未読み込み環境（存在しない場合）は何もしない（新規ロジックの重複実装をしない）。
  if (window.openDeliverableSmart) {
    window.openDeliverableSmart({ title: d.title, type: d.type, at: d.createdAt, body: d.body, url: d.url, path: d.path, app: d.app });
  }
}

function render(container) {
  const state = store.state || {};
  let rows = getDeliverables(state);
  if (store.business !== "all") rows = rows.filter((r) => r.business === store.business);

  container.innerHTML = (
    '<div class="op-view">' +
      '<div class="op-view-head"><h1>成果物</h1><span class="op-view-sub">タスクに紐づく成果物の一覧です</span></div>' +
      '<div data-list></div>' +
    '</div>'
  );

  const listMount = container.querySelector("[data-list]");
  listMount.innerHTML = deliverablesListHtml(rows);
  listMount.querySelectorAll("[data-openpath]").forEach((btn) => {
    const key = btn.getAttribute("data-openpath");
    const row = rows.find((r) => r.key === key);
    if (row) btn.addEventListener("click", () => openDeliverableViaExisting(row));
  });
}

registerView("deliverables", { render });
