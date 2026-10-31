# accounting-converter — 会計ツールコンバータ PoC（フェーズ0）

弥生会計／マネーフォワードクラウド会計（MF）の仕訳CSVを、freee会計の仕訳インポート用CSVに変換する **ローカル完結型の CLI** です。
株式会社コホマダ T13「会計ツールのコンバータ構築」の PoC。設計は `logs/kohomada_2026-09-14_会計ツールコンバータPoC詳細設計_v4.md`（メイ作成。v1→v2→v3 とアオイ監査・ミナ会計見解を反映し、v4 で v3 の実装乖離を設計書側に反映済み）に基づきます。設計書と本実装の表記が異なる点は §8 に列挙しており、**実装＝本 README を正**とします。

- 本ツールは **データを外部に送信しません**（ネットワーク通信を行うコードを含みません。検査範囲：`src/` の静的 import 検査（`fetch`/`http`/`https`/`net`/`child_process` 等）。依存ライブラリ本体は検査対象外ですが、実行時依存を papaparse・iconv-lite の2つに限定する検査を入れています）。
- 本ツールは **税務・会計上の判断を行いません**。勘定科目・税区分の対応表は人間（有資格者）が確定し、実行結果の最終確認も有資格者が行ってください。
- **列名・列順は一切確定していません。** freee・MF・弥生の公式CSV仕様は本PoC作成時点で確認できていないため、本番用設定ファイルの該当箇所は `TODO_VERIFY:<推定名>` としてあります（推定名は先行調査の検索要約に基づく推定であり、確認済みの値ではありません）。`TODO_VERIFY` が1つでも残っていると本番変換は動きません（`--dev` を付けた開発用実行のみ可）。

---

## 1. できること（PoCの範囲）

| データ | 扱い |
|---|---|
| 仕訳（日付・伝票番号・借方/貸方科目・金額・摘要） | 変換する |
| 勘定科目 | 対応表（`maps/accounts`）で変換。未対応は停止（E002） |
| 税区分 | 対応表（`maps/taxcodes`）で変換。日付範囲つきの対応（インボイス経過措置の控80/控50）に対応。未対応は停止（E003）。自動判定はしない |
| 補助科目 | ルール（`maps/subaccount-rules`）で取引先／freee補助科目／メモタグへ割当 |
| 取引先 | そのまま出力＋重複（W001）・表記ゆれ（W002）候補を警告。名寄せは `maps/partners` の別名表で人間が指定したときのみ |
| 期首残高・繰越 | 検出して出力から除外し、科目別合計をレポートに出す（変換しない）。検出は「摘要・メモに `openingBalanceKeywords`（既定：期首残高／開始残高／前期繰越／前期より繰越／期首繰越）を含む」または「伝票日付が期首日 かつ 相手科目が `openingBalanceCounterAccounts`」のみ。**科目名だけでは判定しない**（「繰越利益剰余金」を含む決算振替仕訳の誤除外を防ぐため）。その分、どちらにも該当しない期首残高伝票は検出されず出力に含まれるので、有資格者はレポートの「期首残高・除外伝票」セクションと `report_diagnostics.csv` の W006/W007 を、期首日付の伝票と突合してください |
| 固定資産・減価償却 | 検出して警告（W003 固定資産科目を含む伝票／W004 償却科目を含む伝票）。`fixedAssets: "exclude"` で除外されるのは、**償却科目（`depreciationAccounts`、既定「減価償却費」「一括償却資産償却」）を含み、かつ伝票内の他のすべての科目が償却科目または固定資産科目（`fixedAssetAccounts`）である伝票のみ**（例：減価償却費／減価償却累計額）。**注意**：(1)「減価償却累計額」は除却・売却仕訳にも必ず出る科目のため償却の判定キーから外し、`fixedAssetAccounts` 側に置いた（ミナ見解）。(2) 現金・預金・未払金・損益科目など他科目が1つでも混在する伝票（期中売却の月割償却合算、少額減価償却資産の即時償却等）は除外せず **W017** を出して伝票単位で出力に残す（部分行だけ除外すると貸借が崩れるため）。(3) 取得仕訳・除却仕訳は除外しない（W003 のみ）。(4) `depreciationAccounts`／`fixedAssetAccounts` は **自社（顧問先）の科目表に合わせて編集** すること。(5) 最終的な境界線は顧問先の会計方針（直接法/間接法・台帳への登録範囲）により、税理士の確認が必要 |
| 部門・タグ | 既定で落として警告（W008）。部門は `departments: "passthrough"` で素通し可。タグは `tags: "memo_tag"` で出力テンプレートのメモタグ列（`from: *.mapped.memoTags`）へ渡せる（列が無ければ W008 のまま） |
| 複合仕訳 | `compoundEntries: "blank_side"`（借方行・貸方行を別行にし相手側空欄）または `"unsupported"`（E007で停止） |

