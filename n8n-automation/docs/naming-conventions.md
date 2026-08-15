# 命名規則

## 案件・管理ID

- 案件名：日本語可。簡潔に業務内容が分かるもの（例：「請求書処理自動化」）
- 管理ID：`AUTO-<部署略称>-<3桁連番>`（例：`AUTO-ACC-001`＝経理部門1件目）
  - 部署略称は `docs/architecture.md` に一覧化する（まだ未整備の場合は依頼のたびに追記）
  - 現在使用中の略称：`KHM` = 株式会社コホマダ（AI・DX/業務自動化事業を含む。社外公開テンプレート
    案件にも同様に使用。例：`AUTO-KHM-001`＝2026-08-15、n8n公式Creator Hub提出候補「日本の規制・
    行政ニュース多言語ダイジェスト配信」案A）

## ファイル・フォルダ

- ワークフローJSON：`workflows/<状態>/<管理ID>_<内容が分かる英数字スラッグ>.json`
  例：`workflows/draft/AUTO-ACC-001_invoice-processing.json`
- テストデータ：`tests/fixtures/<管理ID>_<内容>.json`
- テストケース：`tests/cases/<管理ID>_test-cases.md`
- テスト結果：`tests/results/<YYYY-MM-DD>_<管理ID>_result.md`
- ドキュメント（intake/requirements/workflow-design等）：案件ごとに
  `docs/cases/<管理ID>/` を作成し、`templates/` の雛形をコピーして使う
  （`docs/cases/` は初回案件が出た時点で作成する）

## n8nワークフロー内のノード名

- 日本語または英語で、役割が分かる名前にする（例：「請求書PDF取得」「金額チェック」）。
- 同じ役割のノードが複数ある場合は末尾に連番を付ける（例：「リトライ待機_1」）。
- トリガー系ノードは先頭に分かるように配置する（例：「Webhookトリガー」）。

## Credential名（n8n側）

- `<サービス名>_<用途>_<環境>`（例：`Gmail_通知送信_本番`、`Gmail_通知送信_ステージング`）
- 本番用とステージング用は必ず別名にし、混同を防ぐ。

## ブランチ・コミット（Gitを使う場合）

- ブランチ：`automation/<管理ID>-<概要>`
- コミットメッセージ：`[<管理ID>] <変更内容>`（例：`[AUTO-ACC-001] draftワークフロー初版`）
