# ワークフロー設計書

## 基本情報

- ワークフロー名：共通Claude API呼び出しサブワークフロー
- 一意の管理ID：AUTO-COM-001
- 目的：n8n上の各ワークフローがClaude(Anthropic) APIを呼び出す処理を1箇所に集約し、リクエスト整形・エラー処理・リトライ・レスポンス整形のロジックを重複させない。
- 業務責任者：鈴木さん（社長）
- 技術責任者：エイト（n8n Workflow Implementation Engineer）
- 対象部署：共通基盤（全クラスタ横断）
- トリガー：Execute Workflow Trigger（他ワークフローのExecute Workflowノードから呼び出される。単独では起動しない）
- 入力データ：`systemPrompt`（string, 任意）／`userPrompt`（string, 必須）／`model`（string, 任意, 既定 `claude-sonnet-5`）／`maxTokens`（number, 任意, 既定 4000）／`temperature`（number, 任意, 既定 1）
- 出力データ：成功時 `{ success: true, text, model, stopReason, usage }`。失敗時はワークフロー実行自体が失敗（throw）する。
- 前提条件：呼び出し元・本ワークフローともに `anthropicApi` Credentialが利用可能であること。n8n本番登録後、本ワークフローのworkflow IDを呼び出し元のExecute WorkflowノードのworkflowId欄に設定する必要がある。
- 利用サービス：Anthropic Messages API（`https://api.anthropic.com/v1/messages`）
- 必要Credential：`anthropicApi` 種別（用途：Claude API呼び出し）。実値・実IDは本ドラフトに含めていない。
- 実行頻度：呼び出し元次第（本ワークフロー自体に定期実行トリガーは無い）
- 想定件数：呼び出し元1回の実行につき1回のAPI呼び出し
- 最大件数：`[未確認]`（呼び出し元の並列度・実行頻度による。Anthropic APIのレート制限は本ドラフト作成時点で個別確認していない）
- 想定実行時間：`[未確認]`（Claude応答時間はプロンプト長・max_tokensに依存）
- 許容遅延：`[要確認/社長]`
- エラー時の対応：3回リトライ（指数バックオフ想定、`waitBetweenTries`固定値2000msで実装。真の指数バックオフではなく固定間隔である点は簡易実装として明記）後も失敗した場合、明示的にワークフロー実行を失敗させる。共通エラーハンドラー（AUTO-COM-002）をこのワークフローのError Workflow設定に割り当てることを推奨（本番登録時に実施、要承認）。
- 手動対応への切替条件：Claude API呼び出しが継続的に失敗する場合、該当する上位ワークフローを一時的に無効化し、手動での下書き作成に切り替える。
- ログ方針：n8nの標準実行ログに委ねる。個人情報を含むプロンプトを外部ログサービスへ転送する処理は実装していない。
- 保存期間：`[要確認/社長]`（n8n実行データの保存期間設定に依存、本ドラフト作成時点で未確認）
- 個人情報の有無：呼び出し元が渡すプロンプト内容次第。本サブワークフロー自体は個人情報の要否を判定しない（呼び出し元の責任）。
- 監視項目：実行失敗率、Claude API応答時間、リトライ発生率
- 成功条件：Anthropic APIから200番台のレスポンスを受け取り、`content`配列からテキストを抽出できること
- KPI：`[要確認/社長]`
- ロールバック方法：本ワークフローを無効化し、呼び出し元ワークフローのExecute Workflowノードを一時的にバイパスする（呼び出し元側の設計変更が必要になる可能性あり）
- 変更履歴：2026-08-09 v1（ドラフト作成、エイト）

## 案の比較（最低2案）