出力は freee 用 CSV と差分レポート（Markdown＋CSV 4本＋`run.json`）。

## 2. 動作環境

- Node.js 20 以上（Node 22.22.2 で動作確認）
- 依存：`papaparse`（CSV）、`iconv-lite`（Shift_JIS）。それ以外の実行時依存はありません

```bash
cd accounting-converter
npm install
npm test          # 架空データでの自動テスト
```

## 3. 使い方

```bash
# 入力ファイルの文字コード・先頭行を確認する
npx tsx src/cli/index.ts inspect --input in/journal.csv

# 設定ファイルに TODO_VERIFY が残っていないか等を検査する
npx tsx src/cli/index.ts verify-config --profile config/profile.json

# 変換する（out/<日時>_<プロファイル名>/ に成果物を書き出す）
npx tsx src/cli/index.ts convert --profile config/profile.json --input in/journal.csv --out out/

# 転記作業の補助（§4）
npx tsx src/cli/index.ts init-local                                   # 本番用設定（git 管理外）を生成
npx tsx src/cli/index.ts adopt-headers --target config/targets/freee-generic.local.json --file config/templates/<公式テンプレート>.csv
npx tsx src/cli/index.ts adopt-headers --source config/sources/mf-journal.local.json  --file config/templates/<MFエクスポート>.csv
```

`convert` のオプション：

| フラグ | 意味 |
|---|---|
| `--dev` | `TODO_VERIFY:` の値を推定名のまま使って実行する（**開発・fixtures用**。W013 を出す。実データには使わない） |
| `--force` | error のある伝票を除外して残りを出力する（除外一覧はレポートに記載） |
| `--strict` | 対応表の `confirmed:false` エントリの使用を error に格上げする |
| `--suggester noop\|rule` | 未マッピング科目・税区分の**候補**をレポートに併記する（既定 `noop`＝なし）。`rule` はローカルの文字列規則＋別名辞書（`maps/account-aliases`）で候補を出す。候補は変換に適用されない（§8 参照） |

終了コード：`0`＝成功（警告なし）／`1`＝警告あり（出力あり）／`2`＝error あり（出力なし）または設定検証失敗。

### 成果物（`out/<日時>_<プロファイル名>/`）

| ファイル | 内容 |
|---|---|
| `freee_import.csv` | 変換結果（error が0のときのみ。`--force` 時は除外後） |
| `report.md` | 概要／勘定科目別 借方・貸方合計（移行元 vs 変換後）／税区分別合計／除外伝票と科目別合計／未マッピング一覧／取引先と重複候補／警告一覧／補助科目割当サマリ／確認依頼事項 |
| `report_accounts.csv` `report_taxcodes.csv` `report_unmapped.csv` `report_diagnostics.csv` | 上記の機械可読版（UTF-8 BOM付き。Excelで開ける） |
| `run.json` | 実行メタ（プロファイル名・設定ファイルのハッシュ・件数・所要時間）。明細データは含めない |

### 動作確認（架空データ）

