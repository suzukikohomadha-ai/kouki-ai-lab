# ワークフロー設計書：AUTO-COM-003（汎用承認リクエスト作成サブワークフロー／ライブワークフィード・送信側）

## 位置づけ（重要）

本書は、`logs/kohomada_2026-08-16_NoimosAI相当自動化設計書_v1.md`の依頼事項3「`AUTO-CNT-002`のLINE承認パターンを、他のタスク種別でも再利用できる汎用サブワークフローとして切り出せるかの技術検証」に対応する。**依頼内容は「技術検証・設計」であり「本番反映」ではない**ため、本書は次の2段構成をとる。

1. **送信側（承認リクエストを作成する部分）**：`AUTO-CNT-002`のPhase1相当パターンから安全に切り出せることを確認し、実際にドラフトJSON（`workflows/draft/AUTO-COM-003_generic-approval-request.json`）として実装した。
2. **受信側（LINEからの返信を受けて承認判定・実際の反映処理を呼び出す部分）**：技術的な制約（下記）により、`AUTO-CNT-002`の本番稼働中Webhookロジックの変更を伴わずに実装することはできないと判断した。設計・選択肢の比較のみを本書に記載し、**本ドラフトには実装していない**。

## 基本情報

- ワークフロー名：汎用承認リクエスト作成サブワークフロー（ライブワークフィード・送信側）
- 一意の管理ID：AUTO-COM-003
- 目的：Notionレビューページの作成とLINE通知を、特定のタスク種別（note運用計画書等）に固定せず、任意の呼び出し元（`AUTO-AIP-001`等）から再利用できる形で提供する。
- 業務責任者：鈴木さん（社長）
- 技術責任者：エイト
- 対象部署：`COM`（共通基盤、`docs/architecture.md`参照）
- トリガー：Execute Workflow Trigger（他ワークフローから呼び出される。単独では起動しない）
- 入力データ：`taskId`（string, 必須）／`taskType`（string, 必須）／`title`（string, 必須）／`bodyText`（string, 必須）／`notionDataSourceId`（string, 必須）／`lineMessagePrefix`（string, 任意）
- 出力データ：成功時 `{ success:true, reviewPageId, reviewUrl, approvalKeyword, taskId, taskType, lineSendSuccess, lineSendDetail }`。失敗時は`{ success:false, error, detail, taskId }`（throwしない設計、呼び出し元が分岐しやすいように統一）。
- 前提条件：「承認待ちタスク・DB」というNotion databaseの新規作成が必須（下記スキーマ要件参照）。既存の`notionApi`・`httpBearerAuth`（LINE）Credentialの再利用を想定。
- 利用サービス：Notion API（`POST /v1/data_sources/{id}/query`・`POST /v1/pages`）、LINE Messaging API（Broadcast）
- 必要Credential：`notionApi`（既存Credential再利用）、`httpBearerAuth`（LINE、既存Credential再利用）
- 実行頻度：呼び出し元次第
- 想定件数：呼び出し元1回につき1回のNotionページ作成＋LINE通知
- エラー時の対応：throwせず`success:false`のJSONを返す（呼び出し元が制御しやすい設計。ただしこの設計のため`AUTO-COM-002`共通エラーハンドラーの対象外になる点は`AUTO-AIP-001`と同じ既知の制約）
- ログ方針：n8n標準実行ログのみ
- 個人情報の有無：`bodyText`に呼び出し元が個人情報を含めた場合、Notionページ・LINE Broadcastの両方に転記される。本ワークフローは検閲しない（呼び出し元の責務）。**LINE Broadcastは全友だち宛に送信される**ため、機密性の高い`bodyText`を安易に渡さないよう呼び出し元設計時に注意が必要。
- 変更履歴：2026-08-16 v1（ドラフト作成、エイト）

## 「承認待ちタスク・DB」（Notion database）のスキーマ要件（新規作成が必要）

`AUTO-CNT-002`は単一の固定レビューページ（1件のみ）を使っていたが、複数タスク種別を扱うためには「1タスク＝1レコード」の登録型データベースが必要。以下のプロパティを持つNotion databaseを新規作成することを前提とする（実データソースIDは作成後にユーザーへ確認）。

