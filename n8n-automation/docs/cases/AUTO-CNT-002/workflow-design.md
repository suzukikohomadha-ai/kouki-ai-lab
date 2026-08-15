# AUTO-CNT-002：note運用計画書 分析＋LINE承認反映

- ステータス：Draft（ローカルの体裁上。ただし`workflows/README.md`の2026-08-10確認記録によれば、実際のn8n本体では`active:true`・Credential割当済みで稼働中。詳細と重大な指摘事項は`logs/common_2026-08-15_AUTO-CNT-002_n8n品質監査_v1.md`を参照）
- 【2026-08-15追記】監査で指摘された「Webhook署名検証が無効化されたまま稼働」への恒久対応として、n8n公式Cryptoノード（`n8n-nodes-base.crypto`、action='hmac'）による署名検証をワークフローJSONに設計・反映済み（`cnt002-p2-crypto-hmac`・`cnt002-p2-compare-sig`ノード、IF条件に`validSignature===true`を復元）。ただし**設計のみで実機未検証・本番未反映**。適用には①`crypto`種別Credential新規作成（LINE Channel Secret、要ユーザー承認）②本JSONの実インスタンスへの反映③Credential割当④実機テスト、が必要（詳細はJSON内Sticky Note・Phase2参照）。
- 設計元：`logs/common_2026-08-10_n8n自動化_LINE承認反映設計_v2.md`（社長承認済み）
- 実装：ジン（本セッションで直接実装。エイトの背景実行がセッション上限で中断したため引き継いだ）
- 実装日：2026-08-10

## 概要

2つの独立した入口を持つワークフロー。

- **Phase 1（Schedule Trigger、毎月1日9:30 JST）**：Google Drive上の「コホマダ note運用計画書」最新版本文を読み取り、Notion「📝コンテンツ下書き・DB」の新着note記事と照合。実質的な変更があればレビュー用Notionページに記録しLINEで確認送信。無ければスキップ。
- **Phase 2（Webhook、常時稼働）**：LINEからの返信を受信し、署名検証→承認キーワード「反映」の完全一致判定→Google Drive上に新バージョンのGoogleドキュメントを作成。

## 【2026-08-10追記】設計修正：静的データ方式からNotionページ経由方式へ

当初はPhase1→Phase2への本文引き継ぎにn8nの「ワークフロー静的データ」（`getWorkflowStaticData`）を使う設計だったが、n8n公式ドキュメント（`https://docs.n8n.io/build/code-in-n8n/cookbook/built-in-methods-and-variables-examples/getworkflowstaticdata`）で以下2点の制約を確認したため設計を変更した。

1. 静的データは**手動実行（Execute workflowボタン）では保存されない**。本番の自動トリガー実行でのみ機能する。これまでの実機テスト（T115）はすべて手動実行だったため、この制約に気づかないまま実装していると、テストのたびに「反映対象の本文が見つからない」エラーになっていた。
2. 64KBの容量上限があり、本文量によっては収まらないリスクがあった。

**変更後**：Phase1はレビュー用Notionページの本文ブロックに、開始/終了マーカー（`=== 反映用本文 ===` 〜 `=== 本文ここまで ===`）で囲んで全文を書き込む。Phase2はそのマーカー間のブロックを読み出して復元する。これにより手動実行でのテストにも対応でき、64KB上限の懸念も解消した（Notion側の1ブロック2000字制限は既存ワークフローと同じchunk処理で対応）。

## 【2026-08-10追記②】既存の秘書アイLINE機能との共存（リレー方式）