```bash
npx tsx src/cli/index.ts convert --profile config/examples/profile.mf.json    --input fixtures/mf/normal.csv    --out out/
npx tsx src/cli/index.ts convert --profile config/examples/profile.yayoi.json --input fixtures/yayoi/normal.txt --out out/
```

`config/examples/` と `fixtures/` の列名・税区分名・フラグ値（`例_取引日`、`例S` など）は **テストのために作った架空の名前** で、実際の各社CSV仕様ではありません。

## 4. 設定の埋め方（社長作業（手順5のみ有資格者）・1回限り・目安 20〜40分）

本番用の設定は次の構成です。転記は **git 管理外のコピー**（`config/profile.json`、`*.local.json`）に対して行います（公式ヘッダー文字列をリポジトリにコミットしてよいかは規約確認待ち（リョウ）のため）。

```
config/
  profile.sample.json  → profile.json                      … 全体を束ねる（会計期間・オプション）
  sources/mf-journal.json      → mf-journal.local.json     … MF 仕訳帳CSV の列名（ヘッダー文字列）→ 中間モデル
  sources/yayoi-generic.json   → yayoi-generic.local.json  … 弥生 汎用形式 の列index・識別フラグ → 中間モデル
  targets/freee-generic.json   → freee-generic.local.json  … freee インポートCSV の列名・列順
  maps/accounts.sample.json    → accounts.local.json       … 勘定科目 対応表
  maps/taxcodes.sample.json    → taxcodes.local.json       … 税区分 対応表（日付範囲つき）
  maps/subaccount-rules.sample.json → subaccount-rules.local.json … 補助科目 → 取引先/補助科目/メモタグ の割当ルール
  maps/partners.sample.json    → partners.local.json       … 取引先の別名（名寄せ指示）
  maps/account-aliases.sample.json → account-aliases.local.json … `--suggester rule` 用の科目別名辞書（候補提示のみ）
  templates/                   … 公式テンプレート・実エクスポートの置き場（git 管理外・コミットしない）
```

最短手順：

