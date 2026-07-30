// office/app/views/settings.js
// 既存の window.openSetup（会社セットアップフォーム）をそのまま呼び出す薄いラッパー。
import { emptyState } from "../components/empty-state.js";
import { registerView } from "../router.js";

function render(container) {
  container.innerHTML = (
    '<div class="op-view">' +
      '<div class="op-view-head"><h1>設定</h1><span class="op-view-sub">会社の基本設定（既存のセットアップ画面を開きます）</span></div>' +
      (window.openSetup
        ? '<div class="op-card"><button class="op-btn op-btn--primary" data-opensetup>会社の基本設定を開く</button></div>'
        : emptyState({ ic: "⚙️", title: "設定機能が読み込まれていません" })) +
    '</div>'
  );
  const btn = container.querySelector("[data-opensetup]");
  if (btn) btn.addEventListener("click", () => window.openSetup());
}

registerView("settings", { render });
