// office/app/components/agent-card.js
import { esc, trunc } from "../utils.js";
import { agentStatusBadge } from "./status-badge.js";

export function agentCardHtml(a) {
  return (
    `<div class="op-card op-agent" data-agentcard="${esc(a.name)}">` +
      '<div class="op-agent__top">' +
        `<div class="op-agent__emoji" aria-hidden="true">${a.emoji}</div>` +
        '<div style="flex:1;min-width:0">' +
          `<div class="op-agent__name">${esc(a.name)}</div>` +
          `<div class="op-agent__role">${esc(a.role)}</div>` +
        '</div>' +
        agentStatusBadge(a.status) +
      '</div>' +
      (a.currentTask
        ? `<div class="op-agent__pbar"><i style="width:${a.progress || 0}%"></i></div>` +
          `<div class="op-agent__row"><span>${esc(trunc(a.currentTask, 34))}</span><b>${a.progress || 0}%</b></div>`
        : '<div class="op-agent__row"><span>担当中のタスクはありません</span></div>') +
      '<button class="op-agent__toggle" data-toggle aria-expanded="false">詳細を見る ▾</button>' +
      '<div class="op-agent__body">' +
        `<div class="op-agent__row"><span>担当範囲</span><b>${esc(a.scope || "-")}</b></div>` +
        `<div class="op-agent__row"><span>最終稼働</span><b>${esc(a.lastActivityTime || "記録なし")}</b></div>` +
        (a.lastActivity ? `<div style="color:var(--op-text-3)">${esc(trunc(a.lastActivity, 60))}</div>` : "") +
        `<div class="op-agent__row"><span>最近の成果物</span><b>${a.recentDeliverableCount || 0} 件</b></div>` +
        `<div class="op-agent__row"><span>エラー件数</span><b>未計測</b></div>` +
        (a.skills && a.skills.length
          ? `<div><div style="margin-bottom:4px;color:var(--op-text-3)">使用Skills</div><div class="op-tags">${a.skills.map((s) => `<span class="op-tag">${esc(s)}</span>`).join("")}</div></div>`
          : "") +
        `<div><div style="margin-bottom:4px;color:var(--op-text-3)">権限（tools）</div><div class="op-tags">${(a.tools || []).map((t) => `<span class="op-tag">${esc(t)}</span>`).join("")}</div></div>` +
        (a.permissionNote ? `<div class="op-hint">${esc(a.permissionNote)}</div>` : "") +
      '</div>' +
    '</div>'
  );
}

export function bindAgentCards(container) {
  container.querySelectorAll("[data-agentcard]").forEach((card) => {
    const btn = card.querySelector("[data-toggle]");
    if (!btn) return;
    btn.addEventListener("click", () => {
      const open = card.classList.toggle("is-open");
      btn.setAttribute("aria-expanded", String(open));
      btn.textContent = open ? "閉じる ▴" : "詳細を見る ▾";
    });
  });
}
