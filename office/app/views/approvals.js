// office/app/views/approvals.js
import { store, setApprovalOverride } from "../store.js";
import { getApprovals } from "../adapters.js";
import { approvalsListHtml } from "../components/approval-card.js";
import { copyText, flashButton } from "../utils.js";
import { registerView, rerenderCurrent } from "../router.js";

function render(container) {
  const state = store.state || {};
  let rows = getApprovals(state, store.localApprovalOverrides);
  if (store.business !== "all") rows = rows.filter((r) => r.business === store.business);

  container.innerHTML = (
    '<div class="op-view">' +
      '<div class="op-view-head"><h1>承認待ち</h1><span class="op-view-sub">承認/差し戻し/保留はこの画面上のローカル表示のみです（バックエンド未接続）</span></div>' +
      '<div class="op-mockbanner">⚠ ここでの操作は state.js を更新しません。実際の承認は、対象タスクの内容をチャットで社長がClaude Codeへ伝える必要があります。</div>' +
      '<div data-list></div>' +
    '</div>'
  );

  const listMount = container.querySelector("[data-list]");
  listMount.innerHTML = approvalsListHtml(rows);

  listMount.querySelectorAll("[data-approval]").forEach((card) => {
    const id = card.getAttribute("data-approval");
    card.querySelectorAll("[data-appr]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const action = btn.getAttribute("data-appr");
        if (action === "detail") return; // 詳細確認は将来ドロワー接続予定（P0では省略）
        setApprovalOverride(id, action);
        rerenderCurrent();
      });
    });
    const copyBtn = card.querySelector("[data-copycmd]");
    if (copyBtn) {
      copyBtn.addEventListener("click", () => {
        copyText(copyBtn.getAttribute("data-copycmd")).then((ok) => flashButton(copyBtn, "コピーしました ✓", "指示文をコピー", ok));
      });
    }
  });
}

registerView("approvals", { render });
