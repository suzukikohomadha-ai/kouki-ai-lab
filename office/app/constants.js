// office/app/constants.js
// オペレーションモード共通の定数（事業一覧・ナビ構造・依頼テンプレート等）。
// ここに書かれた内容はUI表示用の設定であり、.claude/配下の実際のエージェント/Skills定義とは別物。

export const BUSINESSES = [
  { id: "all", label: "全事業", short: "全", cls: "common" },
  { id: "kohomada", label: "コホマダ", short: "コホ", cls: "kohomada" },
  { id: "kinoto", label: "KINOTO", short: "KIN", cls: "kinoto" },
  { id: "fp", label: "FP事業", short: "FP", cls: "fp" },
  { id: "common", label: "共通業務", short: "共通", cls: "common" },
];

export function bizMeta(id) {
  return BUSINESSES.find((b) => b.id === id) || BUSINESSES.find((b) => b.id === "common");
}

// タイトル文字列からの事業タグ仮マッピング（state.js のタスクに事業フィールドが無いための暫定処理）。
// 本来はバックエンド側でタスクに business フィールドを持たせるのが望ましい。
export const BUSINESS_KEYWORDS = {
  kohomada: ["コホマダ", "海外", "貿易", "進出", "kohomada"],
  kinoto: ["KINOTO", "きのと", "古物", "遺品", "生前整理", "家じまい", "不用品", "引越し", "清掃", "リフォーム"],
  fp: ["FP", "ライフプラン", "家計", "補助金", "助成金", "資産形成", "マネーガード"],
};

export const NAV_GROUPS = [
  {
    id: "overview", label: "概要", items: [
      { id: "dashboard", label: "ホーム", ic: "\u{1F3E0}" },
      { id: "notifications", label: "通知", ic: "\u{1F514}" },
    ],
  },
  {
    id: "exec", label: "実行", items: [
      { id: "command-center", label: "AI指令センター", ic: "\u{1F3AF}" },
      { id: "projects", label: "案件", ic: "\u{1F4C1}" },
      { id: "tasks", label: "タスク", ic: "\u{1F4CB}" },
      { id: "notion-hub", label: "事業開発ハブ", ic: "\u{1F680}" },
      { id: "approvals", label: "承認待ち", ic: "\u{1F590}️", badgeKey: "approvals" },
      { id: "deliverables", label: "成果物", ic: "\u{1F4E6}" },
    ],
  },
  {
    id: "practice", label: "専門業務", items: [
      { id: "research", label: "リサーチ", ic: "\u{1F50D}" },
      { id: "creative", label: "クリエイティブ", ic: "\u{1F3A8}" },
      { id: "routines", label: "ルーティン業務", ic: "\u{1F501}" },
      { id: "automation", label: "自動化", ic: "\u{1F517}" },
      { id: "finance", label: "財務・FP", ic: "\u{1F4B0}" },
      { id: "legal", label: "法務・リスク", ic: "⚖️" },
    ],
  },
  {
    id: "org", label: "組織・知識", items: [
      { id: "agents", label: "AI組織", ic: "\u{1F465}" },
      { id: "library", label: "ライブラリ", ic: "\u{1F4DA}" },
      { id: "office-view", label: "オフィスビュー", ic: "\u{1F3E2}" },
    ],
  },
  {
    id: "admin", label: "管理", items: [
      { id: "audit-log", label: "監査ログ", ic: "\u{1F4DC}" },
      { id: "integrations", label: "連携状況", ic: "\u{1F50C}" },
      { id: "settings", label: "設定", ic: "⚙️" },
    ],
  },
];

export const P1_VIEWS = new Set([
  "notifications", "research", "creative", "automation", "finance", "legal",
  "library", "audit-log", "integrations", "settings",
]);

export const TASK_STATUS_LABEL = {
  todo: "未着手", doing: "進行中", review: "承認待ち", done: "完了",
  // 拡張ステータス（データ上は todo/doing/review/done の4値のみのため、表示ラベルのみ広めに用意）
  blocked: "ブロック中", hold: "保留",
};

export const REQUEST_TEMPLATES = [
  { id: "market-research", label: "市場調査", business: "kohomada" },
  { id: "overseas-expansion", label: "海外展開提案", business: "kohomada" },
  { id: "new-business", label: "新規事業分析", business: "kohomada" },
  { id: "sales-material", label: "営業資料作成", business: "common" },
  { id: "line-design", label: "公式LINE設計", business: "kinoto" },
  { id: "flyer", label: "チラシ制作", business: "kinoto" },
  { id: "lp-web", label: "LP・Webサイト設計", business: "common" },
  { id: "threejs-site", label: "Three.jsサイト設計", business: "common" },
  { id: "n8n-automation", label: "n8n自動化", business: "common" },
  { id: "subsidy-research", label: "補助金調査", business: "fp" },
  { id: "financial-analysis", label: "収支分析", business: "common" },
  { id: "contract-review", label: "契約書確認", business: "common" },
  { id: "fp-report", label: "FP資料作成", business: "fp" },
];

export const RISK_LEVELS = [
  { id: "low", label: "低" },
  { id: "mid", label: "中" },
  { id: "high", label: "高" },
];
