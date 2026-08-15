# ワークフロー設計書

## 基本情報

- ワークフロー名：共通エラーハンドラー
- 一意の管理ID：AUTO-COM-002
- 目的：n8n標準のError Workflow機構を使い、他ワークフローの失敗時に共通ロジックで通知・ログ記録・重複防止を行う。
- 業務責任者：鈴木さん（社長）
- 技術責任者：エイト
- 対象部署：共通基盤
- トリガー：Error Trigger（対象ワークフローのSettings > Error Workflowに本ワークフローを指定することで自動起動される）
- 入力データ：n8nが自動的に渡すエラー情報（workflow名・実行ID・失敗ノード名・エラーメッセージ等。正確なキー構造は`[要インスタンス確認][要公式確認]`）
- 出力データ：LINEメッセージ1件（成功時）、またはNotionページ（LINE送信失敗時のフォールバック）1件、または重複時はスキップ
- 前提条件：`httpBearerAuth`Credential（LINE Messaging APIチャネルアクセストークン想定）および`notionApi`Credential（フォールバック用）が利用可能であること。フォールバック用Notionの格納先`page_id`（旧：`database_id`）が確定していること。【2026-08-10更新】LINE送信先（`to`のuserIdまたはbroadcast可否）は、社長より「『コウキAIラボ』公式LINEは自分以外登録しておらず、ほかの人が登録することは今後もありません」との回答を得たため、ジンの判断でBroadcast Message方式（`to`不要）へ確定した。これにより前提条件から除外した。【2026-08-10更新②】フォールバック格納先は、ジンが社長の正式承認を経ずに作成したNotionページ「n8nエラー通知フォールバックログ」（page id: `3b7040888e97815bbc0ee2441ab6c316`）を暫定値として設定した。ただしこのページを恒久的な格納先として採用することについて社長の正式承認は別途必要であり、前提条件としては「未確定」から「暫定値設定済み・社長承認待ち」へ状態が変わったのみで、完全に解消したわけではない。
- 利用サービス：LINE Messaging API（`https://api.line.me/v2/bot/message/broadcast`、主経路。2026-08-10、PushからBroadcastへ変更）、Notion API（`https://api.notion.com/v1/pages`、フォールバック）
- 必要Credential：`httpBearerAuth`種別（用途：LINE Broadcast Message送信。既存Credential「Bearer Auth account」（id: `QpSnEXPfPjtBKSVD`）について、2026-08-10に社長ご本人から「以前連携したやつで確実に正しい」との直接確認を得て、対象Credentialの識別は一次情報として確定した。ただし、このCredentialが保持するトークンが実際に有効かどうかというn8n側の技術的動作確認〔＝n8n UI上でのテスト送信によりLINEに実際に届くかの確認〕は識別確認とは別軸であり、未実施のまま残っている。詳細は「リスク・注意点」節参照）、`notionApi`種別（用途：フォールバック時のエラー通知ページ作成）
- 実行頻度：不定期（対象ワークフローの失敗時のみ）
- 想定件数：`[要確認/社長]`（対象ワークフロー数・失敗頻度による）
- 最大件数：`[未確認]`
- 想定実行時間：数秒程度（LINE API呼び出し1回、失敗時はNotion API呼び出しが追加で1回）
- 許容遅延：`[要確認/社長]`（LINE Broadcast Messageへの切替により即時性は改善する見込みだが、Credentialの技術的な疎通確認が完了するまでは実質Notionフォールバックのみが動作する可能性がある。9節参照）
- エラー時の対応：LINE送信・Notion書き込みの両方が失敗した場合の三次通知手段は現状ない（既知のリスク、下記「リスク・注意点」参照）。
- 手動対応への切替条件：LINE・Notionいずれの書き込みも継続的に失敗する場合、n8nの実行履歴を手動で定期確認する運用に切り替える。
- ログ方針：LINE送信成功時はLINE側に、失敗時はNotionページに記録。加えてn8n標準実行ログにも自動的に残る。
- 保存期間：`[要確認/社長]`
- 個人情報の有無：エラーメッセージ・ノード名に個人情報が含まれる可能性は低いと想定するが、対象ワークフローの実装次第では含まれ得る（`[要確認]`、呼び出し元の設計次第）。
- 監視項目：本ワークフロー自体の実行失敗率（メタ的な監視が必要。現状は未実装）
- 成功条件：LINE APIまたは（フォールバック時）Notion APIから200番台のレスポンスを受け取ること
- KPI：`[要確認/社長]`
- ロールバック方法：対象ワークフローのError Workflow設定を解除する（本ワークフローへの依存を切る）。LINE経路のみ無効化したい場合は、`LINE - Broadcast通知送信`ノードを無効化し`IF: LINE送信失敗判定`の分岐先を強制的にNotionフォールバックのみにする（個別対応、本ドラフト未実装）。
- 変更履歴：2026-08-09 v1（ドラフト作成、エイト）／2026-08-09 v2（社長回答「名前が『コウキAIラボ』の公式LINE」を反映し、LINE Push Messageを主経路として実装。Notionはフォールバックへ変更、エイト）／2026-08-10 v3（社長より「Bearer Auth account（id: QpSnEXPfPjtBKSVD）は以前連携したやつで確実に正しい」との直接確認を得たため、Credential識別に関する条件付き承認事項を解消。技術的な動作確認（n8n UI上での実送信テスト）と送信先userId/broadcast方式の確定は引き続き未完了。ドキュメント更新のみ、ワークフローJSON構造の変更なし、エイト）／2026-08-10 v4（社長より「『コウキAIラボ』公式LINEは自分以外登録しておらず、ほかの人が登録することは今後もありません」との回答を得て、ジンの判断でLINE送信ノードをPush Message（`to`必須）からBroadcast Message（`to`不要、`POST https://api.line.me/v2/bot/message/broadcast`）へ変更。`lineTargetTo`プレースホルダーおよび関連するSticky Note記述を削除・更新し、送信先未確定の未確認事項を解消。`LINE送信結果判定`ノードもBroadcastResponse（空オブジェクト）の仕様に合わせて簡素化。エイト）／2026-08-10 v5（ジンが社長の正式承認を経ずに作成したNotionページ「n8nエラー通知フォールバックログ」（page id: `3b7040888e97815bbc0ee2441ab6c316`）の実在を読み取り専用GETで確認。これがNotionデータベースではなく通常ページであることを踏まえ、Notion公式APIドキュメント「Create a page」（`https://developers.notion.com/reference/post-page`、2026-08-10参照）に基づき、`com002-build-notion-page`／`com002-http-notion-create`ノードの`parent`を`{ database_id: ... }`から`{ page_id: ... }`へ修正し、page_id parentでは使用できないselectプロパティ（事業/カテゴリ/種別）をpropertiesから削除してchildren本文へ移設。あわせて`destinationDatabaseId`を`destinationParentPageId`へ改名し、値を上記ページIDへ暫定設定（社長の正式承認は別途必要）。エイト）

