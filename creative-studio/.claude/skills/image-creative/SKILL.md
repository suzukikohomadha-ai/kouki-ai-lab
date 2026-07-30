---
name: image-creative
description: "SNS投稿画像・広告バナー・記事画像・サムネイル等を作成する。媒体仕様・デザインコンセプト・画像生成プロンプト・テキスト配置・altテキスト・ファイル名・出力形式を整理する。ブリーフ/戦略が固まった後に使う。"
---

# image-creative：SNS/バナー画像制作

## 目的

`graphic-designer` として、`templates/image-creative-specification.md` の様式で画像制作物を設計する。

## 手順

1. 媒体仕様（画像サイズ・比率等）を確認する。未確認なら `[要公式確認]` とし、
   一般に知られる代表的なサイズを「暫定仕様」として明記した上で進めてよい。
2. 目的・ターゲット・デザインコンセプトを整理する。
3. 画像生成ツールが未接続の場合は、`.claude/rules/print-design.md` の画像制作基準
   （生成前定義項目・生成後確認項目）に沿って画像生成用プロンプトを作成する。
4. 日本語テキストを含む場合は、原則テキストなしの背景素材＋別工程でのテキスト配置
   （HTML/CSS等）に分ける。
5. altテキスト、ファイル名（`docs/naming-conventions.md` 準拠）、出力形式を決める。

## 出力

`templates/image-creative-specification.md`、画像生成プロンプトまたは実装ファイル
（`outputs/images/` または `projects/<案件ID>/06-design/`）

## 実行例

```text
/image-creative Instagram投稿用のバナーを作って
```
