# デザイナー兼マーケター制作チーム

チラシ・SNS画像・広告バナー・営業資料・プレゼン・ホームページ/LPの制作を、
ヒアリング→リサーチ→戦略→コンセプト→制作→品質監査→修正→納品→効果検証まで
一気通貫で担当するClaude Code環境です。「事業目的と成果につながるデザイン」を方針とし、
架空実績・効果保証・推測による仕様断定は行いません。

このフォルダは `../`（コウキAIラボ）・`../n8n-automation/` とは独立しています。

## クイックスタート

```text
/creative-intake 新商品のチラシを作りたい
/brand-strategy このブランドのトーンと配色を決めたい
/marketing-plan このチラシを使った集客導線を設計して
/flyer-design 決まった内容でチラシのラフを作って
/image-creative Instagram投稿用のバナーを作って
/presentation-design 会社紹介資料を作って
/web-lp-design このサービスのLPを作って
/creative-review outputs/flyers/xxx.html を監査して
/project-export DEMO-001 を納品パッケージにまとめて
```

## エージェント

`.claude/agents/` に8体（詳細は `CLAUDE.md` の一覧、権限は `docs/design-quality-standard.md` /
各ルールファイルを参照）。

- `creative-director` … 統括
- `marketing-strategist` … マーケティング戦略
- `brand-researcher` … 読み取り専用の調査
- `graphic-designer` … チラシ・SNS画像等のデザイン
- `presentation-designer` … 営業資料・プレゼン
- `web-lp-designer` … ホームページ・LP
- `conversion-copywriter` … コピーライティング
- `creative-quality-auditor` … 読み取り専用の品質監査

## ディレクトリ構成

```
creative-studio/
├─ CLAUDE.md
├─ README.md
├─ .env.example / .gitignore
├─ .claude/{agents, skills, rules, settings.json}
├─ brand/                … ブリーフ・ガイドライン・トークン・トーン・NG表現・素材・出典台帳
├─ templates/             … ヒアリング〜納品報告書の雛形（13種）
├─ projects/<案件ID>/01-brief〜08-delivery/
├─ assets/{source,generated,licensed,optimized}/
├─ outputs/{flyers,images,presentations,websites,reports}/
├─ scripts/                … 検証スクリプト（Node.js標準ライブラリのみ）
└─ docs/                   … ワークフロー・命名規則・素材ポリシー・品質基準・トラブルシューティング
```

## 確認済み環境（構築時点）

| 項目 | 値 |
|---|---|
| OS / シェル | Windows 11 Pro / PowerShell 5.1 |
| Node.js / npm | v24.18.0 / 11.16.0 |
| Git | **未インストール** |
| Docker | 未検出 |
| Claude Codeバージョン | `[未確認]` |
| 画像生成・編集、Figma/Canva/Adobe、PowerPoint/PDF生成、Lighthouse等のWeb検査、スクリーンショット取得、フォント確認 | すべて `[ツール未接続]` |
| 印刷入稿先・広告媒体・CMS/ホスティング | `[ユーザー入力待ち]` |

制作ツールが未接続のため、実際に生成できるのは **HTML/CSS/SVG・Markdown制作指示書・
画像生成用プロンプト・手動実装手順** です。「入稿完了」「公開完了」「表示確認済み」等は、
実際に確認していない限り書きません。

## セキュリティ

- 実績・レビュー・受賞歴等の架空データは作成しません。
- 本番公開・広告出稿・SNS投稿・メール送信・有料API利用等は `.claude/settings.json` の
  `permissions.ask` で毎回確認が必要です。
- 使用素材はすべて `brand/sources/source-register.md` に記録し、ライセンス不明の素材は
  納品物に含めません。

## デモ案件

`projects/DEMO-001/` に、外部公開なし・架空企業名・実績捏造なしの安全なデモ
（架空カフェのチラシ＋SNS投稿1枚＋簡易LP）を1件作成済みです。詳細は同フォルダの
`01-brief/README.md` を参照してください。

## 次のアクション（ユーザー対応が必要な項目）

- 実際のブランド情報（会社名・ロゴ・配色・トーン）があれば教えてください
- 画像生成ツール・Figma等を使う場合は接続方法を教えてください
- 最初に作りたい制作物を1つ選んでください（`/creative-intake` から開始します）