## 案の比較（最低2案）

### 通知経路の1次案比較（当初版）

| 観点 | 案A（Notionページ作成） | 案B（Google Sheets追記） |
|---|---|---|
| 開発工数 | 低（既存Notion連携パターンを流用） | 低（既存Google Sheets Credentialを流用） |
| 月額費用 | 追加費用なし | 追加費用なし |
| 保守性 | 高（他のコンテンツ系ワークフローと同じNotion API実装パターン） | 中（別サービスの実装パターンが増える） |
| 拡張性 | 高（Notionページに任意のプロパティ・本文を追加しやすい） | 中（スプレッドシートの列構造に縛られる） |
| 安定性 | 既存Credential・既存API実装パターンあり | 既存Credential・既存API実装パターンあり |
| セキュリティ | 同等 | 同等 |
| ベンダーロックイン | Notion依存 | Google Sheets依存 |
| 障害時の影響 | Notion障害時は通知不能 | Google障害時は通知不能（両案とも単一障害点が残る） |
| 必要スキル | Notion APIのブロック構造理解 | スプレッドシート操作の理解 |

当初は案A（Notionページ作成）を採用していたが、いずれも「能動的なプッシュ通知」ではない点（鈴木さんが自発的に見に行く必要がある）が共通の弱点だった。