1. **`npx tsx src/cli/index.ts init-local`**（約1分）。上記のコピーと `profile.json` の参照先書き換えを一括で行います。既存ファイルは上書きしません。`--force` を付けると **編集済みの全 `.local.json` と `profile.json` を破棄して作り直す** ので、やり直したいファイルが1つだけなら `cp config/targets/freee-generic.json config/targets/freee-generic.local.json` のように個別にコピーし直してください。
2. **ファイルを置く**（約10分）。freee ヘルプ「他社会計ソフトから仕訳データを移行する」から仕訳インポート用テンプレートをダウンロードし、`config/templates/` に置く。UTF-8版と Shift-JIS版の両方があるとされますが、**`adopt-headers --target` に使うのは `target.encoding`（既定 `utf8_bom`）に合う UTF-8 版の1ファイルだけ**（両方に実行すると `templateInfo` が最後のファイルを指し、列名との対応が不整合になる。Shift-JIS で出力したい場合は `encoding` を `shift_jis` にした上で Shift-JIS 版1ファイルに実行）。MF は「仕訳帳」から **架空データ数件だけ** を CSV エクスポートして同じ場所に置く（**Excel で開いて保存し直さない**。先頭の0や日付表記が書き換わるため）。ファイル名に顧問先名・事務所名を含めない。
3. **`adopt-headers` を各ファイルに実行**（約1分）：
   ```bash
   npx tsx src/cli/index.ts adopt-headers --target config/targets/freee-generic.local.json --file config/templates/<freeeテンプレート UTF-8版>.csv   # target には1ファイルだけ
   npx tsx src/cli/index.ts adopt-headers --source config/sources/mf-journal.local.json  --file config/templates/<MFエクスポート>.csv
   ```
   指定ファイルの **1行目（ヘッダー）をそのまま読み取り**、設定の `TODO_VERIFY:<推定名>` と突合（NFKC 正規化後の完全一致、または推定名がヘッダー文字列に含まれる/含む場合で候補が1つに絞れるとき）して列名を置き換えます。文字コード（UTF-8 / BOM / Shift_JIS）は自動判定。実行後に「置換した列／未確定の列／削除した列」を表示します。間違えたファイルで実行してしまったら、`cp config/targets/freee-generic.json config/targets/freee-generic.local.json`（source なら `cp config/sources/mf-journal.json config/sources/mf-journal.local.json`）で該当ファイルだけ元に戻して再実行できます。同じファイルで再実行しても、`from:null` の未確定列は `_todo` を保ったまま残ります。
   - 置き換わる列名は **社長が置いた実ファイルの文字列** であり、AI の推定ではありません。
   - ただし `from`（中間モデルとの対応）は設定側の推定を引き継ぐため、**対応が正しいかは人が確認**してください（`confirmed:false` 相当。「部分一致・要確認」と表示された列は特に）。
   - `--target`：テンプレートにあって設定に無い列は `from: null`＋`_todo` 付きで追加され、`verify-config` が error にします（中間モデルの項目を指定するか、不要なら列ごと削除）。設定にあってテンプレートに無い列は削除して表示します。`templateInfo`（ファイル名・`downloadedAt`＝**取り込み実行日**（実際の取得日と異なれば手で修正）・sha256・観測した文字コード）も埋めます。`downloadedFrom` は TODO のまま残るので手順4で URL を記入してください。「部分一致・要確認」で採用した列には `_note` を残します（`verify-config` の検査対象外。確認後に削除してよい）。
   - `--source`：ヘッダーに該当が無い列は `TODO_VERIFY` のまま残して一覧表示します（optional なら削除、必須なら手で指定）。エクスポートにあって設定に無い列も表示します。
   - 弥生（ヘッダー無し想定）は `adopt-headers` の対象外です。`npx tsx src/cli/index.ts inspect --input <弥生エクスポート>` で先頭行を表示し、列 index（0始まり）・識別フラグ列の有無・日付表記（西暦/和暦）を確認して `config/sources/yayoi-generic.local.json` の `index` / `grouping` を手で確定してください（識別フラグ列が無ければ `grouping.strategy` を `by_voucher_no` に）。
4. **残った `TODO_VERIFY` と `from` を手で確認**（約5分）。`amountMode`（税込/税抜）、`compoundEntries`（複合仕訳の書き方）、`required`、`encoding` は公式ヘルプの記載を見て設定します。金額列のように推定名とヘッダーが食い違って未確定になった列は手で指定します。
5. **対応表を有資格者が確定**（時間は科目数による）。`maps/accounts.local.json`・`maps/taxcodes.local.json` に、元CSVに実際に出てくる科目名・税区分文字列と freee 側の名称（正式名称は未確認）を記入し、`confirmed: true` にする。`--suggester rule` で出る候補は転記の参考にできますが、そのままでは適用されません。
6. **`npx tsx src/cli/index.ts verify-config --profile config/profile.json`** を実行し、`TODO_VERIFY 残数: 0` かつ「結果: OK」になるまで 4〜5 を繰り返す。

`TODO_VERIFY:` の後ろの文字列は「推定名」です。そのまま残すのではなく、必ず公式テンプレート・実エクスポートの文字列に置き換えてください。

### 設定の書式メモ

