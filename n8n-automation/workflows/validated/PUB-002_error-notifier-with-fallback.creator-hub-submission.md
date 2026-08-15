# Creator Hub 提出用メタデータ：PUB-002

対象ワークフロー：`PUB-002_error-notifier-with-fallback.json`
作成日：2026-08-12
ステータス：**Validated・n8n実機で動作確認済み（不具合1件発見・修正済み）・Creator Hub未提出**

実機テスト結果の詳細：`tests/results/2026-08-12_PUB-002_result.md`。テスト中に実際のバグ
（Slack成功判定の誤検知）を発見し修正した。単なる動作確認だけでなく、実機でしか見つからない
論理バグを検出できたテストだった。

`AUTO-COM-002`（社内向け共通エラーハンドラー、LINE通知＋Notionフォールバック）の設計を基に、
自社固有の情報（LINE Credential・Notion page ID等）を一切含まない汎用版として新規構築した。
Slack＋Discordという、どちらもOAuth不要でURL1本で試せる組み合わせにし、審査担当者が
低コストでテストできることを優先した（PUB-001と同じ方針）。

## タイトル（英語・Sentence case・動詞開始・80字以内）

```
Notify Slack on workflow errors, with a Discord fallback
```

## 説明文（Markdown・H2見出し構成）

```markdown
## Who is this for
This template is for anyone running production n8n workflows who wants to
know immediately when one fails — without building error handling into every
single workflow individually. Attach it once as the shared "Error Workflow"
for all your other workflows.

## What this workflow does
It receives failure details from n8n's built-in Error Trigger (workflow
name, failing node, error message, execution URL), skips duplicate
notifications for the same execution, and posts a readable summary to Slack.
If the Slack post itself fails — bad URL, Slack outage, anything — it
automatically falls back to posting the same summary to Discord instead of
the failure going unnoticed.

## Requirements
- An n8n instance (Cloud or self-hosted)
- A Slack Incoming Webhook URL (no Slack app or OAuth required)
- A Discord Incoming Webhook URL (no Discord app or OAuth required)

## How to set up
1. Import this workflow and open the "Set: Slack webhook URL" node — paste
   your Slack Incoming Webhook URL.
2. Open the "Set: Discord webhook URL" node — paste your Discord Incoming
   Webhook URL.
3. Activate this workflow.
4. On any workflow you want monitored, go to Settings → Error Workflow and
   select this workflow.

## How to customize
- Swap Slack and/or Discord for email, Microsoft Teams, or any other
  webhook-based channel by editing the two HTTP Request nodes.
- Change how long deduplication remembers past executions by adjusting the
  200-entry limit in the "Check duplicate & summarize error" node.
- Add a second fallback step (e.g. writing to a Google Sheet or Notion page)
  after the Discord notification for a three-tier alerting chain.
```

## 設計上の判断

- **LINE→Slackへの変更理由**：元のAUTO-COM-002はLINE Messaging APIを主経路としていたが、これは
  日本国内サービスでありグローバルなCreator Hub審査担当者がテストしにくい（LINE Developersでの
  チャネル作成が必要）。Slackは前回（PUB-001）と同じくOAuth不要のIncoming Webhookで完結するため、
  こちらに変更した。
- **Notion→Discordへの変更理由**：元のフォールバック先（Notion）はNotion Integration（内部インテ
  グレーション作成・データベース権限付与）というセットアップコストがあり、テストの手軽さで劣る。
  Discordも公式ドキュメントで仕様が明確なIncoming Webhook直叩きが使え（認証ヘッダー不要、
  `POST /webhooks/{id}/{token}`、bodyは`{"content": "..."}`。出典：Discord公式ドキュメント
  `docs.discord.com/developers/resources/webhook`、2026-08-12参照）、Slackと同じ手軽さでテストできる。
- **冪等性（`$getWorkflowStaticData`）の制約**：n8n公式ドキュメント
  （`docs.n8n.io/build/code-in-n8n/cookbook/built-in-methods-and-variables-examples/getworkflowstaticdata`、
  2026-08-12参照）で、静的データは手動テスト実行では保存されず、自動トリガー実行でのみ機能する
  ことを確認済み。Error Workflowは実運用では必ず自動実行されるため、この制約は実害にならない
  （メインのSticky Noteにもその旨を明記した）。

## 提出前に必ず行うこと（未完了・[要実施]）

1. ~~実際のn8nインスタンスへインポートし、動作確認する。~~ **[完了・2026-08-12]**
   使い捨ての「わざと失敗するワークフロー」を作り、`settings.errorWorkflow`でPUB-002を
   Error Workflowに設定して実機テストした。以下すべて確認済み：
   - `n8n-nodes-base.errorTrigger`がError Workflow設定から正しく起動する（`mode: error`で実行）
   - Slack通知が正常に届く
   - Slack失敗時にDiscordへ正しくフォールバックする
   - テスト中に発見した実バグ（Slack成功判定の誤検知）を修正済み（詳細：
     `tests/results/2026-08-12_PUB-002_result.md`）
   - 重複排除ロジックの実地確認（同一execution IDからの多重通知防止）は`[未実施]`のまま残っている
2. ~~`scripts/validate-workflow.mjs` / `scripts/check-secrets.mjs`~~ **[完了]**（エラー0件・
   レイアウト警告0件・検出されたURLはSlack/Discordのプレースホルダーのみ）。
3. ~~Sticky Noteの文字切れが起きないか実機で目視確認する。~~ **[完了]**（今回は文字切れの
   指摘は受けていないが、提出後にn8nチームから同様の指摘が来る可能性はゼロではない）。
4. **[未実施・要実施]** n8n Creator Hubの最新の提出ガイドラインを実際にログインして確認する。
5. 使い捨てのテスト用ワークフローはテスト終了後に削除済み（2026-08-12）。
