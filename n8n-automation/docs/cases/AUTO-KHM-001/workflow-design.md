# ワークフロー設計書：AUTO-KHM-001（日本の規制・行政ニュースダイジェスト）

## 位置づけ（重要：本書は「恒久化」のための事後文書化）

本書は、通常の事前ヒアリング→設計フローを経て作成されたものではない。2026-08-15、社長より「AUTO-KHM-001 Japan Regulatory & Government News Digest (Draft - Not Deployed)」がn8n本体上に既に作成されていると指示を受け、このリポジトリのn8n接続情報（`.env`の読み取り専用APIキー）を使い、n8n公式REST API（`GET /api/v1/workflows`、`GET /api/v1/workflows/{id}`）へ読み取り専用アクセスして実際の定義を取得し、このリポジトリへ持ち帰った（＝「恒久化」）ものである。

- 取得日時：2026-08-15
- 取得方法：`https://kohomadha-n8n.top/api/v1/workflows/fnb61FLnpRLzX1ac`（本体）・`https://kohomadha-n8n.top/api/v1/workflows/jRsg2cYCjWdxrlG2`（コンパニオンのError Workflow）への読み取り専用GETリクエスト（`X-N8N-API-KEY`ヘッダー、`.env`格納の既存キーを使用）
- 誰が・いつ・どのような経緯でこのワークフローを作成したかは、このセッションでは追跡できていない（`updatedAt`は2026-08-15T02:46台）
- 取得時点で`active: false`（未有効化）、両ワークフローともノードにCredentialは一切割り当てられていない（確認済み）
- 本書の内容は、実際に取得したJSON定義（ノード構成・パラメータ・Sticky Note内の説明文）から機械的に読み取れる事実のみを記載する。意図・背景・要件は、ワークフロー自身のSticky Noteに書かれている範囲でのみ引用し、それ以外は`[要確認/社長]`とする。

## 基本情報

- ワークフロー名：AUTO-KHM-001 Japan Regulatory & Government News Digest（本体）／AUTO-KHM-001 Japan Regulatory & Government News Digest - Error Handler（コンパニオン、Error Workflow用）
- 一意の管理ID：AUTO-KHM-001
- 目的（ワークフロー自身のSticky Note「Overview & Setup」より引用・翻訳）：日本市場に参入する海外企業を支援するチーム・コンサルタントが、日本語を読まずに日本の規制・行政発表を追跡できるようにする軽量な仕組み。RSSで収集→重複除去・期間フィルタ→AI要約・翻訳→Slack（既定）／Gmail下書き・Notion追記（任意）で配信→配信ログ更新、という一連の流れ。
- 業務責任者：`[要確認/社長]`
- 技術責任者：`[要確認/社長]`（このワークフローを直接n8n上で作成した担当が誰かは追跡できていない）
- 対象部署：`KHM`（コホマダ事業向け業務ツール、本ワークフローの持ち帰りにあたり新設。`docs/architecture.md`参照）。ただし内容面ではPUB（Creator Hub提出用汎用テンプレート）と酷似した形式（英語UI・プレースホルダーのみ・「as-is」免責文言）であり、内製ツールかCreator Hub提出候補かは`[要確認/社長]`。
- トリガー：Schedule Trigger（`n8n-nodes-base.scheduleTrigger` v1.2）、週次・毎週月曜9時（タイムゾーンは未指定、インスタンスのデフォルトに依存 `[要インスタンス確認]`）
- 入力データ：ユーザーが`Set: Config`ノードで設定するRSSフィードURL最大3件（本ドラフトは3スロットのみ、出荷時点ではすべてプレースホルダーURL `https://example-government-source-*.example/rss`で実在のソースは未設定）
- 出力データ：Slackへの投稿（既定）、任意でGmail下書き作成・Notionページ追記。Google Sheets（配信ログ）への追記
- 前提条件（ワークフロー自身のSticky Noteが明記する必須セットアップ）：
  1. `Set: Config`ノードのプレースホルダーRSS URLを、利用者自身が「実在確認済み・再利用条件を満たす」ソースに置き換える
  2. Credential作成：Google Sheets（配信ログ用）、AI/LLMプロバイダ（HTTP Header Auth）、Slack、任意でGmail/Notion
  3. 配信ログ用Googleスプレッドシートを作成（列：`articleUrl`・`sourceName`・`distributedAt`）
  4. 「Copyright & Compliance」のSticky Noteを必ず読んでから有効化する
  5. コンパニオンのError WorkflowをインポートしSettings > Error Workflowに設定する
  6. 手動実行でテストしてからスケジュールを有効化する
