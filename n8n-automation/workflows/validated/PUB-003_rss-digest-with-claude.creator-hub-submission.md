# Creator Hub 提出用メタデータ：PUB-003

対象ワークフロー：`PUB-003_rss-digest-with-claude.json`
作成日：2026-08-12
ステータス：**Validated・n8n実機で動作確認済み（不具合1件発見・修正済み）・Creator Hub未提出**
（PUB-001が審査中のため、Creator Hub側の制限で新規提出ができない可能性が高い。詳細は
`tests/results/2026-08-12_PUB-003_result.md`。提出はPUB-001の結果が出てから行う）

計画中だった「T101 ニュースダイジェスト」（`docs/architecture.md`で言及されていた将来クラスタ）の
考え方を先取りし、自社固有の情報を含まない汎用版として構築した。RSSフィード＋Anthropic＋Slackの
3ツール連携で、PUB-001（2ツール）・PUB-002（2ツール）よりも差別化を強めている。

## タイトル（英語・Sentence case・動詞開始・80字以内）

```
Summarize an RSS feed with Claude and post the digest to Slack
```

## 説明文（Markdown・H2見出し構成）

```markdown
## Who is this for
This template is for anyone who wants a daily or weekly digest of a blog,
news source, or changelog they follow — without manually checking it. Point
it at any standard RSS 2.0 feed and get a short AI-written summary delivered
to Slack on a schedule.

## What this workflow does
On a schedule, it fetches an RSS feed, extracts the latest items (title,
link, publish date, summary), asks Claude to write a short factual digest
from only that data, and posts the digest to Slack. Fetch and Claude calls
both retry automatically on transient failures, and Slack delivery is
verified by checking the actual response body rather than assuming success.

## Requirements
- An n8n instance (Cloud or self-hosted)
- An Anthropic API key, added as an "Anthropic" credential in n8n
- A Slack Incoming Webhook URL (no Slack app or OAuth required)
- Any standard RSS 2.0 feed URL

## How to set up
1. Import this workflow and open the "Call Claude (Anthropic) API" node —
   select or create your Anthropic credential.
2. Open the "Set: feed URL & Slack webhook" node and paste the RSS feed URL
   you want summarized, and your Slack Incoming Webhook URL.
3. Adjust the Schedule Trigger to whatever cadence you want (defaults to
   every 24 hours).
4. Activate the workflow.

## How to customize
- Change `maxItems` in the "Set: feed URL & Slack webhook" node to summarize
  more or fewer recent items.
- Swap the Slack delivery step for email, Notion, or a database write.
- This template is written for standard RSS 2.0 feeds
  (`<rss><channel><item>`). For Atom feeds, adjust the "Extract feed items"
  node's parsing logic to match the Atom structure.
```

## 設計上の判断

- **公式の「RSS Read」ノードを使わなかった理由**：n8n公式GitHubのIssueで、特定のRSSフィードに対して
  RSS Readノードが`406`エラーを返す不具合が複数報告されている（Issue #15999, #18036, #18493、
  2026-08-12確認）。原因の詳細（User-Agent/Acceptヘッダーの扱い等）はIssue本文だけでは特定できな
  かったため、確実に制御できるHTTP Requestノードで明示的な`Accept`/`User-Agent`ヘッダーを付けて
  取得し、公式の`n8n-nodes-base.xml`ノード（`mode: xmlToJson`、GitHub公式ソースで確認済み）で
  変換する方式にした。
- **RSS 2.0限定という制約**：Atom形式など、RSS 2.0以外のフィード構造には対応していない。汎用的な
  フィードパーサーを自作するリスク（誤ったパースによる無言の失敗）より、対応範囲を明示して
  正直に制約を書く方を選んだ（Sticky Note・説明文の両方に明記）。
- **Slack成功判定**：PUB-002の実機テストで発見したバグ（エラーオブジェクトの有無だけでの判定は
  誤検知しうる）を教訓に、最初からレスポンス本文が`"ok"`であることを確認する判定にしてある。

## 実機での動作確認（完了・2026-08-12）

1. ~~実際のn8nインスタンスへインポートし、動作確認する。~~ **[完了]** n8n公式ブログのRSS
   （`blog.n8n.io/rss/`、標準RSS 2.0）で実際にパースが成功することを確認。当初、XML→JSON変換後の
   実際のデータ構造が想定と異なっており（`data.rss.channel[0]`ではなく`rss.channel`が正しい形。
   単一子要素は配列でラップされない）、実機で発見して修正した（詳細：
   `tests/results/2026-08-12_PUB-003_result.md`）。
   - Claudeの要約：実際のRSS記事内容に基づき生成され、情報源に無い事実の捏造は確認されなかった
   - Slack投稿：レスポンス本文`"ok"`を確認、正しく成功判定
2. ~~`scripts/validate-workflow.mjs` / `scripts/check-secrets.mjs`~~ **[完了]**（エラー0件・
   レイアウト警告0件・検出されたURLはプレースホルダーと実在のAnthropic公式APIエンドポイントのみ）。
3. **[未実施・要実施]** PUB-001が審査中のため、Creator Hubへの新規提出ができない可能性が高い
   （詳細は本ファイル冒頭）。PUB-001の審査結果が出てから提出する。
