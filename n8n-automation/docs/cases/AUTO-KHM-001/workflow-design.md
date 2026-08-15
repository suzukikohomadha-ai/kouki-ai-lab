# ワークフロー設計書（AUTO-KHM-001）

## 基本情報

- ワークフロー名：Japan Regulatory & Government News Digest（日本の規制・行政ニュース多言語ダイジェスト配信）
- 一意の管理ID：AUTO-KHM-001
- 目的：日本語の規制・行政ニュースをRSSで収集し、AIで要約・翻訳して多言語ダイジェストとして配信する。
  n8n公式Creator Hubへの提出候補テンプレート。
- 業務責任者：メイ（設計）／社長最終承認
- 技術責任者：エイト（n8n-workflow-builder相当）
- 対象部署：株式会社コホマダ（AI・DX/業務自動化事業）。提出先はn8n公式（社外向けテンプレート）。
- トリガー：Schedule Trigger（既定：毎週月曜9:00。頻度・時刻はユーザーが変更可能）
- 入力データ：ユーザーが`Set: Config`ノードで設定するRSSソースURL（最大3、プレースホルダーのみ）・
  Slackチャンネル・翻訳先言語・配信オプション（Gmail下書き作成／Notion追記の有効化）
- 出力データ：Slack投稿（既定）、Gmail下書き（任意）、Notion追記（任意）、既読ログ（Google Sheets）への追記
- 前提条件：ユーザーが自身で確認済みのRSSソース・Google Sheets・AI/LLMプロバイダ・Slack（必要に応じGmail/Notion）を用意すること
- 利用サービス：RSS（ユーザー設定）、AI/LLMプロバイダ（プレースホルダーHTTP Request）、Google Sheets、Slack、Gmail（任意）、Notion（任意）
- 必要Credential：下記「Credentialマッピング表」参照。実値は一切含めていない
- 実行頻度：既定週次（ユーザー変更可）
- 想定件数：RSSソース1件あたり数件〜十数件/週を想定（未検証）
- 最大件数：`[未確認]`（RSS Feed Readのページネーション・件数上限は未確認）
- 想定実行時間：`[未確認]`（AI/LLM呼び出しのレイテンシに依存）
- 許容遅延：週次配信のため、当日中の完了を目安とするが`[要ヒアリング]`（テンプレート利用者ごとに異なる）
- エラー時の対応：専用のエラーワークフロー（`AUTO-KHM-001_japan-reg-news-digest-error.json`）をSettings→Error Workflowで指定し、失敗時にSlackで管理者へ通知する設計（Error Trigger自体の`type`はT27で確認済み、`typeVersion`と実際のペイロード構造は`[要再確認]`）
- 手動対応への切替条件：AI応答のパース失敗等、致命的エラー時はワークフローを停止し配信しない（不完全なダイジェストを配信しない設計）
- ログ方針：既読ログ（Google Sheets）に配信済み記事URL・ソース名・配信日時を記録。それ以外の実行ログは対象外（デフォルトのn8n実行ログに準じる）
- 保存期間：`[要ヒアリング]`（既読ログの保持期間はユーザー次第）
- 個人情報の有無：想定上は行政ニュースの公表情報のみを扱うため個人情報は基本的に含まれない見込みだが、
  行政処分公表等の記事に個人名・法人名が含まれる可能性はリョウの論点整理で指摘されており`[要追加調査]`
- 監視項目：`[未確認]`（本番運用時に実行失敗率・AI呼び出しエラー率等の監視設計が別途必要）
- 成功条件：新着記事がある場合、出典（タイトル・URL・発行日）と免責文言を含むダイジェストがSlackに投稿され、既読ログが更新される。新着0件の場合は何も配信せず正常終了する
- KPI：テンプレートとしての採用数・審査通過可否等は`[未確認]`（n8n公式の審査基準自体が未確認のため）
- ロールバック方法：本番未登録のため対象外。本番化する場合はワークフローの無効化（active:false）とCredentialの無効化で対応
- 変更履歴：v1（2026-08-15、エイト、初版実装ドラフト）

## 案の比較（最低2案）

メイの設計書（`logs/kohomada_2026-08-15_日本進出n8nワークフロー案A_設計書_v1.md`）6節に基づき、
実装段階で以下の分岐点について代替案を検討し、判断した。

| 観点 | 採用案：AI一括要約+翻訳（HTTP Request） | 代替案：DeepL等専用翻訳ノード併用 |
|---|---|---|
| 開発工数 | 低い（ノード数が少ない） | 高い（DeepL専用ノードの仕様確認・翻訳ステップの追加実装が必要） |
| 月額費用 | AI/LLMプロバイダの費用のみ`[要公式確認]` | AI/LLMプロバイダ費用＋DeepL費用の両方`[要公式確認]` |
| 保守性 | 高い（1回のAPI呼び出しで完結） | 中（2つの外部連携を維持する必要） |
| 拡張性 | 中（プロンプト変更で対応言語を増やせる） | 高い（DeepLの言語対応の広さを活かせる可能性） |
| 安定性 | AI応答のJSONパース失敗リスクあり（対策済み：パース失敗時は例外で停止） | 翻訳品質はDeepLの専用エンジンの方が安定する可能性（未検証） |
| セキュリティ | 外部送信先が1つに集約される | 外部送信先が2つに増える |
| ベンダーロックイン | AI/LLMプロバイダに依存 | AI/LLMプロバイダ＋DeepLの二重依存 |
| 障害時の影響 | AI呼び出し失敗のみが単一障害点 | AI・DeepLそれぞれが障害点になる |
| 必要スキル | プロンプト設計 | プロンプト設計＋DeepL API仕様の理解 |

