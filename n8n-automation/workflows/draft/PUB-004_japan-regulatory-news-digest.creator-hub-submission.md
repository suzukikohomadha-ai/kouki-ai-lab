# Creator Hub 提出用メタデータ：PUB-004

対象ワークフロー：`PUB-004_japan-regulatory-news-digest.json`（＋コンパニオン `PUB-004_japan-regulatory-news-digest.errorhandler.json`）
作成日：2026-08-15
ステータス：**Validated・n8n実機で動作確認済み（不具合5件発見・修正済み）・Creator Hub未提出**

n8n本体上に直接作成されていた`AUTO-KHM-001`を2026-08-15にこのリポジトリへ持ち帰り、内製運用版とCreator Hub提出候補（本ファイル）の2系統に分岐させた（詳細は`docs/cases/AUTO-KHM-001/workflow-design.md`）。RSS収集（最大3ソース）＋Google Sheetsでの重複排除＋Anthropic Claudeでの要約・翻訳＋Slack/Gmail/Notionの複数配信先、という構成で、`PUB-003`（単一RSS→Claude→Slackのみ）より機能領域が広い。

## タイトル（英語・Sentence case・動詞開始・80字以内）

```
Summarize Japanese regulatory news with Claude and post the digest to Slack
```

（75字。既定の配信先はSlackのみだが、Gmail下書き作成・Notion追記も設定でON/OFFできる。この点は説明文の"What this workflow does"で明記する）

## 説明文

**【2026-08-15訂正】** 実際の提出フォーム（`creators.n8n.io/workflows/<id>/edit`）を鈴木さんに画面共有していただき確認したところ、以前の記述（PUB-001/003作成時点の想定、note.com記事に基づく「タイトル＋Markdown説明文1本＋JSONアップロード」という理解）は不正確だったことが判明した。**実際の説明欄は以下の構造化された複数フィールドに分かれている**（今後のPUB提出でもこの構造を前提にする）：

- **簡単な概要**（Brief overview、10〜50語、1段落）
- **仕組み**（How it works、50語以上、番号付きステップ）
- **設定**（Setup、50語以上、番号付きステップ）
- **要件**（Requirements、任意、1項目ずつ追加していくリスト）
- **カスタマイズ**（Customize、任意、同じくリスト）
- **追加情報**（Additional info、任意、自由記述）

なお、n8n側のフォーム自体がアップロードしたJSONから内容を自動生成する機能を持っており、鈴木さんが提出作業を進めた時点で「簡単な概要」「仕組み」「設定」は自動生成された英文が既に入っていた（内容を確認したところ事実誤認はなく、そのまま採用可能な品質だった）。以下は、その自動生成内容と実質的に同内容になるよう当方で用意した版、および自動生成されない「要件」「カスタマイズ」「追加情報」の入力内容。

### 簡単な概要（10〜50語）

```
This workflow runs weekly, reads user-configured RSS feeds for Japanese
regulatory and government news, deduplicates against a Google Sheets log,
summarizes and translates new articles with Anthropic Claude, then posts a
digest to Slack with optional Gmail draft and Notion logging.
```

（41語）

### 仕組み（50語以上、番号付き）

```
1. Runs on a configurable weekly schedule.
2. Reads up to three RSS feeds you configure in parallel and labels each
   item with its source name.
3. Filters out articles older than a configurable lookback window, then
   cross-references a Google Sheets distribution log so already-sent
   articles are excluded.
4. If at least one new article remains, sends all of them in a single
   batched request to Anthropic Claude, asking for a short summary and
   translation of each.
5. Parses Claude's response and assembles one digest that always preserves
   each article's original title, URL, and publish date.
6. Posts the digest to a Slack channel; optionally also creates a Gmail
   draft and/or appends an entry to a Notion database, based on
   configuration toggles.
7. Records each newly distributed article in the Google Sheets log with a
   timestamp, so it is never summarized twice.
```

### 設定（50語以上、番号付き）

```
1. Import this workflow along with its companion error-handling workflow,
   and set this workflow's Settings > Error Workflow to point at the
   imported error workflow.
2. Add credentials in n8n: an Anthropic credential (used by the AI
   summarization HTTP Request node), a Slack credential with chat:write
   and channels:read scopes, and a Google Sheets credential — plus
   Gmail/Notion credentials only if you plan to enable those optional
   branches.
3. Open "Set: Config (Sources & Distribution Options)" and replace the
   placeholder RSS feed URLs, source names, lookback window, and Slack
   channel with your own values.
4. Create a Google Sheet with columns articleUrl, sourceName, and
   distributedAt for the distribution log, then paste its ID into both
   Google Sheets nodes.
5. Run a manual test execution and check the output before turning on the
   schedule.
```

### 要件（任意、1項目ずつ）

```
An n8n instance (Cloud or self-hosted)
An Anthropic API key, added as an "Anthropic" credential in n8n
A Slack app with a Bot Token that has the chat:write and channels:read OAuth scopes
A Google account with a Sheets credential
A Google Sheet you create yourself with columns: articleUrl, sourceName, distributedAt
RSS feed URLs you have personally verified — this template ships with no real source URLs, and you are responsible for confirming each source's terms of use permit AI summarization and redistribution
```

### カスタマイズ（任意、1項目ずつ）

```
Change lookbackDays to widen or narrow which articles count as "new"
Set createGmailDraft or appendToNotion to true to also deliver the digest by email draft or into a Notion database
Add or remove RSS Feed Read + Set (Label) + Merge nodes if you need more or fewer than three sources
Swap the Claude model in the prompt-building Code node — Haiku for speed/cost, Sonnet or Opus for higher-quality summaries — and increase max_tokens accordingly if you add more sources
```

### 追加情報（任意）

