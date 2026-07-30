// office/app/views/creative.js
// P1・データ源なしのためモック表示。
import { MOCK_CREATIVE, MOCK_ENABLED } from "../mock-data.js";
import { esc } from "../utils.js";
import { emptyState } from "../components/empty-state.js";
import { mockBadge, businessBadge } from "../components/status-badge.js";
import { registerView } from "../router.js";

function card(c) {
  return (
    '<div class="op-card">' +
      `<div class="op-card__head">${businessBadge(c.business, false)}<div style="flex:1"><div class="op-card__title">${esc(c.title)}</div></div>${mockBadge()}</div>` +
      '<dl class="op-approval__grid">' +
        `<dt>目的</dt><dd>${esc(c.purpose || "-")}</dd>` +
        `<dt>ターゲット</dt><dd>${esc(c.target || "-")}</dd>` +
        `<dt>媒体</dt><dd>${esc(c.media || "-")}</dd>` +
        `<dt>サイズ</dt><dd>${c.size ? esc(c.size) : "未入力"}</dd>` +
        `<dt>CTA</dt><dd>${c.cta ? esc(c.cta) : "未入力"}</dd>` +
        `<dt>バージョン</dt><dd>${esc(c.version)}</dd>` +
        `<dt>制作状態</dt><dd>${esc(c.productionStatus)}</dd>` +
        `<dt>レビュー状態</dt><dd>${esc(c.reviewStatus)}</dd>` +
        `<dt>承認状態</dt><dd>${esc(c.approvalStatus)}</dd>` +
      '</dl>' +
    '</div>'
  );
}

function render(container) {
  const rows = MOCK_ENABLED ? MOCK_CREATIVE : [];
  container.innerHTML = (
    '<div class="op-view">' +
      '<div class="op-view-head"><h1>クリエイティブ</h1><span class="op-view-sub">P1・Canva/チラシ/LINE/LP等の制作物管理（サンプル表示）</span></div>' +
      (rows.length
        ? '<div class="op-mockbanner">このリストはすべてサンプルデータです。実データではありません。</div><div class="op-grid">' + rows.map(card).join("") + '</div>'
        : emptyState({ ic: "🎨", title: "クリエイティブ管理対象はまだありません" })) +
    '</div>'
  );
}

registerView("creative", { render });
