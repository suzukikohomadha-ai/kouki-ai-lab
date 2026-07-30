// office/app/adapters.js
// 既存データ（window.AI_STATE / window.COMPANY）→ 新UI表示用モデルへの変換。
// ここでは実データの不足を推測で埋めない。不足項目は null / "unknown" / [] のまま返し、
// 各Viewが「未入力」「未確認」等の明示表示に変換する。

import { AGENT_REGISTRY, agentByName } from "./agent-registry.js";
import { BUSINESS_KEYWORDS } from "./constants.js";

function safeArr(v) { return Array.isArray(v) ? v : []; }

// ---- 事業タグ 仮マッピング（state.js のタスクに business フィールドが無いための暫定処理） ----
// 【仮マッピングの注記】タイトル文字列にキーワードが含まれるかどうかだけで判定する簡易ロジック。
// 正確な事業帰属ではないため、UI上は必ず「(仮)」等の注記を添えて表示すること。
export function guessBusiness(title) {
  const t = String(title || "");
  for (const [biz, words] of Object.entries(BUSINESS_KEYWORDS)) {
    if (words.some((w) => t.indexOf(w) !== -1)) return biz;
  }
  return "common";
}

// ---- タスク（案件・タスク画面の共通ソース） ----
export function getTasks(state) {
  return safeArr(state && state.tasks).map((t) => ({
    id: t.id || "",
    title: t.title || "(無題)",
    owner: t.owner || "",
    status: t.status || "todo",
    progress: Number(t.progress) || 0,
    hint: t.hint || "",
    cmd: t.cmd || "",
    log: safeArr(t.log),
    deliverables: safeArr(t.deliverables),
    business: guessBusiness(t.title),
    businessIsGuessed: true,
    // 以下は現行データモデルに存在しないため一律 null（捏造しない）
    customer: null,
    dueDate: null,
    risk: "unknown",
  }));
}

// 案件画面：現状「案件」という独立エンティティがデータに存在しないため、
// タスクを1件=1案件として暫定表示する（isProvisionalProject=true をUIで明示）。
export function getProjectsFromTasks(state) {
  return getTasks(state).map((t) => ({ ...t, isProvisionalProject: true }));
}

export function getApprovals(state, overrides) {
  const ov = overrides || {};
  return getTasks(state)
    .filter((t) => t.status === "review")
    .map((t) => ({
      ...t,
      localStatus: ov[t.id] || "pending", // pending | approved | rejected | hold（ローカル表示のみ）
      cost: null,
      testResult: null,
      rollback: null,
      deadline: null,
    }));
}

export function getDeliverables(state) {
  const out = [];
  safeArr(state && state.tasks).forEach((t) => {
    safeArr(t.deliverables).forEach((d, i) => {
      out.push({
        key: `${t.id || "?"}:${i}`,
        title: d.title || "(無題の成果物)",
        type: d.type || "",
        business: guessBusiness(t.title),
        businessIsGuessed: true,
        project: t.id || "",
        owner: t.owner || "",
        reviewer: null, // レビュー担当のデータ源なし
        version: null,
        createdAt: d.at || null,
        updatedAt: null,
        url: d.url || null,
        path: d.path || null,
        app: d.app || null,
        body: d.body || null,
        unconfirmedNotes: [],
      });
    });
  });
  return out;
}

// ---- エージェント（AI組織画面・稼働状況） ----
export function getAgentCards(state, company) {
  const liveList = safeArr(state && state.employees);
  const activity = safeArr(state && state.activity);
  const tasks = getTasks(state);
  const companyEmployees = safeArr(company && company.employees);

  return AGENT_REGISTRY.map((reg) => {
    const cEmp = companyEmployees.find((e) => e && e.name === reg.name) || {};
    const live = liveList.find((e) => e && e.name === reg.name) || {};
    const myTasks = tasks.filter((t) => t.owner === reg.name);
    const currentTask = live.taskId ? myTasks.find((t) => t.id === live.taskId) : null;
    const lastActivity = activity.find((a) => a && a.who === reg.name) || null;
    const deliverableCount = myTasks.reduce((n, t) => n + t.deliverables.length, 0);

    return {
      name: reg.name,
      emoji: cEmp.emoji || "🙂",
      role: reg.title || cEmp.role || "",
      dept: reg.dept,
      scope: reg.scope,
      desc: cEmp.desc || "",
      status: live.status || "idle",
      currentTask: currentTask ? currentTask.title : null,
      currentTaskId: currentTask ? currentTask.id : null,
      progress: currentTask ? currentTask.progress : 0,
      lastActivity: lastActivity ? lastActivity.text : null,
      lastActivityTime: lastActivity ? lastActivity.time : null,
      recentDeliverableCount: deliverableCount,
      tools: reg.tools,
      skills: reg.skills,
      permissionNote: reg.permissionNote || "",
      errorCount: null, // データ源なし（未計測）
    };
  });
}

