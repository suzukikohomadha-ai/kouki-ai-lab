// office/app/views/projects.js
import { store } from "../store.js";
import { getProjectsFromTasks } from "../adapters.js";
import { taskTableHtml, bindTaskTable } from "../components/task-table.js";
import { filterBarHtml, bindFilterBar } from "../components/filter-bar.js";
import { openDrawer } from "../components/detail-drawer.js";
import { statusBadge, businessBadge } from "../components/status-badge.js";
import { riskBadge } from "../components/risk-badge.js";
import { esc } from "../utils.js";
import { BUSINESSES, TASK_STATUS_LABEL } from "../constants.js";
import { registerView } from "../router.js";

const filters = { status: "all" };

function detailBody(p) {
  return (
    '<div style="display:flex;flex-direction:column;gap:12px">' +
      `<div>${businessBadge(p.business, p.businessIsGuessed)} ${statusBadge(p.status)} ${riskBadge(p.risk)}</div>` +
      `<div style="font-size:15px;font-weight:700">${esc(p.title)}</div>` +
      '<dl class="op-approval__grid">' +
        `<dt>案件ID（暫定＝タスクID）</dt><dd>${esc(p.id)}</dd>` +
        `<dt>顧客・関係者</dt><dd>未入力</dd>` +
        `<dt>担当エージェント</dt><dd>${esc(p.owner || "未定")}</dd>` +
        `<dt>期限</dt><dd>未入力</dd>` +
        `<dt>タスク件数</dt><dd>1（案件=タスクの仮マッピング）</dd>` +
        `<dt>成果物件数</dt><dd>${p.deliverables.length}</dd>` +
      '</dl>' +
      '<div class="op-hint">この画面は、現行データに「案件」の概念が無いため、タスクを1件=1案件として暫定表示しています（仮マッピング）。対象事業タグもタイトルからの簡易推定です。</div>' +
      (p.log.length
        ? '<div><div style="font-size:12px;color:var(--op-text-3);margin-bottom:4px">経過</div><ul style="margin:0;padding-left:16px;font-size:12.5px;color:var(--op-text-2)">' +
          p.log.map((l) => `<li>${esc(l.time || "")} ${esc(l.text || "")}</li>`).join("") + '</ul></div>'
        : "") +
    '</div>'
  );
}

function render(container) {
  const state = store.state || {};
  let rows = getProjectsFromTasks(state);
  if (store.business !== "all") rows = rows.filter((r) => r.business === store.business);
  if (filters.status !== "all") rows = rows.filter((r) => r.status === filters.status);

  container.innerHTML = (
    '<div class="op-view">' +
      '<div class="op-view-head"><h1>案件</h1><span class="op-view-sub">現在は state.js のタスクを1件=1案件として暫定表示しています</span></div>' +
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
  tableMount.innerHTML = taskTableHtml(rows, "project");
  bindTaskTable(tableMount, rows, (row) => openDrawer(row.title, detailBody(row)));
}

registerView("projects", { render });
