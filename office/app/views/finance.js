// office/app/views/finance.js
// P1・財務/FPのデータモデルは現行未整備のためサンプル表示。
import { MOCK_FINANCE, MOCK_ENABLED } from "../mock-data.js";
import { esc } from "../utils.js";
import { emptyState } from "../components/empty-state.js";
import { mockBadge, businessBadge } from "../components/status-badge.js";
import { bizMeta } from "../constants.js";
import { registerView } from "../router.js";

function budgetRow(b) {
  const m = bizMeta(b.business);
  return `<tr><td>${esc(m.label)}</td><td>${b.budget != null ? esc(b.budget) : "未入力"}</td><td>${b.actual != null ? esc(b.actual) : "未入力"}</td><td>${esc(b.note)}</td></tr>`;
}

function subsidyCard(s) {
  return (
    '<div class="op-card">' +
      `<div class="op-card__head">${businessBadge(s.business, false)}<div style="flex:1"><div class="op-card__title">${esc(s.name)}</div></div>${mockBadge()}</div>` +
      '<dl class="op-approval__grid">' +
        `<dt>申請期限</dt><dd>${s.deadline ? esc(s.deadline) : "未入力"}</dd>` +
        `<dt>必要書類</dt><dd>${(s.requiredDocs || []).map(esc).join("、")}</dd>` +
        `<dt>状態</dt><dd>${esc(s.status)}</dd>` +
      '</dl>' +
      `<div class="op-hint">${esc(s.note)}</div>` +
    '</div>'
  );
}

function render(container) {
  const data = MOCK_ENABLED ? MOCK_FINANCE : { budgetVsActual: [], subsidies: [] };
  container.innerHTML = (
    '<div class="op-view">' +
      '<div class="op-view-head"><h1>財務・FP</h1><span class="op-view-sub">P1・事業別収支/補助金・助成金（サンプル表示）</span></div>' +
      '<div class="op-mockbanner">数値はすべてサンプルです。実績値として扱わないでください。</div>' +
      '<section><h2 style="font-size:13px;color:var(--op-text-3)">事業別 予算・実績</h2>' +
        (data.budgetVsActual.length
          ? '<div class="op-table-wrap"><table class="op-table"><thead><tr><th>事業</th><th>予算</th><th>実績</th><th>備考</th></tr></thead><tbody>' + data.budgetVsActual.map(budgetRow).join("") + '</tbody></table></div>'
          : emptyState({ ic: "💰", title: "収支データはまだありません" })) +
      '</section>' +
      '<section><h2 style="font-size:13px;color:var(--op-text-3)">補助金・助成金</h2>' +
        (data.subsidies.length ? '<div class="op-grid">' + data.subsidies.map(subsidyCard).join("") + '</div>' : emptyState({ ic: "📄", title: "補助金候補はまだありません" })) +
      '</section>' +
    '</div>'
  );
}

registerView("finance", { render });
