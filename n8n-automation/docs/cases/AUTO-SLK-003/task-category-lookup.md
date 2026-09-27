# task_category → 担当社員候補 ルックアップ仕様（n8n Code/Setノード実装用）

- 管理ID：AUTO-SLK-003
- 作成：エイト
- 日付：2026-09-27
- ステータス：**Draft（`[実行環境なしのため未テスト]`）**。以下はn8n Codeノードでの実装を想定した疑似コードであり、実際のn8nインスタンスへの実装・実行はまだ行っていない。
- 出典：`logs/kohomada_2026-09-26_フェーズ1.5詳細設計_v1.md`（T227）2.3節

## 1. 設計原則（なぜこのロジックをn8n側に置くか）

Claudeには`task_category`という**カテゴリ**だけを分類させ、`リサ`や`レン`といった**エージェント名を直接出力させない**。カテゴリ→担当社員のマッピングはn8n側の固定ルックアップテーブルに置く。理由（T227 2.3）：

1. エージェント編成（`.claude/agents/`）が変わったとき、プロンプト・スキーマを変更せずにn8n側のテーブルだけ直せばよい。
2. Claudeが実在しない社員名を生成するリスクを構造的に排除できる（`.claude/rules/evidence-policy.md`原則3）。

## 2. ルックアップテーブル（フェーズ1.5時点）

```javascript
// n8n Codeノード内に定数として保持する想定
// 担当社員名はすべて CLAUDE.md A-2 に実在する11エージェントのいずれかのみを使用している
const TASK_CATEGORY_LOOKUP = {
  "市場調査": {
    candidates: ["リサ"],
    enabledInPhase15: true,
    sourceCandidateNumber: "#11"
  },
  "企画_事業計画": {
    candidates: ["レン"],
    enabledInPhase15: true,
    sourceCandidateNumber: "#12"
  },
  "提案書_営業資料_会議資料": {
    candidates: ["レン", "サトル", "カエデ"],
    enabledInPhase15: true,
    sourceCandidateNumber: "#15"
  },
  "契約書レビュー_法務相談": {
    candidates: ["リョウ"],
    enabledInPhase15: true,
    sourceCandidateNumber: "#16（フェーズ2のF1『契約書ドラフト作成』とも共用、T227 2.3節末尾）"
  },
  "海外法規制調査": {
    candidates: ["リサ", "リョウ"],
    enabledInPhase15: true,
    sourceCandidateNumber: "#17"
  },
  // 以下、フェーズ1.5では「無効」（enumには存在するが3点セットを書き込まない）
  "システム障害対応": { candidates: ["エイト"], enabledInPhase15: false, sourceCandidateNumber: "G5・G10（フェーズ2候補）" },
  "与信_信用リスク調査": { candidates: ["リサ"], enabledInPhase15: false, sourceCandidateNumber: "J19（フェーズ2候補）" },
  "海外新規顧客開拓": { candidates: ["リサ", "レン"], enabledInPhase15: false, sourceCandidateNumber: "J24（フェーズ2候補）" },
  "補助金_助成金候補": { candidates: ["ミナ", "リサ"], enabledInPhase15: false, sourceCandidateNumber: "C28（フェーズ2候補）" },
  "コンプライアンス確認": { candidates: ["リョウ"], enabledInPhase15: false, sourceCandidateNumber: "A27（フェーズ2候補）" },
  // 割当候補なし（社長確認へ回すためのカテゴリ）
  "その他_要人判断": { candidates: [], enabledInPhase15: false, sourceCandidateNumber: "—" },
  // agent_task_candidate以外のkindで使われるプレースホルダー値
  "該当なし": { candidates: [], enabledInPhase15: false, sourceCandidateNumber: "—" }
};
```

## 3. 処理ロジック（1件のNotionページ＝1スレッドに対して実行）

