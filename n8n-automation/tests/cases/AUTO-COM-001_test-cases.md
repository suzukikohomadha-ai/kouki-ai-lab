# テストケース：AUTO-COM-001（共通Claude API呼び出しサブワークフロー）

対応するテストデータ：`tests/fixtures/AUTO-COM-001_cases.json`

| # | 分類 | 内容 | 入力 | 期待結果 |
|---|---|---|---|---|
| 1 | 正常系 | systemPrompt省略 | `{userPrompt: "..."}` | デフォルト値が適用され、Anthropic API呼び出しが成立するリクエストボディが生成される |
| 2 | 正常系 | 全パラメータ指定 | `{systemPrompt, userPrompt, model, maxTokens, temperature}` | 指定値がそのまま使われ、systemPromptに共通ガードレールが追記される |
| 3 | 異常系 | userPrompt未指定 | `{systemPrompt: "..."}` | 入力検証ノードでthrow、ワークフロー失敗 |
| 4 | 境界値 | userPromptが空白のみ | `{userPrompt: "   "}` | trim後に空となりthrow |
| 5 | 異常系 | Anthropic APIエラー応答（モック） | `mockHttpStatus: 529` | エラー分岐を通り最終的にthrow。`[要インスタンス確認]`：continueOnFail時のエラー格納形式が本インスタンスで未検証 |
| 6 | 境界値 | content配列が空のレスポンス（モック） | `mockResponseContent: []` | success:trueのまま空文字テキストが返る（既知の未対応ケース） |
| 7 | 統合 | 呼び出し元（AUTO-CNT-001）からExecute Workflow経由で呼び出す | AUTO-CNT-001のプロンプト生成結果 | AUTO-CNT-001側のIF: 生成成功判定に正しく分岐する |

## 実行結果

| # | 実行日時 | 対象環境 | 実行コマンド／操作 | 実際の出力 | 成否 | 残存リスク |
|---|---|---|---|---|---|---|
| 1〜7 | 未実施 | n8nインスタンスへ未インポート | `[実行環境なしのため未テスト]` | - | - | 実際にn8nへインポートし、Credential割当後に手動実行での検証が必須。特に#5・#6はcontinueOnFailの実挙動が未確認のため優先的に検証すること。 |

このドラフトは `scripts/validate-workflow.mjs`（0エラー、孤立ノード警告1件＝Sticky Noteのみ）・`scripts/check-secrets.mjs`（本番URL誤検知12件のみ、実際のCredential値・実ID等の漏えいなし）による静的検証のみ実施済みです。実際のn8n実行結果ではありません。
