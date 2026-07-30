// office/app/store.js
// window.AI_STATE / window.COMPANY の現在値を保持し、更新を購読できる簡易ストア。
// データそのものは office/state.js・office/company.js が唯一の情報源（ここでは複製しない）。

const listeners = new Set();

const NS = "ai_company_ops:"; // localStorage 名前空間（既存 __LS_NS とは別領域。オフィスモードのデータに触れない）

export const store = {
  state: null,     // window.AI_STATE の最新値（フレームごとに main.js から供給される）
  company: null,   // window.COMPANY の最新値
  business: lsGet("business") || "all",
  view: lsGet("view") || "dashboard",
  sidebarCollapsed: lsGet("sidebarCollapsed") === "1",
  // 承認待ちのローカルのみの状態変更（バックエンド未接続のため、ここに保持するだけで state.js へは書かない）
  localApprovalOverrides: {}, // { [taskId]: "approved" | "rejected" | "hold" }
};

export function setData(state, company) {
  store.state = state || store.state;
  store.company = company || store.company;
  emit();
}

export function setBusiness(id) {
  store.business = id;
  lsSet("business", id);
  emit();
}

export function setView(id) {
  store.view = id;
  lsSet("view", id);
  emit();
}

export function toggleSidebar(force) {
  store.sidebarCollapsed = force != null ? force : !store.sidebarCollapsed;
  lsSet("sidebarCollapsed", store.sidebarCollapsed ? "1" : "0");
  emit();
}

export function setApprovalOverride(taskId, status) {
  store.localApprovalOverrides[taskId] = status;
  emit();
}

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function emit() {
  listeners.forEach((fn) => { try { fn(store); } catch (e) { console.error("[ops-store] listener error", e); } });
}

function lsGet(k) { try { return localStorage.getItem(NS + k); } catch { return null; } }
function lsSet(k, v) { try { localStorage.setItem(NS + k, v); } catch { /* noop */ } }
