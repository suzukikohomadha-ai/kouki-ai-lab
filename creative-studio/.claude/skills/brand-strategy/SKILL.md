---
name: brand-strategy
description: "ブランドの基本方針（役割・価値・ポジショニング・人格・トーン・配色・タイポグラフィ・禁止表現・デザイントークン）を作成する。ブランドガイドラインが未整備、または見直しが必要なときに使う。"
---

# brand-strategy：ブランド基本方針

## 目的

`brand/brand-guidelines.md` と `brand/design-tokens.json`（`templates` の雛形参照）を作成・更新する。

## 手順

1. `creative-intake` の結果と `brand-researcher` の調査結果（あれば）を確認する。
2. ブランドの役割・価値・ターゲット・ポジショニング・ブランド人格・トーンを定義する。
3. 配色・タイポグラフィ・写真表現・アイコン表現の方針を定める（値が未定なら空欄・
   未確定のまま扱い、架空のブランド指定を確定しない）。
4. 禁止表現を `brand/prohibited-expressions.md` に整理する。
5. `brand/design-tokens.json` を埋める（color/typography/spacing/radius/shadow/breakpoint）。
6. フォントは商用利用・Webフォント利用・埋め込み・再配布・印刷・クライアント納品の
   可否を確認し、確認できていないものは候補扱いに留める。

## 出力

`brand/brand-guidelines.md`、`brand/design-tokens.json`、`brand/tone-of-voice.md`、
`brand/prohibited-expressions.md`

## 実行例

```text
/brand-strategy このブランドのトーンと配色を決めたい
```
