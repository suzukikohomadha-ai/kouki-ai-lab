# 標準制作フロー

## エージェント構成

```
creative-director（統括・委任・承認管理）
  ├─ brand-researcher（読み取り専用・調査）
  ├─ marketing-strategist（戦略）
  ├─ graphic-designer（チラシ/SNS画像）
  ├─ presentation-designer（資料）
  ├─ web-lp-designer（Web/LP）
  ├─ conversion-copywriter（コピー）
  └─ creative-quality-auditor（読み取り専用・監査）
```

## Skillsとフェーズの対応

| Phase | 内容 | Skill |
|---|---|---|
| 0 | 環境確認 | （`creative-director` が初回に実施） |
| 1 | ヒアリング | `creative-intake` |
| 2 | リサーチ | `brand-researcher` に委任（専用skillはなし、director経由） |
| 3 | 戦略 | `brand-strategy`, `marketing-plan` |
| 4 | コンセプト（2〜3案） | 各制作skillの中で実施 |
| 5 | 制作 | `flyer-design`, `image-creative`, `presentation-design`, `web-lp-design` |
| 6 | 品質監査 | `creative-review` |
| 7 | 修正 | 該当skillに差し戻し |
| 8 | 納品 | `project-export` |
| 9 | 効果検証 | データ提供時のみ、`marketing-plan` の枠組みで実施 |

## 案件フォルダの型

```
projects/<案件ID>/
  01-brief/       … creative-intake の結果
  02-research/    … brand-researcher の調査結果
  03-strategy/    … brand-strategy, marketing-plan の結果
  04-concepts/    … コンセプト案（2〜3案）
  05-copy/        … copy-deck
  06-design/      … 実装ファイル・デザインデータ
  07-review/      … qa-checklist の結果
  08-delivery/    … delivery-report・最終成果物
```

## Phase 0：環境確認（毎回の作業開始時に）

OS・シェル、Claude Codeのバージョン、Git、Node.js/npm、Python、Dockerの有無、既存の
`CLAUDE.md`・`.claude`・既存Skills/サブエージェント・既存権限設定、利用可能なMCP/外部ツール、
画像生成/編集・SVG・HTML実行環境・Figma/Canva/Adobe連携・PowerPoint/PDF生成・
ブラウザ表示確認・Lighthouse等・スクリーンショット取得・フォント確認環境の有無。
利用できないツールを利用できるものとして扱わない。

既存ファイルは内容を確認せずに上書きしない。差分を確認してから編集する。

## Phase 4：コンセプトの型

原則2〜3案。各案：コンセプト名／狙い／ターゲット／キーメッセージ／ビジュアル方針／配色／
コピー／メリット／リスク。

## Phase 8：納品時に揃えるもの

最終データ／編集用データ／画像／フォント情報／素材情報／ライセンス／出典／使用方法／
未確認事項。