- 利用サービス：RSS（利用者設定のフィード）、AI/LLMプロバイダ（HTTP Request、プロバイダ名は未指定のプレースホルダー`https://your-llm-provider.example/v1/chat/completions`）、Slack、Gmail（任意）、Notion（任意）、Google Sheets
- 必要Credential（いずれも未作成・未割当、取得時点で確認済み）：
  - Google Sheets用Credential（配信ログの読み書き）
  - AI/LLMプロバイダ用のHTTP Header Auth Credential（プロバイダ名未確定、Anthropic APIをAUTO-COM-001経由で使う設計にはなっていない点に注意。汎用HTTP Requestの直書きプレースホルダー）
  - Slack用Credential
  - Gmail用Credential（`createGmailDraft`設定がtrueの場合のみ必要）
  - Notion用Credential（`appendToNotion`設定がtrueの場合のみ必要）
- 実行頻度：週次（デフォルト、Schedule Triggerのcron設定を変更すれば変更可）
- 想定件数／最大件数／想定実行時間／許容遅延：いずれも`[未確認]`（利用者が設定するRSSソース数・記事量に依存するため、本ドラフト単体では見積もれない）
- エラー時の対応：コンパニオンのError Workflow（`AUTO-KHM-001 ... - Error Handler`）が`Error Trigger`→`Set: Format Error Notification`→`Slack: Notify Admin (Error)`の3ノード構成で用意されている。ただし本体ワークフロー側のSettings > Error Workflowへの割当はセットアップ手順として明記されているのみで、取得時点では未設定（`[要確認/社長]`または要n8n UI確認）。
- 手動対応への切替条件：`[要確認/社長]`（本ドラフトに明記なし）
- ログ方針：Google Sheetsの配信ログ（`articleUrl`・`sourceName`・`distributedAt`）に、配信済み記事を1行ずつ記録し、次回実行時の重複判定に使う
- 保存期間：`[要確認/社長]`
- 個人情報の有無：配信先メールアドレス（`digestRecipientEmail`、既定値はプレースホルダー`placeholder-recipient@example.com`）、Slackチャンネル名程度。RSSソース自体・要約結果に第三者の個人情報が含まれる可能性は、利用者が設定するソース次第のため`[未確認]`。
- 監視項目：`[要確認/社長]`（本ドラフトに明記なし。エラー通知はSlackへのError Workflow経由のみ）
- 成功条件：新着記事が要約・翻訳されSlack（既定）に投稿され、配信ログが更新されること
- KPI：`[要確認/社長]`
- ロールバック方法：Schedule Triggerを無効化する（ワークフロー自身に明記のロールバック手順の記載はなし、他ワークフローの慣例を踏襲した推定）
- 変更履歴：2026-08-15（このリポジトリへの持ち帰り・文書化。ワークフロー自体の作成日時・作成経緯は不明）

## 案の比較（最低2案）

本書は事後文書化のため、複数案の比較検討記録は存在しない（`[該当なし・事後文書化のため]`）。

## 技術観点チェック（ワークフロー定義から読み取れる範囲）

- [x] 冪等性／二重実行防止：`Code: Deduplicate Against Log`ノードで、Google Sheets配信ログの既存`articleUrl`と突合し、既配信記事を除外する設計。
- [x] 期間フィルタ：`Filter: Within Lookback Period`で、`lookbackDays`（既定7日）以内に公開された記事のみを対象とする。
- [x] 部分失敗時の処理：新着記事が0件の場合は`If: New Articles Found?`で分岐し、AI呼び出し以降をスキップする（`NoOp: End (No New Articles)`）。
- [x] 配信先の任意化：Gmail下書き作成・Notion追記は、それぞれ`createGmailDraft`・`appendToNotion`の設定値（既定both false）でON/OFFできる設計。Slack投稿は既定で常時実行。
- [ ] タイムアウト・リトライ：AI呼び出し（HTTP Request、プレースホルダー）に`timeout: 60000`は設定されているが、`retryOnFail`等のリトライ設定は確認できず（`continueOnFail`の指定も無し）。RSS Feed Readノードのタイムアウト・リトライ設定も本ドラフトには無い。
- [ ] エラーワークフロー割当：コンパニオンは用意されているが、本体側での実際の割当設定は`[要確認]`（n8n UI上でのSettings確認が必要）。
- [~] 個人情報のマスキング：投稿者情報等は扱わない設計（RSS記事の内容のみ）だが、配信先メールアドレス自体は設定値としてプレーンテキストで保持される。
- [x] 認証情報の分離：Credential実値・実IDはJSON内に一切含まれない（取得時点で未割当のため確認済み）。

