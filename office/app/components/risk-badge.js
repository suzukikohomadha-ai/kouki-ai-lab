// office/app/components/risk-badge.js
import { esc } from "../utils.js";

const LABELS = { low: "リスク低", mid: "リスク中", high: "リスク高", unknown: "未評価" };

export function riskBadge(level) {
  const l = LABELS[level] ? level : "unknown";
  return `<span class="op-badge op-risk--${l}">${esc(LABELS[l])}</span>`;
}

const VERDICT_LABELS = {
  ai_first: "AI一次確認", recommend: "専門家確認推奨", required: "専門家確認必須",
  confirmed: "確認済み", unconfirmed: "未確認",
};
export function legalVerdictBadge(verdict) {
  const v = VERDICT_LABELS[verdict] ? verdict : "unconfirmed";
  return `<span class="op-badge op-legal-verdict--${v}">${esc(VERDICT_LABELS[v])}</span>`;
}
