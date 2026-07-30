# 命名規則

## 案件ID

`<種別略称>-<3桁連番>`（例：`FLY-001`＝チラシ1件目、`LP-001`＝LP1件目、`DEMO-001`＝デモ）

種別略称の例：FLY（チラシ）、IMG（SNS/バナー画像）、PRE（プレゼン資料）、LP（LP）、
WEB（ホームページ）

## ファイル・フォルダ

- 案件フォルダ：`projects/<案件ID>/`
- 最終成果物：`outputs/<種別>/<案件ID>_<内容が分かる英数字スラッグ>.<拡張子>`
  例：`outputs/flyers/FLY-001_summer-campaign.html`
- 画像ファイル：`<案件ID>_<用途>_<サイズ or 比率>.<拡張子>`
  例：`DEMO-001_instagram-post_1080x1080.png`

## 素材ファイル（`assets/`）

- 元素材：`assets/source/<入手元>_<内容>.<拡張子>`
- ライセンス確認済み：`assets/licensed/<案件ID または ブランド共通>_<内容>.<拡張子>`
- 生成素材：`assets/generated/<案件ID>_<内容>.<拡張子>`
- 最適化済み（Web用圧縮等）：`assets/optimized/<元ファイル名と対応させる>`

## ブランド名・トーンの一貫性

制作物内の表記ゆれ（会社名・商品名・キャッチコピーの言い回し）は
`brand/brand-brief.md` の表記を正とする。

## Gitを使う場合

- ブランチ：`creative/<案件ID>-<概要>`
- コミットメッセージ：`[<案件ID>] <変更内容>`