- 列指定は `{ "header": "…" }`（ヘッダー名一致）と `{ "index": n }`（0始まり）の両方を書けます。ヘッダーがあれば `header` を優先し、無ければ `index` にフォールバックします。`"optional": true` の列は無くてもエラーになりません。
- 勘定科目対応表のキーは元CSVの科目名で、照合時に NFKC 正規化・trim・連続空白圧縮をかけます（全角/半角の違いは吸収）。
- 税区分対応表は同じ `sourceTaxCode` を `effectiveFrom`/`effectiveTo` 付きで複数書けます（伝票日付で選択）。範囲外の日付は E003 で停止します。
- `options` の値域：`departments: drop|passthrough`、`tags: drop|memo_tag`（既定 drop）、`fixedAssets: warn|exclude`、`openingBalances: exclude_and_report|include_with_warning`。範囲外の値は `verify-config` で E000。
- 税区分が空欄のときは、科目が `defaultForBlank.appliesToAccounts` にある場合のみ `defaultForBlank.freeeTaxCode` を使い、それ以外は E003 で停止します。
- 経過措置の切替日（`options.invoiceTransitionDates`、既定 `2026-09-30`）は現行制度に基づきます（国税庁一次情報での再確認は未了・リサ確認待ち）。税制改正による延長が法制化された場合は、`maps/taxcodes` のエントリと切替日を追記してください（コード改修は不要）。

## 5. 検証ルール（実装済み）

停止（error。freee用CSVを出力しない）：

| コード | 内容 |
|---|---|
| E000 | 設定検証エラー（`TODO_VERIFY` 残り、必須列未定義、税区分の日付範囲重複 等） |
| E001 | 伝票単位の借方合計 ≠ 貸方合計 |
| E002 | 勘定科目が対応表に無い（`--strict` では `confirmed:false` の使用も） |
| E003 | 税区分が対応表に無い／該当期間のエントリが無い／空欄で既定が適用できない |
| E004 | 日付を解析できない |
| E005 | 金額を解析できない（小数含む）／列数不整合／必須列が無い・空／未知の識別フラグ値 |
| E006 | 出力テンプレートの必須列に値が入らない |
| E007 | 複合仕訳が出力テンプレート設定で表現不可（`compoundEntries: "unsupported"`） |
| E008 | 伝票に明細行が1つしかない（グループ化設定の見直し） |

警告（warning。出力は続行）：W001 取引先の完全一致衝突候補／W002 取引先の表記ゆれ候補／W003 固定資産科目／W004 減価償却関連科目／W005 日付範囲がインボイス経過措置切替日をまたぐ／W006 会計期間外／W007 期首残高・繰越（除外）／W008 部門・タグ・補助科目を落とした（`departments:'drop'`／`tags:'drop'`／メモタグ列なし）／W009 税額が逆算値と±1円超で乖離／W010 負の金額／W011 伝票番号の非連続重複／W012 `confirmed:false` の対応表エントリを使用／W013 `--dev` で `TODO_VERIFY` のまま実行／W014 `amountMode: unknown` のまま借貸チェック／W015 同一補助科目名が複数の親科目で異なる割当結果／W017 償却仕訳に他科目が混在（期中売却の月割償却合算、少額減価償却資産の即時償却等の可能性。伝票単位で出力に残した）。

情報（info）：I001 文字コード判定／I002 除外した伝票数／I003 グループ化戦略と伝票数・明細数。

## 6. 構成

```
src/core/     変換ロジック（純関数。ファイル・ネットワークに触れない。将来ブラウザUI・n8n化で流用）
  index.ts    convert() と公開API
  model.ts    中間モデル JournalEntry / JournalLine / MappedLine / Diagnostic
  config.ts   設定の型・verifyConfig()・stripTodoVerify()
  encoding.ts decodeBytes / encodeText（UTF-8 BOM / Shift_JIS）
  csv.ts      parseCsv / toCsv（papaparse の薄いラッパ。物理行番号を保持）
  normalize.ts 名称正規化・金額/日付解析（全角・和暦）・レーベンシュタイン距離
  adapters/   common.ts（列解決・グループ化・フラグ検出）、mf.ts、yayoi.ts
  mapping.ts  applyMappings（科目・税区分・補助科目ルール・取引先別名）
  validate.ts 検証ルール
  output.ts   renderOutput（freee用CSV）
  report.ts   buildReport / renderReportMarkdown / renderReportCsvBundle
  suggest.ts  MappingSuggester インターフェース＋NoopSuggester＋RuleSuggester（ローカル規則・別名辞書）
  adopt.ts    adoptTargetHeaders / adoptSourceHeaders（ヘッダー文字列と設定の突合。純関数）
src/cli/      index.ts（inspect / verify-config / convert / init-local / adopt-headers）、load.ts（プロファイル読込・ハッシュ）、setup.ts（init-local・adopt-headers のファイル操作）
config/       本番用テンプレート（TODO_VERIFY 付き）と examples/（テスト用・架空）
fixtures/     架空データ（scripts/make-fixtures.ts で生成）。templates/ は adopt-headers テスト用の架空ヘッダーCSV
test/         node:test（npm test）
```

