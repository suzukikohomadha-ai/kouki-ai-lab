// office/app/components/business-switcher.js
import { BUSINESSES } from "../constants.js";
import { esc } from "../utils.js";
import { store, setBusiness } from "../store.js";
import { rerenderCurrent } from "../router.js";

export function renderBusinessSwitcher(el) {
  el.innerHTML = (
    '<div class="op-bizswitch" role="tablist" aria-label="事業切替">' +
      BUSINESSES.map((b) => (
        `<button role="tab" aria-selected="${store.business === b.id}" class="${store.business === b.id ? "is-active" : ""}" data-biz="${b.id}" title="${esc(b.label)}">` +
          `<span class="op-bizswitch-full">${esc(b.label)}</span><span class="op-bizswitch-short">${esc(b.short)}</span>` +
        `</button>`
      )).join("") +
    '</div>'
  );
  el.querySelectorAll("[data-biz]").forEach((btn) => {
    btn.addEventListener("click", () => {
      setBusiness(btn.getAttribute("data-biz"));
      renderBusinessSwitcher(el);
      rerenderCurrent();
    });
  });
}
