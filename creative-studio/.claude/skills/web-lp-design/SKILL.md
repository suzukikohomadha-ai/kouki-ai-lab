---
name: web-lp-design
description: "ホームページまたはLPを設計・実装する。要件定義・ペルソナ・サイトマップ・ワイヤーフレーム・コピー・UI設計・デザイントークン・実装・SEO設定・計測設計・QA結果を出す。ブリーフ/戦略が固まった後に使う。"
---

# web-lp-design：Web/LP制作

## 目的

`web-lp-designer` として、`templates/web-lp-requirements.md` と `templates/wireframe-specification.md`
の様式でWeb/LPを設計・実装する。

## 手順

1. `.claude/rules/web-design.md` に沿って、事業目的・ユーザー目的・ターゲット・流入元・
   検索意図・CTA・ページ構成・必須コンテンツ・信頼要素・FAQ・フォーム・計測方法を確認する。
2. 使用フレームワーク・CMS・ホスティング等、未確認の技術要素は `[ユーザー入力待ち]` とする。
3. ワイヤーフレーム→UI設計→実装（HTML/CSS/JS）の順に作る。`brand/design-tokens.json` に従う。
4. アクセシビリティ（`.claude/rules/accessibility.md`）・SEO基本項目を実装に反映する。
5. 公開前チェックリスト（`templates/qa-checklist.md`）で確認する。実際にブラウザで確認して
   いない項目は「未確認」のままにする。

## 出力

実装ファイル（`outputs/websites/` または `projects/<案件ID>/06-design/`）、
`templates/web-lp-requirements.md`、`templates/wireframe-specification.md`

## 実行例

```text
/web-lp-design このサービスのLPを作って
```

## 次のフェーズ

`creative-review` で監査を受けてから、公開はユーザー承認のもとで行う。
