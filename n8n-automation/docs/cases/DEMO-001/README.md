# DEMO-001：しきい値チェック（安全なデモ案件）

これは実装フローの動作確認用サンプルです。**実在する顧客情報・APIキー・外部送信は
一切使用しません。** n8nインスタンスへの登録・有効化も行っていません。

## 業務目的（架空の設定）

「経費申請の合計金額が、部署ごとのしきい値を超えたら承認者に知らせたい」という
架空の依頼を題材に、ヒアリング→設計→実装ドラフトまでの一連の流れを一通り示します。

## このデモの範囲

- Manual Trigger（手動実行）から開始
- 入力された2つの数値（`amount`, `threshold`）を比較する
- しきい値を超えたら `status = "要確認"`、超えなければ `status = "自動承認"` を返す
- 外部API・外部送信・実在するCredentialは一切使用しない

## ファイル一覧

- `README.md`（このファイル）
- `intake.md` … `templates/automation-intake.md` を埋めたもの（架空データ）
- `workflow-design.md` … `templates/workflow-design.md` を埋めたもの
- ワークフロードラフト：`../../../workflows/draft/DEMO-001_threshold-check.json`
- テストデータ：`../../../tests/fixtures/DEMO-001_cases.json`
- テストケース：`../../../tests/cases/DEMO-001_test-cases.md`

## 重要な注記（ハルシネーション防止）

ワークフロードラフト内のノード `type` / `typeVersion` は、n8nの公式ドキュメントで
一般に案内されている値（Manual Trigger / Set / IF / NoOp 相当の核となるノード）を
参考にしていますが、**接続先n8nインスタンスでの実際の動作は未検証**です。
実際にインポートする前に `n8n-schema-researcher` による公式確認、または
接続先インスタンスでのインポートテストが必要です（`[要インスタンス確認]`）。

このデモは `n8n-review` の静的検証（`scripts/validate-workflow.mjs`）のみ実行済みで、
**n8nへのインポート・実行はしていません**（`[実行環境なしのため未テスト]`）。