### 【2026-08-09追記】社長回答を受けた通知経路の再設計

社長から通知先＝「名前が『コウキAIラボ』の公式LINE」と直接回答があったため、LINE Messaging APIのPush Message送信を組み込む設計に変更した。ただしCredential紐付け・送信先userIdが技術的に未確認のため、Notion通知を完全に削除せず、以下3案を比較した。

| 観点 | 案1（推奨・LINE主経路＋Notionフォールバック） | 案2（両論併記：LINEとNotionを常に並行実行） | 案3（LINEのみ、Notion完全削除） |
|---|---|---|---|
| 社長の指示との整合性 | 高（LINEを主、Notionは保険として残す） | 中（指示にない二重通知が常態化） | 高いが、Credential未確定のリスクをそのまま抱える |
| Credential未確定時の挙動 | 自動的にNotionへフォールバックし、通知が失われない | 常にNotionにも記録が残るため未確定時も安全 | LINE送信が失敗すると通知が一切残らない（重大リスク） |
| 開発工数 | 中（IF分岐1つ追加） | 低（分岐不要、両方実行するだけ） | 低（Notion経路を削除するだけ） |
| 運用時のノイズ | 低（LINE成功時はNotionにログが残らない） | 高（LINE成功時もNotionに毎回ページが作られる） | 低 |
| 障害時の影響 | LINE・Notion両方が同時に落ちない限り通知は届く | 同左（さらに頑健） | LINE単一障害点になる（Notionという保険を失う） |
| 将来のCredential確定後の変更コスト | 低（Notion経路はそのまま残るので削除は任意） | 低 | 該当なし（既に削除済みのため） |

**推奨案とその理由：** 案1（LINE主経路＋Notionフォールバック）を採用した。理由：(1) 社長の回答はLINEを主たる通知先とする指示であり、これを尊重する。(2) 一方でLINE側のCredential紐付け・送信先userIdが技術的に未確認のため、案3（Notion完全削除）を選ぶと、確認が完了するまでの間エラー通知が一切残らない空白期間が生じる。これは`.claude/rules/risk-classification.md`的な考え方（＝二次通知手段が無い状態を避ける）に反するため回避した。(3) 案2（常に並行実行）はより頑健だが、LINE送信が正常に機能するようになった後もNotionに毎回ノイズとなるページが作られ続ける点が運用上望ましくない。以上より、LINE送信が失敗した場合にのみNotionへフォールバックする案1を実装した（`IF: LINE送信失敗判定`ノード）。Credential・送信先が確定し、LINE送信の安定稼働が確認できた段階で、Notionフォールバック経路を残すか削除するかを改めて社長に確認することを推奨する。

### 【2026-08-10追記】送信先確定：Push MessageからBroadcast Messageへの切替

社長より「『コウキAIラボ』公式LINEは自分以外登録しておらず、ほかの人が登録することは今後もありません」との明確な回答を得た。この事実を踏まえ、ジンの判断で送信方式をPush Message（`to`にuserId等の識別子1件が必須）からBroadcast Message（`to`不要、このLINE公式アカウントの友だち全員へ送信）へ切り替えた。

| 観点 | Push Message（従来） | Broadcast Message（採用） |
|---|---|---|
| `to`パラメータ | 必須（送信先userIdが要る） | 不要 |
| 前提条件 | 社長のLINEユーザーIDの特定が必要（未確定のまま残っていた） | 友だち全員へ送信するため送信先の個別特定が不要 |
| 実装の複雑さ | 高（userId取得・設定ノードでの保持が必要） | 低（`lineRequestBody`から`to`フィールドを削除するだけ） |
| 本件での結果の同一性 | — | 友だちが社長1名のみと確認済みのため、実質的な配信結果はPush方式でuserIdを正しく指定した場合と同一 |
| 将来友だちが増えた場合のリスク | 該当なし | 友だちが増えた場合は全員に配信されるため、将来的に別の登録者が生じた場合は方式の見直しが必要（現時点では社長より「今後も登録されない」との回答済み） |