## 7. テスト

`npm test` で `node --test`（tsx 経由）を実行します。設計書 §7 の T1〜T13 に対応：

| # | 内容 | テスト |
|---|---|---|
| T1 | 正常系（MF・弥生） | `mf.test.ts` / `yayoi.test.ts` |
| T2 | 複合仕訳（blank_side / unsupported） | `mf.test.ts` |
| T3 | 未マッピング科目・税区分 | `mf.test.ts` |
| T4 | 借貸不一致 | `mf.test.ts` |
| T5 | 重複取引先（W001/W002、aliases で消える） | `mf.test.ts` |
| T6 | 固定資産・減価償却（warn / exclude） | `mf.test.ts` |
| T7 | 2026-09-30 またぎ（W005、控80/控50 振り分け） | `mf.test.ts` |
| T8 | 期首残高（弥生） | `yayoi.test.ts` |
| T9 | Shift_JIS・ヘッダー無し・BOM | `yayoi.test.ts` / `mf.test.ts` |
| T10 | 金額・日付フォーマット異常 | `mf.test.ts` |
| T11 | 設定検証（`TODO_VERIFY` 検出、`--dev` で W013） | `config.test.ts` / `cli.test.ts` |
| T12 | ローカル完結の静的検査 | `local-only.test.ts` |
| T13 | 往復整合 | `mf.test.ts` |
| 追加 | W006/W009/W011/W015/W017/E005/E008、CLI 終了コード、正規化ユニット | `rules.test.ts` / `cli.test.ts` / `normalize.test.ts` |
| 追加 | `init-local`（上書きしない／`--force`）、`adopt-headers`（置換・未確定・削除の報告、曖昧一致は置換しない、`_todo` を `verify-config` が検出） | `adopt.test.ts` |
| 追加 | `RuleSuggester` の各規則（完全一致・記号除去・別名辞書・前方/後方一致・税率数字）と「候補は適用されない」こと、`LlmSuggester` 不在 | `suggest.test.ts` |

`expected/*.json` との比較方式（設計書 §7）ではなく、テストコード内で期待値を直接アサートしています。

## 8. 未実装項目・設計書との相違

設計書 v3 との相違（v4 で反映済み・記録として残す）：

- `convert()` は **非同期**（`async`／`Promise<ConvertResult>`）です。v3 §2 の「同期」は誤記。
- `suggester`／`codec` は `ConvertOptions` ではなく `ConvertInput` に置いています。
- v3 の `pureDepreciation` 属性は、本実装では `DEPRECIATION_MIXED` フラグの否定（`pureDepreciation === !DEPRECIATION_MIXED`）として表現しています。
- W004 は `DEPRECIATION` の伝票 **全件** に出します（v3 §4.2 の「純粋な償却仕訳のみ」ではない）。混在伝票は W004＋W017 の両方が出ます。
- W003 の文言に v3 リスク11 の追記案（「台帳へ除却・売却を登録する場合は自動生成の設定も確認」）は採用していません。
- 除外処理は `applyMappings` 内ではなく `convert()` 内で行います。`fixedAssetAccounts` のコード側既定は空（サンプルJSONで供給。空だと除外は起きず安全側）。
- `expected/*.json` は使わず、テストコード内で直接アサートします。

以下は設計書 v2 時点からの記録です。