**採用案とその理由：** DeepL等の専用翻訳ノードの正式`type`・`typeVersion`・料金体系がいずれも
未確認（リサ・メイの調査でも継続する留保）であるため、実装段階での不確実性を下げる目的で、
メイの設計書6節が代替案として提示していた「要約と翻訳を1回のLLM呼び出しにまとめる」方式を採用した。
本番化検討時にDeepL等の実仕様が確認でき、翻訳品質上の理由で必要と判断されれば、代替案へ切り替える。

## 技術観点チェック

- 冪等性：既読ログ突合（URLベース）により、同一記事の重複配信を防止。同一実行内での重複URLも
  `Code: Deduplicate Against Log`内で除去（複数ソースが同一記事を配信する場合を想定）
- 二重実行防止：Slack／Gmail／Notionの3並列配信ブランチをMergeノード2段で同期させてから
  既読ログ更新を1回だけ実行する設計（直結すると最大3回重複実行される問題を実装時に発見し対策）
- 入力値検証：`If: New Articles Found?`の前に必ず`Code: Check New Article Count`を挟み、
  入力0件でもIfノードが正しく分岐できるようにしている（Ifノードは入力0件だと評価自体が
  発生しない可能性があるという一般的な理解に基づく対策。本セッションでは未検証）
- データ型統一：RSS項目のURL・日時フィールドを`Set: Tag RSS Items`で`articleUrl`・`publishedAt`に正規化
- タイムゾーン明示：ワークフロー`settings.timezone`を`Asia/Tokyo`に設定（Schedule Triggerの解釈への
  実際の影響は`[要インスタンス確認]`）
- ページネーション：`[未確認]`（RSS Feed Read・Google Sheets双方のページネーション仕様は未確認）
- バッチ処理：AI呼び出しは新着記事をまとめて1回のリクエストで送る設計（記事ごとの個別呼び出しにしていない）
- レート制限・タイムアウト：HTTP RequestノードにtimeoutをoptionsとしてUB(60000ms)を設定。
  リトライ設定は未実装（`[要追加実装]`。安全に再試行できるタイムアウト・レート制限エラーに限定した
  リトライを本番化時に追加すべき）
- リトライ条件：現状未実装。今後追加する場合は、AI呼び出し・RSS取得の一時的な通信障害・レート制限
  エラーに限定し、パース失敗等の恒久的エラーは再試行しない設計にすべき
- 部分失敗時の処理：AI応答のパース失敗時は例外を投げてワークフロー全体を停止し、不完全な
  ダイジェストを配信しない設計（設計書の「意思決定を誤らせるリスク」への対策と一致）
- 補償処理：未実装（本番化時に要検討。例：AI呼び出し失敗時に「今週は取得できませんでした」という
  簡易通知を送る等）
- エラーワークフロー：`AUTO-KHM-001_japan-reg-news-digest-error.json`として実装済み（Draft）
- 通知：Slackへのエラー通知（プレースホルダーチャンネル・Credential）
- ログ：既読ログ（Google Sheets）のみ。実行ログはn8n既定機能に依存
- 監視：`[未確認]`。本番化時に実行失敗率等の監視設計が必要
- 処理コスト：AI/LLM呼び出し・翻訳の料金は`[要公式確認]`（メイの設計書5節と同じ留保）
- 実行データの保存方針：`pinData`等の実行時データはドラフトJSONに含めていない
- 個人情報のマスキング：現時点では個人情報を主体的に扱う設計にしていないが、行政処分公表等の
  記事に個人名が含まれる可能性は`[要追加調査]`（リョウの論点整理を踏襲）
- 認証情報の分離：すべてのCredentialはプレースホルダー（`PLACEHOLDER_...`という文字列）。
  実Credentialは本タスクでは一切作成・登録していない
- テスト環境と本番環境の分離：`[実行環境なしのため未テスト]`。本番投入前に必ずステージング相当の
  検証（ダミーデータでの実インスタンス実行）が必要

- [x] 上記すべてを検討し、該当項目に方針を記載した（一部`[未確認]`のまま残存）

## ノード構成（実装済み・すべて`[要インスタンス確認]`を含む）