エンドポイント・リクエストボディ仕様（`POST https://api.line.me/v2/bot/message/broadcast`、`messages`のみ必須で1〜5件、`to`は存在しない、任意の`notificationDisabled`あり）はLINE公式OpenAPI定義（`github.com/line/line-openapi`、`messaging-api.yml`、`BroadcastRequest`/`BroadcastResponse`スキーマ、2026-08-10参照）で確認済み。`BroadcastResponse`は`PushMessageResponse`と異なり空オブジェクト（`sentMessages`配列を持たない）であるため、`LINE送信結果判定`ノードの成功判定ロジックもあわせて簡素化した（詳細は「ノード構成」表・ワークフローJSONの当該ノードのnotes参照）。

この変更により、AUTO-COM-002の未確認事項のうち「LINE送信先（`to`のuserIdまたはbroadcast可否）」は解消された。ただし、Notionフォールバック格納先の`database_id`（`[要確認/社長]`）、Error Triggerの正確なtypeVersion・出力構造（`[要インスタンス確認][要公式確認]`）、`continueOnFail`時のエラー格納形式（`[要インスタンス確認]`）等、本ワークフロー固有の他の未確認事項は本変更のスコープ外であり、引き続き未解消のまま残っている（詳細は「分類」節参照）。

## 技術観点チェック

- [x] 冪等性：`getWorkflowStaticData('global')`に処理済み(execution ID + ノード名)のキーを保持し、同一失敗の重複処理を防止。
- [x] 二重実行防止：上記と同じ仕組みで対応。
- [x] 入力値検証：Error Triggerの出力フィールドが無い場合のフォールバック値（'[不明なワークフロー]'等）を用意。
- [x] データ型統一：文字列に統一して整形。
- [x] タイムゾーン明示：JST表示（`Intl`/`toLocaleString('ja-JP', {timeZone:'Asia/Tokyo'})`使用。ICUデータ依存のためフォールバックも実装）。
- [x] 日付形式統一：`occurredAtJst`として統一。
- [ ] ページネーション：対象外。
- [ ] バッチ処理：対象外（1件ずつ処理）。
- [ ] レート制限：LINE・Notion双方のAPIレート制限は個別確認していない（`[未確認]`）。エラー多発時に本ワークフロー自体が大量実行される可能性は考慮していない（既知の残課題）。
- [ ] タイムアウト：HTTP Requestノードのデフォルト挙動に依存（明示的なtimeout未設定、既知の簡易実装）。
- [ ] リトライ条件：LINE送信・Notion書き込みいずれも失敗時のリトライは未実装（`continueOnFail`のみで、失敗はそのまま許容する設計。理由：エラーハンドラー自体が無限リトライループに陥るリスクを避けるため、あえてリトライを入れていない。LINE送信の失敗は代わりにNotionフォールバックへ分岐する設計で代替）。
- [ ] 指数バックオフ：対象外（リトライ自体が無いため）。
- [ ] リトライ不可能なエラーの分類：未実装。
- [ ] 部分失敗時の処理：対象外（単一メッセージ／単一ページ作成のみ）。
- [ ] 補償処理：対象外。
- [x] エラーワークフロー：本ワークフロー自体にはError Workflowを設定しない（無限ループ防止のため意図的に未設定とする設計判断）。
- [x] 通知：LINE Broadcast Message（2026-08-10、Pushから変更）を主経路、Notionページ作成をフォールバックとする2段構成（`IF: LINE送信失敗判定`ノードで分岐。詳細は「案の比較」節参照）。
- [x] ログ：LINE送信成功時はメッセージ本文のみ簡易記録、フォールバック時はNotionページ本文に詳細を記録。
- [ ] 監視：`[要確認/社長]`
- [x] 処理コスト：LINE API呼び出し1回、失敗時はNotion API呼び出しが追加で1回（いずれも無料枠内と想定、正確な料金体系は今回未確認）。
- [x] 実行データの保存方針：`[要確認/社長]`
- [x] 個人情報のマスキング：対象ワークフローのエラーメッセージにそのまま個人情報が含まれていた場合、マスキングせずNotionに転記してしまうリスクがある（`[要確認]`、現状未対応の既知リスク）。
- [x] 認証情報の分離：Credential実IDはJSONに含めていない。
- [x] テスト環境と本番環境の分離：`[実行環境なしのため未テスト]`

