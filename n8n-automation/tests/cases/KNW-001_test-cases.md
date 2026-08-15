# テストケース：KNW-001（n8n公式テンプレート自動収集・スプレッドシート整理ワークフロー）

対応するテストデータ：`tests/fixtures/KNW-001_cases.json`

| # | 分類 | 内容 | 入力 | 期待結果 |
|---|---|---|---|---|
| 1 | 正常系 | 1ページで収まる件数・新規テンプレート1件 | `normal-1` | hasMore=falseで1ページのみ取得、新規判定、要約成功、Sheets書き込みまで到達 |
| 2 | 正常系 | ページネーション（totalWorkflowsがrows上限250を超過） | `pagination-2page` | 1ページ目でhasMore=true→Wait経由で2ページ目取得→hasMore=falseでループ終了 |
| 3 | 冪等性 | 差分判定：説明文ハッシュが既存行と一致（変化なし） | `diff-unchanged` | toProcessに含まれず要約対象外（AI要約コスト抑制） |
| 4 | 正常系 | 差分判定：既存テンプレIDだが説明文が変化（更新） | `diff-updated` | changeType='update'として再要約・appendOrUpdateで上書き |
| 5 | 境界値 | workflows配列内にid/name欠損要素が混在 | `missing-id-name` | 壊れた要素はfetchErrorsに記録してスキップ、正常要素は処理継続（全体は失敗させない） |
| 6 | 異常系 | テンプレート検索が3回リトライ後も失敗 | `fetch-fail-retry-exhausted` | 致命的エラー送出（取得失敗）でthrow。Error Workflow未割当のため、この時点では通知されない（既知の未対応事項） |
| 7 | 境界値 | レスポンスにtotalWorkflows自体が含まれない | `total-workflows-missing` | hasMore=falseの安全側フォールバック、致命的エラーにはせず継続、fetchErrorsに記録 |
| 8 | 異常系 | Execute Workflow（AUTO-COM-001呼び出し）がエラーを返す | `summary-fail` | 特徴要約列に「要約失敗（後日再試行）」を記録した行としてSheets書き込みまで到達 |
| 9 | 異常系 | Google Sheets書き込み自体が失敗（モック） | `sheets-write-fail` | continueOnFailで処理は完了扱いになるが当該行は反映されない（次週差分判定で新規として再処理される想定、追加リトライなしの既知リスク） |

## 実行結果

| # | 実行日時 | 対象環境 | 実行コマンド／操作 | 実際の出力 | 成否 | 残存リスク |
|---|---|---|---|---|---|---|
| 1〜9 | 未実施 | n8nインスタンスへ未インポート | `[実行環境なしのため未テスト]` | - | - | 以下「既知の未検証事項」参照 |

静的検証（`validate-workflow.mjs`：0エラー／孤立ノード警告4件＝Sticky Note 4件のみ、`check-secrets.mjs`：本番URL（`kohomadha-n8n.top`・実スプレッドシートURL）と検証済みGitコミットSHAの誤検知のみで実値漏えいなし）は実施済み。

## 既知の未検証事項（本番投入前に確認が必須、`docs/cases/KNW-001/workflow-design.md`と重複するが実行観点で再掲）

- **Google Sheetsノードのtypeversion（4.7 vs 4.5）**：n8n UI上で新規Google Sheetsノードを配置した際の実際の表示値で最終確認する。
- **Execute Workflow（呼び出し側）のtypeVersion 1.3・`__rl`形式・`workflowInputs.defineBelow`が実際に動作するか**：このインスタンス上で確認できた唯一の稼働実例（AUTO-CNT-001→AUTO-COM-001）はtypeVersion 1・プレーン文字列形式であり、1.3形式の動作実績が無い。失敗した場合はtypeVersion 1へのフォールバックが必要（`docs/cases/KNW-001/workflow-design.md`のSticky Note内容を参照）。
- **Wait／Split In Batchesの稼働実績**：GitHubソース（接続先バージョン一致タグ）では存在確認済みだが、このインスタンス上での稼働実例は無し。
- **Codeノードでの`crypto`モジュール利用可否**：現状は簡易フィンガープリントで代替しており、SHA-256が使えるか未確認。
- **`sheetName`（タブ名）の実際の値**：現状「シート1」を仮置きしており、実スプレッドシートのタブ名と一致するか未確認。
- **カテゴリ列**：`/templates/search`のレスポンス単体ではテンプレート単位のカテゴリを紐付けられないことが判明しており、現状は常に空欄。
