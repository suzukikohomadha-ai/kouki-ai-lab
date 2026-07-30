// office/app/views/dashboard.js
import { store } from "../store.js";
import { esc, trunc } from "../utils.js";
import {
  getTopPriorities, getAlerts, getBusinessSummaries, getWorkforceSummary,
} from "../adapters.js";
import { businessBadge } from "../components/status-badge.js";
import { emptyState } from "../components/empty-state.js";
import { bizMeta } from "../constants.js";
import { registerView } from "../router.js";

function priorityCard(p) {
  return (
    '<div class="op-card op-priority-card">' +
      '<div class="op-priority-card__row1">' +
        businessBadge(p.business, p.businessIsGuessed) +
        `<span class="op-priority-card__title">${esc(p.title)}</span>` +
      '</div>' +
      `<div class="op-priority-card__why">${esc(p.reason)}</div>` +
      '<div class="op-priority-card__footer">' +
        `<span>期限：${p.due ? esc(p.due) : "未入力"}</span>` +
        `<span>次のアクション：${esc(p.nextAction)}</span>` +
      '</div>' +
    '</div>'
  );
}

function alertRow(a) {
  return (
    `<div class="op-alert op-alert--${a.level}">` +
      `<div class="op-alert__ic" aria-hidden="true">${a.ic}</div>` +
      `<div class="op-alert__body"><div class="op-alert__title">${esc(a.title)}</div><div class="op-alert__meta">${esc(a.meta)}</div></div>` +
    '</div>'
  );
}

function bizSummaryCard(s) {
  const m = bizMeta(s.business);
  return (
    '<div class="op-card">' +
      `<div class="op-card__head"><div class="op-card__title">${esc(m.label)}</div></div>` +
      (s.note
        ? `<div class="op-hint">${esc(s.note)}</div>`
        : '<dl>' +
            `<dt>進行中案件</dt><dd>${s.inProgress}</dd>` +
            `<dt>承認待ち</dt><dd>${s.review}</dd>` +
            `<dt>今週の期限</dt><dd>未入力</dd>` +
            `<dt>最新成果物</dt><dd>${s.latestDeliverable ? esc(s.latestDeliverable.title) : "なし"}</dd>` +
          '</dl>') +
    '</div>'
  );
}

function render(container) {
  const state = store.state || {};
  const priorities = getTopPriorities(state);
  const alerts = getAlerts(state, window.__lastHealth);
  const bizSummaries = getBusinessSummaries(state);
  const wf = getWorkforceSummary(state);

  container.innerHTML = (
    '<div class="op-view">' +
      '<div class="op-view-head"><h1>ホーム</h1><span class="op-view-sub">今日の状況を1画面で確認できます</span></div>' +

      '<section><h2 style="font-size:13px;color:var(--op-text-3);margin:0 0 8px">今日の最優先事項</h2>' +
        '<div class="op-priority-list">' +
          (priorities.length ? priorities.map(priorityCard).join("") : emptyState({ ic: "✅", title: "優先タスクはありません", desc: "タスクが登録されると、ここに最大3件表示されます。" })) +
        '</div>' +
      '</section>' +

      '<section><h2 style="font-size:13px;color:var(--op-text-3);margin:0 0 8px">重要アラート</h2>' +
        (alerts.length ? alerts.map(alertRow).join("") : emptyState({ ic: "🟢", title: "現在アラートはありません" })) +
      '</section>' +

      '<section><h2 style="font-size:13px;color:var(--op-text-3);margin:0 0 8px">事業別サマリー</h2>' +
        '<div class="op-bizsummary">' + bizSummaries.map(bizSummaryCard).join("") + '</div>' +
      '</section>' +

      '<section><h2 style="font-size:13px;color:var(--op-text-3);margin:0 0 8px">AI稼働状況</h2>' +
        '<div class="op-card">' +
          `<div class="op-priority-card__footer" style="font-size:13px"><span>稼働中 <b style="color:var(--op-text)">${wf.working}</b>人</span><span>会議中 <b style="color:var(--op-text)">${wf.meeting}</b>人</span><span>待機中 <b style="color:var(--op-text)">${wf.idle}</b>人</span></div>` +
        '</div>' +
      '</section>' +
    '</div>'
  );
}

registerView("dashboard", { render });
