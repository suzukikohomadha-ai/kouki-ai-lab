// office/app/components/deliverable-card.js
import { esc } from "../utils.js";
import { businessBadge } from "./status-badge.js";
import { emptyState } from "./empty-state.js";

function iconFor(type) {
  const t = String(type || "");
  if (/スプレッド|sheet/i.test(t)) return "📊";
  if (/ドキュメント|doc/i.test(t)) return "📝";
  if (/契約/i.test(t)) return "📃";
  if (/チラシ|LINE|LP|Web|コード|code/i.test(t)) return "🖥";
  if (/n8n|ワークフロー/i.test(t)) return "🔗";
  if (/財務|FP|補助金/i.test(t)) return "💰";
  return "📄";
}

export function deliverableCardHtml(d) {
  const canOpen = !!(d.url || d.path);
  return (
    `<div class="op-card op-deliverable" data-deliverable="${esc(d.key)}">` +
      '<div class="op-card__head">' +
        `<div style="font-size:20px" aria-hidden="true">${iconFor(d.type)}</div>` +
        `<div style="flex:1"><div class="op-card__title">${esc(d.title)}</div>` +
        `<div class="op-card__meta">${esc(d.type || "種別未設定")} ・ 関連案件：${esc(d.project || "-")}</div></div>` +
        businessBadge(d.business, d.businessIsGuessed) +
      '</div>' +
      '<dl class="op-deliverable__grid">' +
        `<dt>作成エージェント</dt><dd>${esc(d.owner || "未定")}</dd>` +
        `<dt>レビューエージェント</dt><dd>${d.reviewer ? esc(d.reviewer) : "未確認"}</dd>` +
        `<dt>バージョン</dt><dd>${d.version != null ? esc(d.version) : "未入力"}</dd>` +
        `<dt>作成日</dt><dd>${d.createdAt ? esc(d.createdAt) : "未入力"}</dd>` +
      '</dl>' +
      (canOpen
        ? `<button class="op-btn op-btn--primary op-btn--sm" data-openpath="${esc(d.key)}">開く</button>`
        : '<div class="op-hint">実ファイル・URLが未登録のため、開く操作は表示していません（本文のみ保持）</div>') +
    '</div>'
  );
}

export function deliverablesListHtml(rows) {
  if (!rows.length) {
    return emptyState({ ic: "📦", title: "成果物はまだありません", desc: "社員に仕事を任せると、ここに納品されます。" });
  }
  return '<div class="op-grid">' + rows.map(deliverableCardHtml).join("") + '</div>';
}
