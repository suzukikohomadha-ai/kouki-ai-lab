# ワークフロー一覧（現状の索引）

このファイルは `workflows/{draft,validated,deployed,archived}/` 配下の現状を一目で把握するための索引です。
個々の詳細設計は `docs/cases/<管理ID>/workflow-design.md`、詳しい経緯は `../../logs/` の該当ログ
（`logs/common_2026-08-10_n8n自動化_進捗まとめ・整理_v1.md` から辿れます）を参照してください。

最終更新：2026-08-15（KNW-001の状態を追記、AUTO-KHM-001をn8n本体から持ち帰り追記、内製版・PUB-004への派生を追記）

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
| `AUTO-KHM-001` | Japan Regulatory & Government News Digest（＋コンパニオンError Handler） | n8n本体上に直接作成されていたものを2026-08-15に読み取り専用API経由でこのリポジトリへ持ち帰り（`draft`として保存） | `active: false`（未登録・Credential未割当を確認済み） | 静的検証のみ実施（`validate-workflow.mjs`：本体0エラー・警告6件＝Sticky Note孤立のみ、2026-08-15にレイアウト間隔不足11件を解消済み。コンパニオン0エラー・警告1件）。テストケース未作成。監査未実施 | 誰が・いつ作成したか不明のため経緯確認／Error Workflow割当のn8n UI確認。**2026-08-15、内製運用・Creator Hub提出の2系統へ派生させた（下記`AUTO-KHM-001（内製版）``PUB-004`参照）** |
| `AUTO-KHM-001`（内製版） | 同上（社内運用版） | `workflows/draft/AUTO-KHM-001_japan-regulatory-news-digest.internal.json`として新規作成（`draft`） | 未登録（ローカルのみ） | 静的検証のみ実施（0エラー・警告6件＝Sticky Note孤立のみ） | 実RSSソース3件（METI/法務省/内閣府、PDL1.0準拠を確認済み）を設定済み、AI呼び出しをAUTO-COM-001経由に変更済み。**2026-08-15、PUB-004の実機テストで発見した不具合5件（`includeOtherFields`未設定・`columns.schema`欠落等、詳細は`docs/cases/AUTO-KHM-001/workflow-design.md`）を本ファイルにも反映済み**。残作業：実配信先（Slackチャンネル・Gmail・Notion DB）の確定（要社長確認）→Credential作成・割当（要承認）→`n8n-quality-auditor`監査→本番登録（要承認） |
| `PUB-004` | Summarize Japanese regulatory news with Claude and post the digest to Slack | `workflows/draft/PUB-004_japan-regulatory-news-digest.json` | 2026-08-15、社長承認のもと実機登録・**実機テストで完全成功を確認**（実ID`jejKmWHPDWSUifDZ`、実行ID#251：RSS取得→フィルタ→AI要約→Slack投稿→Sheets記録まで全工程成功、詳細は設計書参照）。テスト後、テスト専用の設定値はプレースホルダーへ戻し済み | 静的検証（0エラー・警告6件＝Sticky Note孤立のみ）＋**実機End-to-Endテスト成功**。Creator Hub提出用メタデータ作成済み（`PUB-004_japan-regulatory-news-digest.creator-hub-submission.md`）、Sticky Noteサイズも見直し済み（PUB-001の差し戻し事例を踏まえた予防対応） | **頒布方針を社長確認済み：n8n Creator Hubで無料公開**（n8nplace等の有料販売は不採用）。残作業：n8n画面上でのSticky Note表示の目視確認→`PUB-003`との機能重複を踏まえた提出可否の最終判断→鈴木さん本人によるCreator Hubへの提出→`workflows/validated/`へ格上げ |

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
