# T28 リスペクトマリン案件：デモ用n8nワークフローJSON実装（①④⑤メール版）

- 案件：T11系列（コホマダAI／TSUNAGU × ブラジル・サントス拠点 船舶検査会社案件）
- 担当：エイト（n8n実装エンジニア）
- 作成日：2026-07-28
- ステータス：Draft（未検証・n8n本番未接続・Credential未登録）

> 本番のカスタムAPI（案件・承認ステータス管理）が未実装、かつ契約・ディスカバリーコールも未実施のため、ダミートリガー・ダミーデータで動くデモ用ワークフローとして実装。実インスタンスへの接続・実行・検証は一切行っていない。本番投入前に必ず社長の承認と実インスタンスでの検証が必要。

## 結論

3件（①マネージャー承認依頼通知、④新規案件登録通知、⑤クライアント共有メール下書き作成〔メール限定版〕）のデモ用n8nワークフローJSONを作成した。トリガーはすべてWebhookノード（テスト用・ダミーペイロード付き）、案件データはSetノードでダミー値を埋め込み、メール送信元はGmailノードに統一（下書き作成機能がGmail APIの概念のため）。Credentialは未設定のプレースホルダー。ノードの`type`文字列はn8n公式ドキュメントで確認できた範囲に基づくが、`typeVersion`と一部パラメータの内部キー名は`[要インスタンス確認]`。

## 確認済み事実（n8n公式ドキュメント、確認日2026-07-28）

- Webhookノード：`n8n-nodes-base.webhook`（推定）。主要パラメータ：HTTP Method、Path、Respond、Response Code等。
- Edit Fields (Set)ノード：`n8n-nodes-base.set`（推定）。Mode（Manual Mapping/JSON Output）等。
- Ifノード：詳細スキーマの明記は限定的。
- Send Email（SMTP）ノード：`n8n-nodes-base.sendemail`。Operationは「Send」「Send and Wait for Response」（Approval/Free Text/Custom Form）。
- Gmailノード：下書き作成はResource＝「Draft」、Operation＝「Create」。
- Gmailノードの「Send and Wait for Approval」：Resource＝「Message」、Operation＝「Send and Wait for Approval」。承認/却下ボタンのカスタマイズ可。
- Manual Triggerノードの単独ドキュメントは404。存在自体は一般に知られた情報に基づく推定。
- いずれのページにも`typeVersion`の具体的数値の記載なし。

## 推測・仮説

- 本番メール基盤はGmailと仮定（T27時点で未確定）。汎用SMTPの場合は下書き機能がないため要再設計。
- `operation`/`resource`/`approvalOptions`等の内部キー名はドキュメントの説明文からの逆算推定であり、実際のJSONスキーマと異なる可能性。
- `typeVersion`は妥当と思われる暫定値（1〜3系）。

## ワークフロー①：報告書ドラフト完成時のマネージャー承認依頼通知

目的：ドラフト完成イベント（Webhookでダミー受信）→マネージャーへ承認依頼メール（Gmail Send and Wait for Approval）→承認/差し戻し分岐→（本番連携ポイントはNoOp/無効化HTTP Requestでプレースホルダー化）。

テスト用ダミーペイロード：
```json
{
  "vesselName": "[サンプル船舶]",
  "inspectionType": "Bunker",
  "reportId": "DEMO-0001",
  "draftUrl": "https://example.com/dummy-files/report-draft-demo.pdf",
  "managerEmail": "manager-placeholder@example.com"
}
```

