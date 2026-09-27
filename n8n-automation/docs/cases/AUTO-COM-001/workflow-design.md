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
- 変更履歴：2026-08-09 v1（ドラフト作成、エイト）／2026-09-27 追記（`outputSchema`拡張の設計メモ、メイ。本体の入出力契約は未変更のドラフトのまま。詳細は本ファイル末尾「拡張案：`outputSchema`パラメータの追加」参照）

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

---

## 拡張案：`outputSchema`パラメータの追加（設計メモ、2026-09-27、メイ）

### 経緯

エイトがAUTO-SLK-001（Slack案件管理）・AUTO-SLK-002（決定事項）の実装仕様作成中に、本ワークフロー（AUTO-COM-001）が`systemPrompt`/`userPrompt`/`model`/`maxTokens`/`temperature`のみを入力とし、JSONスキーマ強制出力（Anthropic Structured Outputs）を指定する口を持たないことを発見した。AUTO-SLK系は`slk-extract`という構造化JSONスキーマでの出力を前提とした設計（`logs/kohomada_2026-09-26_Slack業務管理自動化_改善提案_v2.md` 3.3.1〜3.3.2節、以下「改善提案v2」）になっており、エイトから以下2案の引き継ぎを受けた。

- **案X（推奨・引き継ぎ時点）**：AUTO-COM-001自体に任意パラメータ`outputSchema`を追加。渡されなければ従来通り自由記述出力（後方互換）。
- **案Y（暫定）**：AUTO-COM-001は変更せず、SLK系ワークフロー側でプロンプト指示＋n8n Codeノードでのパース・バリデーションに留める。

本メモは、この2案（および第三案）をメイが検証し、技術設計として確定させたものである。**本メモはドキュメント追記のみであり、AUTO-COM-001の実ワークフローJSON・n8n本番環境への変更は一切行っていない。**

### 確認済み事実

1. 本ファイル冒頭に記載の通り、AUTO-COM-001の現行入力は`systemPrompt`（任意）／`userPrompt`（必須）／`model`（任意、既定`claude-sonnet-5`）／`maxTokens`（任意、既定4000）／`temperature`（任意、既定1）のみであり、出力は成功時`{ success: true, text, model, stopReason, usage }`。JSONスキーマを指定するパラメータ（`outputSchema`等）は存在しない。エイトの指摘・改善提案v2 F18の記述と一致する。
2. AUTO-COM-001を参照している既存ワークフロー設計書は以下6件で、全件を実際に読み、Execute Workflow呼び出し時に渡しているパラメータを確認した。**いずれも`systemPrompt`/`userPrompt`/`model`/`maxTokens`/`temperature`の5項目のみを渡しており、`outputSchema`に相当するパラメータを渡している、または渡すことを前提にした記述は1件も無い。**
   - `KNW-001`（`n8n-automation/docs/cases/KNW-001/workflow-design.md` L100-106）：`model: claude-haiku-4-5`を明示指定して要約に利用。出力は自由記述の要約文をそのまま使用（構造化パースは行っていない）。
   - `AUTO-CNT-001`（同ディレクトリ`workflow-design.md` L14-16, L96-98）：Notionの下書き追記にAUTO-COM-001経由でClaudeを呼び出し。出力形式についての構造化前提の記述なし。
   - `AUTO-CNT-002`（同ディレクトリ`workflow-design.md` L43）：ワークフロー図中に「Claude呼び出し(AUTO-COM-001経由)」とあり、後続で「JSON出力パース」ノードが存在する＝**自由記述のJSON文字列をn8n側でJSON.parseする現行実装**（案Yに相当するパターンを、AUTO-COM-001拡張前からこのワークフロー単独で既に採用している）。
   - `AUTO-KHM-001`（同ディレクトリ`workflow-design.md` L34, L103）：AUTO-COM-001経由に変更した旨の記述があり、`model: claude-sonnet-5`・`temperature: 0.3`を指定。構造化出力の前提記述なし。
   - 加えて、AUTO-SLK-001/002/003（新設・未実装、Draft）が`slk-extract`スキーマでの構造化出力を前提にしている（対象外6件目は今回の新設側であり、既存呼び出し元ではない）。