```
This template is provided as-is. You are solely responsible for verifying
that your chosen RSS sources and your use (AI summarization, translation,
automated redistribution) comply with each source's terms of use and
applicable law. This template does not warrant legal compliance for any
specific source.
```

## 設計上の判断

- **`PUB-003`との差別化**：`PUB-003`は単一RSSフィード→Claude要約→Slack投稿のみのシンプルな構成。本テンプレートは①最大3ソースの並行収集、②Google Sheetsによる重複排除（同じ記事を二度配信しない）、③要約に加えて翻訳、④Slack以外にGmail下書き・Notion追記も選べる複数配信先、という点で機能領域を広げている。「日本の規制・行政ニュースを日本語を読まずに追いたい」という具体的なユースケースに寄せたタイトル・説明文にすることで、`PUB-003`の汎用版と重複しないポジションを狙った。
- **AI呼び出しをn8n公式Cryptoノードではなく`predefinedCredentialType`のHTTP Requestにした理由**：n8n公式ドキュメント・GitHub（`n8n-io/n8n`、2026-08-15参照）で確認済みの通り、HTTP Requestノードから`nodeCredentialType: anthropicApi`を指定すれば、Anthropicの認証ヘッダー（`x-api-key`）をn8n側が自動付与できる。この方式は他人が自分のAnthropic Credentialをそのまま割り当てるだけで動く汎用性を保てる。
- **1回のAI呼び出しで全記事をまとめて要約する設計**：記事ごとに個別のAI呼び出しをする設計も検討したが、（a）n8nのExecute Workflow/Loop構成が複雑になる、（b）API呼び出し回数が増えコストと実行時間が伸びる、という理由で、複数記事をJSON配列としてまとめ1回で要約・翻訳させる設計を採用した。**この設計判断の代償**：新着記事数が多い場合（初回実行時など）、AI応答が`max_tokens`の上限に達して途中で切れJSONパースに失敗するリスクがある。実機テストで44件の記事を要約する場面で実際にこの問題が発生し、`max_tokens`を4000→16000に増量して解消した（下記「実機での動作確認」参照）。利用者が非常に多いソースを設定する場合は、`max_tokens`をさらに増やすか、記事数の多いソースだけ分割する改修が今後の課題として残る。

## 実機での動作確認（完了・2026-08-15）

鈴木さんのセルフホストn8nへ実際に登録し、既存の「Slack account」「Google Sheets account」「Anthropic - n8n」Credentialを割り当て、以下すべてを確認した（実行ID#251、詳細は`docs/cases/AUTO-KHM-001/workflow-design.md`参照）。

- RSS取得（3ソース、計45件）→日付フィルタ（44件通過）→重複排除→AI要約・翻訳（Anthropic Claude呼び出し成功）→Slack投稿（レスポンス`"ok":true`を確認）→Google Sheets配信ログへの44行書き込み、まで**End-to-Endで完全に成功**したことをn8n API経由で直接確認済み。
- テスト中に発見・修正した不具合5件（詳細は`docs/cases/AUTO-KHM-001/workflow-design.md`「2026-08-15：PUB-004 実機テストで発見・修正した不具合」参照）：
  1. `Set: Label Source`系ノードが`includeOtherFields`未設定のため記事の日付等を消去し、日付フィルタが常に0件になっていた致命的バグ
  2. AI要約の`max_tokens`不足によるJSON応答の途中切れ
  3. AI呼び出しのHTTPタイムアウト不足
  4. `Google Sheets: Append Distribution Log`の`columns.schema`欠落
  5. Slack Bot Tokenに`chat:write`・`channels:read`スコープが必要（テンプレート利用者向けの前提条件として説明文に明記済み）
- `scripts/validate-workflow.mjs`（エラー0件・警告6件＝Sticky Note孤立のみ、想定内）／`scripts/check-secrets.mjs`（実government URL・Anthropic公式APIエンドポイントの誤検知のみで実値漏えいなし）を実施済み。
- **2026-08-15追記**：過去のPUB-001提出時に「Sticky Noteのテキストが最新版n8nで見切れている」という理由で差し戻しを受けた実績を踏まえ、本テンプレートのSticky Note（特に文章量の多い"Overview & Setup"）のサイズを事前に見直した（高さ250px→800pxへ拡大）。**社長がn8n画面上で目視確認済み**：Sticky Noteのテキスト（"IMPORTANT"部分含む）は最後まで表示されている。
- **2026-08-15追記②**：目視確認の過程で、`validate-workflow.mjs`が検出しない**ノード間（Sticky Note以外）の重なり**が発見された（Slack/Gmail/Notionへの分岐部分、`If`ノードと実際の送信ノードがほぼ重なっていた）。現行の静的検証スクリプトはSticky Noteと通常ノードの重なりのみを検出する仕様のため、この種の重なりは検出対象外だった。座標を手動で計算し直し（1回目は間隔計算を誤り再修正）、プログラム的に矩形重なり0件を確認した上で、社長に画面で最終確認していただき解消を確認した。

## 次のアクション

1. ~~n8n画面上で実際の見た目を確認する~~ **[完了]** 社長が目視確認し、Sticky Note・ノード重なりとも解消済み（上記参照）。
2. `PUB-001`〜`003`の審査結果・Creator Hub側の受付状況を踏まえ、提出タイミングを判断する。
3. **[進行中]** 提出は鈴木さんご自身のn8n Creator Hubアカウントからログインして行う（Claudeが代行できない操作）。JSONアップロード＋上記「簡単な概要」「仕組み」「設定」「要件」「カスタマイズ」「追加情報」の入力。2026-08-15、鈴木さんが実際にフォーム画面に着手し、上記構造を確認済み。
4. 提出後、`workflows/validated/`へ格上げし、本ファイルの「ステータス」「提出履歴」を更新する。