ワークフローJSON：
```json
{
  "name": "【デモ】①報告書ドラフト完成時のマネージャー承認依頼通知",
  "nodes": [
    {
      "id": "n1",
      "name": "Webhook: ドラフト完成通知(デモ)",
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 2,
      "position": [240, 300],
      "notes": "[要インスタンス確認] typeVersion。本番ではカスタム側の「ドラフト完成」イベントを受信する想定のテスト用Webhook。",
      "parameters": {
        "httpMethod": "POST",
        "path": "demo-draft-completed",
        "responseMode": "onReceived",
        "options": {}
      }
    },
    {
      "id": "n2",
      "name": "Set: ダミー案件データ",
      "type": "n8n-nodes-base.set",
      "typeVersion": 3.4,
      "position": [460, 300],
      "notes": "[要インスタンス確認] typeVersion・assignments構造。受信データが空でもデモが動くよう既定値をフォールバックで埋める。",
      "parameters": {
        "mode": "manual",
        "assignments": {
          "assignments": [
            { "id": "a1", "name": "vesselName", "type": "string", "value": "={{ $json.body?.vesselName || $json.vesselName || '[サンプル船舶]' }}" },
            { "id": "a2", "name": "inspectionType", "type": "string", "value": "={{ $json.body?.inspectionType || $json.inspectionType || 'Bunker' }}" },
            { "id": "a3", "name": "reportId", "type": "string", "value": "={{ $json.body?.reportId || $json.reportId || 'DEMO-0001' }}" },
            { "id": "a4", "name": "draftUrl", "type": "string", "value": "={{ $json.body?.draftUrl || $json.draftUrl || 'https://example.com/dummy-files/report-draft-demo.pdf' }}" },
            { "id": "a5", "name": "managerEmail", "type": "string", "value": "={{ $json.body?.managerEmail || $json.managerEmail || 'manager-placeholder@example.com' }}" }
          ]
        },
        "options": {}
      }
    },
    {
      "id": "n3",
      "name": "IF: 必須項目チェック",
      "type": "n8n-nodes-base.if",
      "typeVersion": 2.2,
      "position": [680, 300],
      "notes": "[要インスタンス確認] typeVersion・conditions内部スキーマ",
      "parameters": {
        "conditions": {
          "options": { "caseSensitive": true, "typeValidation": "strict" },
          "combinator": "and",
          "conditions": [
            { "id": "c1", "leftValue": "={{ $json.vesselName }}", "rightValue": "", "operator": { "type": "string", "operation": "notEmpty", "singleValue": true } },
            { "id": "c2", "leftValue": "={{ $json.reportId }}", "rightValue": "", "operator": { "type": "string", "operation": "notEmpty", "singleValue": true } }
          ]
        },
        "options": {}
      }
    },
    {
      "id": "n4",
      "name": "NoOp: エラー(必須項目欠落)",
      "type": "n8n-nodes-base.noOp",
      "typeVersion": 1,
      "position": [900, 460],
      "notes": "本番では検査員・管理者へのエラー通知に置き換える想定のプレースホルダー",
      "parameters": {}
    },
    {
      "id": "n5",
      "name": "Gmail: マネージャー承認依頼(Send and Wait)",
      "type": "n8n-nodes-base.gmail",
      "typeVersion": 2.1,
      "position": [900, 200],
      "notes": "[要インスタンス確認] typeVersion・operation/approvalOptionsの正確なキー名。Credential未設定。",
      "parameters": {
        "resource": "message",
        "operation": "sendAndWaitForApproval",
        "sendTo": "={{ $json.managerEmail }}",
        "subject": "=[承認依頼] 検査報告書ドラフト確認 - {{ $json.vesselName }} ({{ $json.reportId }})",
        "message": "=案件: {{ $json.vesselName }}\n検査種別: {{ $json.inspectionType }}\n報告書ID: {{ $json.reportId }}\nドラフトURL: {{ $json.draftUrl }}\n\n内容をご確認の上、承認または差し戻しをお願いします。",
        "approvalOptions": { "values": { "approvalType": "both" } },
        "options": {}
      },
      "credentials": {
        "gmailOAuth2": { "id": "PLACEHOLDER_GMAIL_OAUTH2_CREDENTIAL_ID", "name": "[要設定] Gmail OAuth2 認証情報（未登録）" }
      }
    },
    {
      "id": "n6",
      "name": "IF: 承認結果判定",
      "type": "n8n-nodes-base.if",
      "typeVersion": 2.2,
      "position": [1120, 200],
      "notes": "[要インスタンス確認] Send and Wait再開後にn8nが返すフィールド名（例: $json.data.approved）は未確認。",
      "parameters": {
        "conditions": {
          "options": { "caseSensitive": true, "typeValidation": "loose" },
          "combinator": "and",
          "conditions": [
            { "id": "c1", "leftValue": "={{ $json.data?.approved ?? $json.approved }}", "rightValue": true, "operator": { "type": "boolean", "operation": "equal" } }
          ]
        },
        "options": {}
      }
    },
    { "id": "n7", "name": "NoOp: 承認済み(本番連携ポイント)", "type": "n8n-nodes-base.noOp", "typeVersion": 1, "position": [1340, 100], "notes": "本番では「承認後のPDF生成トリガー」ワークフローへの連携ポイント（今回はスコープ外・未実装）", "parameters": {} },
    { "id": "n8", "name": "NoOp: 差し戻し(本番連携ポイント・スコープ外)", "type": "n8n-nodes-base.noOp", "typeVersion": 1, "position": [1340, 300], "notes": "本番では検査員への差し戻し通知に接続する想定（今回はスコープ外・未実装）", "parameters": {} },
    {
      "id": "n9",
      "name": "HTTP Request: カスタムAPIへステータス反映(無効化・将来用)",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [1560, 200],
      "disabled": true,
      "notes": "カスタム側の案件・承認ステータスAPIが未実装のため無効化(disabled:true)。本番化時はURL・認証・メソッドを実仕様に合わせて設定してから有効化する。",
      "parameters": { "method": "POST", "url": "https://YOUR-BACKEND-API.example.com/matters/{{ $json.reportId }}/status", "sendBody": true, "options": {} }
    }
  ],
  "connections": {
    "Webhook: ドラフト完成通知(デモ)": { "main": [[{ "node": "Set: ダミー案件データ", "type": "main", "index": 0 }]] },
    "Set: ダミー案件データ": { "main": [[{ "node": "IF: 必須項目チェック", "type": "main", "index": 0 }]] },
    "IF: 必須項目チェック": { "main": [ [{ "node": "Gmail: マネージャー承認依頼(Send and Wait)", "type": "main", "index": 0 }], [{ "node": "NoOp: エラー(必須項目欠落)", "type": "main", "index": 0 }] ] },
    "Gmail: マネージャー承認依頼(Send and Wait)": { "main": [[{ "node": "IF: 承認結果判定", "type": "main", "index": 0 }]] },
    "IF: 承認結果判定": { "main": [ [{ "node": "NoOp: 承認済み(本番連携ポイント)", "type": "main", "index": 0 }], [{ "node": "NoOp: 差し戻し(本番連携ポイント・スコープ外)", "type": "main", "index": 0 }] ] },
    "NoOp: 承認済み(本番連携ポイント)": { "main": [[{ "node": "HTTP Request: カスタムAPIへステータス反映(無効化・将来用)", "type": "main", "index": 0 }]] },
    "NoOp: 差し戻し(本番連携ポイント・スコープ外)": { "main": [[{ "node": "HTTP Request: カスタムAPIへステータス反映(無効化・将来用)", "type": "main", "index": 0 }]] }
  },
  "active": false,
  "settings": { "executionOrder": "v1" },
  "pinData": {}
}
```

