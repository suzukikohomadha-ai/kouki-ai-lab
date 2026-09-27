# 抽出スキーマ：`slk-extract v1.1`（フェーズ1.5拡張）

- 管理ID：AUTO-SLK-003
- 作成：エイト（n8n Workflow Implementation Engineer）
- 日付：2026-09-27
- ステータス：**Draft（`[実行環境なしのため未テスト]`）**。本番Notion・Slack・n8nインスタンスへの変更は一切行っていない。
- 位置づけ：`logs/kohomada_2026-09-26_Slack業務管理自動化_改善提案_v2.md`（T225 v2）3.3.2節の`slk-extract v1.0`に、`logs/kohomada_2026-09-26_フェーズ1.5詳細設計_v1.md`（T227）2節の追加項目を機械的にマージしたもの。実際に流し込むJSON Schema本体は同ディレクトリの`schema.json`（`_meta`キーを除いたもの）。

## 1. v1.0→v1.1の差分一覧

| 変更種別 | 対象 | 内容 | 出典 |
|---|---|---|---|
| enum拡張 | `status_proposal` | `受注`を追加（挿入位置：`保留`と`完了`の間） | T227 2.1 |
| 新規プロパティ | `contract_status_proposal` | `未送付`/`送付済み`/`受領済み`/`双方受領済み`/`該当なし` | T227 2.2 |
| 新規プロパティ | `record_type_proposal` | `案件`/`クレーム・返品`/`不明`。`決定事項`は含めない | T227 2.2 |
| 新規プロパティ | `trade_terms` | `item`/`quantity`/`price_or_amount`/`payment_terms`（すべて`["string","null"]`） | T227 2.2 |
| 既存配列の要素拡張 | `next_actions[].task_category` | 12値のenum（`該当なし`＋11カテゴリ）。`kind`が`agent_task_candidate`のときのみ意味を持つ | T227 2.3 |
| 新規プロパティ | `immediate_action` | `requested`/`kind`/`output_markdown`/`destination`/`confidence` | T227 2.4 |
| 変更なし | `title`/`counterparty_org`/`summary`/`next_actions[].text,kind,owner_role,confidence`/`deadline`/`overall_confidence`/`ambiguities`/`injection_suspected`/`pii_detected`/`evidence` | フィールド構造・enum値とも既存のまま | 改善提案v2 3.3.2、T227冒頭 |

## 2. `required`配列・`additionalProperties:false`の整合性確認（今回の実装作業で実施）

T227は「既存の`title`/…/`evidence`は変更しない」と述べる一方、実際には`status_proposal`のenumを拡張しており、かつ`additionalProperties:false`のスキーマでは新規プロパティを`properties`だけでなく`required`にも追加しないとClaudeが値を返せない（構造化出力の制約、改善提案v2 F12：`additionalProperties:false`必須）。以下の対応を行った。

1. **トップレベル`required`配列**：v1.0の11項目（`title`〜`evidence`）はそのまま維持し、新規4項目（`contract_status_proposal`／`record_type_proposal`／`trade_terms`／`immediate_action`）を追加し、計15項目とした（`schema.json`参照）。v1.0の既存プロパティがすべて`required`に含まれていたパターンを踏襲し、新規プロパティも同様に扱った（nullを許容する場合は`["string","null"]`型にすることで「必須だが値が無いことを表現できる」既存パターンと整合させた）。
2. **`next_actions[].required`**：T227 2.3が示すとおり、既存4項目（`text`/`kind`/`owner_role`/`confidence`）に`task_category`を追加し5項目とした。
3. **`trade_terms`・`immediate_action`自体の`additionalProperties:false`・`required`**：T227の該当コードブロックをそのまま踏襲（4項目ずつ）。矛盾は見つからなかった。

**指摘：T227冒頭の「既存項目は変更しない」という要約は、`status_proposal`のenum拡張という実質的な変更と厳密には矛盾する。** ただし、これはT227 2.1節本文で明示的に扱われており、実害のある矛盾ではなく要約文の言葉足らずと判断した。実装（本ファイル）では2.1節の記載を優先し、enumに`受注`を含めている。

## 3. `[要確認]`として残した論点（機械的マージでは解決できなかったもの）

- **`immediate_action.destination`の`sheets`値の使用条件が未設計**：改善提案v2・T227のいずれにも「翻訳・整形結果をGoogle Sheetsへ出す場合の判定基準」の記載がない。決定事項4で確定しているのは「`thread_reply`は使わない、既定は`notion_page`」のみで、`sheets`をいつ選ぶかの基準は無い。フェーズ1.5のルーターは**`sheets`分岐を実装せず、常に`notion_page`固定**とする（decision 4の額面通りの実装）。`sheets`はenum値として温存するが、実際に選択されることは無い設計とした。`[要確認]`：この値を将来削除するか、使用条件を別途設計するかはメイ・社長判断待ち。
- **`割当候補・カテゴリ`（Notionプロパティ#12）が「AI欄（Claude出力）／システム欄（n8n確定値）」の両方に属すると記載されている（T227 1節表）が、これが物理的に2つのプロパティを意味するのか、1つのプロパティに2つの性質を兼ねさせる想定なのかが本文からは確定できない**。本実装では**1つのselectプロパティとして扱い、Claudeが出力した`task_category`の値をn8nがそのまま（変換せずに）書き込む**という解釈を採用した（enumが閉じているため、n8nの「確定」作業は実質的に発生しない）。理由・詳細は`task-category-lookup.md`参照。`[要確認]`：この解釈で問題ないか、メイ・社長に確認を推奨。
- **同一スレッド内に複数の`agent_task_candidate`が存在する場合、Notionプロパティ#11〜13（3点セット）にどれを代表として書き込むかのルールが設計書に無い**。T227 1節#11備考「複数候補が要る場合はページ本文に列挙」は挙動を示すのみで、どれを「代表」としてプロパティに書くかの選定基準（信頼度順／出現順等）が未定義。本実装では`task-category-lookup.md`に暫定ルール（信頼度降順、同点は配列順）を定義したが、**これはエイトの実装判断であり、社長・メイの確認を経ていない**。`[要確認]`。

## 4. ハルシネーション防止の確認

- `task_category`のenum値はすべてT227 2.3節からそのまま転記（新規に作った値は無い）。
- 担当社員候補（multi_select）に使う名前は、`CLAUDE.md` A-2に実在する11名（リサ・レン・サトル・カエデ・メイ・エイト・ノヴァ・ミナ・リョウ・アオイ・ジン）のみで構成されており、架空の社員名は含まれていない（`task-category-lookup.md`参照）。
- 本ファイル・`schema.json`は`[実行環境なしのため未テスト]`。Anthropic APIへの実送信・Notionへの実書き込みは一切行っていない。

## 出典

- `logs/kohomada_2026-09-26_Slack業務管理自動化_改善提案_v2.md`（T225 v2）3.3.2節
- `logs/kohomada_2026-09-26_フェーズ1.5詳細設計_v1.md`（T227）2節
- `n8n-automation/.claude/rules/n8n-workflow-json.md`（推測禁止・ラベル運用）
- `.claude/rules/evidence-policy.md`
