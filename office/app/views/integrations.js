// office/app/views/integrations.js
// 既存の window.openIntegrations（index.htmlインラインscript）をそのまま呼び出す薄いラッパー。
// 連携ロジックの再実装はしない（重複防止・既存の /health 確認ロジックを再利用）。
import { emptyState } from "../components/empty-state.js";
import { registerView } from "../router.js";

function render(container) {
  container.innerHTML = (
    '<div class="op-view">' +
      '<div class="op-view-head"><h1>連携状況</h1><span class="op-view-sub">Gmail・カレンダー・LINE の連携状況を確認できます</span></div>' +
      (window.openIntegrations
        ? '<div class="op-card"><div class="op-card__title" style="margin-bottom:10px">連携状況を開く</div>' +
          '<button class="op-btn op-btn--primary" data-openintegrations>連携状況を確認する</button>' +
          '<div class="op-hint" style="margin-top:8px">既存のパネル（オフィスモードと共通のロジック）が開きます。</div></div>'
        : emptyState({ ic: "🔌", title: "連携状況の機能が読み込まれていません" })) +
    '</div>'
  );
  const btn = container.querySelector("[data-openintegrations]");
  if (btn) btn.addEventListener("click", () => window.openIntegrations());
}

registerView("integrations", { render });
