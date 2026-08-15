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
- 対象部署：`KHM`（コホマダ事業向け業務ツール、本ワークフローの持ち帰りにあたり新設。`docs/architecture.md`参照）。**2026-08-15、社長確認済み**：①コホマダ内製ツールとしての実運用、②`PUB`系列と同様のCreator Hub提出候補、の**両方**を目的とする。Creator Hub提出時は別途`PUB`番号を採番し、自社固有情報を含まない形へ整える作業が必要（現状のプレースホルダーのみの状態はむしろCreator Hub提出には適しているが、内製運用には実ソース・実配信先の設定が別途必要）。
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
- Slackチャンネル・Gmail送信先・Notion DB等、実際の配信先（下記「①内製運用の進捗」参照。社長確認が必須）
- コンパニオンError Workflowの本体への割当状況（n8n UI上の確認が必要）
- レイアウト警告11件の解消（機能に影響しない見た目上の課題）

## 2026-08-15：①②を並行して進めた記録

社長より①コホマダ内製運用②Creator Hub提出、の両方を目的とすると確認が取れたため、`AUTO-KHM-001`から2つの派生ファイルを作成した。

### ①内製運用向け：`workflows/draft/AUTO-KHM-001_japan-regulatory-news-digest.internal.json`

**実RSSソース3件を調査・実アクセスで確認済み**（2026-08-15、curlで直接アクセスしHTTP 200・直近日付のエントリを確認）：

| ソース | フィードURL | 利用規約 |
|---|---|---|
| 経済産業省（METI）ニュースリリース | `https://www.meti.go.jp/ml_index_release_atom.xml` | 公共データ利用規約（PDL1.0）準拠を確認（`https://www.meti.go.jp/main/rules.html`）。出典明記の上での編集・要約・再配布が可能 |
| 法務省 新着・更新情報 | `https://www.moj.go.jp/news.xml` | PDL1.0準拠を確認（`https://www.moj.go.jp/hisho06_00280.html`）。同上 |
| 内閣府 報道発表新着情報 | `https://www.cao.go.jp/rss/news.rdf` | PDL1.0準拠を確認（`https://www.cao.go.jp/notice/rule.html`）。同上 |

**検討したが採用しなかった候補**：JETRO（ジェトロ）はコホマダの事業領域（貿易・海外展開支援）と直結し内容面では最も魅力的だが、利用規約（`https://www.jetro.go.jp/biznews/faq/article_use.html`）が「転載・複製・編集・加工…をご遠慮いただいております」と明記し事前許諾を原則必須としているため、AI要約・自動再配布との適合性が不明。追加を希望する場合はJETRO側への事前確認を推奨（本ドラフトでは意図的に含めていない）。いずれもPDLと異なり本セッションでは実務上の許諾可否を確認できていない点に留意。

**AI/LLM呼び出しをAUTO-COM-001（共通Claude API呼び出しサブワークフロー、実ID`r0IZ2ByR7MX4RWCp`、2026-08-15に`active:true`を再確認）経由に変更**：プレースホルダーのHTTP Requestを廃し、Execute Workflowノード（typeVersion 1、AUTO-CNT-002が実機確認済みの「プレーンworkflowId・全渡し」形式を踏襲）に置き換えた。モデルは`claude-sonnet-5`（翻訳精度を優先）、temperatureは0.3（事実ベースの要約でハルシネーションを抑制）を初期値として設定。

**引き続き社長確認が必要な項目（実配信先）**：
- `slackChannel`（実際のSlackワークスペース・チャンネル名）
- `digestRecipientEmail`（Gmail下書き機能をONにする場合の想定表示用ラベル。実際の送信先は下書き作成者＝Gmail Credentialの持ち主のアカウントになる点に注意）
- `appendToNotion`をONにする場合のNotion DB ID

これらが確定すればCredential作成（要承認）→`n8n-quality-auditor`監査→本番登録、に進められる状態。

### ②Creator Hub提出向け：`workflows/draft/PUB-004_japan-regulatory-news-digest.json`

元のプレースホルダーのみの汎用版を`PUB-004`として複製（内容は無改変、ワークフロー名のみPUB命名規則に合わせて`Summarize Japan regulatory and government news with Claude and distribute the digest`に変更）。**現時点では`workflows/draft/`に留め置き、`workflows/validated/`へは格上げしていない**（PUB-001〜003は実インスタンスへの登録・実機テストを経てから`validated/`へ格上げされているが、`PUB-004`はまだ登録・実機テストを一切行っていないため、同列に扱うと実態と異なる）。