## ノード構成（ドラフト・2026-08-10 v5）

| ノード名 | 役割 | 種別 | type / typeVersion | 備考 |
|---|---|---|---|---|
| Error Trigger | エラーワークフローの起点 | 公式（type文字列のみ確認済み） | `n8n-nodes-base.errorTrigger` / 1 `[要インスタンス確認][要公式確認]` | 公式ドキュメントページタイトルで文字列は確認、typeVersion・出力構造は未確認 |
| エラー情報整形＋冪等性チェック | フィールド抽出・重複判定 | Code | `n8n-nodes-base.code` / 2（確認済み） | |
| IF: 重複チェック | 重複ならスキップ | 公式（確認済み） | `n8n-nodes-base.if` / 2.2（確認済み） | |
| 設定：通知先（Notionフォールバック格納先は暫定値・社長の正式承認は未了） | `destinationParentPageId`（旧`destinationDatabaseId`）の保持。値はジン作成ページのid `3b7040888e97815bbc0ee2441ab6c316` を暫定設定（`lineTargetTo`は2026-08-10のBroadcast切替に伴い削除） | Set | `n8n-nodes-base.set` / 3.4（確認済み） | |
| LINE通知メッセージ本文生成 | Broadcast Messageリクエストボディ構築（`to`不要） | Code | `n8n-nodes-base.code` / 2（確認済み） | LINE公式OpenAPI定義（BroadcastRequest、2026-08-10参照）に基づく |
| LINE - Broadcast通知送信 | LINE Messaging API Broadcast Message呼び出し（2026-08-10、Pushから変更） | HTTP | `n8n-nodes-base.httpRequest` / 4.2（確認済み） | `POST https://api.line.me/v2/bot/message/broadcast`。`authentication: genericCredentialType` / `genericAuthType: httpBearerAuth`はn8n公式ドキュメントの記述に基づくが本インスタンス実例は未確認 `[要インスタンス確認]`。credentials未割当。`continueOnFail: true` |
| LINE送信結果判定 | 成功/失敗の正規化（2026-08-10、BroadcastResponseが空オブジェクトである仕様に合わせ簡素化） | Code | `n8n-nodes-base.code` / 2（確認済み） | `continueOnFail`時のエラー格納形式は未確認のため防御的実装 `[要インスタンス確認]` |
| IF: LINE送信失敗判定 | 失敗ならNotionフォールバックへ | 公式（確認済み） | `n8n-nodes-base.if` / 2.2（確認済み） | |
| Notion通知ページ本文生成（フォールバック） | properties（title型のみ）/children構築（2026-08-10、parent=page_idへ修正に伴いselectプロパティを本文へ移設） | Code | `n8n-nodes-base.code` / 2（確認済み） | Notion公式ドキュメント「Create a page」（2026-08-10参照）に基づく |
| Notion - エラー通知ページ作成（フォールバック） | Notionページ作成（`parent: { page_id: ... }`、2026-08-10修正） | HTTP | `n8n-nodes-base.httpRequest` / 4.2（確認済み） | credentials未割当 |
| NoOp: 完了（LINE通知成功） / NoOp: 完了（フォールバック：Notion通知試行済み） / NoOp: 完了（重複スキップ） | 終端 | 公式（未確認） | `n8n-nodes-base.noOp` / 1 `[要インスタンス確認]` | |

## Credentialマッピング表

| ワークフロー内の参照名 | 用途 | 実在するCredential名（ユーザー確認後に記入） |
|---|---|---|
| `httpBearerAuth`（未割当） | LINE Messaging API Broadcast Message送信（2026-08-10、Push Messageから変更） | 既存Credential「Bearer Auth account」（種別`httpBearerAuth`、id: `QpSnEXPfPjtBKSVD`、2026-08-09監査で存在確認済み）。**識別は2026-08-10に社長ご本人から「以前連携したやつで確実に正しい」との直接確認を得て一次情報として確定した。**ただし、このCredentialが実際に正しいチャネルアクセストークンを保持しているか（＝n8n側でトークンが有効に機能するか）は識別確認とは別軸の技術的事項であり、n8n UI上でのテスト送信による動作確認は未実施のまま（本番投入前に実施すること。手順はワークフローJSONのSticky Note参照）。実値は記載していない |
| `notionApi`（未割当） | エラー通知ページ作成（LINE送信失敗時のフォールバック） | 既存Credential「Notion - n8n」（種別`notionApi`、2026-08-09監査で存在確認済み。実IDは記載していない） |

