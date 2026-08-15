# ワークフロー一覧（現状の索引）

このファイルは `workflows/{draft,validated,deployed,archived}/` 配下の現状を一目で把握するための索引です。
個々の詳細設計は `docs/cases/<管理ID>/workflow-design.md`、詳しい経緯は `../../logs/` の該当ログ
（`logs/common_2026-08-10_n8n自動化_進捗まとめ・整理_v1.md` から辿れます）を参照してください。

最終更新：2026-08-15（KNW-001の状態を追記）

## ⚠️ ローカルの状態とn8n本体の実際の状態にズレがあります

`AUTO-CNT-001` `AUTO-CNT-002` `AUTO-COM-001` `AUTO-COM-002` の4件は、`workflows/draft/`に
置かれ監査ログ上も「条件付き承認・本番投入前に対応が必要」という扱いのままですが、
2026-08-10にn8n本体を確認したところ、**実際には4件とも`active: true`で稼働中、かつ実在の
Notion／Google／LINE Credentialが割り当て済み**でした（レイアウト修正の反映作業中に判明）。
つまりドキュメント上の「対応必要」ステータスと、本体の実際の稼働状態が一致していません。
これがいつ・誰の操作で本番化されたかは本セッションでは追跡できていません。**社長への確認・
`n8n-quality-auditor`による正式な再監査を推奨します**（特にAUTO-CNT-002は監査自体が
未実施のまま稼働している状態です）。

## 現在の状態一覧

| 管理ID | ワークフロー名 | ローカルの状態 | n8n本体の実際の状態（2026-08-10確認） | 直近の監査判定 | 対応が必要なこと |
|---|---|---|---|---|---|
| `AUTO-CNT-001` | note運用マニュアル（社内版・自動更新・下書き分離方式） | `draft`（v2） | **稼働中**（active、Notion Credential 3ノードに割当済み） | 条件付き承認（`logs/common_2026-08-09_n8n実装_再監査_v1.md`） | 同一ID禁止ガードのID表記ゆれ正規化（未対応）／稼働中である旨の社長確認 |
| `AUTO-CNT-002` | note運用計画書分析＋LINE承認反映（Phase1／Phase2） | `draft`（v1） | **稼働中**（active、Notion/Google/LINE Credential 14ノードに割当済み） | **未監査**（`n8n-quality-auditor`のレビュー未実施） | 署名検証が暫定停止中のまま稼働（`logs/common_2026-08-10_n8n実装_第7弾_v1.md`参照）／監査未実施のまま稼働中である旨の社長確認・正式監査 |
| `AUTO-COM-001` | 共通Claude API呼び出しサブワークフロー | `draft` | **稼働中**（active、Anthropic Credential割当済み） | 条件付き承認（据え置き） | Execute Workflow Triggerの実機仕様確認（`n8n-schema-researcher`、未対応） |
| `AUTO-COM-002` | 共通エラーハンドラー | `draft` | **稼働中**（active、LINE/Notion Credential割当済み） | 条件付き承認（据え置き） | Credentialの技術的疎通確認（LINE送信テスト、未実施の可能性） |
| `DEMO-001` | 経費申請しきい値チェック（デモ・外部接続なし） | `draft` | 未登録（ローカルのみ） | 静的検証のみ（監査対象外の安全なデモ） | なし（デモ用途のため本番投入予定なし） |
| `PUB-001` | Generate text with Claude and post it to Slack via a validated webhook | **`validated`** | 稼働中（実機テスト目的で意図的に登録・有効化） | 実機テスト完了（`tests/results/2026-08-10_PUB-001_result.md`） | **Creator Hub 2回目提出・審査中**（1回目は2026-08-11にSticky Note文字切れで差し戻し→修正し2026-08-12再提出。詳細：`validated/PUB-001_claude-api-webhook-with-retry.creator-hub-submission.md`）。審査結果待ち |
| `PUB-002` | Notify Slack on workflow errors, with a Discord fallback | **`validated`** | 実機テスト目的で意図的に登録・有効化（テスト用の使い捨てワークフローは削除済み） | 実機テスト完了、不具合1件発見・修正済み（`tests/results/2026-08-12_PUB-002_result.md`） | Creator Hub提出待ち（PUB-001審査中のため新規提出不可の可能性、詳細：`validated/PUB-002_error-notifier-with-fallback.creator-hub-submission.md`） |
| `PUB-003` | Summarize an RSS feed with Claude and post the digest to Slack | **`validated`** | 実機テスト目的で意図的に登録（手動実行のみ、Schedule Triggerは無効化のまま） | 実機テスト完了、不具合1件発見・修正済み（`tests/results/2026-08-12_PUB-003_result.md`） | Creator Hub提出待ち（PUB-001審査中のため新規提出不可の可能性、詳細：`validated/PUB-003_rss-digest-with-claude.creator-hub-submission.md`） |
| `KNW-001` | n8n公式テンプレート自動収集・スプレッドシート整理ワークフロー | `draft` | 未登録（ローカルのみ、実機への読み取り専用API確認は実施済み） | 静的検証のみ実施（`validate-workflow.mjs`0エラー、テストケース`tests/cases/KNW-001_test-cases.md`作成済みだが`[実行環境なしのため未テスト]`）。監査未実施 | Google Sheets typeVersion（4.7/4.5）・Execute Workflowのtypeversion1.3形式・Wait/Split In Batchesの稼働実績確認（いずれもn8n UI上での実機確認が必要）／sheetName確定／Google Sheets・Anthropic Credential割当（要承認）／`n8n-quality-auditor`監査／本番登録・Schedule Trigger有効化（要承認） |

## レイアウト規約（2026-08-10ルール化）

Sticky Noteと通常ノードがキャンバス上で重ならないよう、全ワークフロー（上記6件）のSticky Note
配置を修正済みです。`scripts/validate-workflow.mjs`にレイアウト重なりの自動検出を組み込んだため
（`.claude/rules/n8n-workflow-json.md`参照）、今後新規作成・更新するワークフローも同スクリプトを
実行すれば同じ基準が自動的に適用されます。

## 補足

- **`PUB-001` `PUB-002`は他の5件と目的が異なります。** AUTO-*/DEMO-*は社内業務自動化（T100系列
  プロジェクト）向け、`PUB-*`はn8n公認クリエイター制度（Creator Hub）への公開テンプレート提出候補
  です。自社固有の情報を一切含まない、他人が再利用できる汎用ワークフローとして別枠（`PUB`）で
  管理しています（`docs/architecture.md`の部署略称一覧を参照）。`PUB-002`は社内向け
  `AUTO-COM-002`（LINE通知＋Notionフォールバック）の設計思想を、Slack＋Discord（ともにOAuth不要で
  低コストにテストできる）に置き換えて汎用化したものです。
- `workflows/validated/`にある`PUB-001`のJSONファイルは、n8n本体（鈴木さんのセルフホスト環境）へ
  実際に登録・Credential割当・有効化・4パターンの動作確認を行った上で格上げしたものです。ただし
  ローカルのこのファイル自体にはCredentialの実値・自社固有IDを一切含めていません（提出用に汎用性を
  保つため）。
- `workflows/deployed/` `workflows/archived/`は現時点で空です（`.gitkeep`のみ）。
- ここに載っていない`AICompany/n8n-workflows/`（このフォルダの外、`n8n-automation/`とは別の場所）は、
  **別案件（T27/T28、リスペクトマリン案件向けデモ）の完了済み納品物**であり、このプロジェクト
  （T100系列）とは無関係です。混同しないよう分けて管理しています。
