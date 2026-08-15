# Creator Hub 提出用メタデータ：PUB-001

対象ワークフロー：`PUB-001_claude-api-webhook-with-retry.json`
作成日：2026-08-10
ステータス：**再提出済み・審査中**（初回提出：2026-08-10／差し戻し：2026-08-11「Sticky Note
のテキストが最新版n8nで見切れている」／修正・再提出：2026-08-12）

## 1回目の提出とn8nチームからのフィードバック（2026-08-11）

初回提出（2026-08-10）に対し、n8n運営チームから以下のフィードバックを受け、差し戻しとなった。

> Before we can publish it, we noticed that the text in some of your sticky notes is being cut
> off on the latest version of n8n because the sticky note is too small for its content. Please
> update to the latest version and resize the affected sticky notes or reformat the text so that
> everything is fully visible and readable.

**対応（2026-08-12）**：
- メインのSticky Note：JSON例を複数行のコードブロックから1行のインラインコードに圧縮。
  高さを300px→520pxに拡大
- Step1〜4のSticky Note：高さを150px→220pxに拡大（4枚とも）
- `scripts/validate-workflow.mjs`でレイアウト重なり0件を確認
- n8n本体（鈴木さんのセルフホスト環境）へ反映後、実際の画面をスクリーンショットで目視確認し、
  5枚すべてでテキストが最後まで表示されていることを確認してから再提出した

**現時点で確認できていないこと**：修正が「最新版のn8n」で実際にどう見えるかは、鈴木さんの
セルフホスト環境（バージョンは`[要確認]`、本ドラフト作成時点で未取得）での目視確認のみ。
n8nチームが指摘した「latest version」と鈴木さんの環境のバージョンが完全に一致しているかは
未確認のため、次のフィードバックで再度同種の指摘を受ける可能性はゼロではない。

n8n Creator Hub（公認クリエイター制度）へのワークフローテンプレート提出は、n8nアカウントでログインした
Creator Dashboardから「JSONアップロード＋タイトル＋説明文の入力」で行う（[出典：note.com記事による解説、
2026-08-10確認。公式ガイドライン本文はn8n Creator Hubの限定Notionページにあり本セッションでは直接確認できて
いないため、提出前に必ずログイン後の公式ページで最新のガイドラインを再確認すること]）。以下はこのワークフロー
の提出に使うテキスト案。

## タイトル（英語・Sentence case・動詞開始・80字以内）

```
Generate text with Claude and post it to Slack via a validated webhook
```

## 説明文（Markdown・約220語・H2見出し構成）

```markdown
## Who is this for
This template is for automation builders, indie hackers, and internal tool
developers who want a dependable way to turn a prompt into an AI-generated
answer that lands directly in Slack. It's a solid starting point for AI
assistants, notification bots, or content-generation endpoints that other
systems (forms, chatbots, internal tools) can call over HTTP.

## What this workflow does
The workflow exposes a webhook that accepts a prompt, validates the input,
calls the Anthropic Claude Messages API with automatic retries on transient
failures, and immediately returns a clean JSON response to the caller. In
parallel, it posts a preview of the generated text to a Slack channel via an
Incoming Webhook, so a human can see the result without polling anything.
If the input is invalid or the Claude API call fails after retries, it
returns a structured error response instead of crashing silently.

## Requirements
- An n8n instance (Cloud or self-hosted)
- An Anthropic API key, added as an "Anthropic" credential in n8n
- A Slack Incoming Webhook URL (no Slack app or OAuth required)

## How to set up
1. Import this workflow.
2. Open the "Call Claude (Anthropic) API" node and select (or create) your
   Anthropic credential.
3. Open the "Set: Slack webhook URL" node and paste your own Slack Incoming
   Webhook URL.
4. Activate the workflow and copy the webhook's production URL.
5. Send a POST request with a JSON body containing at least `userPrompt`.

## How to customize
- Change the default `model`, `maxTokens`, or `temperature` in the
  "Validate input & apply defaults" node.
- Swap the Slack step for Notion, email, or a database write to deliver the
  generated text somewhere else.
- Replace the Webhook trigger with a Schedule Trigger to run this on a
  recurring basis instead of on demand.
```

