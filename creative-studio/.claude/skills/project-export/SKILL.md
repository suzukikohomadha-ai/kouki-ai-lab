---
name: project-export
description: "案件の成果物を整理して納品パッケージを作成する。最終成果物・編集用ファイル・使用素材一覧・ライセンス一覧・出典一覧・修正履歴・未確認事項・使用方法をまとめる。creative-reviewで承認された後に使う。"
---

# project-export：納品パッケージ作成

## 目的

`templates/delivery-report.md` の様式で、案件フォルダ（`projects/<案件ID>/08-delivery/`）に
納品パッケージをまとめる。

## 手順

1. `creative-review` で「納品不可」判定が出ていないか確認する（出ていれば先にそちらを解消する）。
2. 最終成果物・編集用ファイルを整理する。
3. `scripts/generate-asset-manifest.mjs` で使用素材を棚卸しし、`brand/sources/source-register.md`
   と突き合わせてライセンス一覧を作る。
4. 修正履歴、未確認事項（`[要法務確認]` 等が残っていればここに集約）、使用方法を記載する。

## 出力

`templates/delivery-report.md` を埋めたもの、整理済みファイル一式
（`projects/<案件ID>/08-delivery/`）

## 実行例

```text
/project-export DEMO-001 を納品パッケージにまとめて
```
