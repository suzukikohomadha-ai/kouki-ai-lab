// office/app/components/status-badge.js
import { esc } from "../utils.js";
import { TASK_STATUS_LABEL } from "../constants.js";
import { bizMeta } from "../constants.js";

export function statusBadge(status) {
  const label = TASK_STATUS_LABEL[status] || status || "不明";
  const cls = status === "done" ? "success" : status === "review" ? "review" : status === "doing" ? "doing" : "idle";
  return `<span class="op-badge op-badge--${cls} op-badge--dot">${esc(label)}</span>`;
}

export function agentStatusBadge(status) {
  const map = { working: ["working", "作業中"], meeting: ["warning", "会議中"], idle: ["idle", "待機中"], error: ["danger", "エラー"] };
  const [cls, label] = map[status] || map.idle;
  return `<span class="op-badge op-badge--${cls} op-badge--dot">${esc(label)}</span>`;
}

export function businessBadge(id, guessed) {
  const m = bizMeta(id);
  return `<span class="op-biz op-biz--${m.cls}"><span class="op-biz__dot"></span>${esc(m.label)}${guessed ? "（仮）" : ""}</span>`;
}

export function mockBadge() {
  return '<span class="op-badge op-badge--mock">サンプルデータ</span>';
}
