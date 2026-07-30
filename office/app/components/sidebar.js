// office/app/components/sidebar.js
import { NAV_GROUPS, P1_VIEWS } from "../constants.js";
import { esc } from "../utils.js";
import { store } from "../store.js";
import { navigate } from "../router.js";

const collapsedGroups = new Set(); // グループ開閉のUI状態（セッション内のみ・保存不要）

function badgeFor(item, counts) {
  if (!item.badgeKey) return "";
  const n = counts && counts[item.badgeKey];
  if (!n) return "";
  return `<span class="op-navitem__badge">${n}</span>`;
}

export function renderSidebar(el, counts) {
  el.innerHTML = NAV_GROUPS.map((group) => {
    const isCollapsed = collapsedGroups.has(group.id);
    const items = group.items.map((item) => {
      const isCurrent = store.view === item.id;
      const p1 = P1_VIEWS.has(item.id) ? ' title="準備中（P1）"' : "";
      return (
        `<button class="op-navitem${isCurrent ? " is-current" : ""}" data-nav="${item.id}"${p1} aria-current="${isCurrent ? "page" : "false"}">` +
          `<span class="op-navitem__ic" aria-hidden="true">${item.ic}</span>` +
          `<span class="op-navitem__label">${esc(item.label)}</span>` +
          badgeFor(item, counts) +
        `</button>`
      );
    }).join("");
    return (
      `<div class="op-sidebar__group${isCollapsed ? " is-collapsed" : ""}" data-group="${group.id}">` +
        `<button class="op-sidebar__group-head" data-grouptoggle="${group.id}" aria-expanded="${!isCollapsed}">` +
          `<span class="label">${esc(group.label)}</span>` +
          `<svg class="chev" width="10" height="10" viewBox="0 0 10 10" aria-hidden="true" style="transform:rotate(${isCollapsed ? "-90deg" : "0deg"})"><path d="M1 3l4 4 4-4" stroke="currentColor" stroke-width="1.6" fill="none"/></svg>` +
        `</button>` +
        `<div class="op-sidebar__group-body">${items}</div>` +
      `</div>`
    );
  }).join("");

  el.querySelectorAll("[data-nav]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-nav");
      if (id === "office-view") {
        el.dispatchEvent(new CustomEvent("op:switch-to-office", { bubbles: true }));
        return;
      }
      navigate(id);
    });
  });
  el.querySelectorAll("[data-grouptoggle]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-grouptoggle");
      if (collapsedGroups.has(id)) collapsedGroups.delete(id); else collapsedGroups.add(id);
      renderSidebar(el, counts);
    });
  });
}