**提出前に検討が必要な点**：
- `PUB-003`（RSS要約→Slack投稿）と機能領域が重なる。`PUB-004`の差別化点は、複数ソース対応・Google Sheetsでの重複排除・翻訳機能・Slack/Gmail/Notionの複数配信先・「日本の規制・行政ニュース」という特定ニッチへの特化、と考えられるが、Creator Hub提出の価値があるかは社長判断。
- ~~レイアウト警告11件（Sticky Noteの重なり・間隔不足）の解消~~ → **2026-08-15完了**。原因はSticky Note群（上部y:0〜508）と機能ノード群（RSS Feed Read等、最上段がy:352から開始）の間隔が設計時点から不足していたこと。機能ノード35個（Copyright & Complianceのstickyを含む、Overview/1〜4のセクション見出しstickyを除く）をy方向に一律+500した上で、Overview & Setupのstickyの高さを340→250に縮小し解消（接続関係・ノードの内容は無変更、位置のみ調整）。`AUTO-KHM-001`本体・内製版・`PUB-004`の3ファイルすべてに適用し、`validate-workflow.mjs`でエラー0件・警告6件（Sticky Note孤立のみ、他ワークフローと同様の想定内パターン）まで低減したことを確認済み。ただしn8n UI上での見た目の最終確認はしていない（`[要インスタンス確認]`）。
- ~~実機登録の実施~~ → **2026-08-15、社長承認のもと実施済み**。n8n本体へ実際に登録（実ワークフローID`jejKmWHPDWSUifDZ`、`active:false`のまま）。あわせてAI呼び出しノードを、社長確認（既存Anthropic Credentialを流用）に基づきプレースホルダーからAnthropic Messages API（`https://api.anthropic.com/v1/messages`、`authentication:predefinedCredentialType`/`nodeCredentialType:anthropicApi`、n8n公式仕様で確認済み）へ実装し直し、レスポンス解析（`content[].text`）もAnthropic実仕様に合わせて修正した。ローカルの`workflows/draft/PUB-004_japan-regulatory-news-digest.json`と実インスタンスの内容は同期済み。
- **実機テストの残作業（n8n UI上で社長が実施、要Credential）**：
  1. Slack Credential新規作成（お持ちのBot Tokenをn8n UI上で直接入力。トークンをチャットには貼らない方針で統一）→`Slack: Post Digest`ノードへ割当
  2. 既存の「Google Sheets account」Credentialを`Google Sheets: Read/Append Distribution Log`の2ノードへ割当
  3. 配信ログ用の実在するGoogleスプレッドシート（列：`articleUrl`・`sourceName`・`distributedAt`）を用意し、`Set: Config`ノードの`documentId`プレースホルダーを実IDに差し替え
  4. 既存の「Anthropic - n8n」Credentialを`HTTP Request: AI Summarize & Translate (Anthropic Claude)`ノードへ割当
  5. 手動実行でテストし、レビュー用RSSソース（METI等、内製版で確認済みのものを流用可）を`Set: Config`に一時的に設定してエンドツーエンドの動作を確認
- 上記完了後、`workflows/validated/`への格上げと`*.creator-hub-submission.md`の作成を検討する。

**2026-08-15、頒布方法を社長確認：n8n公式Creator Hubでの無料公開を採用（n8nplace等の第三者マーケットプレイスでの有料販売は不採用）**。理由（提案・確認時のやり取りより）：
- n8n公式Creator Hub自体はテンプレートを無料公開する仕組みであり、Creator向けの収益化はテンプレート単体の売上ではなくn8n Cloudアフィリエイト経由の紹介報酬が中心（`https://n8n.io/creators/`・`https://n8n.io/affiliates/`、2026-08-15参照）。有料直接販売はn8nplace等、公式Creator Hubとは別の第三者マーケットプレイスでのみ可能。
- 本テーマ（日本の規制・行政ニュース、海外企業の日本進出支援向け）はコホマダの本業と直接重なるため、有料公開すると自社のコンサルティング価値を自分で目減りさせるリスクがある一方、無料公開はPUB-001〜003で既に取り組んでいる無料戦略と一貫し、信頼度・Verified Creatorバッジの蓄積という長期的価値に資すると判断。

### 静的検証結果（両ファイルとも2026-08-15実施）

- `AUTO-KHM-001_japan-regulatory-news-digest.internal.json`：`validate-workflow.mjs`0エラー・警告17件（既存のレイアウト警告のみ、AI呼び出し変更による新規警告なし）。ノード数40・接続の整合性（孤立参照なし）をスクリプトで確認済み。`check-secrets.mjs`は実government URLの誤検知7件＋プレースホルダーemail1件のみ（実値の混入なし、目視確認済み）。
- `PUB-004_japan-regulatory-news-digest.json`：元のプレースホルダー版から名称のみ変更のため、検証結果は committed 済みの`AUTO-KHM-001_japan-regulatory-news-digest.json`と同一（0エラー・警告17件、check-secrets 1件＝プレースホルダーemail誤検知のみ）。

## 次のフェーズ

- **内製運用**：上記「引き続き社長確認が必要な項目」の確定 → Credential作成・割当（要承認）→ `n8n-quality-auditor`監査 → 本番登録（要承認）。
- **Creator Hub提出**：`PUB-003`との差別化について社長判断 → レイアウト調整 → 実機登録・テスト（要承認）→ `workflows/validated/`格上げ・提出資料作成。