## ノード構成（取得したJSON定義より）

**本体（40ノード）**：Sticky Note×6（Overview & Setup／1. Collect／2. Dedupe & Filter／3. Summarize & Translate／4. Distribute／Copyright & Compliance）、Schedule Trigger、Set: Config、RSS Feed Read×3＋Set: Label×3（ソース1〜3）、Google Sheets: Read Distribution Log、Set: Tag Log Entries、Merge×2（ソース統合）、Filter: Within Lookback Period、Set: Tag RSS Items、Merge: Combine RSS + Log (for Dedup)、Code: Deduplicate Against Log、Code: Check New Article Count、If: New Articles Found?、NoOp: End (No New Articles)、Code: Build AI Summarize+Translate Prompt、HTTP Request: AI Summarize & Translate (placeholder)、Code: Parse AI Response、Code: Assemble Digest、Slack: Post Digest、If: Create Gmail Draft?、Gmail: Create Draft、NoOp: Gmail Draft Skipped、If: Append to Notion?、Notion: Append Digest Entry、NoOp: Notion Skipped、Merge×2（Slack+Gmail、+Notion）、Code: Prepare Log Rows、Google Sheets: Append Distribution Log。

**コンパニオン（Error Handler、4ノード）**：Sticky Note: Error Workflow Setup、Error Trigger、Set: Format Error Notification、Slack: Notify Admin (Error)。

詳細なノード種別・typeVersion・パラメータは`workflows/draft/AUTO-KHM-001_japan-regulatory-news-digest.json`（本体）・`workflows/draft/AUTO-KHM-001_japan-regulatory-news-digest.errorhandler.json`（コンパニオン）を参照。

## 検証結果（2026-08-15、このリポジトリ持ち帰り時に実施）

- `validate-workflow.mjs`：本体はエラー0件・警告17件（Sticky Note孤立6件は他ワークフローと同様の既知パターン。**残り11件はSticky Noteと実ノードの重なり・間隔不足**で、他ワークフロー（AUTO-CNT-002等）で守られている「80px以上の間隔」ルールに反している。ただし機能面には影響しないレイアウト上の指摘であり、n8n UI上でSticky Noteをドラッグして調整すれば解消できる想定。コンパニオンはエラー0件・警告1件（Sticky Note孤立のみ）。
- `check-secrets.mjs`：本体1件検出（`placeholder-recipient@example.com`、プレースホルダーのため誤検知）、コンパニオンは検出なし。
- 取得元APIレスポンスに含まれていた所有者の実名・メールアドレス（`shared`フィールド）、内部ID・バージョン情報等のメタデータは、このリポジトリへ保存する前にすべて除去済み（`name`・`active`・`nodes`・`connections`・`settings`のみを保持）。

## 未確認事項（本書作成時点でこのセッションからは解消できないもの）

- このワークフローがいつ・誰によって・どのような経緯で作成されたか
- `KHM`という部署略称の妥当性（`PUB`系列との重複可能性、上記「対象部署」参照）
- 実際にどのRSSソースを使う想定か（プレースホルダーのみで実ソース未設定）
- AI/LLMプロバイダとして何を使う想定か（Anthropic API・AUTO-COM-001経由の想定になっていない点を含む）
- Slackチャンネル・Gmail送信先・Notion DB等、実際の配信先
- コンパニオンError Workflowの本体への割当状況（n8n UI上の確認が必要）
- レイアウト警告11件の解消（機能に影響しない見た目上の課題）

## 次のフェーズ

`n8n-automation/CLAUDE.md`のPhase 0〜10に沿えば、本ワークフローは実質「Phase 3（設計）〜Phase 4（実装）」相当まで進んだ状態で見つかったが、**要件定義（Phase 2）に相当する正式なヒアリングを経ていない**。本番投入を検討する場合は、上記「未確認事項」（特に実ソース・実配信先・AI/LLMプロバイダの選定）について社長へのヒアリングを行い、`n8n-quality-auditor`による監査（AUTO-CNT-002と同様の観点）を経てからCredential割当・本番登録に進むことを推奨する。