ダミー部分：Webhookトリガー／Setノードの全フィールド／managerEmailの既定値／Gmail Credential（未設定）／承認後・差し戻し後のNoOpノード／末尾HTTP Requestノード（disabled:true）。

本番化する際の置き換えリスト：
1. Webhookをカスタム側の実イベント（またはポーリング）に差し替え、認証方式を設定
2. Setノードの既定値を削除
3. Gmail OAuth2 Credentialを実登録（またはメール基盤に応じ差し替え）
4. `IF: 承認結果判定`が参照するフィールド名を実インスタンスで確認
5. 末尾HTTP RequestのURL・認証設定後に`disabled:false`
6. typeVersionを実値に修正

## ワークフロー④：新規案件登録時の関係者通知

目的：案件登録イベント（Webhookでダミー受信）→検査員・マネージャーへ通知メール。

テスト用ダミーペイロード：
```json
{
  "caseId": "DEMO-CASE-0001",
  "vesselName": "[サンプル船舶]",
  "inspectionType": "Bunker",
  "scheduledDate": "2026-08-05",
  "inspectorEmail": "inspector-placeholder@example.com",
  "managerEmail": "manager-placeholder@example.com"
}
```

ワークフローJSON：
```json
{
  "name": "【デモ】④新規案件登録時の関係者通知",
  "nodes": [
    {
      "id": "n1", "name": "Webhook: 新規案件登録通知(デモ)", "type": "n8n-nodes-base.webhook", "typeVersion": 2, "position": [240, 300],
      "notes": "[要インスタンス確認] typeVersion。本番ではカスタム側の案件登録UIからのイベントを想定。",
      "parameters": { "httpMethod": "POST", "path": "demo-case-registered", "responseMode": "onReceived", "options": {} }
    },
    {
      "id": "n2", "name": "Set: ダミー案件データ", "type": "n8n-nodes-base.set", "typeVersion": 3.4, "position": [460, 300],
      "notes": "[要インスタンス確認] typeVersion・assignments構造",
      "parameters": {
        "mode": "manual",
        "assignments": { "assignments": [
          { "id": "a1", "name": "caseId", "type": "string", "value": "={{ $json.body?.caseId || $json.caseId || 'DEMO-CASE-0001' }}" },
          { "id": "a2", "name": "vesselName", "type": "string", "value": "={{ $json.body?.vesselName || $json.vesselName || '[サンプル船舶]' }}" },
          { "id": "a3", "name": "inspectionType", "type": "string", "value": "={{ $json.body?.inspectionType || $json.inspectionType || 'Bunker' }}" },
          { "id": "a4", "name": "scheduledDate", "type": "string", "value": "={{ $json.body?.scheduledDate || $json.scheduledDate || '2026-08-05' }}" },
          { "id": "a5", "name": "inspectorEmail", "type": "string", "value": "={{ $json.body?.inspectorEmail || $json.inspectorEmail || 'inspector-placeholder@example.com' }}" },
          { "id": "a6", "name": "managerEmail", "type": "string", "value": "={{ $json.body?.managerEmail || $json.managerEmail || 'manager-placeholder@example.com' }}" }
        ] },
        "options": {}
      }
    },
    {
      "id": "n3", "name": "IF: 必須項目チェック", "type": "n8n-nodes-base.if", "typeVersion": 2.2, "position": [680, 300],
      "notes": "[要インスタンス確認] conditions内部スキーマ",
      "parameters": { "conditions": { "options": { "caseSensitive": true, "typeValidation": "strict" }, "combinator": "and", "conditions": [
        { "id": "c1", "leftValue": "={{ $json.caseId }}", "rightValue": "", "operator": { "type": "string", "operation": "notEmpty", "singleValue": true } },
        { "id": "c2", "leftValue": "={{ $json.vesselName }}", "rightValue": "", "operator": { "type": "string", "operation": "notEmpty", "singleValue": true } }
      ] }, "options": {} }
    },
    { "id": "n4", "name": "NoOp: エラー(必須項目欠落)", "type": "n8n-nodes-base.noOp", "typeVersion": 1, "position": [900, 460], "parameters": {} },
    {
      "id": "n5", "name": "Gmail: 関係者へ登録通知", "type": "n8n-nodes-base.gmail", "typeVersion": 2.1, "position": [900, 200],
      "notes": "[要インスタンス確認] typeVersion。Credential未設定。宛先は複数（検査員・マネージャー）をカンマ区切りで指定。",
      "parameters": {
        "resource": "message", "operation": "send",
        "sendTo": "={{ $json.inspectorEmail }},{{ $json.managerEmail }}",
        "subject": "=[新規案件登録] {{ $json.vesselName }} ({{ $json.inspectionType }}) - {{ $json.scheduledDate }}",
        "message": "=新規案件が登録されました。\n\n案件ID: {{ $json.caseId }}\n船名: {{ $json.vesselName }}\n検査種別: {{ $json.inspectionType }}\n予定日: {{ $json.scheduledDate }}",
        "options": {}
      },
      "credentials": { "gmailOAuth2": { "id": "PLACEHOLDER_GMAIL_OAUTH2_CREDENTIAL_ID", "name": "[要設定] Gmail OAuth2 認証情報（未登録）" } }
    },
    {
      "id": "n6", "name": "HTTP Request: 登録完了ログ(無効化・将来用)", "type": "n8n-nodes-base.httpRequest", "typeVersion": 4.2, "position": [1120, 200],
      "disabled": true,
      "notes": "カスタム側APIが未実装のため無効化。本番化時にURL・認証を設定して有効化する。",
      "parameters": { "method": "POST", "url": "https://YOUR-BACKEND-API.example.com/cases/{{ $json.caseId }}/notification-log", "sendBody": true, "options": {} }
    }
  ],
  "connections": {
    "Webhook: 新規案件登録通知(デモ)": { "main": [[{ "node": "Set: ダミー案件データ", "type": "main", "index": 0 }]] },
    "Set: ダミー案件データ": { "main": [[{ "node": "IF: 必須項目チェック", "type": "main", "index": 0 }]] },
    "IF: 必須項目チェック": { "main": [ [{ "node": "Gmail: 関係者へ登録通知", "type": "main", "index": 0 }], [{ "node": "NoOp: エラー(必須項目欠落)", "type": "main", "index": 0 }] ] },
    "Gmail: 関係者へ登録通知": { "main": [[{ "node": "HTTP Request: 登録完了ログ(無効化・将来用)", "type": "main", "index": 0 }]] }
  },
  "active": false,
  "settings": { "executionOrder": "v1" },
  "pinData": {}
}
```

