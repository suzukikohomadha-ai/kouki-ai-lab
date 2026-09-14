# accounting-converter — 会計ツールコンバータ PoC（フェーズ0）

弥生会計／マネーフォワードクラウド会計（MF）の仕訳CSVを、freee会計の仕訳インポート用CSVに変換する **ローカル完結型の CLI** です。
株式会社コホマダ T13「会計ツールのコンバータ構築」の PoC。設計は `logs/kohomada_2026-09-14_会計ツールコンバータPoC詳細設計_v2.md`（メイ作成。v1 にアオイ監査を反映したもの）に基づきます。

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
| 期首残高・繰越 | 検出して出力から除外し、科目別合計をレポートに出す（変換しない） |
| 固定資産・減価償却 | 検出して警告（W003 取得仕訳／W004 減価償却仕訳）。`fixedAssets: "exclude"` で除外されるのは **減価償却仕訳のみ**。取得仕訳（例：借方 工具器具備品／貸方 普通預金）は資金移動のため除外しない（除外すると預金残高が合わなくなる） |
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
```

`convert` のオプション：

| フラグ | 意味 |
|---|---|
| `--dev` | `TODO_VERIFY:` の値を推定名のまま使って実行する（**開発・fixtures用**。W013 を出す。実データには使わない） |
| `--force` | error のある伝票を除外して残りを出力する（除外一覧はレポートに記載） |
| `--strict` | 対応表の `confirmed:false` エントリの使用を error に格上げする |

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

## 4. 設定の埋め方（社長作業・1回限り）

本番用の設定は次の構成です。`config/profile.sample.json` を `config/profile.json` にコピーして使います（`config/profile.json` は git 管理外）。

```
config/
  profile.sample.json            … 全体を束ねる（会計期間・オプション）
  sources/mf-journal.json        … MF 仕訳帳CSV の列名（ヘッダー文字列）→ 中間モデル
  sources/yayoi-generic.json     … 弥生 汎用形式 の列index・識別フラグ → 中間モデル
  targets/freee-generic.json     … freee インポートCSV の列名・列順
  maps/accounts.sample.json      … 勘定科目 対応表
  maps/taxcodes.sample.json      … 税区分 対応表（日付範囲つき）
  maps/subaccount-rules.sample.json … 補助科目 → 取引先/補助科目/メモタグ の割当ルール
  maps/partners.sample.json      … 取引先の別名（名寄せ指示）
  templates/                     … 公式テンプレート・実エクスポートの置き場（git 管理外・コミットしない）