| プロパティ名 | 型 | 用途 |
|---|---|---|
| Name | タイトル | タスクのタイトル |
| タスクID | テキスト | 呼び出し元が発行した一意なID（例：`AIP-...`） |
| タスク種別 | テキスト | どのワークフロー由来か（例：`AIP-task-planning`） |
| ステータス | セレクト | `承認待ち` / `反映済み` / `変更なし` / `却下`（AUTO-CNT-002の「承認ステータス」プロパティを踏襲） |
| 承認キーワード | テキスト | LINE返信で一致判定するキーワード（本ワークフローが自動生成） |
| 作成日時 | 日付 | ページ作成日時 |

## 案の比較（最低2案・送信側）

| 観点 | 案A（推奨・登録型DB＋動的キーワード） | 案B（低コスト・AUTO-CNT-002方式の複製） |
|---|---|---|
| 開発工数 | 中（キーワード生成・衝突確認ロジックが必要） | 低（既存パターンをコピーするだけ） |
| 保守性 | 高（1つのサブワークフローを全タスク種別が再利用） | 低（タスク種別が増えるたびに`AUTO-CNT-002`類似のワークフローを複製する必要がある） |
| 拡張性 | 高（登録型DBのため同時に複数の承認待ちタスクを扱える） | 低（1ワークフロー＝1固定レビューページのため、同時に複数の承認待ちを扱えない） |
| 安定性 | Notion API仕様（data_source_id、properties+children同時指定）を公式ドキュメントで確認済み | 実績あり（AUTO-CNT-002が本番稼働中） |
| セキュリティ | 同等（Credential参照方式は変わらない） | 同等 |
| 必要スキル | Notion databaseスキーマ設計の理解が必要 | 不要（既存パターンの模倣のみ） |

**推奨案とその理由：** 案A。理由：依頼内容が「他のタスク種別でも再利用できる汎用サブワークフロー」を求めているため、タスク種別ごとにワークフローを複製する案Bでは要件を満たさない。案Aは初期構築コストがやや高いが、`AUTO-AIP-001`を含む将来のタスク種別すべてが同じ1つのサブワークフローを呼べる点で明確に優位。

## 技術検証：受信側の一般化（未実装・本書の中核）

### 制約の整理

1. LINE公式アカウント（「コウキAIラボ」）のWebhook URLは、LINE Developersコンソール上で**1つしか設定できない**（LINE公式仕様）。
2. `docs/cases/AUTO-CNT-002/workflow-design.md`によれば、現状この唯一のWebhook URLは**n8nの`AUTO-CNT-002`のWebhookノード**が受けており、承認キーワード「反映」に一致しないメッセージはすべて既存の秘書アイ機能（Render `ai-company-brain`）へリレー転送する設計になっている（`[未確認]` 本セッションでは実際にどちらのURLが現在LINE Developersコンソールに設定されているかを確認できていない。過去の設計書の記述に基づく）。
3. したがって、新しいタスク種別（`AUTO-AIP-001`等）の承認をLINE経由で受け取るには、**新しい別のWebhookエンドポイントを追加する方法は使えない**（LINE側のURL設定が1つのため）。既存の唯一の受信口（現状`AUTO-CNT-002`のWebhookロジック）を経由させるしかない。

### 選択肢の比較

**選択肢A（推奨・将来対応）：共有ルーターへの一本化**

`AUTO-CNT-002`のWebhookノード以降のロジックを、「承認キーワード→動作」の**汎用ルーター**に置き換える。具体的には、受信したキーワードで「承認待ちタスク・DB」（本書で定義したスキーマ）を検索し、一致するレコードが見つかれば、そのレコードの`タスク種別`に応じて対応する「実行（反映）」サブワークフローをExecute Workflowノードで動的に呼び出す（`タスク種別`→`実行ワークフローID`のマッピングテーブルをCodeノードまたはNotion側のプロパティで保持）。`AUTO-CNT-002`固有の「note運用計画書へのGoogle Docs反映」処理自体も、このルーターから呼ばれる1つの「実行」サブワークフローとして切り出す。

- 長所：真に汎用的。新しいタスク種別を追加するたびにWebhookロジックを触る必要がなくなる。
- 短所：**現在`active:true`で本番稼働中の`AUTO-CNT-002`のWebhookロジックを直接改修する**ことになり、影響範囲が大きい（既存の秘書アイ機能へのリレー転送、署名検証等、現状の重要な機能を壊さずに移行する必要がある）。単体テストだけでなく、実際のLINEアカウントでの受信テストが必須であり、失敗すると社長が日常使っているLINE公式アカウントの応答が止まるリスクがある。

