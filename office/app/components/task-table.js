// office/app/components/task-table.js
import { esc, trunc } from "../utils.js";
import { statusBadge, businessBadge } from "./status-badge.js";
import { riskBadge } from "./risk-badge.js";
import { emptyState } from "./empty-state.js";

// mode: "project" | "task" — 見出し文言が少し変わるだけで、データ構造は同じ（案件は暫定的にタスク=案件のため）
export function taskTableHtml(rows, mode) {
  if (!rows.length) {
    return emptyState({
      ic: mode === "project" ? "📁" : "📋",
      title: mode === "project" ? "案件がありません" : "タスクがありません",
      desc: "Claude Code のチャットで「今日やることを決めよう」と話すと、ここに並びます。",
    });
  }
  const idLabel = mode === "project" ? "案件ID" : "タスクID";
  return (
    '<div class="op-table-wrap op-table-wrap--cardify">' +
      '<table class="op-table">' +
        '<thead><tr>' +
          `<th>${idLabel}</th><th>タイトル</th><th>対象事業</th><th>担当</th><th>状態</th><th>進捗</th><th>成果物</th><th>リスク</th>` +
        '</tr></thead>' +
        '<tbody>' +
          rows.map((t) => (
            `<tr data-taskrow="${esc(t.id)}" tabindex="0">` +
              `<td data-label="${idLabel}">${esc(t.id || "-")}</td>` +
              `<td data-label="タイトル">${esc(trunc(t.title, 40))}</td>` +
              `<td data-label="対象事業">${businessBadge(t.business, t.businessIsGuessed)}</td>` +
              `<td data-label="担当">${esc(t.owner || "未定")}</td>` +
              `<td data-label="状態">${statusBadge(t.status)}</td>` +
              `<td data-label="進捗">${t.progress || 0}%</td>` +
              `<td data-label="成果物">${(t.deliverables || []).length}</td>` +
              `<td data-label="リスク">${riskBadge(t.risk)}</td>` +
            '</tr>'
          )).join("") +
        '</tbody>' +
      '</table>' +
    '</div>'
  );
}

export function bindTaskTable(container, rows, onRowClick) {
  container.querySelectorAll("[data-taskrow]").forEach((tr) => {
    const id = tr.getAttribute("data-taskrow");
    const row = rows.find((r) => r.id === id);
    if (!row) return;
    const open = () => onRowClick(row);
    tr.addEventListener("click", open);
    tr.addEventListener("keydown", (e) => { if (e.key === "Enter") open(); });
  });
}
