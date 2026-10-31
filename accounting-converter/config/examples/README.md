# config/examples/ — テスト・動作確認専用の設定

ここにある設定の列名（`例_取引日` など）・税区分名（`例_課税売上10%` など）・識別フラグ値（`例S` など）は
**すべて本PoCのテストのために作った架空の名前**です。MF・弥生・freee の実際のCSV仕様を確認したものではありません。

- 目的：`TODO_VERIFY` を含まない設定でパイプライン全体（読込→マッピング→検証→出力→レポート）を自動テストすること
- 対応する架空データ：`fixtures/`（`scripts/make-fixtures.ts` で生成）
- 本番の設定は `config/profile.sample.json` と `config/sources/` `config/targets/` `config/maps/*.sample.json` を元に、公式テンプレートから転記して作る（ルートの README 参照）
