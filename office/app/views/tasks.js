// office/app/views/tasks.js
import { store } from "../store.js";
import { getTasks } from "../adapters.js";
import { taskTableHtml, bindTaskTable } from "../components/task-table.js";
import { filterBarHtml, bindFilterBar } from "../components/filter-bar.js";
import { openDrawer } from "../components/detail-drawer.js";
import { statusBadge, businessBadge } from "../components/status-badge.js";
import { esc } from "../utils.js";
import { TASK_STATUS_LABEL } from "../constants.js";
import { registerView } from "../router.js";

const filters = { status: "all", owner: "all" };

function detailBody(t) {
  return (
    '<div style="display:flex;flex-direction:column;gap:12px">' +
      `<div>${businessBadge(t.business, t.businessIsGuessed)} ${statusBadge(t.status)}</div>` +
      `<div style="font-size:15px;font-weight:700">${esc(t.title)}</div>` +
      (t.hint ? `<div class="op-hint">社長への確認事項：${esc(t.hint)}</div>` : "") +
      (t.cmd ? `<div class="op-prompt" style="background:var(--op-surface-2);border:1px dashed var(--op-border);border-radius:8px;padding:10px;font-size:12.5px">${esc(t.cmd)}</div>` : "") +
      '<div><div style="font-size:12px;color:var(--op-text-3);margin-bottom:4px">成果物（' + t.deliverables.length + '件）</div>' +
        (t.deliverables.length
          ? '<ul style="margin:0;padding-left:16px;font-size:12.5px">' + t.deliverables.map((d) => `<li>${esc(d.title || "無題")}</li>`).join("") + '</ul>'
          : '<div class="op-hint">まだありません</div>') +
      '</div>' +
    '</div>'
  );
}

function render(container) {
  const state = store.state || {};
  let rows = getTasks(state);
  if (store.business !== "all") rows = rows.filter((r) => r.business === store.business);
  if (filters.status !== "all") rows = rows.filter((r) => r.status === filters.status);

  container.innerHTML = (
    '<div class="op-view">' +
      '<div class="op-view-head"><h1>タスク</h1><span class="op-view-sub">全エージェントのタスクを一覧できます</span></div>' +
      '<div data-filterbar></div>' +
      '<div data-table></div>' +
    '</div>'
  );

  const filterMount = container.querySelector("[data-filterbar]");
  filterMount.innerHTML = filterBarHtml([
    { key: "status", label: "ステータス", options: [{ value: "all", label: "すべてのステータス" }].concat(Object.keys(TASK_STATUS_LABEL).slice(0, 4).map((k) => ({ value: k, label: TASK_STATUS_LABEL[k] }))) },
  ], filters);
  bindFilterBar(filterMount, (key, value) => { filters[key] = value; render(container); });

  const tableMount = container.querySelector("[data-table]");
  tableMount.innerHTML = taskTableHtml(rows, "task");
  bindTaskTable(tableMount, rows, (row) => openDrawer(row.title, detailBody(row)));
}

registerView("tasks", { render });
