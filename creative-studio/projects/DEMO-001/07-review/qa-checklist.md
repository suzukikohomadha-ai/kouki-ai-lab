# DEMO-001：品質監査チェックリスト

- 対象成果物：`06-design/flyer.html`、`06-design/lp/index.html`、`06-design/sns-post-spec.md`
- 監査担当：creative-quality-auditor
- 監査日：構築時点

## 実行した検証（実際にコマンドを実行した結果）

| スクリプト | 対象 | 結果 |
|---|---|---|
| `check-secrets.mjs` | flyer.html, lp/index.html, sns-post-spec.md | 検出0件 |
| `check-links.mjs` | flyer.html, lp/index.html | 壊れたローカル参照0件、外部URL0件 |
| `check-assets.mjs` | flyer.html, lp/index.html | 参照素材0件（画像素材未使用のため対象外） |
| `validate-design-tokens.mjs` | brand/design-tokens.json | 必須グループOK。色トークン未確定のためコントラスト計算は未実施 |

## 確認項目

- [x] 目的との一致：来店・Instagramフォローという目的にCTAが対応している
- [x] ターゲットとの一致：想定ターゲット（近隣30〜50代）向けのトーンで一貫
- [x] ブランド一貫性：デモ限定の仮配色で3成果物とも統一（正式なbrand/design-tokens.jsonとは未連携）
- [x] 情報の正確性：実在の実績・数値を主張していない（架空設定である旨を明記）
- [ ] コントラスト比：`[実機未確認]` スクリプトはbrand/design-tokens.json基準のため、
      デモの独自配色（--brown-d #4a3220 on --beige #f6efe2 等）は未計算。目視ではAA相当に
      見えるが、機械的な確認はできていない
- [x] 著作権・商標・肖像権：画像素材を使用していない（プレースホルダーのみ）ため該当なし
- [x] アクセシビリティ：見出し階層・alt相当の説明・skip link・focus-visible を実装
- [ ] スマートフォン表示：`[実機未確認]`（ブラウザでの実表示確認はしていません）
- [x] 個人情報：含まれない
- [x] 法令上の注意表現：断定的な効果保証表現なし

## 重大な問題

なし

## 改善推奨

- 実際のブラウザでのレスポンシブ表示確認（PC/スマホ）が未実施
- デモの独自配色についてWCAGコントラスト比の機械計算が未実施

## 納品・入稿・公開の可否

**条件付き承認**（社内デモ確認用としては可。外部公開・実案件化する場合は、上記の未確認事項
（実機でのコントラスト確認・スマホ表示確認・実際のブランド情報反映）を解消してから。）