| ノード名 | 役割 | 種別 | type / typeVersion | 備考 |
|---|---|---|---|---|
| Sticky Note ×6 | 概要・セクション説明・著作権注意書き（英語） | 公式ノード | `n8n-nodes-base.stickyNote` / `1` | `[要インスタンス確認]` |
| Schedule Trigger: Weekly (Configurable) | 起点（既定週次） | 公式ノード | `n8n-nodes-base.scheduleTrigger` / `1.2` | `[要インスタンス確認]` parameters構造未確認 |
| Set: Config (Sources & Distribution Options) | ユーザー設定の集約 | 公式ノード | `n8n-nodes-base.set` / `3.4` | assignments構造はT28パターン踏襲・未再確認 |
| RSS Feed Read ×3 | RSS取得（ソース1〜3） | 公式ノード | `n8n-nodes-base.rssFeedRead` / `1` | `[要公式確認]` 未確認（今回初めて使用） |
| Set: Label Source ×3 | ソース名の付与 | 公式ノード | `n8n-nodes-base.set` / `3.4` | `includeOtherFields`キー名未確認 |
| Merge ×4（Source結合・Dedup入力・配信ブランチ同期×2） | データ結合・同期 | 公式ノード | `n8n-nodes-base.merge` / `3` | mode="append"は未確認 |
| Filter: Within Lookback Period | 期間絞り込み | 公式ノード | `n8n-nodes-base.filter` / `2` | conditionsスキーマ未確認 |
| Set: Tag RSS Items / Set: Tag Log Entries | 重複排除用のタグ付け・正規化 | 公式ノード | `n8n-nodes-base.set` / `3.4` | 同上 |
| Google Sheets: Read/Append Distribution Log | 既読ログの読み書き | 公式ノード | `n8n-nodes-base.googleSheets` / `4.5` | resourceLocator構造未確認 |
| Code ×6（Dedup／件数チェック／プロンプト生成／AI応答パース／ダイジェスト組立／ログ行準備） | 標準ノードで安全に実装できない処理 | Codeノード | `n8n-nodes-base.code` / `2` | `jsCode`キー名・`$input`/`$()`構文は一般的想定・未検証 |
| If ×3（新着判定／Gmail有効化／Notion有効化） | 分岐 | 公式ノード | `n8n-nodes-base.if` / `2.2` | T27/T28パターン踏襲・未再確認 |
| NoOp ×3（新着なし終端／Gmailスキップ／Notionスキップ） | 終端・スキップ | 公式ノード | `n8n-nodes-base.noOp` / `1` | DEMO-001/T28で使用実績あり |
| HTTP Request: AI Summarize & Translate | AI要約・翻訳（プレースホルダーエンドポイント） | HTTP API接続 | `n8n-nodes-base.httpRequest` / `4.2` | T28で使用実績あり。URLはプレースホルダー（`.example`） |
| Slack: Post Digest | ダイジェスト配信（既定） | 公式ノード | `n8n-nodes-base.slack` / `2.2` | resource/operation名未確認 |
| Gmail: Create Draft | メール下書き作成（任意） | 公式ノード | `n8n-nodes-base.gmail` / `2.1` | resource=draft, operation=createはT28確認済みパターン踏襲 |
| Notion: Append Digest Entry | Notion追記（任意） | 公式ノード | `n8n-nodes-base.notion` / `2.2` | `[要公式確認]` 特に不確実性が高い（バージョン差異が大きいノード） |
| Error Trigger（別ワークフロー） | エラーハンドリング起点 | 公式ノード | `n8n-nodes-base.errorTrigger` / `1` | type文字列はT27で確認済み、typeVersionは`[要再確認]` |

## Credentialマッピング表

| ワークフロー内の参照名 | 用途 | 実在するCredential名（ユーザー確認後に記入） |
|---|---|---|
| `googleSheetsOAuth2Api`（Read/Append Distribution Log） | 既読ログの読み書き | `[未設定]` |
| `httpHeaderAuth`（AI Summarize & Translate） | AI/LLMプロバイダのAPIキー | `[未設定]`（プロバイダ自体が未確定） |
| `slackApi`（Post Digest／エラーワークフローのNotify Admin、2件） | Slack投稿 | `[未設定]`（本番用・エラー通知用は別名にする） |
| `gmailOAuth2`（Create Draft） | Gmail下書き作成 | `[未設定]`（任意機能） |
| `notionApi`（Append Digest Entry） | Notion追記 | `[未設定]`（任意機能） |

実際の割り当ては、社長の承認のもとで行う（`.claude/rules/security.md`・approval-policy.md準拠）。

## 分類

- **確認済み事実**：Gmail Draft作成（resource=draft, operation=create）・Error Triggerの存在は
  2026-07-28（T27/T28）にn8n公式ドキュメントで確認済み（ただし今回のセッションでは再確認していない）
- **現在の仮定**：RSSソースは最大3件を既定構成とする（ユーザーが増減可能）。AI/LLMプロバイダは
  OpenAI互換のchat completion形式のレスポンスを返すと仮定している（プロバイダ確定後に要修正）
- **未確認事項**：本表の「ノード構成」列に記載の`type`/`typeVersion`のほぼすべて、Google Sheets・
  Notion・Slackの詳細パラメータスキーマ、n8n公式Creator Hubの提出規約（リョウの論点整理で
  指摘された未確認事項）