**選択肢B（本ドラフトの対応範囲・現状維持）：送信側のみ切り出し、受信側は個別対応を継続**

`AUTO-COM-003`（送信側）は汎用化するが、受信側は当面`AUTO-CNT-002`のWebhookロジックに手を入れない。新しいタスク種別（`AUTO-AIP-001`等）で生成された承認待ちタスクは、Notionページを見て**社長が手動でステータスを更新する**運用に留める（LINEキーワード返信による自動反映は、当面`AUTO-CNT-002`のnote運用計画書ユースケースのみで機能する）。

- 長所：本番稼働中のWebhookロジックに触らないため、リスクがない。今回のフェーズ1の範囲（追加コストなしでの技術検証・部分実装）に収まる。
- 短所：`AUTO-AIP-001`等の新しいタスク種別では、LINEキーワード返信による自動反映という「ライブワークフィード」のUXが完成しない（Notionページの手動確認・手動ステータス変更に留まる）。

### 推奨

**今回のドラフトでは選択肢Bを採用**し、`AUTO-COM-003`は送信側のみを実装した。選択肢A（共有ルーターへの一本化）は技術的に実現可能と判断するが、本番稼働中のLINE Webhookロジックの改修という性質上、**独立した実装案件として日程を切り、`AUTO-CNT-002`の十分なテスト計画とともに着手すべき**であり、本タスクの範囲（「技術検証」）を超えると判断した。着手する場合は次を推奨する。

1. `AUTO-CNT-002`の現在の本番Webhookロジックを、まず変更せずに複製したテスト用ワークフローで選択肢Aのルーター機能を検証する
2. 検証後、`AUTO-CNT-002`本体への統合は必ず段階的に行い、既存の「反映」キーワード・秘書アイへのリレー転送機能が壊れていないことを実機で確認してから切り替える
3. 切り替え前後で、削除操作は伴わないため`.claude/rules/approval-policy.md`上の自動化対象（本番接続・更新）に該当するが、影響範囲の大きさに鑑み、着手前に社長へ一度方針確認することを推奨する

## 技術観点チェック（送信側・実装済み範囲）

- [x] 冪等性：Notionページは呼び出しごとに新規作成される（意図的な設計、既存ページの上書きはしない）。
- [x] 二重実行防止：承認キーワードの重複確認クエリを実装（衝突時は連番付与、完全な排他制御ではない既知の制約）。
- [x] 入力値検証：`taskId`/`taskType`/`title`/`bodyText`/`notionDataSourceId`の必須チェックを実装。
- [ ] タイムゾーン明示：`requestedAt`はISO 8601（UTC）文字列のみで、表示用のJSTフォーマットは行わない（対象外）。
- [x] レート制限：`[未確認]`（Notion/LINE APIそれぞれのレート制限は個別確認していない）。
- [x] タイムアウト：`n8n-nodes-base.httpRequest`の既定タイムアウトに依存（本ワークフローで明示的なtimeout指定はしていない、既知の制約）。
- [ ] リトライ条件：Notion/LINE呼び出しともにリトライ未実装（失敗時は`continueOnFail`で捕捉しエラーレスポンスに変換するのみ）。
- [x] 部分失敗時の処理：LINE送信失敗はNotionページ作成成功を損なわない設計（`lineSendSuccess:false`として呼び出し元に通知）。
- [ ] エラーワークフロー：意図的に不使用（`AUTO-AIP-001`と同じ理由）。
- [x] 認証情報の分離：Credential実IDはJSONに含まれない。

## ノード構成（ドラフト）