設計書 v2 の「v1 からの変更点」15項目（A-1/A-2、`convert` 非同期、`tagsRaw`、`E000`、W012 の `--dev` 時挙動、`verifyConfig` の値域検査、`run.json.input`、README 追記、encoding 層の差し替え前提）は本実装に反映済みです。ただし #13（fixtures の `例_` 接頭辞）は**一部のみ**：接頭辞を付けたのは「例_ABC商事」「例_A銀行」「例_B銀行」で、「サンプル商事株式会社」「（株）サンプル商事」「ダミー物産」「テスト工業有限会社」は明らかなプレースホルダー名のためそのままです。以下は未実装項目と、v2 と異なる／v2 に書かれていない実装上の決め事です。

v2 と異なる点：

- `convert(input, opts)` は2引数です（v2 §2 は `input.options`）。E000（設定検証エラー）のときも `dataset`／`report` は `null` ではなく空の Dataset と Report を返します。
- `applyMappings()` は同期で、`suggester` 引数を持ちません（v2 §2.4 は非同期）。`MappingSuggester` の呼び出しは `convert()` 側で行っています。非同期化はフェーズ1で検討。
- `Codec.encodeText` は `convert()` 内では使いません（`decodeBytes` のみ）。出力のエンコードは CLI が `src/core/encoding.ts` の `encodeText` を直接呼びます。ブラウザ化時は CLI 相当のシェル側で注入 codec の `encodeText` を使う想定。

未実装：

- `LlmSuggester`（設計書 v4 §8）、`config/approvals.json`、`--i-confirm-external-ai`、W016、`--write-suggestions`。外部AIは社長の承認未了のため未実装。`--suggester` フラグは `noop | rule` のみ受け付け、それ以外はエラー。
- **`RuleSuggester` は実装済み**（社長回答 D-4「まずルールベースの提案まで」に基づく。v4 §8 では「未実装」とされていた項目）。勘定科目は (i) 正規化後の完全一致 1.0 → (ii) 記号・空白・括弧内除去後の一致 0.9 → (iii) 別名辞書 `maps/account-aliases` 0.8 → (iv) 前方/後方一致 0.5 の順で最大3件、税区分は正規化一致＋税率数字（売上/仕入の語が合えば 0.6、数字のみ 0.4）。候補はレポート §5「未マッピング一覧」の「提案」列に根拠付きで併記されるだけで、**変換には適用されず E002/E003 は解消されない**（人間が対応表に転記して `confirmed:true` にする）。v4 §8.1 の「freee側科目一覧（社長が用意）」は使わず、対応表 `maps/accounts` の `freeeAccount` 値の集合と別名辞書を候補の母集団にしています。別名辞書の同梱例は `例_` 付きの架空で、実在の科目体系を示すものではありません。
- `init-local`／`adopt-headers` は v4 §6.4 に無い CLI コマンドです（社長回答 B「進めやすいように準備」への対応）。`adopt-headers` はファイルの1行目の文字列を転記するだけで、列名の推定はしません。`TargetColumn._todo`（未確定列の目印）・`_note`（部分一致採用の記録）と `templateInfo.encodingObserved` は設計書に無い項目です。
- アオイ監査（2026-09-18）反映：`adopt-headers` の再実行で `from:null` 列の `_todo` が消える穴を修正（`from` が null で TODO_VERIFY からの置換でない列は `_todo` を保持）。レポート §5 の列名を「候補（未適用）」に改め、候補があるときは「変換には適用されていない・数値は確率ではない」旨を1行出します。
- ブラウザ用 codec の実装。`ConvertInput.codec`（`decodeBytes`/`encodeText` の注入口）は用意し、未指定時は `src/core/encoding.ts`（`iconv-lite`・Node `Buffer` 依存）を使います。ブラウザ版では `TextDecoder('shift_jis')`＋Shift_JIS エンコード可能な別実装を注入する想定（未作成）。

実装上の決め事：

