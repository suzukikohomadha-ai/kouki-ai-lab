// office/app/mock-data.js
//
// ★★★ このファイルの中身はすべてサンプル（モック）データです ★★★
// 実データではありません。本番処理へ送信されることはありません。
// リサーチ・クリエイティブ・自動化・財務/FP・法務・ライブラリの各画面は、
// 現行の office/state.js・office/company.js にはまだデータモデルが存在しないため、
// UI確認用にここでのみ有効なサンプルを用意しています。
// すべてのレコードに isMock:true を持たせ、画面側で必ず「サンプルデータ」表示を強制します。

export const MOCK_ENABLED = true; // 切り替えスイッチ（falseにすると各画面は空状態表示になる）

export const MOCK_RESEARCH = [
  {
    isMock: true, id: "R-MOCK-1", theme: "KINOTO：遺品整理サービスの地域相場（サンプル）",
    category: "未確認", body: "近隣3市の遺品整理サービスの一般的な価格帯レンジ（サンプル値）",
    source: null, publisher: null, publishedAt: null, updatedAt: null, confirmedAt: null,
    isPrimary: false, confidence: "低（サンプル）", recheckBy: null, project: null, owner: "リサ",
  },
  {
    isMock: true, id: "R-MOCK-2", theme: "コホマダ：東南アジア進出の一般的な法人形態（サンプル）",
    category: "仮説", body: "現地法人設立の一般的な選択肢（サンプルの整理例）",
    source: null, publisher: null, publishedAt: null, updatedAt: null, confirmedAt: null,
    isPrimary: false, confidence: "低（サンプル）", recheckBy: null, project: null, owner: "レン",
  },
];

export const MOCK_CREATIVE = [
  {
    isMock: true, id: "C-MOCK-1", title: "KINOTO 公式LINE リッチメニュー案（サンプル）",
    business: "kinoto", purpose: "サンプル：友だち登録後の導線確認", target: "サンプル：既存顧客",
    media: "LINE", size: "2500×1686", cta: "無料見積り", version: "v0（サンプル）",
    productionStatus: "サンプル", reviewStatus: "未レビュー", approvalStatus: "未申請", project: null,
  },
  {
    isMock: true, id: "C-MOCK-2", title: "コホマダ 営業資料 表紙案（サンプル）",
    business: "kohomada", purpose: "サンプル：海外展開提案の表紙", target: "サンプル：経営層",
    media: "PDF", size: "A4横", cta: null, version: "v0（サンプル）",
    productionStatus: "サンプル", reviewStatus: "未レビュー", approvalStatus: "未申請", project: null,
  },
];

export const MOCK_AUTOMATION_MEI = [
  {
    isMock: true, id: "A-MEI-1", process: "KINOTO：問い合わせ受付〜見積り送付（サンプル）",
    issue: "サンプル：手作業でのメール転記に時間がかかる", bottleneck: "サンプル：営業時間外の一次対応",
    candidate: "サンプル：LINE自動応答→スプレッドシート転記", priority: "中（サンプル）",
    toolCandidate: "n8n + Googleスプレッドシート（サンプル）", roi: "未算定（サンプル）",
  },
];
export const MOCK_AUTOMATION_EITO = [
  {
    isMock: true, id: "WF-MOCK-1", name: "サンプルワークフロー：問い合わせ転記",
    process: "KINOTO 問い合わせ対応", devStatus: "サンプル", env: "dev", nodeCount: 6,
    apis: ["サンプルAPI"], credentialRef: "（値は表示しません）", lastRun: null,
    successCount: 0, failCount: 0, successRate: null, testStatus: "未テスト", prodStatus: "未接続", version: "v0",
  },
];

export const MOCK_FINANCE = {
  isMock: true,
  budgetVsActual: [
    { business: "kohomada", budget: null, actual: null, note: "未入力（サンプル）" },
    { business: "kinoto", budget: null, actual: null, note: "未入力（サンプル）" },
    { business: "fp", budget: null, actual: null, note: "未入力（サンプル）" },
  ],
  subsidies: [
    {
      isMock: true, id: "S-MOCK-1", name: "サンプル：小規模事業者向け補助金（仮称）",
      business: "kinoto", deadline: null, requiredDocs: ["サンプル：事業計画書", "サンプル：見積書"],
      status: "サンプル", note: "実際の公募要領は必ず一次情報で確認してください",
    },
  ],
};

export const MOCK_LEGAL = [
  {
    isMock: true, id: "L-MOCK-1", title: "KINOTO 業務委託契約書（ひな形・サンプル）",
    business: "kinoto", type: "業務委託契約", verdict: "unconfirmed", deadline: null,
    risk: "unknown", note: "サンプルデータです。実際の契約書レビューはリョウに依頼してください。",
  },
];

export const MOCK_LIBRARY = [
  { isMock: true, id: "LIB-MOCK-1", kind: "リサーチ", title: "サンプル：KINOTO地域相場調査", business: "kinoto" },
  { isMock: true, id: "LIB-MOCK-2", kind: "クリエイティブ", title: "サンプル：コホマダ営業資料表紙案", business: "kohomada" },
];
