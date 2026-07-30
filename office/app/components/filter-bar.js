// office/app/components/filter-bar.js
import { esc } from "../utils.js";

// fields: [{ key, label, options: [{value,label}] }]
export function filterBarHtml(fields, current) {
  current = current || {};
  return (
    '<div class="op-filterbar">' +
      fields.map((f) => (
        `<select data-filter="${f.key}" aria-label="${esc(f.label)}">` +
          f.options.map((o) => `<option value="${esc(o.value)}"${current[f.key] === o.value ? " selected" : ""}>${esc(o.label)}</option>`).join("") +
        `</select>`
      )).join("") +
    '</div>'
  );
}

export function bindFilterBar(container, onChange) {
  container.querySelectorAll("[data-filter]").forEach((sel) => {
    sel.addEventListener("change", () => onChange(sel.getAttribute("data-filter"), sel.value));
  });
}