ダミー部分：Webhookトリガー、Setノードの全フィールド、Gmail Credential（未設定）、末尾HTTP Requestノード（disabled:true）。

本番化する際の置き換えリスト：
1. Webhookを案件登録UIの実イベントに差し替え
2. Setノードの既定値を削除
3. Gmail Credentialの本登録
4. 宛先ロジックを実際の関係者リスト取得に変更（現状は1件のダミー宛先のハードコードに近い）
5. 末尾HTTP Requestの有効化・URL設定
6. typeVersionの実値確認

## ワークフロー⑤（メール限定版）：クライアント共有メール文面の下書き作成

目的：報告書PDF生成完了イベント（Webhookでダミー受信）→文面組み立て→**Gmail下書き（Draft）として保存**。送信は人間が行う。WhatsApp版はT27の制約（下書き専用操作なし）のため今回スコープ外。

テスト用ダミーペイロード：
```json
{
  "caseId": "DEMO-CASE-0001",
  "vesselName": "[サンプル船舶]",
  "inspectionType": "Bunker",
  "reportDate": "2026-08-05",
  "clientContactName": "[クライアント担当者名]",
  "clientContactEmail": "client-placeholder@example.com",
  "pdfUrl": "https://example.com/dummy-files/report-demo.pdf"
}
```