「コウキAIラボ」LINE公式アカウントのWebhookは、既に既存の秘書アイ機能（Renderにデプロイ済みの`ai-company-brain`サーバー、`https://ai-company-brain-jb59.onrender.com/webhook`）が使用しており、社長が実際に使用中と確認した。LINEのWebhook URLは1つしか設定できないため、Webhook自体はn8n側で受け取り、**署名が有効かつ「反映」の完全一致でない全てのメッセージは、生のリクエストボディ・元のx-line-signatureヘッダーをそのままRenderの既存エンドポイントへリレー転送する**設計に変更した。JSONの再パース・再シリアライズを行うとRender側の署名検証が失敗する可能性があるため、`contentType: raw`で生の文字列をそのまま転送する。署名検証・キーワード判定自体にバグがあっても、既存の秘書アイ機能への影響が最小限になるよう、判定に失敗した場合は基本的にリレー側に倒れる設計とした。

## 既知の制約（重要）

既存クラウドルーティンが実現している**見出し・表・取り消し線等のリッチな書式は、本ドラフトでは再現されない**。プレーンテキストでの本文挿入のみを実装した。理由は本ファイル・ワークフローJSON内Sticky Noteに記載（複雑なAPI呼び出しの実機未検証リスクを避けるため）。将来のn8n-optimizeフェーズでの改善候補。

## 前提条件（本番登録前に必須）

1. Google Drive/Docs書き込み用の新規Credential（汎用「Google OAuth2 API」、スコープ `drive.readonly` + `drive.file` + `documents`）と、Google Cloud ConsoleでのDocs API有効化（社長対応）
2. LINE Developersコンソールでの Webhook URL登録・Channel Secret取得（社長対応、エイトが手順を案内）
3. n8n側でのLINE_CHANNEL_SECRET環境変数またはCredentialでの設定方法確定（要n8n-schema-researcher確認）
4. Webhookノードのrawbody取得・Codeノードでの`crypto`モジュール利用可否の実機確認
5. Phase1→Phase2間の静的データ共有が実際に機能するかの実機確認（機能しない場合、Notionページ経由での本文引き継ぎに設計変更が必要）

## ノード一覧

Phase1: Schedule Trigger → 設定 → Google Drive一覧取得 → 最新版特定・重複防止ガード → IF(スキップ判定) → Google Drive本文エクスポート／Notion DB照会 → コンテキスト整形 → Claudeプロンプト生成 → Claude呼び出し(AUTO-COM-001経由) → IF(成功判定) → JSON出力パース → IF(変更有無) → Notionレビューページ追記＋ステータス更新 → 静的データ保存 → LINE確認送信

Phase2: Webhook → 署名検証＋キーワード判定 → IF(有効かつ承認) → Notionレビューページ確認 → IF(承認待ち状態) → 静的データから本文取得 → Google Drive新規ファイル作成 → Google Docs本文挿入 → IF(成功) → Notion更新＋LINE完了通知

## Credentialマッピング（値は未取得・未割当）

| 用途 | Credential種別 | 備考 |
|---|---|---|
| Google Drive一覧・エクスポート・新規作成 | `googleOAuth2Api`（汎用、新規作成必要） | 既存の読み取り専用「Google Drive account」とは別に新規作成を推奨（設計書） |
| Google Docs本文挿入 | 同上 | 同一Credentialを想定 |
| Notion各種API | `notionApi`（既存「Notion - n8n」を再利用） | 値未取得 |
| LINE送受信 | `httpBearerAuth`（既存「Bearer Auth account」を再利用） | T115で疎通確認済み |

## 検証結果

`validate-workflow.mjs`：エラー0件・警告2件（Sticky Note孤立、既知パターン）
`check-secrets.mjs`：27件検出、すべてNotion page ID・公開APIドメインの誤検知（目視確認済み、Credential実値の混入なし）

## 未確認事項

- Webhookノードのproduction URL到達性（自己ホストn8nへの外部インバウンド）
- LINE署名検証のCodeノード実装がn8n実機で動作するか（`crypto`モジュールのrequire可否含む）
- Notion `data_sources` クエリエンドポイントの`notionApi`Credentialでの動作
- Phase1→Phase2の静的データ共有可否
- Google Drive/Docs API呼び出し全般（新規Credential作成後の実機テストが必要）
- LINE公式アカウントマネージャーの応答設定との相互作用