```javascript
/**
 * @param {Array} nextActions - Claude抽出結果の next_actions 配列（slk-extract v1.1）
 * @returns {object|null} 割当候補プロパティに書き込む値。書き込み対象が無ければnull
 */
function resolveAssignmentCandidate(nextActions) {
  // Step 1: kind=agent_task_candidate かつ カテゴリがフェーズ1.5で「有効」かつ担当候補が1名以上のものだけを対象にする
  const eligible = nextActions.filter((action) => {
    if (action.kind !== "agent_task_candidate") return false;
    const entry = TASK_CATEGORY_LOOKUP[action.task_category];
    if (!entry) {
      // Claude出力が万一enum外の値を返した場合の防御（本来スキーマ検証で弾かれるはずだが二重に防御する）
      return false;
    }
    return entry.enabledInPhase15 === true && entry.candidates.length > 0;
  });

  // Step 2: 該当なしの場合、割当候補プロパティ（#11〜#13）は一切書き込まない
  //         （#14「割当候補・状態」も同様。新規ページ作成時ですら書き込まない＝プロパティ自体が空欄のまま）
  if (eligible.length === 0) {
    return null;
  }

  // Step 3: 代表候補を1件選ぶ（複数のagent_task_candidateが同一スレッドに存在する場合）
  //         [要確認] このソート基準（信頼度降順、同点は元の配列順）は本ロジックのために
  //         エイトが実装判断として補ったものであり、T227・改善提案v2に明記された基準ではない。
  //         メイ・社長の確認を推奨する。
  const sorted = [...eligible].sort((a, b) => b.confidence - a.confidence);
  const chosen = sorted[0];
  const others = sorted.slice(1);
  const chosenEntry = TASK_CATEGORY_LOOKUP[chosen.task_category];

  return {
    // #11 割当候補テキスト（AI欄・rich_text）
    "割当候補テキスト": chosen.text,
    // #12 割当候補・カテゴリ（AI欄・select）— Claude出力の値をそのまま使用。n8nによる値の変換は行わない
    "割当候補・カテゴリ": chosen.task_category,
    // #13 割当候補・担当社員候補（システム欄・multi_select）— n8n側ルックアップの結果のみ
    "割当候補・担当社員候補": chosenEntry.candidates,
    // #14 割当候補・状態（人間欄・select）— 新規ページ作成時のみ "候補" を初期値投入。
    //     更新（PATCH）時はこのキー自体をpropertiesペイロードに含めない（3.2.2のUpsert原則）。
    "割当候補・状態_初期値": "候補",
    // 代表に選ばれなかった候補は、Notionページ本文に列挙する（rich_text本文への追記）
    "ページ本文追記_その他候補": others.map((o) => ({
      text: o.text,
      task_category: o.task_category,
      candidates: (TASK_CATEGORY_LOOKUP[o.task_category] || { candidates: [] }).candidates,
      confidence: o.confidence
    }))
  };
}
```

## 4. 「無効」カテゴリの扱い（フェーズ2切替時の設計）

- フェーズ1.5では、`enabledInPhase15: false`のカテゴリが検知されても、**#11〜#14の3点セットは一切書き込まない**。ただし`next_actions[].text`自体は「AI次アクション」（既存rich_text列）にそのまま残るため、情報として消えることはない（T227 2.3節末尾）。
- フェーズ2着手時は、該当カテゴリの`enabledInPhase15`を`true`に切り替えるだけで済むように設計している（改善提案v2 P16「今作らないものを後で作り込み直さない」の考え方）。
- **`契約書レビュー_法務相談`はフェーズ2のF1（契約書ドラフト作成、担当リョウ）とも共用**する（T227 2.3節末尾で確定済み）。新規カテゴリを追加する必要はない。

## 5. 社員の入れ替えがあった場合の更新手順

1. `CLAUDE.md` A-2のエージェント一覧を確認し、変更後の実在エージェント名を確定する。
2. 本ファイルの`TASK_CATEGORY_LOOKUP`定数を更新する（n8n Codeノードの実装にも反映）。
3. `notion-properties.md` #13の`multi_select`選択肢を、Notion UI上でも同期して更新する。
4. 両者を同時に更新しないと、n8nが書き込もうとした担当社員候補がNotion側の選択肢に存在せず、書き込み失敗（またはNotion APIによる選択肢自動追加、改善提案v2 F6）が起きる。

## 6. 未確認事項・要確認事項まとめ

- `[要確認]` 複数`agent_task_candidate`が同一スレッドに存在する場合の代表候補選定ルール（3節Step 3）は、エイトの実装判断であり設計書に明記された基準ではない。
- `[要確認]` 「割当候補・カテゴリ」プロパティが「AI欄（Claude出力）／システム欄（n8n確定値）」の両方に属すると記載されている点（T227 1節表）の解釈（`schema.md`2節に詳細）。
- `[実行環境なしのため未テスト]` 本ロジックはn8n Codeノードとして未実装・未実行。`workflow-design.md`のノード構成（案）、および`tests/fixtures/AUTO-SLK-003_cases.json`のケース#2・#11・#12・#15・#16・#17で検証する想定。