- `options.tags: "memo_tag"` は `tagsRaw` を分割せず1つのメモタグとして渡します（MF のタグ列に複数タグがどう格納されるかは未確認）。同じ行の借方・貸方の両方の明細に付きます。
- `run.json` の `input` は `{ fileName, encoding, hadBom, physicalRows, sha256 }`。`fileName` はパスではなくファイル名のみ。明細データは含めません。
- E002/E003 は明細行ごとに1件出します（レポートの未マッピング一覧では値ごとに集計）。error になった伝票は出力レンダリングをスキップするため、同じ伝票に E006 が重複して出ることはありません。
- `hasHeader: "auto"` の判定は「1行目のセルが `headerSignature` または `columns[].header` のいずれかと一致するか」で行います。
- 期首残高の検出は v2 §2.3 どおり、(a) 摘要・メモのキーワード（既定 `期首残高／開始残高／前期繰越／前期より繰越／期首繰越`。科目名は照合しない）、(b) 伝票日付＝会計期間開始日 かつ 科目が `openingBalanceCounterAccounts` に含まれる、のいずれか。
- `fixedAssets: "exclude"` で除外されるのは `DEPRECIATION` フラグかつ `DEPRECIATION_MIXED` フラグを持たない伝票のみ（ミナ見解に基づく v2 からの変更。`DEPRECIATION_MIXED` フラグと W017 は v2 に無い追加項目）。`FIXED_ASSET` はどの設定でも除外しない。純粋な償却仕訳には `FIXED_ASSET` フラグ（W003）を付けない。
- freee の固定資産台帳は、除却・売却仕訳も設定により自動生成しうる（ミナ確認）。移行時点で在籍する資産のみ台帳に入れる前提では、過去の除却・売却仕訳は通常仕訳として移行すべきだが、期中除却資産を台帳に含めた場合の挙動は未確認。
- `confirmed:false` の対応表エントリは `--dev` でも W012 を出します。
- T9 の MF 側 fixture は `mf/normal.csv`（BOM付き）＋ `mf/utf8-nobom.csv`（BOMなし）の2本で判定を確認しています。
- W002 の距離しきい値は `partnerFuzzyThreshold`（既定2、法人格除去後の文字数が5以下なら1）。
- 弥生アダプタは MF と同じ共通処理を使い、取引先列を持たない点だけが異なります（弥生の「税区分＋税計算区分」結合表記は文字列のまま対応表で引く前提）。
- `inspect` は区切り文字カンマ固定・1行目をヘッダーと仮定して表示します。
- テストは `expected/*.json` 比較ではなく、テストコード内で期待値を直接アサートしています。

## 9. 既知の制約・注意

- **列定義が未確認**であることが最大のリスクです。`TODO_VERIFY` を残したまま実データに使うと誤変換します。`verify-config` のゲートを外さないでください。
- 借貸チェックは「同一伝票内で税込/税抜が統一されている」前提です。元CSVが税抜金額＋税額列の形の場合は `amountMode` を正しく設定してください。
- 弥生汎用形式のグループ化（識別フラグか伝票番号か）は実ファイルを見るまで決められません。アダプタは両方に対応しています。
- `iconv-lite` の CP932 機種依存文字（①・㈱・髙 等）の扱いは実ファイルで確認が必要です（テストでは ①・㈱ の往復のみ確認）。
- PoC は架空データ限定です。実データ（会計事務所・顧問先）の使用は、社長承認・仮名化方針・秘密保持の整理を経てから。
- 公式テンプレート・実エクスポートファイルは `config/templates/` にのみ置き、リポジトリにコミットしないでください（各社の著作物であり再配布の可否が未確認）。
- 本ツールは freee への実インポートを行いません。インポート操作と結果確認は会計事務所側の有資格者が行ってください。
- 本ツールの外販・配布は、各社規約・商標・免責文言の整理待ちで **未承認** です（社内PoC用途に限る）。
- 入力ファイル名に顧問先名・個人名を含めないでください（ファイル名は `report.md`・`run.json` に転記されます）。