## 分類

- **確認済み事実**：社長より通知先＝「名前が『コウキAIラボ』の公式LINE」との直接回答あり（一次情報として確定）。`notionApi`・`httpBearerAuth`（`Bearer Auth account`、id: `QpSnEXPfPjtBKSVD`）Credentialが1件ずつ存在（出典：`logs/common_2026-08-09_n8n実装_第2弾_v1.md`）。既存本番ワークフローがNotionページ/DB書き込みにHTTP Request＋`notionApi`を使う実装パターンを採用（出典：`logs/common_2026-08-09_n8n実環境監査_v1.md`）。`httpBearerAuth`Credential（`Bearer Auth account`、id: `QpSnEXPfPjtBKSVD`）が今回のLINE通知用として正しいCredentialであることについて、社長ご本人から「以前連携したやつで確実に正しい」との直接確認を得た（2026-08-10、一次情報として確定）。**【2026-08-10追記】社長より「『コウキAIラボ』公式LINEは自分以外登録しておらず、ほかの人が登録することは今後もありません」との直接回答を得た（一次情報として確定）。これを受け、送信方式をPush MessageからBroadcast Message（`POST https://api.line.me/v2/bot/message/broadcast`、`messages`のみ必須で1〜5件、`to`不要、認証はBearer＝チャネルアクセストークン）へ変更した。エンドポイント・リクエストボディ・レスポンス（`BroadcastRequest`／`BroadcastResponse`はいずれもPushMessage系と異なりレスポンスは空オブジェクト）はLINE公式OpenAPI定義（`github.com/line/line-openapi`、`messaging-api.yml`、2026-08-10参照）で確認済み。**
- **現在の仮定**：Error Triggerの出力に`workflow.name`/`execution.id`等に類する情報が含まれる（n8n一般的な仕様として認識しているが本インスタンスでの実例未確認のため仮定に留める）。`httpBearerAuth`Credential（`Bearer Auth account`）がこのLINEアカウント用であるという識別自体はもはや仮定ではなく確認済み事実（上記参照）に格上げされた。一方、「このCredentialが実際に有効なチャネルアクセストークンを保持しており、n8n実行時にLINEへ正しく送信できる」という技術的な動作可否は、社長の識別確認とは別軸の未検証事項として引き続き仮定にとどまる（識別確認＝どのCredentialかという人間側の認識の正しさ、動作確認＝そのCredentialが技術的に機能するかという別問題であり、前者の確定は後者を保証しない）。本番投入前に必ずn8n UI上でのテスト送信により最終確認すること。友だちが社長1名のみで今後も増えない、という前提はあくまで2026-08-10時点の社長回答に基づく仮定であり、将来的に状況が変わった場合はBroadcast方式の妥当性を再確認する必要がある。
- **未確認事項**：Error Triggerの正確なtypeVersion・出力データ構造（`[要インスタンス確認][要公式確認]`）／LINE text messageの正確な文字数上限（`[要公式確認]`、本ドラフトは安全側に1900文字で切り詰め）／n8n HTTP Requestノードの`genericCredentialType`＋`genericAuthType: httpBearerAuth`というパラメータ名の組み合わせが本インスタンスで実際に機能するか（`[要インスタンス確認]`）／`continueOnFail`時のエラー情報の正確な格納形式（`[要インスタンス確認]`、従来からの既知の未確認事項）／〔識別確認済み・動作未確認〕`httpBearerAuth`Credentialが実際に有効なLINEチャネルアクセストークンを保持しているかのn8n UI上での実送信テスト（`[要インスタンス確認]`、Sticky Noteの確認手順参照）。**【2026-08-10解消】LINE送信先（`to`のuserIdまたはbroadcast可否）は、Broadcast Message方式への切替により解消された（下記「未確認事項」からは除外）。** **【2026-08-10更新】エラーログ（フォールバック時）の格納先は、`database_id`前提の未確定状態から、`page_id`前提（ジン作成ページ、id: `3b7040888e97815bbc0ee2441ab6c316`）の暫定値設定済み状態へ変わった。ただしこのページを恒久的な格納先として採用することについて社長の正式承認は取得していないため、完全な解消ではなく「暫定値あり・社長承認待ち」として引き続き未確認事項に位置づける。これに伴い、旧課題だった『Notion側selectプロパティへの新規値追加がAPI経由で自動的に可能か』は、properties内のselectプロパティ自体を廃止（本文へ移設）したため論点として解消された。**

