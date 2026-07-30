---
name: presentation-design
description: "営業資料・提案資料・会社紹介資料等を作成する。読み手・意思決定目標・ストーリー・スライド構成・図解指示・発表者ノート・引用出典を整理する。ブリーフが固まった後に使う。"
---

# presentation-design：資料制作

## 目的

`presentation-designer` として、`templates/presentation-storyboard.md` の様式で資料を設計する。

## 手順

1. 誰が読むか・誰が説明するか・読後に何を判断してほしいか・発表時間・配布の有無・
   提案/報告/説明のどれかを確認する。
2. `.claude/rules/presentation-design.md` の標準構成を参考に、内容に応じてスライド構成を作る。
   不要なスライドで水増ししない。
3. 各スライドの主要メッセージ・図解指示・引用出典を明記する。
4. ユーザー提供のない数値はグラフ化しない。概念図と実データのグラフを区別する。
5. 出力はHTML/Markdownのストーリーボードとして作成し、PowerPoint/PDF生成ツールが
   未接続の場合はその旨を明記する。

## 出力

`templates/presentation-storyboard.md`（`projects/<案件ID>/06-design/` または
`outputs/presentations/`）

## 実行例

```text
/presentation-design 会社紹介資料を作って
```