| ノード名 | 役割 | 種別 | type / typeVersion | 備考 |
|---|---|---|---|---|
| Execute Workflow Trigger | 入口 | 公式（未確認） | `n8n-nodes-base.executeWorkflowTrigger` / 1 `[要インスタンス確認]` | AUTO-COM-001と同型 |
| 入力検証・承認キーワード生成 | 必須項目チェック＋キーワード生成 | Code | `n8n-nodes-base.code` / 2 | `require('crypto')`不可のため簡易ハッシュ |
| IF：入力検証OK判定 | 分岐 | 公式 | `n8n-nodes-base.if` / 2.2 | |
| レスポンス生成：入力検証エラー（終端） | エラーJSON返却 | Code | `n8n-nodes-base.code` / 2 | |
| Notion：承認キーワード重複確認 | 衝突確認クエリ | HTTP | `n8n-nodes-base.httpRequest` / 4.2（確認済み） | `data_sources/{id}/query` |
| 衝突解消・最終キーワード確定 | 連番付与 | Code | `n8n-nodes-base.code` / 2 | |
| Notionページ本文ブロック生成（チャンク化） | children/properties構築 | Code | `n8n-nodes-base.code` / 2 | 2000字chunk、97ブロック上限 |
| Notion：承認待ちタスクページ新規作成 | ページ作成 | HTTP | `n8n-nodes-base.httpRequest` / 4.2 | `POST /v1/pages`、`parent.data_source_id` |
| IF：ページ作成成功判定 | 分岐 | 公式 | `n8n-nodes-base.if` / 2.2 | |
| レスポンス生成：Notionページ作成失敗（終端） | エラーJSON返却 | Code | `n8n-nodes-base.code` / 2 | |
| LINEメッセージ本文生成 | 通知文面生成 | Code | `n8n-nodes-base.code` / 2 | |
| LINE - Broadcast確認送信 | LINE通知 | HTTP | `n8n-nodes-base.httpRequest` / 4.2 | Broadcast（全友だち宛、既知の制約） |
| レスポンス生成：成功（終端） | 最終JSON返却 | Code | `n8n-nodes-base.code` / 2 | |

## Credentialマッピング表

| ワークフロー内の参照名 | 用途 | 実在するCredential名（ユーザー確認後に記入） |
|---|---|---|
| `notionApi` | 承認待ちタスクDBへの照会・ページ作成 | 既存Credential「Notion - n8n」の再利用を想定（AUTO-CNT-002と同一を推奨） |
| `httpBearerAuth` | LINE Broadcast送信 | 既存Credential「Bearer Auth account」の再利用を想定（AUTO-CNT-002と同一） |

## 分類

- **確認済み事実**：Notion `POST /v1/pages`が`properties`と`children`を同一リクエストで受け付けること、2025-09-03のAPIアップグレードでデータベース配下ページ作成の`parent`が`{type:'data_source_id', data_source_id:'<ID>'}`形式になったことは、いずれもNotion公式ドキュメント（2026-08-16参照、出典節参照）で確認した。
- **現在の仮定**：LINE公式アカウントの現在のWebhook URL設定が`AUTO-CNT-002`のn8n Webhookを指しているという前提は、`docs/cases/AUTO-CNT-002/workflow-design.md`の記述に基づく仮定であり、本セッションでLINE Developersコンソールを直接確認したものではない（`[未確認]`）。
- **未確認事項**：`n8n-nodes-base.executeWorkflowTrigger`の正確なtypeVersion・入力パラメータUI（`[要インスタンス確認]`）。Notion database新規作成時のプロパティ型（特に「テキスト」型が`rich_text`として正しくマッピングされるか）は`[要インスタンス確認]`（データベース作成はユーザー側の作業のため）。

## 出典

- Notion公式ドキュメント「Create a page」`https://developers.notion.com/reference/post-page`（2026-08-16参照）
- Notion公式ドキュメント「Upgrade guide (2025-09-03)」`https://developers.notion.com/guides/get-started/upgrade-guide-2025-09-03`（2026-08-16参照）
- `docs/cases/AUTO-CNT-002/workflow-design.md`（LINE Webhook一本化・リレー転送設計の出典）
- `workflows/draft/AUTO-CNT-002_line-approval-gdocs-sync.json`（Notionブロックchunk処理・LINE Broadcastパターンの実装出典）

## 次に必要なアクション

1. 社長／ジンへ：「承認待ちタスク・DB」（Notion database）の新規作成依頼（本書のスキーマ要件を渡す）
2. 社長へ：受信側の一般化（選択肢A）に着手するかどうかの方針確認（本番Webhookロジックの改修を伴うため、独立案件として日程を切ることを推奨）
3. `.env`が使えるセッションで`scripts/validate-workflow.mjs`・`scripts/check-secrets.mjs`を実行（本セッションでは未実行）
4. n8n-quality-auditorによる監査（未実施）
