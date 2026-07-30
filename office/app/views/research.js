// office/app/views/research.js
// P1・データ源なしのためモック表示（isMock:true のサンプルのみ）。
import { store } from "../store.js";
import { MOCK_RESEARCH, MOCK_ENABLED } from "../mock-data.js";
import { esc } from "../utils.js";
import { emptyState } from "../components/empty-state.js";
import { mockBadge } from "../components/status-badge.js";
import { registerView } from "../router.js";

function evidenceTag(cat) {
  const map = { "確認済み事実": "fact", "推測": "guess", "仮説": "hypo", "提案": "hypo", "未確認": "unconfirmed" };
  const cls = map[cat] || "unconfirmed";
  return `<span class="op-badge op-evidence-tag--${cls}">${esc(cat)}</span>`;
}

function row(r) {
  return (
    '<div class="op-card">' +
      `<div class="op-card__head"><div style="flex:1"><div class="op-card__title">${esc(r.theme)}</div>` +
      `<div class="op-card__meta">担当：${esc(r.owner || "-")}</div></div>${mockBadge()}</div>` +
      `<div style="font-size:12.5px;color:var(--op-text-2);margin-bottom:8px">${esc(r.body)}</div>` +
      '<dl class="op-approval__grid">' +
        `<dt>情報分類</dt><dd>${evidenceTag(r.category)}</dd>` +
        `<dt>一次情報か</dt><dd>${r.isPrimary ? "はい" : "いいえ"}</dd>` +
        `<dt>出典</dt><dd>${r.source ? esc(r.source) : "なし（実在しない出典は作成していません）"}</dd>` +
        `<dt>確認日</dt><dd>${r.confirmedAt ? esc(r.confirmedAt) : "未確認"}</dd>` +
      '</dl>' +
    '</div>'
  );
}

function render(container) {
  const rows = MOCK_ENABLED ? MOCK_RESEARCH : [];
  container.innerHTML = (
    '<div class="op-view">' +
      '<div class="op-view-head"><h1>リサーチ</h1><span class="op-view-sub">P1・現行データに調査記録の保存先が無いため、サンプル表示です</span></div>' +
      (rows.length
        ? '<div class="op-mockbanner">このリストはすべてサンプルデータです。実データではありません。</div><div class="op-grid">' + rows.map(row).join("") + '</div>'
        : emptyState({ ic: "🔍", title: "リサーチ記録はまだありません" })) +
    '</div>'
  );
}

registerView("research", { render });
