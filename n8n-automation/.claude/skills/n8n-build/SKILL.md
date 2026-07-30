---
name: n8n-build
description: "承認済みの設計書をもとに、n8n-workflow-builderが実際にワークフローJSON・補助コード・テストデータを実装し、workflows/draft/ に保存する。設計がユーザー承認された後に使う。"
---

# n8n-build：実装

## 目的

承認済みの設計書（`templates/workflow-design.md`）をもとに、`n8n-workflow-builder` が
ワークフローJSON・補助コード・テストデータ・ドキュメントを実装する。

## 手順

1. 設計書と、`n8n-schema-researcher` が確認済みのノード仕様・API仕様を確認する。
   未確認のまま実装が必要な箇所は、実装を止めて確認を依頼するか、
   `[要インスタンス確認]` と明記した上でドラフトとして進める。
2. `workflows/draft/<案件名>.json` にワークフローJSONを作成する。
   - `.claude/rules/n8n-workflow-json.md` の必須技術観点（冪等性・入力値検証・
     タイムアウト・リトライ・エラー処理 等）を満たす。
   - 分かりやすいノード名・役割の注記を入れる。
3. 必要な補助コード（Codeノードの中身など）は、標準ノード・式で安全に実装できない場合のみ使う。
4. `tests/fixtures/` にテストデータ、`tests/cases/` にテストケース（正常系・異常系・境界値等）を作成する。
5. `templates/workflow-design.md` の必須項目（Credential一覧・環境変数一覧を含む）を埋め切る。

## 入力

承認済み設計書

## 出力

- `workflows/draft/*.json`
- `tests/fixtures/*` / `tests/cases/*`
- 実装ドキュメント（設計書の更新）

## 実行例

```text
/n8n-build 承認済み設計書からワークフローを作成
```

## 次のフェーズ

実装が完了したら `n8n-review`（静的検証・監査）へ進む。