ワークフローJSON：
```json
{
  "name": "【デモ】⑤クライアント共有メール下書き作成(メール限定版)",
  "nodes": [
    {
      "id": "n1", "name": "Webhook: 報告書PDF生成完了(デモ)", "type": "n8n-nodes-base.webhook", "typeVersion": 2, "position": [240, 300],
      "notes": "[要インスタンス確認] typeVersion。本番ではPDF生成完了イベントを想定。",
      "parameters": { "httpMethod": "POST", "path": "demo-report-pdf-ready", "responseMode": "onReceived", "options": {} }
    },
    {
      "id": "n2", "name": "Set: ダミー案件・PDF情報", "type": "n8n-nodes-base.set", "typeVersion": 3.4, "position": [460, 300],
      "notes": "[要インスタンス確認] typeVersion",
      "parameters": { "mode": "manual", "assignments": { "assignments": [
        { "id": "a1", "name": "caseId", "type": "string", "value": "={{ $json.body?.caseId || $json.caseId || 'DEMO-CASE-0001' }}" },
        { "id": "a2", "name": "vesselName", "type": "string", "value": "={{ $json.body?.vesselName || $json.vesselName || '[サンプル船舶]' }}" },
        { "id": "a3", "name": "inspectionType", "type": "string", "value": "={{ $json.body?.inspectionType || $json.inspectionType || 'Bunker' }}" },
        { "id": "a4", "name": "reportDate", "type": "string", "value": "={{ $json.body?.reportDate || $json.reportDate || '2026-08-05' }}" },
        { "id": "a5", "name": "clientContactName", "type": "string", "value": "={{ $json.body?.clientContactName || $json.clientContactName || '[クライアント担当者名]' }}" },
        { "id": "a6", "name": "clientContactEmail", "type": "string", "value": "={{ $json.body?.clientContactEmail || $json.clientContactEmail || 'client-placeholder@example.com' }}" },
        { "id": "a7", "name": "pdfUrl", "type": "string", "value": "={{ $json.body?.pdfUrl || $json.pdfUrl || 'https://example.com/dummy-files/report-demo.pdf' }}" }
      ] }, "options": {} }
    },
    {
      "id": "n3", "name": "IF: 必須項目チェック", "type": "n8n-nodes-base.if", "typeVersion": 2.2, "position": [680, 300],
      "notes": "[要インスタンス確認] conditions内部スキーマ",
      "parameters": { "conditions": { "options": { "caseSensitive": true, "typeValidation": "strict" }, "combinator": "and", "conditions": [
        { "id": "c1", "leftValue": "={{ $json.caseId }}", "rightValue": "", "operator": { "type": "string", "operation": "notEmpty", "singleValue": true } },
        { "id": "c2", "leftValue": "={{ $json.clientContactEmail }}", "rightValue": "", "operator": { "type": "string", "operation": "notEmpty", "singleValue": true } }
      ] }, "options": {} }
    },
    { "id": "n4", "name": "NoOp: エラー(必須項目欠落)", "type": "n8n-nodes-base.noOp", "typeVersion": 1, "position": [900, 460], "parameters": {} },
    {
      "id": "n5", "name": "Set: メール文面生成(テンプレート)", "type": "n8n-nodes-base.set", "typeVersion": 3.4, "position": [900, 200],
      "notes": "静的テンプレートによる文面組み立て。AI文章生成は本デモのスコープ外（Phase2で検討）。",
      "parameters": { "mode": "manual", "assignments": { "assignments": [
        { "id": "b1", "name": "draftSubject", "type": "string", "value": "=[検査報告書のご送付] {{ $json.vesselName }} ({{ $json.inspectionType }}) - {{ $json.reportDate }}" },
        { "id": "b2", "name": "draftBody", "type": "string", "value": "={{ $json.clientContactName }} 様\n\n平素より大変お世話になっております。\n下記案件の検査報告書がまとまりましたのでご案内いたします。\n\n船名: {{ $json.vesselName }}\n検査種別: {{ $json.inspectionType }}\n検査日: {{ $json.reportDate }}\n報告書PDF（参照用・本番では添付に置き換え予定）: {{ $json.pdfUrl }}\n\n[本文は下書きです。送信前に必ず内容をご確認・編集の上、担当者が手動で送信してください。]" }
      ] }, "options": {} }
    },
    {
      "id": "n6", "name": "Gmail: クライアント共有メール下書き作成", "type": "n8n-nodes-base.gmail", "typeVersion": 2.1, "position": [1120, 200],
      "notes": "[要インスタンス確認] typeVersion・PDF添付方法（今回は本文中にURL参照のみ、添付ファイル操作は未検証）。Credential未設定。resource=draft, operation=createは公式ドキュメントで確認済み。",
      "parameters": { "resource": "draft", "operation": "create", "sendTo": "={{ $json.clientContactEmail }}", "subject": "={{ $json.draftSubject }}", "message": "={{ $json.draftBody }}", "options": {} },
      "credentials": { "gmailOAuth2": { "id": "PLACEHOLDER_GMAIL_OAUTH2_CREDENTIAL_ID", "name": "[要設定] Gmail OAuth2 認証情報（未登録）" } }
    },
    {
      "id": "n7", "name": "HTTP Request: 下書き記録ログ(無効化・将来用)", "type": "n8n-nodes-base.httpRequest", "typeVersion": 4.2, "position": [1340, 200],
      "disabled": true,
      "notes": "カスタム側APIが未実装のため無効化。本番では下書きIDを案件フォルダ・カスタムDBへ記録する想定。WhatsApp版は今回対象外。",
      "parameters": { "method": "POST", "url": "https://YOUR-BACKEND-API.example.com/cases/{{ $json.caseId }}/draft-log", "sendBody": true, "options": {} }
    }
  ],
  "connections": {
    "Webhook: 報告書PDF生成完了(デモ)": { "main": [[{ "node": "Set: ダミー案件・PDF情報", "type": "main", "index": 0 }]] },
    "Set: ダミー案件・PDF情報": { "main": [[{ "node": "IF: 必須項目チェック", "type": "main", "index": 0 }]] },
    "IF: 必須項目チェック": { "main": [ [{ "node": "Set: メール文面生成(テンプレート)", "type": "main", "index": 0 }], [{ "node": "NoOp: エラー(必須項目欠落)", "type": "main", "index": 0 }] ] },
    "Set: メール文面生成(テンプレート)": { "main": [[{ "node": "Gmail: クライアント共有メール下書き作成", "type": "main", "index": 0 }]] },
    "Gmail: クライアント共有メール下書き作成": { "main": [[{ "node": "HTTP Request: 下書き記録ログ(無効化・将来用)", "type": "main", "index": 0 }]] }
  },
  "active": false,
  "settings": { "executionOrder": "v1" },
  "pinData": {}
}
```

