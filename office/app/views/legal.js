// office/app/views/legal.js
// P1・サンプル表示。「法的問題なし」と断定するUIは作らない。
import { MOCK_LEGAL, MOCK_ENABLED } from "../mock-data.js";
import { esc } from "../utils.js";
import { emptyState } from "../components/empty-state.js";
import { mockBadge, businessBadge } from "../components/status-badge.js";
import { legalVerdictBadge, riskBadge } from "../components/risk-badge.js";
import { registerView } from "../router.js";

function card(l) {
  return (
    '<div class="op-card">' +
      `<div class="op-card__head">${businessBadge(l.business, false)}<div style="flex:1"><div class="op-card__title">${esc(l.title)}</div>` +
      `<div class="op-card__meta">${esc(l.type)}</div></div>${mockBadge()}</div>` +
      `<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:8px">${legalVerdictBadge(l.verdict)}${riskBadge(l.risk)}</div>` +
      `<div style="font-size:12px;color:var(--op-text-2)">${esc(l.note)}</div>` +
    '</div>'
  );
}

function render(container) {
  const rows = MOCK_ENABLED ? MOCK_LEGAL : [];
  container.innerHTML = (
    '<div class="op-view">' +
      '<div class="op-view-head"><h1>法務・リスク</h1><span class="op-view-sub">P1・契約書/許認可等の状況（サンプル表示）</span></div>' +
      '<div class="op-mockbanner">この一覧は「法的問題なし」を保証するものではありません。最終判断は必ずリョウの論点整理と、必要に応じた弁護士確認を経てください。</div>' +
      (rows.length ? '<div class="op-grid">' + rows.map(card).join("") + '</div>' : emptyState({ ic: "⚖️", title: "法務案件はまだありません" })) +
    '</div>'
  );
}

registerView("legal", { render });