```

手順（設計書 §3.7 と同じ）：

1. freee ヘルプ「他社会計ソフトから仕訳データを移行する」から仕訳インポート用テンプレート（UTF-8版・Shift-JIS版）をダウンロードし、`config/templates/` に置く。**Excel では開かず**テキストエディタで開く（Excel は先頭の0や日付表記を書き換えるため）。
2. テンプレート1行目のヘッダーを `config/targets/freee-generic.json` の `columns[].name` に **列順どおり・文字列完全一致** で転記する（全角/半角・括弧・空白まで一致させる）。テンプレートに無い列は削除し、テンプレートにあって中間モデルに対応が無い列は `"from": null` を追加する。
3. 同ページに「金額は税込か税抜か」「複合仕訳の書き方」「必須列」「文字コード」「行数上限」の記載があれば、`amountMode` / `compoundEntries` / `required` / `encoding` に反映し、`templateInfo` にファイル名・取得日を記録する。
4. MF：試用または自社事業所の「仕訳帳」から **架空データ数件だけ** を CSV エクスポートし、ヘッダー行を `config/sources/mf-journal.json` の各 `header` に転記する。金額列が税込か、複合仕訳が同一取引Noの複数行か、BOM の有無をメモする。
5. 弥生：同様に汎用形式で数件エクスポートし、ヘッダー行の有無・文字コード・列順・識別フラグ列の有無・日付表記（西暦/和暦）を確認して、`config/sources/yayoi-generic.json` の `index` / `grouping` を確定する（識別フラグ列が無ければ `grouping.strategy` を `by_voucher_no` にする）。
6. 税区分の対応（`maps/taxcodes`）は、元CSVに実際に出てくる税区分文字列と、freee 側の税区分名称（正式名称は未確認）を **有資格者が確定** し、`confirmed: true` にする。勘定科目（`maps/accounts`）も同様。
7. `npx tsx src/cli/index.ts verify-config --profile config/profile.json` を実行し、`TODO_VERIFY 残数: 0` かつ「結果: OK」になるまで繰り返す。

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

警告（warning。出力は続行）：W001 取引先の完全一致衝突候補／W002 取引先の表記ゆれ候補／W003 固定資産科目／W004 減価償却関連科目／W005 日付範囲がインボイス経過措置切替日をまたぐ／W006 会計期間外／W007 期首残高・繰越（除外）／W008 部門・タグ・補助科目を落とした（`departments:'drop'`／`tags:'drop'`／メモタグ列なし）／W009 税額が逆算値と±1円超で乖離／W010 負の金額／W011 伝票番号の非連続重複／W012 `confirmed:false` の対応表エントリを使用／W013 `--dev` で `TODO_VERIFY` のまま実行／W014 `amountMode: unknown` のまま借貸チェック／W015 同一補助科目名が複数の親科目で異なる割当結果。

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
  suggest.ts  MappingSuggester インターフェース＋NoopSuggester
src/cli/      index.ts（inspect / verify-config / convert）、load.ts（プロファイル読込・ハッシュ）
config/       本番用テンプレート（TODO_VERIFY 付き）と examples/（テスト用・架空）
fixtures/     架空データ（scripts/make-fixtures.ts で生成）
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
| 追加 | W006/W009/W011/W015/E005/E008、CLI 終了コード、正規化ユニット | `rules.test.ts` / `cli.test.ts` / `normalize.test.ts` |

`expected/*.json` との比較方式（設計書 §7）ではなく、テストコード内で期待値を直接アサートしています。

## 8. 未実装項目・設計書（v2）との相違

設計書 v2 の「v1 からの変更点」15項目（A-1/A-2、`convert` 非同期、`tagsRaw`、`E000`、W012 の `--dev` 時挙動、`verifyConfig` の値域検査、`run.json.input`、fixtures の `例_` 接頭辞、README 追記、encoding 層の差し替え前提）は本実装に反映済みです。以下は未実装項目と、v2 にも書かれていない実装上の決め事です。

未実装：

- `RuleSuggester`・`LlmSuggester`（v2 §8）。`MappingSuggester` インターフェースと `NoopSuggester` のみ。外部LLMの利用は社長の承認未了のため、`--suggester` フラグ・`config/approvals.json`・W016 も未実装。
- ブラウザ用 codec の実装。`ConvertInput.codec`（`decodeBytes`/`encodeText` の注入口）は用意し、未指定時は `src/core/encoding.ts`（`iconv-lite`・Node `Buffer` 依存）を使います。ブラウザ版では `TextDecoder('shift_jis')`＋Shift_JIS エンコード可能な別実装を注入する想定（未作成）。

実装上の決め事：

- `options.tags: "memo_tag"` は `tagsRaw` を分割せず1つのメモタグとして渡します（MF のタグ列に複数タグがどう格納されるかは未確認）。同じ行の借方・貸方の両方の明細に付きます。
- `run.json` の `input` は `{ fileName, encoding, hadBom, physicalRows, sha256 }`。`fileName` はパスではなくファイル名のみ。明細データは含めません。
- E002/E003 は明細行ごとに1件出します（レポートの未マッピング一覧では値ごとに集計）。error になった伝票は出力レンダリングをスキップするため、同じ伝票に E006 が重複して出ることはありません。
- `hasHeader: "auto"` の判定は「1行目のセルが `headerSignature` または `columns[].header` のいずれかと一致するか」で行います。
- 期首残高の検出は v2 §2.3 どおり、(a) 摘要・メモのキーワード（既定 `期首残高／開始残高／前期繰越／前期より繰越／期首繰越`。科目名は照合しない）、(b) 伝票日付＝会計期間開始日 かつ 科目が `openingBalanceCounterAccounts` に含まれる、のいずれか。
- `fixedAssets: "exclude"` で除外されるのは `DEPRECIATION` フラグの伝票のみ（`FIXED_ASSET` はどの設定でも除外しない）。
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
