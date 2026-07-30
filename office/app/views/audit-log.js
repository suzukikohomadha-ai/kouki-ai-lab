// office/app/views/audit-log.js
// P1・監査ログの保存先は現行データに存在しないため空状態を表示する（捏造しない）。
import { store } from "../store.js";
import { esc } from "../utils.js";
import { emptyState } from "../components/empty-state.js";
import { registerView } from "../router.js";

function render(container) {
  const activity = (store.state && store.state.activity) || [];
  container.innerHTML = (
    '<div class="op-view">' +
      '<div class="op-view-head"><h1>監査ログ</h1><span class="op-view-sub">P1・専用の監査ログは未実装。参考として state.js の activity（会社の動き）を表示します</span></div>' +
      (activity.length
        ? '<div class="op-table-wrap"><table class="op-table"><thead><tr><th>時刻</th><th>担当</th><th>内容</th></tr></thead><tbody>' +
          activity.map((a) => `<tr><td>${esc(a.time || "")}</td><td>${esc(a.who || "")}</td><td>${esc(a.text || "")}</td></tr>`).join("") +
          '</tbody></table></div>'
        : emptyState({ ic: "📜", title: "活動記録はまだありません" })) +
    '</div>'
  );
}

registerView("audit-log", { render });
