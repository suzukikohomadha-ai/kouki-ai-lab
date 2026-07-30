// office/app/views/notifications.js
// P1・現行データに通知の保存先が無いため、常に空状態を表示する（捏造しない）。
import { emptyState } from "../components/empty-state.js";
import { registerView } from "../router.js";

function render(container) {
  container.innerHTML = (
    '<div class="op-view">' +
      '<div class="op-view-head"><h1>通知</h1><span class="op-view-sub">P1・通知データの保存先は未実装です</span></div>' +
      emptyState({ ic: "🔔", title: "通知はまだありません", desc: "通知機能はこのUI追加の対象外（P1未実装）です。重要事項はホームの「重要アラート」と「承認待ち」を確認してください。" }) +
    '</div>'
  );
}

registerView("notifications", { render });