## リスク・注意点（設計書固有の追記）

1. **LINE Credentialの識別は確認済み・技術的な動作確認は未実施**：`httpBearerAuth`Credential（`Bearer Auth account`、id: `QpSnEXPfPjtBKSVD`）が今回のLINE通知用として正しいCredentialであることは、2026-08-10に社長ご本人から「以前連携したやつで確実に正しい」との直接確認を得ており、一次情報として確定した。この条件付き承認事項（従来「n8n UI上での実機確認が必要」としていたもの）はこれにより解消された。ただし、**社長による識別確認と、n8n側の技術的な動作確認（このCredentialが保持するトークンが実際に有効で、Broadcast Message送信がLINEに正しく届くか）は別軸の事項**である点は変わらず残る。値を見ずには技術的な有効性までは判別できないため、本番投入前には必ずn8n UI上でテスト送信を行い、実際にLINEへメッセージが届くことを確認すること（手順はワークフローJSONのSticky Note参照）。この技術確認を過信して省略しないこと。**現時点で本ワークフロー固有の未確認事項のうち、これが唯一の「実際に試してみないと判断できない」項目である。**
2. **【2026-08-10解消】送信先userId未確定**：従来はLINE Push Messageが`to`に単一の送信先ID（userId等）を必須としており未確定のまま残っていたが、社長より「『コウキAIラボ』公式LINEは自分以外登録しておらず、ほかの人が登録することは今後もありません」との回答を得たため、`to`が不要なBroadcast Messageへ切り替えて解消した。友だちが将来増えた場合はBroadcast方式の妥当性を再確認する必要がある点は残存リスクとして認識しておく。
3. **Notionフォールバックのログ格納先は暫定値設定済み・社長の正式承認は未了**：【2026-08-10更新】ジンが社長の正式承認を経ずに作成したNotionページ「n8nエラー通知フォールバックログ」（page id: `3b7040888e97815bbc0ee2441ab6c316`）の実在を読み取り専用GETで確認し、これを`destinationParentPageId`の暫定値として設定した（parent形式も`page_id`へ修正済み）。これにより「格納先が完全未確定でフォールバック自体が機能しない」という従来のリスクは後退したが、**このページを恒久的な格納先として採用することについて社長の正式承認は別途必要**であり、本番登録（`n8n-deploy`）前に確認すること。当初版の3案（新規DB作成／既存📚ナレッジDB活用／Google Sheets）についても、社長が別案を選好する可能性は残るため、「案の比較」節の内容は参考情報として残す。
4. **単一障害点の残存**：LINE・Notion双方が同時に利用不能になった場合の三次通知手段はない。
5. **通知内容の情報量差**：LINEメッセージは文字数制約から詳細を絞ったサマリーのみ、Notionフォールバックは従来通り詳細な本文を記録する。フォールバック発動時のほうが情報量が多い非対称な設計である点は運用上の注意点として認識しておく。
6. **Error Trigger・continueOnFail等の構造的な未確認事項**：Error Triggerの正確なtypeVersion・出力データ構造、`continueOnFail`使用時のエラー格納形式、`genericCredentialType`＋`genericAuthType: httpBearerAuth`の組み合わせが本インスタンスで実際に機能するかは、いずれも本インスタンスでの実例が無く未確認のまま（`[要インスタンス確認][要公式確認]`）。これらはワークフロー実行時に初めて判明する性質のものであり、本番投入前のテスト実行（`n8n-test`スキル相当のステージング検証）で確認することが望ましい。