| 観点 | 案A（推奨・HTTP Requestで直接API呼び出し） | 案B（専用Anthropicノード使用） |
|---|---|---|
| 開発工数 | 中（プロンプト整形・エラー処理を自前実装） | 低（ノードがあれば） |
| 月額費用 | 変わらず（Anthropic API従量課金のみ） | 同左 |
| 保守性 | 高（既存7ワークフローと実装パターンが統一される） | 専用ノードのバージョンアップ挙動に依存 |
| 拡張性 | 高（プロンプト構造を自由に制御可能） | ノードの対応パラメータ範囲に制約される可能性 |
| 安定性 | 実績あり（既存本番ワークフローで同パターンが稼働中） | 未検証（このインスタンスでの専用ノード存在自体が未確認） |
| セキュリティ | Credential参照方式は同等 | 同左 |
| ベンダーロックイン | 低い（HTTP Requestは汎用ノード） | 専用ノードが将来的に廃止・仕様変更されるリスク |
| 障害時の影響 | n8n実環境監査の結果、Anthropic専用ノードの存在自体が未確認のため選択不可 | 選択不可（未確認のため） |
| 必要スキル | Anthropic API仕様の理解 | ノードUIの理解のみで良い場合が多いが今回は非該当 |

**推奨案とその理由：** 案A（HTTP Request＋`anthropicApi`Credential）。理由：(1) n8n実環境監査（2026-08-09）で、このインスタンスの既存7ワークフローがNotion・Anthropicいずれも専用ノードではなくHTTP Requestノード＋Credentialで統一して実装している実績が確認されており、一貫性・保守性の観点からこのパターンを踏襲すべきと判断した。(2) Anthropic専用ノードがこのインスタンスにインストール・有効化されているかは`GET /types/nodes.json`等が401/404となり確認できなかった（[要インスタンス確認][要UI確認]、出典：`logs/common_2026-08-09_n8n実環境監査_v1.md`）。未確認のノードを前提に設計することは`.claude/rules/n8n-workflow-json.md`のノード選定優先順位（1.公式ノード→2.HTTP Request等）にも反しないが、今回は「存在未確認」という制約により、確実に動作実績のあるHTTP Request方式を選ぶ。

## 技術観点チェック

- [x] 冪等性：Claude API呼び出し自体は副作用が読み取り専用（外部システムへの書き込みは行わない）。呼び出し元での重複実行防止は呼び出し元の責任とする。
- [x] 二重実行防止：本サブワークフロー単体では扱わない（呼び出し元の責務）。
- [x] 入力値検証：`userPrompt`必須チェックを実装。空・未指定の場合は明示的にthrow。
- [x] データ型統一：`maxTokens`/`temperature`はNumber型を強制（`Number.isFinite`チェック）。
- [x] タイムゾーン明示：本ワークフローは時刻を扱わないため対象外。
- [x] 日付形式統一：対象外。
- [ ] ページネーション：対象外（単発API呼び出しのため）。
- [ ] バッチ処理：対象外（1リクエスト=1呼び出し）。
- [x] レート制限：`[未確認]`。Anthropic APIのレート制限値は個別確認していない。リトライで一時的なレート制限には対応するが、恒常的な超過には対応しない。
- [x] タイムアウト：HTTP Requestノードの`options.timeout`を60000ms（60秒）に設定（キー名は[要インスタンス確認]）。
- [x] リトライ条件：`retryOnFail`/`maxTries`/`waitBetweenTries`を設定（キー名・挙動は[要インスタンス確認]、このインスタンスでの実例なし）。
- [x] 指数バックオフ：未実装（固定間隔2000msのみ。真の指数バックオフが必要な場合は追加実装が要る、既知の簡易実装である旨を明記）。
- [x] リトライ不可能なエラーの分類：未実装。すべての失敗を同一に扱いthrowする簡易設計。将来的に4xx（リクエスト不正）と5xx/タイムアウト（再試行余地あり）を区別する改善余地あり。
- [x] 部分失敗時の処理：対象外（単一APIコールのため部分失敗の概念なし）。
- [ ] 補償処理：対象外（副作用を持たないため）。
- [x] エラーワークフロー：失敗時にthrowし、Error Workflow設定（AUTO-COM-002想定）での捕捉を前提とする。
- [x] 通知：本サブワークフロー自体は通知を行わない（AUTO-COM-002に委譲）。
- [x] ログ：n8n標準実行ログのみ。
- [ ] 監視：`[要確認/社長]`（n8n標準の実行履歴閲覧以外の監視は未実装）。
- [x] 処理コスト：Claude Sonnet 5想定、入力$3/1M・出力$15/1Mトークン（2026-08-08確認のclaude-apiスキルキャッシュ情報、導入価格適用時は入力$2/1M・出力$10/1M、2026-08-31まで。最新価格は都度 https://platform.claude.com/docs/en/pricing で要確認）。
- [x] 実行データの保存方針：`[要確認/社長]`
- [x] 個人情報のマスキング：呼び出し元の責務。本サブワークフローはプロンプト内容を検閲しない。
- [x] 認証情報の分離：Credential実IDはJSONに含めず、インポート後にUIで手動割当する方式とした。
- [x] テスト環境と本番環境の分離：`[実行環境なしのため未テスト]`。ステージング環境の有無は本ドラフト作成時点で未確認。

