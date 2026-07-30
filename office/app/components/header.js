// office/app/components/header.js
import { NAV_GROUPS } from "../constants.js";
import { esc } from "../utils.js";
import { store } from "../store.js";
import { navigate } from "../router.js";
import { renderBusinessSwitcher } from "./business-switcher.js";

function currentTitle(viewId) {
  for (const g of NAV_GROUPS) {
    const it = g.items.find((i) => i.id === viewId);
    if (it) return it.label;
  }
  return "ホーム";
}

export function renderHeader(el, opts) {
  const counts = opts.counts || {};
  const approvalCount = counts.approvals || 0;
  el.innerHTML = (
    '<button class="op-iconbtn" data-collapse title="サイドバーの開閉" aria-label="サイドバーの開閉">' +
      '<svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M2 3h12M2 8h12M2 13h12" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>' +
    '</button>' +
    '<span class="op-header__logo">🏢 コウキAIラボ</span>' +
    '<span class="op-header__title">' + esc(currentTitle(store.view)) + '</span>' +
    '<div class="op-header__spacer"></div>' +
    '<div class="op-header__group" data-bizswitch></div>' +
    '<div class="op-header__group">' +
      '<div class="op-search"><span aria-hidden="true">🔎</span>' +
        '<input type="search" placeholder="横断検索（準備中）" disabled title="横断検索はP1で実装予定です。現在は未接続です。"></div>' +
      '<button class="op-iconbtn" data-nav="notifications" title="通知" aria-label="通知">🔔</button>' +
      '<button class="op-iconbtn" data-nav="approvals" title="承認待ち" aria-label="承認待ち">' +
        '🖐' + (approvalCount ? '<span class="op-navitem__badge" style="position:absolute;top:2px;right:2px">' + approvalCount + '</span>' : "") +
      '</button>' +
      '<button class="op-btn op-btn--sm" data-modetoggle title="オペレーション/オフィス表示の切替">' +
        (opts.mode === "office" ? "🏢" : "🖥") +
        '<span class="op-modetoggle-label">' + (opts.mode === "office" ? " オフィス表示中" : " オペレーション表示中") + '</span>' +
      '</button>' +
      '<button class="op-iconbtn" data-nav="settings" title="設定" aria-label="設定">⚙️</button>' +
    '</div>'
  );

  // [data-collapse] の挙動（幅に応じて折りたたみ/ドロワーを切替）は main.js 側で一括ハンドリングする。
  el.querySelectorAll("[data-nav]").forEach((btn) => btn.addEventListener("click", () => navigate(btn.getAttribute("data-nav"))));
  const modeBtn = el.querySelector("[data-modetoggle]");
  if (modeBtn && opts.onModeToggle) modeBtn.addEventListener("click", opts.onModeToggle);

  const bizMount = el.querySelector("[data-bizswitch]");
  if (bizMount) renderBusinessSwitcher(bizMount);
}
