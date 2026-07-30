// office/app/agent-registry.js
//
// これは「UI表示専用」の静的設定ファイルです。
// .claude/agents/*.md（実際のサブエージェント定義）の複製・同期物ではありません。
// 部門・権限（tools）・使用Skillsの一覧はブラウザから .claude/ 配下を読めないため、
// 2026-07-25時点の .claude/agents/*.md の内容を手動で書き写しています。
// エージェント定義そのものを変更した場合は、このファイルも合わせて手動更新してください
// （自動同期の仕組みはこのUI追加の範囲外です）。

export const DEPARTMENTS = [
  { id: "exec", label: "統括" },
  { id: "strategy", label: "戦略・調査部門" },
  { id: "creative-tech", label: "制作・技術・自動化部門" },
  { id: "finance-legal", label: "財務・法務・監査部門" },
];

export const AGENT_REGISTRY = [
  {
    name: "ジン", file: "jin-chief-of-staff", dept: "exec",
    title: "AI Chief of Staff", scope: "全事業横断",
    tools: ["Read", "Glob", "Grep", "Write", "Edit", "Agent"],
    skills: [],
    permissionNote: "唯一 Agent ツール（他エージェントへの委任）を保持",
  },
  {
    name: "リサ", file: "lisa-research-analyst", dept: "strategy",
    title: "Research & Evidence Analyst", scope: "全事業横断",
    tools: ["Read", "Glob", "Grep", "WebSearch", "WebFetch"],
    skills: ["market-research-protocol", "fact-check-and-citations"],
    permissionNote: "読み取り専任（Write/Edit なし）",
  },
  {
    name: "レン", file: "ren-business-strategist", dept: "strategy",
    title: "Business Development & Market Strategy Director", scope: "コホマダ",
    tools: ["Read", "Glob", "Grep", "Write", "Edit", "WebSearch", "WebFetch"],
    skills: ["kohomada-business-context"],
  },
  {
    name: "サトル", file: "satoru-growth-strategist", dept: "strategy",
    title: "Growth Marketing & Revenue Strategist", scope: "コホマダ／KINOTO",
    tools: ["Read", "Glob", "Grep", "Write", "Edit", "WebSearch", "WebFetch"],
    skills: ["sns-operation", "official-line-design", "copywriting", "financial-analysis"],
  },
  {
    name: "カエデ", file: "kaede-creative-director", dept: "creative-tech",
    title: "Creative & Brand Director", scope: "コホマダ／KINOTO",
    tools: ["Read", "Glob", "Grep", "Write", "Edit"],
    skills: ["canva-creative-production", "wix-lp-production", "official-line-design", "sales-proposal-production"],
  },
  {
    name: "メイ", file: "mei-automation-architect", dept: "creative-tech",
    title: "AI Automation & Operations Architect", scope: "全事業横断",
    tools: ["Read", "Glob", "Grep", "Write", "Edit", "WebSearch", "WebFetch"],
    skills: ["n8n-automation-design"],
  },
  {
    name: "エイト", file: "eito-n8n-engineer", dept: "creative-tech",
    title: "n8n Workflow Implementation Engineer", scope: "全事業横断（メイ配下）",
    tools: ["Read", "Glob", "Grep", "Write", "Edit", "WebFetch", "WebSearch"],
    skills: ["n8n-automation-design"],
    permissionNote: "11体目・新10体構成の例外",
  },
  {
    name: "ノヴァ", file: "nova-web-3d-engineer", dept: "creative-tech",
    title: "Web & Three.js Technical Architect", scope: "全事業横断",
    tools: ["Read", "Glob", "Grep", "Write", "Edit", "Bash", "WebSearch", "WebFetch"],
    skills: ["threejs-production"],
  },
  {
    name: "ミナ", file: "mina-finance-fp-analyst", dept: "finance-legal",
    title: "Finance, FP & Subsidy Analyst", scope: "全事業横断／個人FP",
    tools: ["Read", "Glob", "Grep", "Write", "Edit", "WebSearch", "WebFetch"],
    skills: ["financial-analysis", "subsidy-research", "fp-business-context"],
  },
  {
    name: "リョウ", file: "ryo-legal-compliance", dept: "finance-legal",
    title: "Legal Research & Compliance Analyst", scope: "全事業横断",
    tools: ["Read", "Glob", "Grep", "WebSearch", "WebFetch"],
    skills: ["contract-review-protocol", "fact-check-and-citations"],
    permissionNote: "読み取り専任（Write/Edit なし）／「顧問弁護士」と称さない",
  },
  {
    name: "アオイ", file: "aoi-quality-auditor", dept: "finance-legal",
    title: "Quality Assurance & Risk Auditor", scope: "全事業横断（独立監査）",
    tools: ["Read", "Glob", "Grep"],
    skills: [],
    permissionNote: "読み取り専任・新規制作しない",
  },
];

export function agentByName(name) {
  return AGENT_REGISTRY.find((a) => a.name === name) || null;
}