// ---- ダッシュボード：AI稼働状況の集計 ----
export function getWorkforceSummary(state) {
  const emps = safeArr(state && state.employees);
  const working = emps.filter((e) => e && e.status === "working").length;
  const meeting = emps.filter((e) => e && e.status === "meeting").length;
  const idle = emps.length - working - meeting;
  return { working, meeting, idle, total: emps.length };
}

// ---- ダッシュボード：今日の最優先事項（最大3件・review優先→doing進捗の低い順） ----
export function getTopPriorities(state) {
  const tasks = getTasks(state);
  const review = tasks.filter((t) => t.status === "review");
  const doing = tasks.filter((t) => t.status === "doing").sort((a, b) => a.progress - b.progress);
  const todo = tasks.filter((t) => t.status === "todo");
  const ordered = review.concat(doing, todo);
  return ordered.slice(0, 3).map((t) => ({
    id: t.id,
    title: t.title,
    business: t.business,
    businessIsGuessed: t.businessIsGuessed,
    reason: t.status === "review" ? "社長の確認待ちで止まっています" : (t.status === "doing" ? "進行中のタスクです" : "未着手のタスクです"),
    due: t.dueDate, // null（未入力）
    status: t.status,
    nextAction: t.status === "review" ? "内容を確認して承認/差し戻しを判断する" : "進捗を確認する",
  }));
}

// ---- ダッシュボード：重要アラート（実データから確認できるものだけを生成。捏造しない） ----
export function getAlerts(state, health) {
  const alerts = [];
  const tasks = getTasks(state);
  const reviewCount = tasks.filter((t) => t.status === "review").length;
  if (reviewCount > 0) {
    alerts.push({ id: "alert-approvals", level: "warning", ic: "🖐", title: `承認待ちが${reviewCount}件あります`, meta: "承認待ち画面で確認できます" });
  }
  if (health && health.google === false) {
    alerts.push({ id: "alert-google", level: "info", ic: "📧", title: "Gmail/カレンダー連携が未接続です", meta: "連携状況で確認できます" });
  }
  if (health && health.line === false) {
    alerts.push({ id: "alert-line", level: "info", ic: "💬", title: "LINE連携が未接続です", meta: "連携状況で確認できます" });
  }
  // 期限超過・n8nエラー・補助金締切・契約更新期限・セキュリティ警告：
  // 対応するデータフィールドが現行モデルに存在しないため、意図的に生成しない（捏造禁止）。
  return alerts;
}

// ---- ルーティン業務（note/Instagram/X等、事業ごとの定型運用一覧） ----
export function getRoutines(state) {
  return safeArr(state && state.routines).map((r, i) => ({
    key: `routine-${i}`,
    business: r.business || "common",
    platform: r.platform || "(未設定)",
    detail: r.detail || "",
    frequency: r.frequency || null,
    url: r.url || null,
    accountLabel: r.accountLabel || r.url || null,
  }));
}

// ---- 事業別サマリー ----
export function getBusinessSummaries(state) {
  const tasks = getTasks(state);
  return ["kohomada", "kinoto", "fp"].map((biz) => {
    const mine = tasks.filter((t) => t.business === biz);
    return {
      business: biz,
      inProgress: mine.filter((t) => t.status === "doing").length,
      review: mine.filter((t) => t.status === "review").length,
      dueThisWeek: null, // 期限データなし
      latestDeliverable: (mine.flatMap((t) => t.deliverables).slice(-1)[0] || null),
      note: mine.length ? null : "現在このタグに紐づくタスクはありません（事業タグは仮マッピングです）",
    };
  });
}
