# ワークフロー設計書：AUTO-AIP-001（AIタスク自動プランニング）

## 基本情報

- ワークフロー名：AIタスク自動プランニング
- 一意の管理ID：AUTO-AIP-001
- 目的：事業URL・事業概要を受け取り、Claude APIで「実行候補タスクリスト」をJSON構造で生成し、人間承認導線（`AUTO-COM-003`）に接続する。NoimosAI等の外部SaaSが謳う「URL/事業内容を渡すだけでAIがタスクを自動構築する」オンボーディング体験を、追加の有料API契約なしに再現する（`logs/kohomada_2026-08-16_NoimosAI相当自動化設計書_v1.md`のNoimosAI要素分解#1、分類B）。
- 業務責任者：鈴木さん（社長）
- 技術責任者：エイト（n8n Workflow Implementation Engineer）
- 対象部署：`AIP`（AI自律プランニング、2026-08-16新設。`docs/architecture.md`参照）
- トリガー：Webhook（POST、`headerAuth`認証、`responseMode: lastNode`で同期レスポンス）
- 入力データ：`businessUrl`（string、任意）・`businessDescription`（string、任意）。いずれか一方は必須。
- 出力データ：Webhook呼び出し元への同期JSONレスポンス（生成されたタスク候補リスト、承認リクエストのNotionページURL・承認キーワード）
- 前提条件：`AUTO-COM-001`（実インスタンス登録済み、実ID`r0IZ2ByR7MX4RWCp`と2026-08-15複数箇所で確認されているが本セッションでは未再検証）・`AUTO-COM-003`（本ドラフトと同時に新規設計、未登録）が両方とも実インスタンスに登録済みであること。`AUTO-COM-003`が要求する「承認待ちタスク・DB」（Notion）の作成（`docs/cases/AUTO-COM-003/workflow-design.md`参照）。
- 利用サービス：Anthropic Claude API（`AUTO-COM-001`経由）、Notion API・LINE Messaging API（`AUTO-COM-003`経由）、任意の事業サイトURL（HTTP GET）
- 必要Credential：Webhook自体の`httpHeaderAuth`（新規作成が必要）。Anthropic/Notion/LINEは`AUTO-COM-001`/`AUTO-COM-003`側で既存Credentialを再利用する想定（本ワークフロー自身は直接保持しない）。
- 実行頻度：呼び出し元次第（定期実行トリガーなし）
- 想定件数／最大件数：`[要確認/社長]`（想定呼び出し頻度が未確定）
- 想定実行時間：Claude API呼び出し（`AUTO-COM-001`のリトライ込みで最大数十秒）＋事業サイト取得（最大15秒）＋承認リクエスト作成（Notion/LINE、数秒）の合計、目安として数十秒程度と見積もるが実測値は`[実行環境なしのため未テスト]`
- 許容遅延：`[要確認/社長]`
- エラー時の対応：throwせず、各失敗パターンごとに制御されたJSONレスポンス（`success:false`＋`error`）を返す設計（下記「設計判断」参照）。この設計のためError Workflow（`AUTO-COM-002`）による自動通知は発生しない点に注意（下記リスク参照）。
- 手動対応への切替条件：`[要確認/社長]`
- ログ方針：n8n標準実行ログのみ。個人情報を含む可能性のある`businessDescription`を外部ログサービスへ転送する処理は実装していない。
- 保存期間：`[要確認/社長]`
- 個人情報の有無：入力（`businessUrl`・`businessDescription`）自体に個人情報が含まれる想定はしていないが、呼び出し元の入力内容次第で混入し得る（本ワークフローは検知・除去しない、`.claude/rules/security-policy.md`上の留意事項）
- 監視項目：`[要確認/社長]`（本ドラフトはError Workflow通知を意図的に使わない設計のため、別途の監視手段が必要）
- 成功条件：`success:true`のJSONが返り、`tasks`配列に1件以上のタスク候補が含まれること
- KPI：`[要確認/社長]`
- ロールバック方法：Webhookを無効化する
- 変更履歴：2026-08-16 v1（ドラフト作成、エイト）

## 案の比較（最低2案）

