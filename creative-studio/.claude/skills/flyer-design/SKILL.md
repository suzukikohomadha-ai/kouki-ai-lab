---
name: flyer-design
description: "チラシ・パンフレット・ポスター等を設計する。入稿仕様確認・情報優先順位・ラフ構成・コピー・配色・フォント・写真指示・レイアウト指示・デザインデータ・入稿前チェックを行う。ブリーフ/戦略が固まった後に使う。"
---

# flyer-design：印刷物デザイン

## 目的

`graphic-designer` として、`templates/flyer-specification.md` の様式でチラシ等を設計する。

## 手順

1. `.claude/rules/print-design.md` の入稿仕様確認項目を、ユーザーまたは入稿先情報で埋める
   （未定なら「暫定仕様」と明記）。
2. 情報の優先順位を決め、ラフ構成（視線の開始位置・CTAの位置）を作る。
3. `conversion-copywriter` と連携してコピーを確定する（このスキル内で簡易に書いてもよいが、
   本格的なコピーが必要な場合は委任する）。
4. 配色・フォントは `brand/design-tokens.json` に従う。
5. デザインデータはHTML/CSS/SVGで作成するか、ツール未接続の場合は制作指示書として作成する。
   原則3案以内とし、各案にコンセプト・意図・メリット・リスク・推奨媒体を記載する。
6. 入稿前チェック（画像解像度・CMYK変換・PDF規格等）は実施できない場合、
   `[要入稿先確認]` として明記し「入稿可能」と断定しない。

## 出力

`templates/flyer-specification.md`、デザインデータまたは制作指示書
（`outputs/flyers/` または `projects/<案件ID>/06-design/`）

## 実行例

```text
/flyer-design 決まった内容でチラシのラフを作って
```

## 次のフェーズ

`creative-review` で監査を受けてから納品する。