3. Anthropic Structured Outputsの機能自体について、本メモ作成時点（2026-09-27）で公式ドキュメント（`https://platform.claude.com/docs/en/build-with-claude/structured-outputs`）を実際に取得し、以下を確認した。
   - ステータス：**GA（一般提供）**。
   - `output_config.format`に`{ "type": "json_schema", "schema": {...} }`を指定する形式。
   - 対応モデルに`claude-sonnet-5`・`claude-haiku-4-5-20251001`・`claude-opus-5`等を含む（AUTO-COM-001の既定モデル`claude-sonnet-5`は対応モデル一覧に含まれることを確認）。
   - スキーマ制約：オブジェクト型には`additionalProperties: false`が必須。`minimum`/`maximum`/`multipleOf`/`minLength`/`maxLength`は「Not supported」（ワイヤ上の生JSONスキーマとしては使えない。SDK側の追加検証機能として吸収する経路はあるが、n8nのHTTP Requestノードで直接APIを叩く現行実装ではSDKを介さないため、この経路は使えないと考えるべき）。
   - 旧`output_format`パラメータは非推奨で、`output_config.format`を使う限りベータヘッダは不要。
   - これらは改善提案v2 F12の記述（一次情報を6節に出典明記済み）と整合しており、本メモ作成時点で改めて公式ページ本文を直接読了して再確認できた。
   - 出典：[Structured outputs - Claude Platform Docs](https://platform.claude.com/docs/en/build-with-claude/structured-outputs)（確認日2026-09-27）

### 未確認事項

- `[要確認]` `output_config.format`使用時、Anthropic Messages APIのレスポンス構造（`content`配列の形・`text`フィールドの有無）が、自由記述時と同一の形式を保つか。本メモでは「同一の`content[].text`形式で返り、その文字列がスキーマに準拠したJSON文字列になる」という前提で設計しているが、これは改善提案v2 F12・本メモの公式ページ取得のいずれでもレスポンス例までは確認できておらず、**実機（テストAPI呼び出し）での確認が必要**。
- `[要インスタンス確認]` Execute Workflow Triggerノード（AUTO-COM-001側の入口）が、定義済み以外の任意キーを含むJSONオブジェクトを渡された場合にそのまま通過させるか、それとも事前定義済みの入力項目以外を破棄する設定になっているか。KNW-001の設計書（L250）に「唯一確認できた稼働実例はtypeVersion 1のプレーン形式」とある通り、本インスタンスでの実際の設定は未確認。後方互換性の実証には、この点の実機確認が必須（下記「検証方法」参照）。
- `[未確認]` `claude-haiku-4-5`という短縮表記が、Anthropic API上で`claude-haiku-4-5-20251001`のエイリアスとして解決されるか。AUTO-SLK-001側がHaikuを第一候補にしている（改善提案v2 3.3.3）ため、AUTO-SLK-001実装時に別途確認が必要（AUTO-COM-001自体は`model`を呼び出し元からの文字列そのまま使う設計のため、本メモのスコープでは影響しない）。

### 案の比較

| 観点 | 案X：AUTO-COM-001に`outputSchema`（任意）を追加 | 案Y：AUTO-COM-001は変更せず、呼び出し元でプロンプト指示＋JSON.parse | 案Z（新規検討）：スキーマ対応の別サブワークフロー（例：AUTO-COM-003）を新設し、AUTO-COM-001は不可変のまま維持 |
|---|---|---|---|
| 既存6ワークフローへの影響 | **無し**（後方互換設計。下記「後方互換性の設計」参照） | 無し（そもそも変更しないため） | 無し（AUTO-COM-001自体に触れないため、最も保守的） |
| 実装コスト | 小〜中（Codeノード2箇所への分岐追加のみ） | 小（呼び出し元だけで完結。ただしAUTO-CNT-002が既に同種のパース処理を自前実装しており、SLK系でも同じパターンを複製することになる） | 中〜大（リトライ・エラー処理・タイムアウト等、AUTO-COM-001が持つ共通ロジックを丸ごと複製する必要がある） |
| 構造化出力の保証 | 有り（Anthropic側でスキーマ強制。パース失敗が構造上ゼロ） | 無し（プロンプト任せ。前置き文・Markdownコードフェンス混入等でパース失敗が起こり得る） | 有り（案Xと同等） |
| 保守性・拡張性 | 高（KNW-001等、将来構造化出力が必要になる既存・新規ワークフローすべてに恩恵。ロジックは1箇所） | 低（SLK系・CNT-002のように、構造化が必要なワークフローごとに同じパース処理を重複実装することになる） | 低（リトライ方針変更等のたびに2つのサブワークフローを同期する必要があり、`n8n-workflow-json.md`の「過剰分割で保守性を落とさない」に反する） |
| フェーズ1.5（AUTO-SLK-003）への拡張性 | 高（`outputSchema`にv1.1スキーマを渡すだけ、`migration-note.md`の合流手順とも整合） | 低（都度パース処理の作り直しが必要） | 中（対応は可能だがAUTO-COM-001とAUTO-COM-003の使い分けルールが今後の呼び出し元選定を複雑にする） |
| リスク | 小（後方互換の作り方次第。下記で担保） | 小（現状維持のため） | 小だが、共通化の理念（AUTO-COM-001の目的＝「Claude API呼び出し処理を1箇所に集約」）に反し、将来的な保守負債になる |

### 推奨案と判断理由

**案X（AUTO-COM-001の拡張）を推奨する。** 理由は以下の3点。

1. **既存6ワークフローへの影響が実証的に無いと判断できる**：6件全てを実読し、`outputSchema`に相当するパラメータへの依存が無いことを確認した（上記「確認済み事実」2）。かつ、下記「後方互換性の設計」の通り、`outputSchema`が渡されない場合はリクエストボディ生成・レスポンス整形の両方で従来と**バイト単位で同一の挙動**になるよう設計する（新規キーの追加を「存在する場合のみ」に限定し、既存の分岐・既存キーの中身は一切変更しない）。
2. **案Y（プロンプト任せ）は、AUTO-SLK系が前提とする構造化出力の保証を得られない**。AUTO-CNT-002が現に「JSON出力パース」ノードでこのパターンを採用しているが、これは案Yそのものであり、パース失敗時の挙動が明文化されていない（既存の技術的負債）。SLK系はフェーズ1.5以降の自動実行（`internal_status_update`等）の土台になるため、案Yのままではパース失敗のリスクを今以上に積み増すことになる。
3. **案Z（別サブワークフロー新設）は、AUTO-COM-001自体の設計目的（「n8n上の各ワークフローがClaude APIを呼び出す処理を1箇所に集約し、リクエスト整形・エラー処理・リトライ・レスポンス整形のロジックを重複させない」、本ファイル冒頭「目的」参照）に反する**。既存の後方互換リスクをゼロにする効果はあるが、そのリスクは案Xでも十分小さく抑えられる設計が可能であり、リスク低減効果に見合わないメンテナンスコスト増（リトライ・タイムアウト等のロジックを2箇所で同期し続ける必要）を払う理由が無い。

### 後方互換性の設計（技術仕様）

#### 1. 入力パラメータへの追加

| パラメータ | 型 | 必須/任意 | 挙動 |
|---|---|---|---|
| `outputSchema` | object（JSON Schema） | 任意（既定：未指定＝`undefined`） | 指定時のみ、Anthropicへのリクエストボディに`output_config.format`を付加する。未指定・`null`・`false`等のfalsy値の場合は、リクエストボディに`output_config`キー自体を含めない（キーの有無で分岐し、空オブジェクト等を代わりに入れない） |

既存5パラメータ（`systemPrompt`/`userPrompt`/`model`/`maxTokens`/`temperature`）の意味・型・既定値は一切変更しない。

#### 2. 「入力検証・デフォルト適用」Codeノードの変更方針

- 既存の`userPrompt`必須チェック等はそのまま維持する。
- 追加分岐（疑似コード、実装時は`n8n-workflow-json.md`のルールに従いCodeノードでの実装可否を再確認）：
  ```
  const outputSchema = item.json.outputSchema;
  if (outputSchema !== undefined && outputSchema !== null) {
    if (typeof outputSchema !== 'object' || Array.isArray(outputSchema)) {
      throw new Error('outputSchema must be a JSON object when provided');
    }
    // 新規呼び出し元（例：AUTO-SLK-001）が明示的に渡した場合のみ検証する。
    // 既存呼び出し元はこのキー自体を渡さないため、この分岐に入らない。
  }
  ```
- 既存呼び出し元（KNW-001／AUTO-CNT-001／AUTO-CNT-002／AUTO-KHM-001）はこのキーを渡していないため、`outputSchema === undefined`となり、この分岐を素通りする＝**既存の検証ロジックの実行結果は変更前と完全に同一**。

#### 3. 「リクエストボディ生成」Codeノードの変更方針

- 疑似コード：
  ```
  const body = {
    model, messages, max_tokens: maxTokens, temperature,
    ...(systemPrompt ? { system: systemPrompt } : {}),
  };
  if (outputSchema) {
    body.output_config = { format: { type: 'json_schema', schema: outputSchema } };
  }
  ```
- `outputSchema`が無い場合、`body`オブジェクトは変更前と同一のキー集合になる（`output_config`キー自体が生成されない）。これにより「既存呼び出し元が意図せず新しいAPI挙動に晒される」リスクを構造的に排除する。

#### 4. 「成功レスポンス整形」Codeノードの変更方針

- 既存出力`{ success, text, model, stopReason, usage }`の各キー・型・意味は変更しない。
- 追加：`outputSchema`が指定されていた場合に限り、`text`をJSON.parseし、成功すれば`parsed`キー（追加・任意参照）として出力に加える。失敗した場合は`parsed`を含めず、`success: true`のまま返す（パース失敗の扱いは呼び出し元＝AUTO-SLK-001側のIF分岐に委ねる。改善提案v2 3.3.4「スキーマ検証失敗」のフォールバックと対応）。
- `outputSchema`が指定されていない場合、この追加ロジックは実行されず、出力は完全に現状のまま（`parsed`キーは追加されない）。
- 疑似コード：
  ```
  const result = { success: true, text, model, stopReason, usage }; // 既存と同一
  if (outputSchema) {
    try { result.parsed = JSON.parse(text); } catch (e) { /* parsedを付けないだけ。throwしない */ }
  }
  return result;
  ```

#### 5. リトライ・エラー処理への影響

- 既存の3回固定リトライ（`waitBetweenTries`固定2000ms）はそのまま維持する。`outputSchema`のスキーマ不正等でAnthropicが400を返した場合も、現行実装は4xx/5xxを区別しないため3回リトライしてから失敗する（既知の非効率だが、既存呼び出し元の挙動には影響しない。改善提案v2 3.4.2で「COM-001の改善候補」として既に指摘済みの別課題であり、本拡張の必須要件ではない）。

#### 6. 後方互換性の確認方法（本番接続前に実施）

`outputSchema`を渡さない限りリクエストボディ・レスポンス整形ロジックの両方が現状と同一になるよう設計しているため、原理的には既存呼び出し元のコード変更は不要と判断できる。ただし「原理的に」で終わらせず、以下の手順で実証する。

1. **静的レビュー**：上記疑似コードの通り、変更が「`outputSchema`が真値の場合のみ実行される追加分岐」に限定されており、既存分岐の削除・並び替え・条件変更を伴わないことをコードレビューで確認する（担当：エイト実装後、メイまたは`aoi-quality-auditor`相当のレビュー）。
2. **単体テスト（実行環境非依存）**：`outputSchema`を含む入力オブジェクトと含まない入力オブジェクトの2パターンで、「入力検証」「リクエストボディ生成」「成功レスポンス整形」の各Codeノードのロジックを、n8n環境を介さないNode.jsスクリプトとして`n8n-automation/tests/`配下で単体実行し、後者（`outputSchema`無し）が拡張前の出力と一致することを確認する。
3. **実機確認**：`n8n-automation/CLAUDE.md`の検証必須事項（`validate-workflow.mjs`・`check-secrets.mjs`）を実行した上で、AUTO-COM-001を更新登録する（削除を伴わない更新は現行ルール上自動化対象だが、共有依存であることを踏まえ、更新前に必ずバックアップ（現行ワークフローJSONのエクスポート）を取得する）。更新後、まず`outputSchema`を渡さない既存呼び出し元（例：KNW-001の低リスクなテスト実行）を1回実行し、出力形状・所要時間が拡張前と同等であることを確認してから、`outputSchema`を渡すテスト呼び出し（AUTO-SLK-001の本番接続前段階のテストハーネス）を行う。結果は`documentation.md`の実行記録ルール（実行日時・対象環境・入力・実際の出力・成否・残存リスク）に従って記録する。
4. Execute Workflow Triggerの入力形式（上記「未確認事項」の`[要インスタンス確認]`）は、この実機確認の中で併せて確認する。もし本インスタンスのExecute Workflow Triggerが「事前定義済みキーのみ通過」という設定になっていた場合、既存呼び出し元の呼び出しコード自体は変更不要のまま、AUTO-COM-001側のTriggerノードの「定義済み入力項目」一覧に`outputSchema`を追加する作業が必要になる（この追加自体は既存項目の削除・変更を伴わないため後方互換性は保たれるが、実装工数がわずかに増える）。

### 代替案（不採用理由の再掲）

- **案Y**：本ドキュメント「推奨案と判断理由」2. の通り。フェーズ1.5以降の自動実行の土台として構造化出力の保証が必要になるため不採用。ただし、AUTO-COM-001拡張（案X）が何らかの事情で先に完了できない場合の**暫定措置**として、AUTO-SLK-001側だけで一時的に案Yパターン（AUTO-CNT-002と同型）を採用し、拡張完了後に切り替える、という段階移行はエイトの引き継ぎ通り許容する。
- **案Z**：本ドキュメント「推奨案と判断理由」3. の通り。共通化の設計目的に反し、リスク低減効果に見合わない保守コスト増を伴うため不採用。

### 分類（本拡張案メモ）

- **確認済み事実**：既存6ワークフロー設計書の実読了によるパラメータ依存関係の確認、Anthropic公式ドキュメント（2026-09-27時点、GA・`output_config.format`・スキーマ制約・対応モデル）の実読了確認。
- **現在の仮定**：`output_config.format`使用時もレスポンスの`content[].text`形式は自由記述時と同一という前提（未実機検証）。
- **未確認事項**：上記「未確認事項」節に列挙の3点（レスポンス構造・Execute Workflow Triggerの入力通過設定・`claude-haiku-4-5`のエイリアス解決）。
- **推奨案**：案X（本メモの技術設計通り）。
- **代替案**：案Y（暫定移行のみ許容）、案Z（不採用）。
- **次に必要なアクション**：(1) 社長・エイトとの間で、本拡張を「AUTO-SLK-001実装に先立つ別タスク」として着手するか合意する（`migration-note.md`および`AUTO-SLK-001/workflow-design.md`「次に必要なアクション」1.と対応）。(2) 上記「後方互換性の確認方法」1〜4を実施する。(3) 実装（Codeノードの変更）はエイトが担当し、本メモを実装仕様のインプットとする。
