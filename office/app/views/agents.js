// office/app/views/agents.js
import { store } from "../store.js";
import { getAgentCards } from "../adapters.js";
import { DEPARTMENTS } from "../agent-registry.js";
import { agentCardHtml, bindAgentCards } from "../components/agent-card.js";
import { registerView } from "../router.js";

function render(container) {
  const state = store.state || {};
  const company = store.company || {};
  const cards = getAgentCards(state, company);
  const jin = cards.find((c) => c.dept === "exec");
  const others = cards.filter((c) => c.dept !== "exec");

  const deptBlocks = DEPARTMENTS.filter((d) => d.id !== "exec").map((d) => {
    const members = others.filter((c) => c.dept === d.id);
    return (
      '<div>' +
        `<div class="op-orgchart__dept-title">${d.label}</div>` +
        `<div class="op-orgchart__dept-body">${members.map(agentCardHtml).join("")}</div>` +
      '</div>'
    );
  }).join("");

  container.innerHTML = (
    '<div class="op-view">' +
      '<div class="op-view-head"><h1>AI組織</h1><span class="op-view-sub">ジンを統括に、3部門・計11体で構成されています</span></div>' +
      '<div class="op-orgchart">' +
        `<div class="op-orgchart__jin">${jin ? agentCardHtml(jin) : ""}</div>` +
        `<div class="op-orgchart__depts">${deptBlocks}</div>` +
      '</div>' +
    '</div>'
  );

  bindAgentCards(container);
}

registerView("agents", { render });