## ノード構成（ドラフト）

| ノード名 | 役割 | 種別 | type / typeVersion | 備考 |
|---|---|---|---|---|
| Execute Workflow Trigger | サブワークフローの入口 | 公式（未確認） | `n8n-nodes-base.executeWorkflowTrigger` / 1 `[要インスタンス確認]` | type文字列は公式ドキュメントURLスラッグからの類推 |
| 入力検証・デフォルト適用 | userPrompt必須チェック・デフォルト値適用・共通ガードレール付与 | Code | `n8n-nodes-base.code` / 2（確認済み） | |
| リクエストボディ生成 | Anthropic Messages API形式のリクエストボディ構築 | Code | `n8n-nodes-base.code` / 2（確認済み） | 既存本番ワークフロー実例に基づく |
| Claude API呼び出し | Anthropic API呼び出し | HTTP | `n8n-nodes-base.httpRequest` / 4.2（確認済み） | 既存本番ワークフロー実例に基づく。credentials未割当 |
| IF: 呼び出し成功判定 | エラー有無で分岐 | 公式（確認済み） | `n8n-nodes-base.if` / 2.2（確認済み） | |
| 成功レスポンス整形 | content配列からtext抽出 | Code | `n8n-nodes-base.code` / 2（確認済み） | |
| NoOp: 完了（成功） | 終端 | 公式（未確認） | `n8n-nodes-base.noOp` / 1 `[要インスタンス確認]` | |
| 失敗時エラー送出 | 明示的にthrow | Code | `n8n-nodes-base.code` / 2（確認済み） | |

## Credentialマッピング表

| ワークフロー内の参照名 | 用途 | 実在するCredential名（ユーザー確認後に記入） |
|---|---|---|
| `anthropicApi`（nodeCredentialType指定のみ、JSON上は未割当） | Claude API呼び出しの認証 | 既存Credential「Anthropic - n8n」（種別`anthropicApi`、2026-08-09の読み取り専用監査で存在確認済み。実IDはこのドキュメントにも記載していない。インポート後にn8n UIで手動割当し、既存の運用系ワークフローとの共有可否は[要確認/社長]） |

## 分類

- **確認済み事実**：n8n実環境（`https://kohomadha-n8n.top`）に`anthropicApi`Credentialが1件存在すること。既存本番ワークフローがHTTP Request＋`anthropicApi`でAnthropic APIを呼び出す実装パターンを採用していること（出典：`logs/common_2026-08-09_n8n実環境監査_v1.md`、および本セッションでの読み取り専用API確認）。
- **現在の仮定**：Anthropic専用ノードは存在しない（未確認だがHTTP Request方式を選択する根拠とした仮定）。Execute Workflow Trigger/Execute Workflowのtype文字列はcamelCase命名規則が本インスタンスでも一貫していると仮定。
- **未確認事項**：Execute Workflow Trigger/Execute Workflowの正確なtype・typeVersion・パラメータ構造（`[要インスタンス確認]`）／httpRequestノードのtimeout・retry関連オプションキー名（`[要インスタンス確認]`）／continueOnFail使用時のitem.json.errorの正確な形（`[要インスタンス確認]`）／Anthropic APIのレート制限値（`[未確認]`）／n8n実行データの保存期間設定（`[要確認/社長]`）