| 観点 | 案A（推奨・Webhook同期レスポンス） | 案B（低コスト・Execute Workflow Trigger方式） | 案C（Form Trigger方式・未採用） |
|---|---|---|---|
| 開発工数 | 中 | 低（Webhook部分が不要） | 中〜高 |
| 月額費用 | 変わらず（既存API従量課金のみ） | 同左 | 同左 |
| 保守性 | 高（他システムから疎結合に呼べる） | 高いが呼び出し元がn8n内に限定される | 未評価（下記理由により選択せず） |
| 拡張性 | 高（将来的な社内ツール・簡易フォームからの呼び出しに対応しやすい） | 低い（n8n UIでの手動実行や他ワークフローからの呼び出しに限定） | 高い（人がURLを開いて直接入力できる） |
| 安定性 | Webhookノードのtype/typeVersion/authentication/responseModeは全てn8n公式GitHubで確認済み（本文参照） | 高い（AUTO-COM-001と同型で実績あり） | `n8n-nodes-base.formTrigger`は本リポジトリでの使用実績・確認実績が無く不採用 |
| セキュリティ | `headerAuth`による簡易な呼び出し元制限が必要（Claude API従量課金のためのコスト保護） | 呼び出し元をn8n内部に限定できるため相対的に低リスク | 未評価 |
| ベンダーロックイン | 低い（Webhookは汎用） | 低い | 未評価 |
| 障害時の影響 | 呼び出し元がエラーJSONを直接受け取れる | 呼び出し元（他ワークフロー）側での判定が必要 | 未評価 |
| 必要スキル | HTTPクライアントを扱える呼び出し元が必要 | n8n内部の知識のみで足りる | 未評価 |

**推奨案とその理由：** 案A（Webhook同期レスポンス、`responseMode: lastNode`）。理由：(1) 依頼内容「事業情報を入力として受け取り」という体験には、他システム・将来の簡易フォームから直接叩けるHTTPエンドポイントが最も自然。(2) `n8n-nodes-base.webhook`のtype/typeVersion/`headerAuth`/`responseMode`はすべてn8n公式GitHub（`Webhook.node.ts`・`description.ts`、2026-08-16参照）で確認済みであり、未確認のノード種別（`formTrigger`等）を新たに導入するリスクを避けられる。(3) 案Bも技術的には成立するが、依頼内容の「入力を受け取り」という要件に対して呼び出し元をn8n内部に限定するのは不自然と判断した。

## 技術観点チェック

- [x] 冪等性／二重実行防止：本ワークフロー自体は読み取り中心（Claude生成＋Notion新規ページ作成）であり、同一入力での複数回呼び出しはそれぞれ独立したタスク候補・承認リクエストを生成する（意図的な設計。既存の「承認待ちタスク」を上書きしない）。呼び出し元での多重送信防止は呼び出し元の責務。
- [x] 入力値検証：`businessUrl`・`businessDescription`のいずれか一方が必須であることをコードノードで検証し、両方欠落時は`success:false`を返す。
- [x] データ型統一：`maxTokens`/`temperature`をAUTO-COM-001呼び出し時に明示的な数値で指定。
- [ ] タイムゾーン明示：本ワークフローは時刻をISO 8601文字列（`requestedAt`等）で記録するのみで、タイムゾーン変換は行わない（対象外）。
- [x] レート制限：Webhook呼び出し自体のレート制限は未実装（既知の制約）。Claude APIコストを保護する目的で`headerAuth`による呼び出し元制限を必須とした（有効な代替にはならないが最低限の抑止）。将来的な改善候補として、n8nのWorkflow-level rate limitingまたは呼び出し元アプリ側での制限を推奨。
- [x] タイムアウト：事業サイト取得15000ms。Claude呼び出しは`AUTO-COM-001`内部で60000ms。
- [x] リトライ条件：Claude呼び出しは`AUTO-COM-001`内部で3回リトライ（既存実装）。事業サイト取得・Notion/LINE呼び出しは本ワークフロー・`AUTO-COM-003`ともにリトライなし（失敗時はフォールバックまたはエラーレスポンス）。
- [x] 部分失敗時の処理：事業サイト取得の失敗は致命的とせず、事業概要のみでプロンプトを構成するフォールバックを実装。承認リクエスト作成（`AUTO-COM-003`）の失敗も、タスク候補自体の生成が成功していれば`success:true`＋`warning`として返す設計（部分成功を明示）。
- [ ] エラーワークフロー：**意図的に不使用**。throwせずJSONレスポンスで制御しているため、`AUTO-COM-002`（共通エラーハンドラー）は発火しない。運用開始後にエラー発生を検知する手段が別途必要（下記リスク参照）。
- [x] 個人情報のマスキング：本ワークフローは検閲を行わない（呼び出し元の責務、`intake.md`に明記）。
- [x] 認証情報の分離：Credential実値・実IDはJSON内に含まれない（Webhookの`httpHeaderAuth`、Execute WorkflowのworkflowIdのみ、いずれも参照値）。
- [x] テスト環境と本番環境の分離：`[実行環境なしのため未テスト]`。