ダミー部分：Webhookトリガー、Setノードの全フィールド、メール文面（固定テンプレート）、Gmail Credential（未設定）、末尾HTTP Requestノード（disabled:true）。

本番化する際の置き換えリスト：
1. Webhookを実際のPDF生成完了イベントに差し替え
2. Setノードの既定値を削除、実データ連携に変更
3. Gmail Credentialの本登録
4. PDF添付方法の確定（今回は本文中URL参照のみ。実添付は`[要公式確認]`）
5. 文面テンプレートの内容確定（法務・営業観点でのレビューが必要）
6. 末尾HTTP Requestの有効化・URL設定
7. WhatsApp版を追加する場合はT27の制約を踏まえた別途設計判断が必要（本デモのスコープ外）

## リスク・注意点

- メール基盤の仮定（Gmail）：本番が汎用SMTPの場合、下書き作成機能がなく代替実装が必要。
- パラメータ内部キー名（`operation`・`resource`・`approvalOptions`等）はドキュメントの説明文からの推定であり、実際のJSONスキーマと綴りが異なる可能性が高い。実インスタンスでGUI操作→エクスポートして正しい構造を確認することを強く推奨。
- Send and Wait再開後のデータ構造（`$json.data.approved`等）は未確認。
- `typeVersion`の不整合により、インポート時にノードが「更新が必要」と表示される可能性。
- HTTP Requestノードはカスタム側API未実装のため`disabled:true`にしている（誤った外部送信を防ぐ安全策）。
- 本成果物は設計書・実装案であり、実際にn8nへインポート・実行した結果ではない。

