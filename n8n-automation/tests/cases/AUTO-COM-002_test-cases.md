# テストケース：AUTO-COM-002（共通エラーハンドラー）

対応するテストデータ：`tests/fixtures/AUTO-COM-002_cases.json`

| # | 分類 | 内容 | 入力 | 期待結果 |
|---|---|---|---|---|
| 1 | 正常系 | 通常のワークフロー失敗 | workflow/execution/error情報あり | isDuplicate=false、Notion通知ページ作成まで到達 |
| 2 | 冪等性 | 同一失敗の重複起動 | normal-1と同一のexecution.id + lastNodeExecuted | isDuplicate=trueとなり通知をスキップ |
| 3 | 境界値 | フィールド欠損 | `{}` | フォールバック値で処理継続、throwしない |
| 4 | 異常系 | Notion API呼び出し自体が失敗（モック） | `mockNotionStatus: 401` | continueOnFailで処理は完了扱いになるが実質的な通知は失われる（既知のリスク） |

## 実行結果

| # | 実行日時 | 対象環境 | 実行コマンド／操作 | 実際の出力 | 成否 | 残存リスク |
|---|---|---|---|---|---|---|
| 1〜4 | 未実施 | n8nインスタンスへ未インポート | `[実行環境なしのため未テスト]` | - | - | Error Triggerの実際の出力データ構造がこのインスタンスで未確認のため、`エラー情報整形＋冪等性チェック`ノードのフィールド抽出ロジックが実際に機能するかは優先的に検証が必要。ログ格納先database_idも実値未確定のため、そのままでは実行不可（設定：ログ格納先ノードで意図的にthrowする設計）。 |

静的検証（`validate-workflow.mjs`：0エラー／孤立ノード警告1件＝Sticky Noteのみ、`check-secrets.mjs`：本番URL誤検知のみで実値漏えいなし）のみ実施済み。