## ノード構成（ドラフト）

| ノード名 | 役割 | 種別 | type / typeVersion | 備考 |
|---|---|---|---|---|
| Webhook（タスクプランニング受付） | 入口 | 公式 | `n8n-nodes-base.webhook` / 2.1（確認済み・n8n公式GitHub） | `authentication:headerAuth`・`responseMode:lastNode` |
| 入力検証・リクエストID採番 | businessUrl/businessDescription検証 | Code | `n8n-nodes-base.code` / 2（確認済み） | |
| IF：入力検証OK判定 | 分岐 | 公式 | `n8n-nodes-base.if` / 2.2（確認済み） | |
| レスポンス生成：入力検証エラー（終端） | エラーJSON返却 | Code | `n8n-nodes-base.code` / 2 | |
| IF：businessUrl指定判定 | 分岐 | 公式 | `n8n-nodes-base.if` / 2.2 | |
| 事業サイト本文取得 | サイトHTML取得 | HTTP | `n8n-nodes-base.httpRequest` / 4.2（確認済み） | `continueOnFail:true` |
| サイト本文の簡易抽出 | HTMLタグ除去・切詰め | Code | `n8n-nodes-base.code` / 2 | 簡易実装（既知の制約） |
| サイト取得スキップ（URL未指定） | フォールバック | Code | `n8n-nodes-base.code` / 2 | |
| Claude用プロンプト生成 | プロンプト構築 | Code | `n8n-nodes-base.code` / 2 | プロンプトインジェクション対策を明記 |
| Claude呼び出し（AUTO-COM-001経由） | サブワークフロー呼び出し | 公式（未確認） | `n8n-nodes-base.executeWorkflow` / 1 `[要インスタンス確認]` | workflowIdは暫定値（本文参照） |
| IF：Claude呼び出し成功判定 | 分岐 | 公式 | `n8n-nodes-base.if` / 2.2 | |
| レスポンス生成：Claude呼び出し失敗（終端） | エラーJSON返却 | Code | `n8n-nodes-base.code` / 2 | |
| Claude出力のJSONパース・検証 | パース＋構造検証 | Code | `n8n-nodes-base.code` / 2 | id/title/category必須チェック |
| IF：パース成功判定 | 分岐 | 公式 | `n8n-nodes-base.if` / 2.2 | |
| レスポンス生成：JSON解析失敗（終端） | エラーJSON返却 | Code | `n8n-nodes-base.code` / 2 | |
| 承認リクエスト用データ整形 | AUTO-COM-003入力契約への変換 | Code | `n8n-nodes-base.code` / 2 | `notionDataSourceId`はプレースホルダー |
| 承認リクエスト作成（AUTO-COM-003経由） | サブワークフロー呼び出し | 公式（未確認） | `n8n-nodes-base.executeWorkflow` / 1 `[要インスタンス確認]` | workflowId未設定（AUTO-COM-003未登録のため） |
| IF：承認リクエスト作成成功判定 | 分岐 | 公式 | `n8n-nodes-base.if` / 2.2 | |
| レスポンス生成：成功（終端） | 最終JSON返却 | Code | `n8n-nodes-base.code` / 2 | |
| レスポンス生成：タスク生成は成功・承認リクエスト失敗（終端） | 部分成功JSON返却 | Code | `n8n-nodes-base.code` / 2 | |

## Credentialマッピング表

| ワークフロー内の参照名 | 用途 | 実在するCredential名（ユーザー確認後に記入） |
|---|---|---|
| `httpHeaderAuth`（Webhookノード） | 呼び出し元の簡易認証 | 未作成。新規Credential名・共有シークレット値の運用方法は`[要ユーザー承認]` |
| `AUTO-COM-001`（Execute Workflow経由、間接） | Claude API呼び出し | `AUTO-COM-001`側の既存`anthropicApi`Credential（「Anthropic - n8n」）を再利用（本ワークフロー自体はCredentialを保持しない） |
| `AUTO-COM-003`（Execute Workflow経由、間接） | Notion/LINE通知 | `AUTO-COM-003`側の既存`notionApi`・`httpBearerAuth`Credentialを再利用 |

## 分類

