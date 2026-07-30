# 素材ポリシー

## ライフサイクル

```
assets/source/     … 入手直後・ライセンス未確認の元素材（Git管理対象外）
       ↓ ライセンス確認
assets/licensed/    … 使用許諾を確認済みの素材（Git管理対象外・機密性の観点で既定除外）
       ↓ 加工
assets/generated/   … AI生成・自作した素材
       ↓ 最適化
assets/optimized/   … Web/印刷用に圧縮・変換した最終素材（制作物から参照するのはここ）
```

## 台帳登録（必須）

使用する素材はすべて `brand/sources/source-register.md` に記録する。
`scripts/generate-asset-manifest.mjs` で未登録ファイルを検出できる。

## 禁止事項

他社ロゴ、キャラクター、著名人写真、スポーツチームの意匠、ブランド商品画像、
Web上で拾った出典不明画像、ライセンス不明のフォント、競合企業のデザインデータの使用。

## 実在人物

実在人物を含む画像・推薦コメントは、使用許可と提供画像を確認できるまで
`assets/licensed/` に置かず、`[要ライセンス確認]` のまま `assets/source/` に留める。

## フォント

商用利用・Webフォント利用・埋め込み・再配布・印刷・クライアント納品それぞれの可否を
`brand/assets/fonts/` 内のメモ、または `source-register.md` に記録してから
`brand/design-tokens.json` に正式採用する。
