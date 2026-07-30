---
name: n8n-review
description: "workflows/draft/ のワークフローJSONを、静的検証スクリプトとn8n-quality-auditorで監査する。JSON整合性・シークレット混入・セキュリティ・エラー処理・テスト網羅性を確認し、問題なければ workflows/validated/ へ進める。実装完了後に使う。"
---

# n8n-review：静的検証・品質監査

## 目的

`workflows/draft/` のワークフローJSONを、実装者から独立した立場（`n8n-quality-auditor`）で
監査し、`workflows/validated/` へ進めてよいか判定する。

## 手順

1. `scripts/validate-workflow.mjs <path>` を実行し、JSON構文・必須構造・ノード名重複・
   接続整合性・未接続ノード・不明なCredential参照を確認する。
2. `scripts/check-secrets.mjs <path>` を実行し、シークレットらしき文字列・個人情報らしき
   テストデータ・本番URLの混入を確認する（検出のみ、自動削除はしない）。
3. `n8n-quality-auditor` として、`.claude/rules/security.md` のチェック項目と、
   テスト網羅性（正常系・異常系・境界値・空/欠損/重複データ・大量データ・
   APIタイムアウト・認証エラー・レート制限・外部サービス障害・部分失敗・再実行）を確認する。
4. 検証結果を「重大な問題／軽微な指摘」に分けて報告する。
5. 重大な問題がなければ `workflows/draft/<name>.json` を `workflows/validated/` へ移動する。
   重大な問題があれば `n8n-workflow-builder` に差し戻す。

## 入力

`workflows/draft/*.json`

## 出力

- 検証結果（JSON + Markdown、`tests/results/` に保存）
- `workflows/validated/` への昇格、または差し戻し

## 実行例

```text
/n8n-review workflows/draft/invoice-processing.json
```

## 次のフェーズ

`validated` になったワークフローは `n8n-test` へ進む。