- **確認済み事実**：`n8n-nodes-base.webhook`のtype/typeVersion配列`[1,1.1,2,2.1]`・defaultVersion 2.1・`authentication`オプション（`basicAuth`/`headerAuth`/`jwtAuth`/`n8nOAuth2`/`none`）・`responseMode`オプション（`onReceived`/`lastNode`/`responseNode`/`streaming`）は、いずれもn8n公式GitHub（`packages/nodes-base/nodes/Webhook/Webhook.node.ts`・`description.ts`、2026-08-16参照）で確認した。Notion `POST /v1/pages`が`properties`と`children`を同一リクエストで受け付けること、および2025-09-03のAPIアップグレードでデータベース配下ページ作成の`parent`が`data_source_id`形式になったことは、Notion公式ドキュメント（`developers.notion.com/reference/post-page`・`developers.notion.com/guides/get-started/upgrade-guide-2025-09-03`、いずれも2026-08-16参照）で確認した。
- **現在の仮定**：`AUTO-COM-001`の実ワークフローID`r0IZ2ByR7MX4RWCp`は過去セッション（2026-08-15）の複数記録に基づく値であり、本セッションでは`.env`が無く再検証できていない（登録前に要再確認）。`n8n-nodes-base.executeWorkflow`/`executeWorkflowTrigger`のtype/typeVersionは、AUTO-COM-001作成時（2026-08-09）のn8n公式ドキュメントURLスラッグからの類推を踏襲しており、本インスタンスでの実例確認はまだない。
- **未確認事項**：Webhookの`headerAuth`＋`httpHeaderAuth`Credentialの組み合わせが本インスタンスで実際に機能するか（`[要インスタンス確認]`）。`responseMode:lastNode`使用時、複数の終端ノードが存在する分岐構造でどのノードの出力が実際にHTTPレスポンスとして返るか（`[要インスタンス確認]`、n8nの一般的な仕様では「実際に実行された最後のノード」の出力が返る想定だが本インスタンスでの実機検証が必要）。事業サイト取得のタイムアウト・User-Agent設定（一部サイトがボット判定でブロックする可能性、`[未確認]`）。

## リスク・注意点

- 本ワークフローは意図的にthrowせずJSONエラーレスポンスを返す設計としたため、`AUTO-COM-002`（共通エラーハンドラー）による自動通知の対象外になる。運用開始後、失敗が発生してもSlack/LINE等への自動通知は行われないため、別途の監視（例：レスポンスの`success`フィールドを呼び出し元でチェックする、n8nの実行履歴を定期確認する等）が必要。
- Claude APIはトークン従量課金であり、Webhookエンドポイントが外部から連打された場合にコストが発生する。`headerAuth`による簡易な呼び出し元制限のみでは、共有シークレットが漏洩した場合に防げない。呼び出し頻度の想定・追加のレート制限の要否は社長確認が必要。
- `AUTO-COM-003`が要求する「承認待ちタスク・DB」（Notion）が未作成のままでは、承認リクエスト作成が常に失敗し「部分成功（`warning`）」のレスポンスになる。運用開始前に必ずDB作成を完了させること。

## 次に必要なアクション

1. 社長へ：Webhook呼び出し元・認証方式（`headerAuth`の共有シークレット運用方法）の確認
2. 社長／ジンへ：`AUTO-COM-003`が要求する「承認待ちタスク・DB」（Notion）の新規作成依頼
3. `AUTO-COM-001`・`AUTO-COM-003`のワークフローID確定後、本ドラフトの該当箇所（`aip001-call-claude`・`aip001-call-approval`のworkflowId、`aip001-build-approval-request`の`notionDataSourceId`）を実値に更新
4. ~~`.env`が使えるセッション（社長ご自身の環境等）で`scripts/validate-workflow.mjs`・`scripts/check-secrets.mjs`を実行し、結果を本ディレクトリに追記（本セッションではBashツールが無く未実行）~~ → **2026-08-16、別セッション（ジン、Bashツールあり）で実施済み。** `validate-workflow.mjs`：エラー0件・警告1件（Sticky Note孤立、想定内、`.validate.json`/`.validate.md`参照）。`check-secrets.mjs`（実行日時2026-08-16、コマンド：`node scripts/check-secrets.mjs workflows/draft/AUTO-AIP-001_ai-task-planning.json`）：**検出なし**（Credential実値・APIキー等のハードコードなし）。なおこの実行は`.env`接続の有無に関わらず可能な静的解析であり、n8n本番環境への接続は不要だった。
5. n8n-quality-auditorによる監査（未実施。2026-08-16、aoi-quality-auditorによる一般監査でPASS WITH CONDITIONS。条件はAUTO-COM-003側のLINE Broadcast配信リスク対応。詳細は`logs/kohomada_2026-08-16_NoimosAI相当自動化_監査_v1.md`参照）