## 推奨案

1. 本番投入前に、まずワークフロー④（最も単純）を実インスタンスへ手動インポートし、エラー内容・実際のパラメータ構造・typeVersionを確認する検証タスクを先に実施する。
2. 検証で判明した正しいスキーマを反映した改訂版を作成し、他の2ワークフローにも横展開する。
3. メール基盤確定後、該当ノードを差し替える。
4. ディスカバリーコールでの営業デモとしては、①のSend and Wait for Approval部分（受信者の操作で再開する動き）が訴求力が高いため優先的に検証する。

## 代替案

- ドキュメントからの推測でなく、n8nエディタでGUI操作→エクスポートしてJSON構造を確認する「逆引き」アプローチの方が確実。
- ワークフロー①の承認結果分岐を、Send and Wait機能に依存せず「Waitノード＋カスタム側APIポーリング」方式に変更することも可能（T27代替案）だが、ダミー環境ではn8n単体で完結するSend and Wait方式の方がデモに適していると判断。

## 出典

- n8n公式ドキュメント「Webhook」：https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.webhook/ （確認日2026-07-28）
- n8n公式ドキュメント「Edit Fields (Set)」：https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.set/ （確認日2026-07-28）
- n8n公式ドキュメント「If」：https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.if/ （確認日2026-07-28）
- n8n公式ドキュメント「Send Email」：https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.sendemail （確認日2026-07-28）
- n8n公式ドキュメント「Gmail」：https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-base.gmail/ （確認日2026-07-28）
- n8n公式ドキュメント「Gmail Message Operations」：https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-base.gmail/message-operations （確認日2026-07-28）
- logs/kohomada_2026-07-28_T27n8nワークフロー設計書_v1.md
- logs/kohomada_2026-07-28_T25自動化アーキテクチャ設計_v1.md

## 未確認事項

- 各ノードの正確なtypeVersion
- Gmailノードのoperation/approvalOptions/PDF添付パラメータの正確な内部キー名
- Send and Wait再開後のデータ構造
- Ifノードconditionsパラメータの正確なスキーマ
- Webhookノードのwebhookid自動生成の要否
- 本番のメール送信基盤（Gmail/Outlook/汎用SMTP）
- カスタム側の案件・承認ステータスAPI仕様（未実装）

## 次に必要なアクション

1. 実インスタンスへのインポート・手動実行による検証（社長承認の上、別タスクとして実施）
2. 検証結果を踏まえた改訂版JSONの作成
3. ディスカバリーコールでのデモ実演順序（①→④→⑤）をメイ・社長と相談
4. メール基盤確定後の該当ノード差し替え
5. Credential登録・有効化・実送信テストは社長の明示的承認を得てから実施（本タスクでは一切未実施）
