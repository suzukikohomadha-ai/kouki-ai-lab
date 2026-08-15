# テストケース：AUTO-KHM-001（案A：日本の規制・行政ニュース多言語ダイジェスト配信）

対応するテストデータ：`tests/fixtures/AUTO-KHM-001_cases.json`

> **[実行環境なしのため未テスト]** 本ドキュメントの「期待結果」はすべて手計算・設計上の想定であり、
> 実際にn8nへインポート・実行して確認したものではありません。実インスタンスでのインポート・
> 手動実行による検証が別途必須です。

## 正常系・境界値・異常系

| # | 分類 | 内容 | 入力（フィクスチャ内の参照） | 期待結果（想定・未検証） |
|---|---|---|---|---|
| 1 | 正常系 | 複数ソースからの新着記事を統合し、既読ログと未一致の記事のみ残す | `rssFeedReadMockOutputs` + `distributionLogMockRows` | `expectedDedupeResult.expectedNewArticleUrls` の1件（demo-b-1）のみが新着として残る |
| 2 | 正常系 | 期間フィルタ（lookbackDays=7）で古い記事を除外 | `rssFeedReadMockOutputs.source1Items[1]`（2026-07-01付、実行日想定2026-08-15前後） | Filterノードで除外され、後段に到達しない |
| 3 | 重複排除 | 既読ログに一致するURLを除外 | `rssFeedReadMockOutputs.source1Items[0]`（demo-a-1）と`distributionLogMockRows.rows[0]`が同一URL | `Code: Deduplicate Against Log`の出力から除外される |
| 4 | 境界値・0件 | 全ソースが空、または全件既読の場合 | `boundaryCases.zeroNewArticlesCase` | `Code: Check New Article Count`が`newArticleCount:0`を返し、`If: New Articles Found?`のfalse分岐（`NoOp: End`）へ進む。AI呼び出し・配信は発生しない |
| 5 | 異常系 | AI応答がJSON配列としてパースできない | `boundaryCases.malformedAiResponseCase` | `Code: Parse AI Response`が例外を投げ、ワークフロー実行が失敗として終了する（Error Workflowが設定されていれば、その時点でエラーワークフローが自動起動する想定） |
| 6 | 欠損データ | RSS項目にpubDateもisoDateも無い | `boundaryCases.missingPubDateCase` | `[要インスタンス確認]` `new Date(undefined).getTime()`は`NaN`となり、`gte`比較でおそらく除外される想定だが、Filterノードの実際の比較演算子の挙動（`NaN`の扱い）は未確認 |
| 7 | 冪等性 | 複数ソースが同一記事URLを配信した場合の実行内重複排除 | フィクスチャ外・設計上の想定ケース | `Code: Deduplicate Against Log`内の`seen`セットにより、同一実行内の重複URLも1件に統合される |
| 8 | 二重実行防止 | Slack/Gmail/Notionの3並列ブランチが既読ログ更新を何回起動するか | ワークフロー構造そのもの（フィクスチャ非依存） | `Merge: Join Slack + Gmail Branch`→`Merge: Join + Notion Branch`で同期後に`Google Sheets: Append Distribution Log`が実行されるため、1回のみ実行される設計。**Mergeノードの実際の同期挙動（全入力が揃うまで待つか）はn8nバージョンにより異なる可能性があり[要インスタンス確認]** |
| 9 | オプション機能OFF | `createGmailDraft=false`かつ`appendToNotion=false`（既定値） | `configInput` | Gmail・Notionノードは実行されず、`NoOp: Gmail Draft Skipped`・`NoOp: Notion Skipped`を通過する |
| 10 | オプション機能ON | `createGmailDraft=true`の場合 | フィクスチャ外・設定変更ケース | `Gmail: Create Draft`（resource=draft, operation=create）が実行され、**送信はされず下書きのみ作成される**想定（T28で確認済みのパターンを踏襲。ただし本ワークフローでの再確認は未実施） |

## 実行結果

| # | 実行日時 | 対象環境 | 実行コマンド／操作 | 実際の出力 | 成否 | 残存リスク |
|---|---|---|---|---|---|---|
| 1〜10 | 未実施 | n8nインスタンス未接続 | `[実行環境なしのため未テスト]` | - | - | n8nへのインポート・実行検証、および各ノードの正式仕様確認（`type`・`typeVersion`・パラメータ）が必須 |

## 静的検証について

`scripts/validate-workflow.mjs` ・`scripts/sanitize-workflow.mjs` ・`scripts/check-secrets.mjs` による
自動検証は、**本タスクを実施したセッションではシェル実行ツールが利用できなかったため実行できていません**
（`[実行環境なしのため未テスト]`）。実装メモ（`logs/kohomada_2026-08-15_日本進出n8nワークフロー案A_実装メモ_v1.md`）
に、手動での目視レビュー結果と、次回これらのスクリプトを実際に実行すべき旨を記載しています。