## 設計上の判断（一度だけ記す）

- **単一ツールではなくAnthropic + Slackの2ツール連携にした理由**：Anthropic API呼び出しのみの
  v1構成は、Creator Hubの審査で「類似テンプレートとの差別化ができていない場合はリジェクトされる／
  単一機能では不十分」という傾向が調査で指摘されていた（[出典：note.com記事の実体験談、
  2026-08-10確認、n8n公式基準としての一次情報での裏付けは未確認]）。Slackを選んだのは、OAuth設定が
  不要でURL1本で試せるため、審査担当者が最も低コストで動作確認できるという理由による
  （[出典：同記事、2026-08-10確認]）。**未解決の懸念として残るのは、2ツールで十分か
  （3ツール以上を求める暗黙の基準がある可能性）は一次情報で確認できておらず、実際の審査結果でしか
  確定できない点。**
- **Slack投稿を公式Slackノードではなく HTTP Request＋Incoming Webhook直叩きにした理由**：
  公式Slackノード（`n8n-nodes-base.slack`）はメッセージ送信パラメータがresourceMapper型で複雑かつ
  未確認だった。Slack公式ドキュメントで仕様が明確なIncoming Webhook直叩きの方が、パラメータを
  推測で埋めるリスクが低いと判断した。審査側が「公式ノードを使うべき」という基準を持っている
  可能性はゼロではないが、現時点ではリスクの低い方を優先した。
- **Credentialの扱い（2つのコピーがある点の整理）**：このリポジトリの`PUB-001_....json`
  （＝Creator Hubへ提出するファイルそのもの）には、Credentialの実値・実IDを一切埋め込んでいない。
  自社固有のNotion page ID・Google DriveフォルダID・実在の会社名・自社本番Webhook URLも同様に
  含まれていない（他人がそのまま再利用できる汎用テンプレートとして設計しているため）。
  一方、下記「実機での動作確認」は、鈴木さんのセルフホストn8n上に**このファイルをインポートした
  別コピー**を作り、そちらにだけ実在のAnthropic Credentialと実際のSlack Webhook URLを設定して
  行った。**動作確認が完了していることと、提出用ファイルがCredential未設定のままであることは
  両立する**（検証は本番機のコピーで行い、配布用ファイルはクリーンなまま）。

## 実機での動作確認（完了・2026-08-10）

鈴木さんのセルフホストn8nへ実際に登録し、既存の「Anthropic - n8n」Credentialを割り当て、
Slack Incoming Webhook URLを設定・有効化した上で、以下すべてを確認した（詳細ログ：
`tests/results/2026-08-10_PUB-001_result.md`）。

- 成功時：200・生成テキストが返り、Slackにも実際に投稿されたことを鈴木さんが目視確認
- 入力不備時：400・想定通りのエラーメッセージ
- Claude API失敗時（存在しないmodel名で疑似発生）：502・想定通りのエラーメッセージ
- `respondToWebhook`の`respondWith:"json"`を含め、ドラフト時点で未確認だったパラメータは
  すべて実機で問題なく動作した

`scripts/validate-workflow.mjs` / `scripts/check-secrets.mjs` も実行済み（エラー0件。
`check-secrets.mjs`が検出したURLは`https://api.anthropic.com/v1/messages`とSlackの
プレースホルダーURLのみで、自社内部システムの情報や実在するシークレットではない）。

## 提出履歴

| 回 | 日付 | 内容 | 結果 |
|---|---|---|---|
| 1回目 | 2026-08-10 | creators.n8n.ioのCreator Portalから提出（「要件」「カスタマイズ」欄にも入力済み。n8n側AIの自動改善提案は参考情報として不採用） | **差し戻し**（2026-08-11、Sticky Note文字切れの指摘） |
| 2回目 | 2026-08-12 | Sticky Noteのサイズ修正版を再提出 | 審査中（結果待ち） |

## 残っていること

1. n8n審査チームからの2回目のフィードバック待ち。
2. 万一再度修正指示があれば対応の上、再提出。
3. 公認クリエイターになるには、テンプレートを3本以上審査通過させる必要がある
   （[出典：note.com記事、2026-08-10確認、一次情報未確認]）。本ワークフローが1本目の候補となる。
