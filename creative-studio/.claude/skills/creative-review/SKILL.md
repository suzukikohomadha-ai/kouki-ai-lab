---
name: creative-review
description: "既存の制作物を、制作者とは独立した立場で品質監査する。重大な問題・改善推奨・軽微な修正・判断根拠・未確認事項・納品/公開可否をまとめる。制作物ができたら、納品・入稿・公開の前に必ず使う。"
---

# creative-review：品質監査

## 目的

`creative-quality-auditor` として、制作物を監査し、`templates/qa-checklist.md` に記録する。

## 手順

1. 可能であれば `scripts/check-links.mjs` `scripts/check-assets.mjs` `scripts/check-secrets.mjs`
   `scripts/validate-design-tokens.mjs` を実行する。
2. `.claude/rules/` 全ファイルの確認項目（ブランド一貫性・事実確認・著作権/ライセンス・
   アクセシビリティ・印刷/資料/Web個別基準）に沿ってチェックする。
3. 品質評価スコア（`docs/design-quality-standard.md` の配点）をつけ、改善理由を添える。
4. 重大な問題（事実誤認・ライセンス問題・個人情報漏えい・法的リスク）があれば、
   点数にかかわらず「納品不可」とする。

## 出力

`templates/qa-checklist.md` を埋めたもの：重大な問題／改善推奨／軽微な調整／判断根拠／
未確認事項／納品・入稿・公開の可否

## 実行例

```text
/creative-review outputs/flyers/xxx.html を監査して
```
