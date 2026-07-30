// office/app/components/approval-card.js
import { esc } from "../utils.js";
import { businessBadge } from "./status-badge.js";
import { emptyState } from "./empty-state.js";

const LOCAL_LABEL = { pending: "未対応", approved: "承認済み（ローカル表示のみ）", rejected: "差し戻し（ローカル表示のみ）", hold: "保留（ローカル表示のみ）" };

export function approvalCardHtml(a) {
  return (
    `<div class="op-card op-approval" data-approval="${esc(a.id)}">` +
      '<div class="op-card__head">' +
        `<div style="flex:1"><div class="op-card__title">${esc(a.title)}</div>` +
        `<div class="op-card__meta">${esc(a.id)} ・ 担当：${esc(a.owner || "未定")}</div></div>` +
        businessBadge(a.business, a.businessIsGuessed) +
      '</div>' +
      '<dl class="op-approval__grid">' +
        `<dt>実行内容</dt><dd>${esc(a.hint || a.title)}</dd>` +
        `<dt>影響範囲</dt><dd>未入力</dd>` +
        `<dt>費用</dt><dd>${a.cost != null ? esc(a.cost) : "未入力"}</dd>` +
        `<dt>テスト結果</dt><dd>${a.testResult != null ? esc(a.testResult) : "未入力"}</dd>` +
        `<dt>ロールバック方法</dt><dd>${a.rollback != null ? esc(a.rollback) : "未入力"}</dd>` +
        `<dt>承認期限</dt><dd>${a.deadline != null ? esc(a.deadline) : "未入力"}</dd>` +
      '</dl>' +
      `<div class="op-approval__unconnected">現在の状態：<b>${esc(LOCAL_LABEL[a.localStatus] || "未対応")}</b>（バックエンド未接続。承認/差し戻し/保留はこの画面上の表示のみが変わり、実際の処理は行われません）</div>` +
      '<div class="op-approval__actions">' +
        `<button class="op-btn op-btn--primary op-btn--sm" data-appr="approved">承認</button>` +
        `<button class="op-btn op-btn--danger op-btn--sm" data-appr="rejected">差し戻し</button>` +
        `<button class="op-btn op-btn--sm" data-appr="hold">保留</button>` +
        `<button class="op-btn op-btn--ghost op-btn--sm" data-appr="detail">詳細確認</button>` +
        (a.cmd ? `<button class="op-btn op-btn--ghost op-btn--sm" data-copycmd="${esc(a.cmd)}">指示文をコピー</button>` : "") +
      '</div>' +
    '</div>'
  );
}

export function approvalsListHtml(rows) {
  if (!rows.length) {
    return emptyState({ ic: "🖐", title: "承認待ちはありません", desc: "確認が必要な事項が発生すると、ここに表示されます。" });
  }
  return '<div class="op-grid op-grid--2">' + rows.map(approvalCardHtml).join("") + '</div>';
}
