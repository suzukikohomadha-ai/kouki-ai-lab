// office/app/main.js
// オペレーションモードのエントリーポイント。
// 既存のバーチャルオフィス（#game, office.js）・既存パネル群（index.htmlのインラインscript）には
// 一切手を加えず、#opshell に新UIをマウントするだけ。

import { store, setData, toggleSidebar, subscribe } from "./store.js";
import { initRouter, rerenderCurrent, getMountedId } from "./router.js";
import { renderSidebar } from "./components/sidebar.js";
import { renderHeader } from "./components/header.js";
import { getApprovals } from "./adapters.js";

import "./views/dashboard.js";
import "./views/command-center.js";
import "./views/projects.js";
import "./views/tasks.js";
import "./views/notion-hub.js";
import "./views/approvals.js";
import "./views/deliverables.js";
import "./views/agents.js";
import "./views/research.js";
import "./views/creative.js";
import "./views/routines.js";
import "./views/automation.js";
import "./views/finance.js";
import "./views/legal.js";
import "./views/library.js";
import "./views/notifications.js";
import "./views/audit-log.js";
import "./views/integrations.js";
import "./views/settings.js";

const MODE_KEY = "ai_company_ops:mode";
function getMode() { try { return localStorage.getItem(MODE_KEY) || "ops"; } catch { return "ops"; } }
function setMode(m) { try { localStorage.setItem(MODE_KEY, m); } catch { /* noop */ } }

const shellRoot = document.getElementById("opshell");
const gameRoot = document.getElementById("game");

if (shellRoot) {
  shellRoot.innerHTML = (
    '<div class="op-shell" data-shell>' +
      '<header class="op-header" data-header></header>' +
      '<nav class="op-sidebar" data-sidebar aria-label="メインナビゲーション"></nav>' +
      '<div class="op-scrim" data-scrim></div>' +
      '<main class="op-main">' +
        '<div class="op-view" data-viewroot></div>' +
      '</main>' +
    '</div>'
  );

  const shellEl = shellRoot.querySelector("[data-shell]");
  const headerEl = shellRoot.querySelector("[data-header]");
  const sidebarEl = shellRoot.querySelector("[data-sidebar]");
  const scrimEl = shellRoot.querySelector("[data-scrim]");
  const viewRoot = shellRoot.querySelector("[data-viewroot]");
  const mq = window.matchMedia("(max-width: 980px)");

  let currentMode = getMode();

  function computeCounts() {
    const approvals = getApprovals(store.state || {}, store.localApprovalOverrides).length;
    return { approvals };
  }

  function paintChrome() {
    if (store.sidebarCollapsed) shellEl.classList.add("is-collapsed"); else shellEl.classList.remove("is-collapsed");
    renderSidebar(sidebarEl, computeCounts());
    renderHeader(headerEl, { counts: computeCounts(), mode: currentMode, onModeToggle: toggleMode });
  }

  function applyMode(m) {
    currentMode = m;
    if (m === "office") {
      shellRoot.classList.remove("is-active");
      if (gameRoot) gameRoot.style.display = "";
    } else {
      shellRoot.classList.add("is-active");
      if (gameRoot) gameRoot.style.display = "none";
    }
  }
  function setModeAndPaint(m) {
    setMode(m);
    applyMode(m);
    paintChrome();
  }
  function toggleMode() { setModeAndPaint(currentMode === "office" ? "ops" : "office"); }

  sidebarEl.addEventListener("op:switch-to-office", () => setModeAndPaint("office"));
  scrimEl.addEventListener("click", () => shellEl.classList.remove("is-sidebar-open"));
  headerEl.addEventListener("click", (e) => {
    if (!e.target.closest("[data-collapse]")) return;
    if (mq.matches) shellEl.classList.toggle("is-sidebar-open");
    else toggleSidebar();
  });
  window.addEventListener("resize", () => { if (!mq.matches) shellEl.classList.remove("is-sidebar-open"); });

  subscribe(() => paintChrome());

  // 未保存の入力を持つ画面（AI指令センターのフォーム等）は、裏側のデータ更新のたびに
  // 画面ごと再描画されると入力が消えてしまうため、自動再描画の対象から外す。
  // サイドバー/ヘッダー（件数バッジ等）は入力を持たないので常に最新化してよい。
  const NO_AUTO_REFRESH_VIEWS = new Set(["command-center"]);
  function refreshDataAndMaybeView() {
    if (!NO_AUTO_REFRESH_VIEWS.has(getMountedId())) rerenderCurrent();
    paintChrome();
  }

  // ---- 既存データ（office/state.js・office/company.js）との結線 ----
  // index.html 側の renderOffice(s) から呼ばれる疎結合フック。
  // 例外はここで握りつぶし、既存のオフィス描画処理には一切影響させない。
  window.__opRender = function (state) {
    try {
      setData(state, window.COMPANY || null);
      refreshDataAndMaybeView();
    } catch (e) {
      console.error("[ops] __opRender error (既存オフィス描画には影響しません):", e);
    }
  };
  // .bar 側のモード切替ボタン（index.html インラインscriptから呼ばれる）
  window.__opToggleMode = toggleMode;

  applyMode(currentMode);
  initRouter(viewRoot);
  // 初回描画：state.js の非同期読み込みが未完了でも、company.js は同期読み込み済みのため先に反映しておく。
  setData(window.AI_STATE || null, window.COMPANY || null);
  paintChrome();

  // ---- 初回ロードのレース対策 ----
  // index.html 側の最初の loadState() は、このモジュール（type="module"はdeferで遅れて実行される）が
  // window.__opRender を定義し終える前に完了してしまうことがある。その1回限りの renderOffice() 呼び出しは
  // 素通りしてしまうため、次の state.js 反映（SSE/ポーリング。最大15秒後）まで新UIが空データのまま止まって見える。
  // ここでは短時間（1.8秒）だけ window.AI_STATE を再確認して自己修復する。読み取り専用の画面は何度再描画されても
  // 実害が無いため判定を単純化し、未保存の入力を持つ画面だけ NO_AUTO_REFRESH_VIEWS で個別に保護する。
  let resyncTries = 0;
  const resyncTimer = setInterval(() => {
    resyncTries += 1;
    if (window.AI_STATE) {
      setData(window.AI_STATE, window.COMPANY || null);
      refreshDataAndMaybeView();
    }
    if (resyncTries >= 6) clearInterval(resyncTimer); // 300ms x 6 = 1.8秒で打ち切り
  }, 300);
}
