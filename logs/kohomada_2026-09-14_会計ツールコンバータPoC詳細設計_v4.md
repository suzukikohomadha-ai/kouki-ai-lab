# 会計ツールコンバータ PoC（フェーズ0）詳細設計書 v4 ― CSVベース・ローカル完結型

- 作成：メイ（AI Automation & Operations Architect）
- 関連タスク：T13「会計ツールのコンバータ構築（コホマダ金融）」
- 対象事業：株式会社コホマダ（AI・DX事業／金融関連事業）。KINOTO・個人FP事業の情報は含まない
- 実装担当：ノヴァ（Web & Three.js Technical Architect）。実装先：`accounting-converter/`
- 作成日：2026-09-18（ファイル名の日付 `2026-09-14` はシリーズ継続のため v1〜v3 と同じにしている）
- ステータス：v4 Draft。**目的は「設計書を実装に合わせる」ことのみ**で、仕様の追加・変更は行っていない。実装＝`accounting-converter/README.md` §8「未実装項目・設計書との相違」を正とし、`src/core/index.ts`・`validate.ts`・`adapters/common.ts`・`model.ts`・`fixtures/mf/fixed-assets.csv`・`test/rules.test.ts`（該当箇所）で突合した
- 前版：v3 `logs/kohomada_2026-09-14_会計ツールコンバータPoC詳細設計_v3.md`（v1〜v3 は上書きせず保存）
- 先行資料（すべて2026-09-14付・`logs/`配下）：技術実現可能性（メイ）／移行課題リサーチ（リサ）／会計リスク整理（ミナ）／規約法務論点整理（リョウ）／事業モデル仮説（レン）

> **本設計書の最重要前提（v1から変更なし）**：本セッションでは egress proxy により `support.freee.co.jp` `developer.freee.co.jp` `biz.moneyforward.com` `support.yayoi-kk.co.jp` がブロックされており、**freee・MF・弥生いずれの公式CSV列定義も直接確認できていない**。本書は列名・列順を一切断定せず、外部設定ファイルに切り出して `TODO_VERIFY:` プレースホルダで示す。正確な値は社長が公式テンプレートをダウンロードして転記する（§3.7）。コード側は `TODO_VERIFY` が残っていれば本番変換を拒否する（§3.8）。

---

## v3 からの変更点（すべて「実装に合わせる」修正。仕様の追加・変更なし）

| # | 区分 | 変更内容 | 該当節 |
|---|---|---|---|
| 3 | 誤記訂正 | `convert()` は**非同期**（`async`／`Promise<ConvertResult>`）。v3 §2 の関数定義・説明文、参考表 #3、§8.1、次のアクション1 にあった「同期」は誤記。`applyMappings()` は同期のまま（これは v3 どおり）。`suggester.suggest()` は `convert()` 内で `await` する | §2、§2.4、§6.3、§8.1、参考表 #3 |
| 4 | 整合 | `suggester`／`codec` は `ConvertOptions` ではなく **`ConvertInput`** に置く。`ConvertOptions` は `dev`／`force`／`strict` のみ。`ConvertInput` には `configHashes`／`runAt` もある | §2、§6.1 |
| 5 | 整合 | `EntryFlag` に **`DEPRECIATION_MIXED`** を追加。v3 の `pureDepreciation` は独立属性ではなく、`DEPRECIATION_MIXED` の否定（`pureDepreciation === !DEPRECIATION_MIXED`）として説明。名称は実装側に統一 | §2.3、§2.4、§1.2 |
| 6 | 整合 | §4.2 W004 の範囲を「`DEPRECIATION` 全件（混在伝票は W004＋W017 の両方が出る）」に修正。W003 の文言は実装どおり「取得仕訳の扱いを確認」のみ。v3 リスク11 の追記案（「台帳へ除却・売却を登録する場合は自動生成の設定も確認」）は**未採用**（README §8 に記載） | §4.2、リスク11 |
| 7 | 整合 | §7 T6 の fixture 記述を「`mf/fixed-assets.csv`（取得・月次償却・雑費の3行）＋`rules.test.ts` のインラインケース（除却・少額即時償却・期中売却合算）」に修正。`expected/*.json` は §6.3・§7 から削除（テストコード内で直接アサート） | §6.3、§7 |
| 追 | 整合 | 除外処理（期首残高・減価償却・`--force`）の位置は `applyMappings` 内ではなく **`convert()` 内**。`fixedAssetAccounts` のコード側既定は**空**（サンプルJSONで供給。空だと `DEPRECIATION_MIXED` になりやすく除外は起きず安全側） | §2.3、§2.4 |
| 追 | 整合 | 実装に存在する細部を追記：`ConvertResult.stats.outputEntries`／`ConvertResult.excluded`、`MappedLine.provenance.tax` に `'default_blank'`、E002 は `--strict` 時に `confirmed:false` 使用も含む、E005 に「未知の識別フラグ値」、`src/cli/load.ts`・`scripts/make-fixtures.ts`・`config/examples/` の存在、`hasHeader:'auto'` の判定基準、`tags:'memo_tag'` の挙動、`Codec.encodeText` は `convert()` 内では未使用 | §2、§2.2、§2.3、§2.4、§4.1、§6.1、§6.3 |

§9 社長確認事項・§10 人間承認が必要な事項は v3 から変更なし。

### 参考：v2 → v3 の変更点（v3 から転記。#3 の扱いを訂正）

| # | 区分 | 変更内容 | 該当節 |
|---|---|---|---|
| (a) | 整合 | リスク8 の補完策を実在する手段（期首残高・除外伝票セクション＋`report_diagnostics.csv` の W006/W007 突合）に修正 | リスク8 |
| (b) | 整合 | fixtures の取引先名の記述を実態に合わせた（`例_` 接頭辞は「例_ABC商事」「例_A銀行」「例_B銀行」のみ） | §7 |
| (c) | 整合 | `convert(input, opts)` の2引数化、E000 時は空の Dataset／Report、`applyMappings` 同期・suggester 引数なし。**ただし v3 で `convert` を「同期」と書いたのは誤記（v4 #3 で訂正。実装は非同期）** | §2、§2.4 |
| (d) | 追記 | `verifyConfig()` の `options` 4項目の値域検査 | §3.8 |
| (e)(f) | 仕様変更 | 減価償却仕訳の除外判定（`depreciationAccounts` から「減価償却累計額」を外す、混在伝票は W017 で残す）、freee 台帳の自動生成範囲の訂正 | §1.2、§2.3、§2.4、§4.2、リスク10・11 |

### 参考：v1 → v2 の変更点（要旨のみ）

A-1 期首残高検出の限定／A-2 固定資産除外の限定／`tagsRaw`／`E000`／W012 の `--dev` 時挙動／`verifyConfig` の値域検査／`run.json.input`／`RuleSuggester` はフェーズ1／`encoding.ts` の `Buffer` 依存明記。詳細は v2・v3 を参照。

---

## 要約

1. **PoCは「CSV in → CSV out、外部通信ゼロ」のNode.js CLI（TypeScript）**として作る。変換ロジックは純関数（`src/core/`）に閉じ込め、将来のブラウザUI化・n8n化で再利用できる構造にする（ただし encoding 層は環境依存のため差し替え前提。§6.1）。この形はリョウの規約整理がどちらに転んでも成立し、レンの差別化仮説（AIマッピング提案＋差分検証＋専門家最終確認）の土台になる。
2. **入力の第1優先はMF「仕訳帳」CSV、第2優先は弥生「汎用形式」CSV**。MFはヘッダー行を持つと見られ（検索要約ベース）、列名ベースの読み込みでパイプライン検証に集中できる。弥生は文字コード・ヘッダー有無・税区分結合コードの不確実性が大きく、アダプタ層で吸収する。**社長の想定顧客が弥生中心なら順序を入れ替える**（§9）。
3. **PoCで扱うのは：仕訳・勘定科目（対応表）・税区分（対応表、自動判定なし）・取引先（マッピング＋重複/表記ゆれ検出）。期首残高は検出・集計・レポートのみ。減価償却仕訳は検出して警告（設定で純粋な償却仕訳のみ除外可）、固定資産の取得・除却仕訳は警告のみで除外しない。部門・品目・メモタグは既定で落として警告**。
4. 検証は「停止（error）」と「警告で続行（warning）」に分け、**設定不備・借貸不一致・未マッピング科目/税区分・日付/金額の解析失敗は停止**、**重複取引先候補・固定資産/減価償却科目・インボイス経過措置切替日またぎ・部門等の欠落は警告**。
5. 差分レポートは Markdown と CSV の両方。**勘定科目別の借方/貸方合計（移行元 vs 変換後）**を中核に、未マッピング一覧・警告一覧を添える。
6. AIマッピング提案（フェーズ1）は `MappingSuggester` の差し込み口だけを用意し、**PoCでは `NoopSuggester` のみ**。外部LLMへの送信は `approval-policy.md` 上、社長の事前承認が必要であり、有効化には承認記録＋明示フラグを要する（未実装）。
7. **人間の承認が必要な事項**は §10 に独立して列挙。PoCは架空データのみで動かし、外販は未承認。

---

## 結論

- PoCの目的は「変換精度100%」ではなく、**(a) 列定義を設定に外出しした変換パイプラインが動くこと、(b) 停止/警告の分類が会計上のリスク（ミナ整理）に対応していること、(c) 差分レポートが専門家の最終確認に使える形であること**の実証に置く。
- 規約（リョウ）・ヒアリング（ミナ質問リスト）の結果を待たずに着手できる範囲は §1〜§7 のすべて（架空データ前提）。着手できないのは「実データでの検証」「公式列定義の確定」「外部LLM利用」で、いずれも社長の作業・承認が前提（§9・§10）。
- 本 v4 は実装（`accounting-converter/`）と整合した状態を記述している。以後、実装と本書が食い違った場合は README §8 を正とし、本書を次版で追随させる。

---

## 先行資料からの引用（本文未検証）

> 以下はすべて先行5資料からの引用であり、各資料はWebSearch要約ベースで一次情報の本文を直接確認できていない。本書もその制約を引き継ぐ。「確認済み」とは扱わない。

- freeeは「他社会計ソフトから仕訳データを移行する」機能とCSVテンプレート（Shift-JIS版／UTF-8版）を公式に用意しているとされる。弥生会計形式・マネーフォワード形式・freee汎用形式など複数の形式があるとされる〔メイ技術検討・リサ調査〕。
- 弥生会計（デスクトップ）は仕訳日記帳を「弥生インポート形式」「汎用形式」でエクスポートでき、汎用形式は区切り文字にカンマを指定できるとされる〔メイ技術検討〕。やよいの青色申告オンラインのエクスポートCSVにはヘッダー行が付かないという指摘がある〔リサ調査〕。
- 弥生会計の消費税は「税区分」と「税計算区分」に分かれ、テキストのインポート/エクスポート時は結合した形式で記載されるとされる〔ミナ整理〕。
- MFクラウド会計「仕訳帳」CSVの項目は、取引No・取引日・勘定科目・補助科目・部門・取引先・税区分・インボイス・金額・摘要・タグ・メモ等とされる〔リサ調査。正確な列名・列順は未確認〕。
- freeeは取引先名・品目名・部門名の完全一致の重複を許可しない仕様があるとの指摘がある〔リサ調査（第三者ブログの要約）〕。
- freeeは固定資産台帳に登録すると減価償却仕訳を自動生成するため、台帳インポートと減価償却費を含む仕訳インポートを両方行うと二重計上の恐れがあるとされる〔ミナ整理・freee公式ヘルプの要約〕。加えて、除却・売却を台帳に登録した場合も、除却・売却仕訳を自動生成する／しないを選択できるとされる〔ミナ確認・freeeヘルプ「固定資産を除却する」「【法人】固定資産の売却を記帳する」。本文は本セッションでは未取得〕。
- インボイス制度の経過措置は、現行制度では2026年9月30日までが80%控除、2026年10月1日〜2029年9月30日が50%控除とされる〔ミナ整理〕。**国税庁一次情報での再確認は未了**（リサに依頼中）。令和8年度税制改正大綱による延長は未確認。
- 弥生Web APIは金融機関口座連携中心の規約に見え、freee/MFのAPI規約原文も未確認〔リョウ整理〕。→ 本PoCはAPIを一切使わないため、この未確定に依存しない。

## 推測・仮説

- [推測] MF仕訳帳CSVは1行に借方・貸方の両側を持ち、複合仕訳は同一「取引No」の複数行で表現される。弥生汎用形式も同様で、伝票番号または識別フラグでグループ化される。→ 中間モデルは「グループ化戦略」の設定で両方を吸収する（§2.3）。
- [推測] MFのエクスポートはUTF-8（BOM付きの可能性）、弥生デスクトップはShift_JIS（CP932）。→ 自動判定＋設定で強制（§2.1）。
- [仮説] freee汎用形式テンプレートも1行に借方・貸方両側を持つ。複合仕訳の表現方法は不明。→ 出力設定 `compoundEntries` で切り替える（§3.2）。
- [仮説] 弥生・MFの摘要はfreeeの「摘要」相当列にそのまま入れられる。

---

## §1. PoCのスコープ

### 1.1 入力・出力

| 項目 | 内容 |
|---|---|
| 入力（第1優先） | MFクラウド会計「仕訳帳」エクスポートCSV（`source: mf_journal`） |
| 入力（第2優先） | 弥生会計「汎用形式」エクスポート（.txt/.csv、カンマ区切り。`source: yayoi_generic`） |
| 出力 | freee会計「他社会計ソフトインポート」用CSV（freee汎用形式テンプレート準拠を既定。`target: freee_generic`）＋差分レポート（Markdown＋CSV） |
| 実行環境 | 会計事務所（または社長）のPC上のNode.js CLI。**ネットワーク通信なし** |

**優先順位の理由**：MFはヘッダー行あり・UTF-8想定で「列名で読む」実装が安定しやすく、まず骨格（正規化→マッピング→検証→出力→レポート）を確実に動かせる。弥生は読み込み側固有の不確実性があり、骨格が固まった後にアダプタ1枚を追加する形が手戻りが少ない。両方ともPoC内で実装済み（弥生アダプタは MF と共通処理を使い、取引先列を持たない点のみ異なる）。

> 補足：freeeが「マネーフォワード形式」「弥生会計形式」テンプレートを用意しているとされる〔リサ調査〕。公式テンプレート確認の結果、MF/弥生のエクスポートをほぼそのまま受け付けられると判明した場合、コンバータの価値は「形式変換」ではなく「マッピング・検証・差分レポート」に寄る。出力先は `targets/*.json` で差し替え可能にしておく。

### 1.2 データ種別ごとの扱い

| データ種別 | PoCでの扱い | 備考 |
|---|---|---|
| 仕訳（日付・伝票番号・借方/貸方科目・金額・摘要） | **変換する** | 中核 |
| 勘定科目 | **対応表で変換**（`maps/accounts.json`）。未対応は停止 | 対応表は有資格者が確定 |
| 補助科目 | **ルールで freee タグ（取引先／freee補助科目／メモタグ）へ割当**。品目・部門への割当はルール記述のみ許可し、出力は警告付き | §3.5 |
| 税区分 | **対応表で変換**（`maps/taxcodes.json`）。自動判定はしない。未対応は停止 | 日付依存の対応（経過措置）を表現可能 |
| 取引先 | MFの取引先列／補助科目由来の取引先を**そのまま出力**＋**重複・表記ゆれ候補を警告** | 名寄せは `maps/partners.json` の別名表で人間が指定したときのみ |
| 期首残高（開始残高・繰越仕訳） | **検出して除外し、集計をレポートに出す**。変換しない | freee開始残高テンプレートはフェーズ1。検出条件は §2.3（A-1） |
| 減価償却仕訳（`DEPRECIATION`） | **検出して警告 W004（`DEPRECIATION` 全件）**。`fixedAssets:"exclude"` で**出力から除外**するのは、`DEPRECIATION` かつ `DEPRECIATION_MIXED` を持たない伝票（伝票内の科目が `depreciationAccounts`∪`fixedAssetAccounts` だけで構成される「純粋な償却仕訳」）のみ。現金・預金・未払金・損益科目が混在する伝票は `DEPRECIATION_MIXED` となり、除外せず **W004＋W017** | freee台帳自動生成仕訳との二重計上リスク対応（A-2＋(f)）。境界線は顧問先の会計方針で変わる `[要税理士確認]`（リスク10） |
| 固定資産の取得・除却・売却等の仕訳（`FIXED_ASSET`） | **検出して警告 W003 のみ。除外しない**（`exclude` 設定でも除外しない） | 資金移動（預金減等）や損益を伴うため除外すると残高が崩れる（A-2）。過去の除却・売却仕訳は通常仕訳として移行する前提（§9 未確認あり） |
| 部門 | **既定で落として警告**。`departments:"passthrough"` で出力列へ素通し可 | 出力列の存在が未確認 |
| 品目・メモタグ | **PoCでは品目は生成しない**。MF「タグ」列等は `tagsRaw` に保持し、既定（`tags:"drop"`）は警告付きで落とす。`tags:"memo_tag"` で出力テンプレートのメモタグ列（`from: *.mapped.memoTags`）へ渡す（`tagsRaw` を分割せず1つのメモタグとして、同じ行の借方・貸方の両明細に付ける。メモタグ列が無ければ W008 のまま） | フェーズ1 |
| 固定資産台帳・給与・債権債務残高 | **対象外** | 先行資料どおり |

---

## §2. 処理パイプライン

```
[bytes] → decode → parseCsv → toDataset(adapter) → applyMappings → validate → (suggest) → 除外判定 → renderOutput → buildReport
            §2.1      §2.2         §2.3              §2.4          §2.5       §2.4項8    §2.4項7       §2.6          §2.7
```

`src/core/` は純関数（ファイル・ネットワーク・`process` に触れない）。最上位は次の1関数（**実装どおり：2引数・非同期**）：

```ts
export async function convert(input: ConvertInput, opts: ConvertOptions = {}): Promise<ConvertResult>;   // 副作用なし

export interface Codec {
  decodeBytes(bytes: Uint8Array, hint: EncodingHint): DecodeResult;
  encodeText(text: string, encoding: OutputEncoding): Uint8Array;
}
export const defaultCodec: Codec;      // src/core/encoding.ts（iconv-lite・Node Buffer 依存）

export interface ConvertInput {
  bytes: Uint8Array;                   // 入力CSVの生バイト
  profile: Profile;                    // §3.1（読み込み済みJSONを束ねたオブジェクト）
  fileName?: string;                   // 既定 'input.csv'。パスではなくファイル名のみを渡す
  suggester?: MappingSuggester;        // §8。省略時 NoopSuggester
  codec?: Codec;                       // 省略時 defaultCodec。ブラウザ化時に差し替える注入口（§6.1）
  configHashes?: Record<string, string>;   // CLI が設定ファイルの sha256 を渡す（レポート・run.json 用）
  runAt?: string;                      // 実行時刻（ISO）。省略時は現在時刻
}
export interface ConvertOptions {
  dev?: boolean;                       // TODO_VERIFY を推定名のまま扱う（W013）
  force?: boolean;                     // エラー伝票を除外して出力
  strict?: boolean;                    // confirmed:false 使用を error 扱い
}
export interface ConvertResult {
  dataset: Dataset;                    // E000 のときは entries が空の Dataset（null にしない）
  diagnostics: Diagnostic[];           // error/warning/info
  outputCsv: string | null;            // error が1件でもあれば null（--force 時はエラー伝票除外で出力。データセット単位の error があれば null）
  report: Report;                      // E000 のときは集計が空の Report（null にしない）
  stats: { rows: number; entries: number; lines: number; errors: number; warnings: number; outputEntries: number };
  excluded: Map<string, string>;       // 除外した伝票ID → 理由
}
```

- `convert()` は最初に（`opts.dev` なら `stripTodoVerify` を適用した上で）`verifyConfig(profile)`（§3.8）を実行し、失敗時は**例外を投げず `E000` 診断を返して終了**する（`dataset.entries=[]`、`report` は空集計。CLIが終了コード2に変換）。
- `suggester.suggest()` は `convert()` 内で `await` する（§2.4 項8）。`convert` が非同期なのはこのため。`applyMappings()` 自体は同期。
- `codec.decodeBytes` は `convert()` 内で使うが、**`codec.encodeText` は `convert()` 内では使わない**（`outputCsv` は文字列で返す）。出力のエンコードは CLI が `src/core/encoding.ts` の `encodeText` を直接呼ぶ。ブラウザ化時は CLI 相当のシェル側で注入 codec の `encodeText` を使う想定。

### 2.1 decode（文字コード判定）

```ts
export function decodeBytes(bytes: Uint8Array, hint: 'auto'|'utf8'|'shift_jis'): { text: string; encoding: 'utf8'|'shift_jis'; hadBom: boolean }
export function encodeText(text: string, enc: 'utf8_bom'|'utf8'|'shift_jis'): Uint8Array
```

- 先頭 `EF BB BF` → UTF-8（BOM除去）。それ以外で `auto`：`TextDecoder('utf-8', { fatal: true })` で試し、例外なら Shift_JIS（CP932）として `iconv-lite` でデコード。判定結果は `I001`。
- 出力エンコードは `target.encoding`。既定 `utf8_bom`。freeeが実際に受け付ける文字コードは公式テンプレートで確認（TODO_VERIFY）。
- `iconv-lite` は Node の `Buffer` を前提とするため、`encoding.ts` は Node 環境依存。`core` の他モジュールは `encoding.ts` に依存せず `string` を受け取る。ブラウザ化時は `ConvertInput.codec` に別実装を注入する（§6.1）。

### 2.2 parseCsv

```ts
export function parseCsv(text: string, opts: { delimiter: ','|'\t'; hasHeader: boolean|'auto'; headerSignature?: string[] }): { header: string[]|null; rows: RawRow[]; physicalRows: number }
export interface RawRow { rowNumber: number; cells: string[] }   // 1始まりの物理行番号
```

- RFC 4180準拠。`papaparse` を利用。
- `hasHeader:'auto'`：1行目のセルが `headerSignature` **または `columns[].header` のいずれか**と一致すればヘッダー（`collectHeaderSignature()` が両者を合成する）。一致しなければヘッダー無しとして列インデックスで読む（弥生対応）。
- 空行はスキップ。列数不整合は `E005`。

### 2.3 toDataset（正規化：中間モデルへ）

```ts
export type SourceSystem = 'mf_journal' | 'yayoi_generic';
export type EntryFlag = 'OPENING_BALANCE' | 'CLOSING_ADJUSTMENT' | 'FIXED_ASSET' | 'DEPRECIATION' | 'DEPRECIATION_MIXED' | 'COMPOUND';

export interface Dataset {
  source: SourceSystem;
  sourceFile: { name: string; encoding: string; hadBom: boolean; hasHeader: boolean; physicalRows: number };
  entries: JournalEntry[];
}

export interface JournalEntry {
  entryId: string;                 // "E000001" 連番
  voucherNo: string | null;
  date: string;                    // ISO "YYYY-MM-DD"。解析失敗時は '0000-00-00'（E004 併発）
  description: string;             // 摘要（伝票単位。先頭行を採用し、行ごとに異なる場合は各行の line.memo に保持）
  lines: JournalLine[];            // 最低2行（1行なら E008）
  amountMode: 'tax_included' | 'tax_excluded' | 'unknown';
  flags: EntryFlag[];
  sourceRows: number[];
}

export interface JournalLine {
  side: 'debit' | 'credit';
  accountRaw: string;              // 元の勘定科目名（無加工）
  account: string;                 // 照合用正規化名（NFKC・trim・連続空白圧縮）。出力には使わない
  subAccountRaw: string | null;
  departmentRaw: string | null;
  partnerRaw: string | null;       // MFの取引先列。弥生はnull
  taxCodeRaw: string | null;       // 弥生は結合文字列のまま
  amount: number;                  // 整数円
  taxAmount: number | null;
  invoiceRaw: string | null;       // MF「インボイス」列など。PoCでは判定に使わない
  memo: string | null;             // 行単位の摘要（伝票摘要と異なる場合）・仕訳メモを ' / ' で連結
  tagsRaw: string | null;          // MF「タグ」列など。memo と分離して保持
  sourceRow: number;
  mapped?: MappedLine;
}

export interface MappedLine {
  freeeAccount: string;
  freeeSubAccount: string | null;
  freeeTaxCode: string;
  partner: string | null;
  item: string | null;             // PoCでは常にnull
  department: string | null;       // 既定null
  memoTags: string[];
  provenance: { account: 'table'; tax: 'table'|'table_dated'|'default_blank'; subAccount: `rule:${string}`|'none'; partner: 'column'|'subaccount'|'alias'|'none' };
}

export interface Diagnostic {
  code: string;                    // 'E000' 等（§4）
  severity: 'error' | 'warning' | 'info';
  message: string;                 // 日本語
  entryId?: string;
  sourceRow?: number;
  detail?: Record<string, string | number | boolean | null>;   // 摘要全文は入れない
}
```

**アダプタ**（`adapters/common.ts` の共通処理を `adapters/mf.ts`・`adapters/yayoi.ts` が使う）は `sourceConfig.columns` に従い `RawRow` → 行ごとの `{debit?, credit?, voucherNo, date, description, memo, tags, closingFlag, groupFlag}` を作り、`grouping` 戦略で束ねる：

- `'by_voucher_no'`：同一 `voucherNo` の連続行を1伝票（MF「取引No」想定）。離れた位置に同一番号が再出現すると `W011`。
- `'by_flag'`：識別フラグ列で単一／複合開始／複合中／複合終了を判定（弥生インポート形式で知られる方式。汎用形式に同様のフラグがあるかは**未確認**）。フラグ値は `grouping.flagValues` に外出し。**設定に無いフラグ値は `E005`**。
- `'each_row'`：1行＝1伝票。

**正規化の細則**：
- 日付：`dateFormats` で順に解析。和暦は `"GYY/MM/DD"` を含めた場合のみ `eraTable` で解釈。失敗は `E004`。
- 金額：全角→半角、カンマ・空白・円記号除去、`△`/`▲`/`-` は負号。小数は `E005`。負は `W010`。科目・金額とも空欄なら「行なし」、片方だけ空欄は `E005`。
- 科目照合キーは NFKC＋trim＋連続空白1つ化。出力値は `accountRaw` を対応表で引いた結果。

**フラグ付与（A-1・(f) 反映、実装 `detectFlags()` と一致）**。リストは `options.detectors` に外出し：

- `OPENING_BALANCE`（期首残高）は次の**いずれか**で付与する：
  - (a) **摘要（`entry.description`）または行メモ（`line.memo`）**が `openingBalanceKeywords` のいずれかを含む。**科目名は照合対象にしない**。既定キーワードは `["期首残高", "開始残高", "前期繰越", "前期より繰越", "期首繰越"]`。**単独の「繰越」は既定に含めない**。
  - (b) 伝票日付が `fiscalYear.start` と一致し、**かつ**いずれかの行の科目が `openingBalanceCounterAccounts`（コード側既定 `["元入金", "資本金", "繰越利益剰余金", "開始残高", "期首残高"]`）に含まれる。日付条件と科目条件は**両方必要**（AND）。
- `DEPRECIATION`：いずれかの行の科目が `depreciationAccounts`（コード側既定 `["減価償却費", "一括償却資産償却"]`）に含まれる。**「減価償却累計額」は判定キーに含めない**（除却・売却仕訳にも必ず現れるため。ミナ見解）。
- `DEPRECIATION_MIXED`：`DEPRECIATION` かつ、伝票内の**いずれかの**行の科目が `depreciationAccounts`∪`fixedAssetAccounts` に**含まれない**（現金・預金・未払金・固定資産除却損・売却益等が混在）。v3 の `pureDepreciation` はこのフラグの否定に相当する（`pureDepreciation === !DEPRECIATION_MIXED`）。独立した属性は持たない。
- `FIXED_ASSET`：いずれかの行の科目が `fixedAssetAccounts` に含まれ、**かつ**その伝票が「純粋な償却仕訳」（`DEPRECIATION` かつ非 `MIXED`）でない。つまり純粋な償却仕訳（例：減価償却費／減価償却累計額）には `FIXED_ASSET` を付けず W003 を出さない。**`fixedAssetAccounts` のコード側既定は空配列**であり、サンプルJSON（§3.1）で `["減価償却累計額", "建物", …]` を供給する。空のままだと「減価償却累計額」を相手科目とする償却仕訳も `DEPRECIATION_MIXED` となり除外は起きない（安全側）。事務所の科目表に合わせて必ず編集する。
- `CLOSING_ADJUSTMENT`：`closingFlag` 列があり、値が空・`0`・`false`・`no`・`通常` 以外のとき（列の有無は未確認）。
- `COMPOUND`：`lines.length > 2`。

### 2.4 applyMappings と、convert() 側の後処理

```ts
export function applyMappings(ds: Dataset, maps: Maps, opts: { departments; tags; memoTagColumnExists; strict; sourceSystem }): { dataset: Dataset; diagnostics: Diagnostic[]; unmapped: UnmappedItem[] }   // 同期。suggester 引数なし
```

各 `JournalLine` について順に（項1〜6 は `applyMappings` 内）：

1. **勘定科目**：`maps.accounts[照合キー]`。ヒット→`freeeAccount`（＋`freeeSubAccount`）。ミス→`E002`（明細行ごとに1件。レポートでは値ごとに集計）。`confirmed:false` のエントリ使用は **`--dev` の有無にかかわらず `W012`**、`--strict` では `E002`。
2. **税区分**：`maps.taxcodes`（§3.4）。日付範囲付きエントリは伝票日付で選ぶ（`provenance.tax='table_dated'`）。ミス／範囲外→`E003`。空欄で科目が `defaultForBlank.appliesToAccounts` にあれば既定値（`provenance.tax='default_blank'`）、それ以外の空欄は `E003`。
3. **補助科目→freeeタグ**：`maps.subaccountRules`（§3.5）を上から評価し最初のマッチを適用。マッチなし→`defaultAction`。
4. **取引先**：取引先列（MF） > 補助科目ルールの `partner` > null。`maps.partners.aliases` に一致すれば置換。
5. **部門**：`opts.departments = 'drop'|'passthrough'`。`drop` で値があれば `W008`。
6. **タグ**：`opts.tags = 'drop'|'memo_tag'`。`drop` で `tagsRaw` に値があれば `W008`。`memo_tag` でも出力テンプレートにメモタグ列（`from: *.mapped.memoTags`）が無ければ `W008`。

以下は **`convert()` 内**で行う（`applyMappings` の外）：

7. **除外処理（A-2＋(f) 反映）**：`validate()` の後、各伝票について次の順で判定し `excluded: Map<entryId, 理由>` に記録する。(i) `OPENING_BALANCE` かつ `options.openingBalances='exclude_and_report'`（既定）→除外。(ii) `DEPRECIATION` かつ **`DEPRECIATION_MIXED` を持たず** かつ `options.fixedAssets='exclude'`→除外。(iii) `--force` かつ error を含む伝票→除外。(i)(ii) の件数を `I002` に出す。`DEPRECIATION_MIXED` の伝票は除外せず W017（§4.2）。`FIXED_ASSET` のみの伝票はどの設定でも除外しない。
8. **suggester**：`applyMappings` が返す `unmapped`（`UnmappedItem[]`）が1件以上あれば、`input.suggester`（既定 `NoopSuggester`）の `suggest()` を**一度だけ `await`** し、結果をレポートの未マッピング一覧に添える。提案は自動適用しない。

### 2.5 validate（§4）

```ts
export function validate(ds: Dataset, cfg: { fiscalYear?; invoiceTransitionDates; partnerFuzzyThreshold; taxRates; erroredEntryIds }): Diagnostic[]
```

### 2.6 renderOutput

```ts
export function renderOutput(ds: Dataset, target: TargetConfig, skipEntryIds: Set<string>): { csv: string; diagnostics: Diagnostic[]; outputEntryIds: Set<string> }
```

- `skipEntryIds`（除外伝票＋error 伝票）は出力しない。error 伝票をスキップするため、同じ伝票に `E006` が重複して出ることはない。
- `target.columns` の順に `from`（中間モデルのパス式）から値を取り出す。
- `rowModel:'debit_credit_pair'`（既定）：単純仕訳は1行。複合仕訳は `compoundEntries`：`'blank_side'`（片側空欄で複数行、伝票番号で結ぶ。freeeが受け付けるかは TODO_VERIFY）／`'unsupported'`（`E007`）。
- RFC 4180エスケープ。改行は `target.newline`（既定 CRLF）。
- error が1件でもあれば `outputCsv` は null。`--force` でエラー伝票を除外して出力（ただしデータセット単位の error、例：必須列欠落の E005 があれば出力しない）。

### 2.7 buildReport（§5）

```ts
export function buildReport(ds: Dataset, diags: Diagnostic[], ctx: { profileName; runAt; sourceFile; excluded; outputEntryIds; outputWritten; unmapped; suggestions; configHashes? }): Report
export function renderReportMarkdown(r: Report): string
export function renderReportCsvBundle(r: Report): { accounts: string; unmapped: string; diagnostics: string; taxcodes: string }
export const DISCLAIMER: string;   // レポート末尾の確認依頼文言
```

---

## §3. マッピング設定の仕様

形式は **JSON**（コメントは `"_comment"` キー）。`profile.json` が各ファイルを束ねる。実装では `config/`（本番用テンプレート・`TODO_VERIFY` 付き）と `config/examples/`（テスト用・架空の列名 `例_取引日` 等）を分けている。CLI の読み込みは `src/cli/load.ts`（相対パス解決・sha256 計算）。

### 3.1 `profile.json` と `sources/*.json`（(a) 入力列→中間モデル）

```jsonc
// config/profile.sample.json
{
  "name": "sample-mf-to-freee",
  "source": "./sources/mf-journal.json",
  "target": "./targets/freee-generic.json",
  "maps": {
    "accounts": "./maps/accounts.sample.json",
    "taxcodes": "./maps/taxcodes.sample.json",
    "subaccountRules": "./maps/subaccount-rules.sample.json",
    "partners": "./maps/partners.sample.json"
  },
  "fiscalYear": { "start": "2026-04-01", "end": "2027-03-31" },
  "options": {
    "departments": "drop",             // "drop" | "passthrough"
    "tags": "drop",                    // "drop" | "memo_tag"
    "fixedAssets": "warn",             // "warn" | "exclude"（exclude は DEPRECIATION かつ非 DEPRECIATION_MIXED の伝票のみ除外）
    "openingBalances": "exclude_and_report",   // "exclude_and_report" | "include_with_warning"
    "invoiceTransitionDates": ["2026-09-30"],  // 切替の「最終日」。延長が法制化されたら追記
    "partnerFuzzyThreshold": 2,
    "detectors": {
      "openingBalanceKeywords": ["期首残高", "開始残高", "前期繰越", "前期より繰越", "期首繰越"],   // 摘要・メモのみに適用。単独「繰越」は含めない
      "openingBalanceCounterAccounts": ["元入金", "資本金", "繰越利益剰余金", "開始残高", "期首残高"], // fiscalYear.start と同日の伝票にのみ適用
      "depreciationAccounts": ["減価償却費", "一括償却資産償却"],   // 「減価償却累計額」は含めない（除却・売却仕訳にも現れるため）
      "fixedAssetAccounts": ["減価償却累計額", "建物", "建物附属設備", "構築物", "機械装置", "車両運搬具", "工具器具備品", "土地", "ソフトウェア", "一括償却資産", "リース資産"]   // コード側既定は空。必ず事務所の科目表に合わせて編集
    }
  }
}
```

`sources/mf-journal.json`・`sources/yayoi-generic.json` は v3 §3.1 と同一（列名・index・フラグ値はすべて `TODO_VERIFY:` 付き。ノヴァは v3 の雛形をそのまま使用済み）。列指定は `{ "header": … }` と `{ "index": n }` を両方許可し、ヘッダーがあれば header を優先、無ければ index にフォールバック。`"optional": true` の列は無くてもエラーにしない。

### 3.2 `targets/freee-generic.json`（(b) 出力列順・列名）

v1 §3.2 と同一（`templateInfo`・`encoding:"utf8_bom"`・`rowModel:"debit_credit_pair"`・`compoundEntries:"TODO_VERIFY:blank_side"`・`columns[]` すべて `TODO_VERIFY:` 付き）。

### 3.3 `maps/accounts.json`（(c) 勘定科目対応表）

v1 と同一構造（`entries: { <照合キー>: { freeeAccount, freeeSubAccount?, confirmed, source, note? } }`）。`confirmed:false` のエントリを使用した場合、**`--dev` の有無にかかわらず `W012`**。`--strict` では `E002`。

### 3.4 `maps/taxcodes.json`（(d) 税区分対応表・日付依存対応可）

v1 と同一（`defaultForBlank`、`entries[].sourceTaxCode/freeeTaxCode/rate/effectiveFrom/effectiveTo/confirmed`）。80%/50%の期間は現行制度に基づく（国税庁一次情報での再確認は未了）。延長は法制化確認後に `entries` と `invoiceTransitionDates` を追記する（コード改修不要）。

### 3.5 `maps/subaccount-rules.json`（(e) 補助科目→freeeタグ割当ルール）

v1 と同一（`defaultAction`、`rules[].id/when/then/note`。`assign` は `partner | freee_sub_account | memo_tag | drop`。`item`／`department` はルール記述可だが PoC では警告付きで落とす）。

### 3.6 `maps/partners.json`

v1 と同一（`aliases`。自動名寄せはしない）。

### 3.7 「公式テンプレートから転記する手順」（社長作業・1回限り）

v1 §3.7 と同一の7ステップ。**実装上の追加（README §4）**：公式ヘッダー文字列の転記結果をリポジトリにコミットしてよいかは規約確認待ち（リョウ）のため、確定までは転記を git 管理外のコピー（`config/profile.json`、`config/targets/freee-generic.local.json`、`config/sources/*.local.json`。いずれも `.gitignore` 済み）に対して行い、`config/profile.json` の `source`／`target` の参照先を `.local.json` に書き換える。エクスポート時の入力ファイル名に顧問先名・事務所名を含めない（`report.md`・`run.json` に転記されるため）。

### 3.8 `verifyConfig()` と `verify-config` コマンド

`src/core/config.ts` の `verifyConfig(profile)`（純関数）が以下を検査し、1件でも error があれば `convert()` は `E000` を返して終了する（`configDiagnostics()` で診断に変換）。CLI `verify-config` は同関数を呼び「`TODO_VERIFY 残数: n`」と結果を表示（失敗なら終了コード2）。

- 値・キーに `TODO_VERIFY` 接頭辞が残っていないか（残っていればファイル・パスを列挙）
- `target.columns` の `required:true` 列がすべて `from` を持つか
- `source.columns` の必須キー（date, debit.account, debit.amount, credit.account, credit.amount）が定義されているか
- `grouping.strategy` が `by_voucher_no | by_flag | each_row` のいずれかか。`by_flag` のとき `flagColumn`・`flagValues` が揃っているか
- `amountMode` が `tax_included | tax_excluded | unknown` のいずれかか（`unknown` は W014 を伴う）
- `options` の4項目の値域：`departments ∈ {drop, passthrough}`、`tags ∈ {drop, memo_tag}`、`fixedAssets ∈ {warn, exclude}`、`openingBalances ∈ {exclude_and_report, include_with_warning}`。範囲外は error（E000）
- `taxcodes.entries` に同一 `sourceTaxCode` で日付範囲が重複するものがないか
- `accounts.entries` の `confirmed:false` 件数（警告として件数表示）
- `--dev` 指定時のみ、`stripTodoVerify()` で `TODO_VERIFY:` 接頭辞を剥がして「推定名のまま」扱い、`W013` を出して続行する（fixtures での開発用）。**`--dev` でも `W012`（confirmed:false 使用）は出す**。

---

## §4. 検証ルール

### 4.1 停止（error：freee用CSVを出力しない）

| コード | 内容 | 判定 |
|---|---|---|
| E000 | 設定検証エラー | `verifyConfig()` の error。`TODO_VERIFY` 残存・必須列未定義・不正な戦略名/amountMode/options値・税区分日付重複 |
| E001 | 伝票単位の借方合計 ≠ 貸方合計 | `amountMode:'unknown'` のときは W014 を併発（1回のみ） |
| E002 | 勘定科目が対応表に無い | 明細行ごとに1件。**`--strict` 時は `confirmed:false` の使用も E002** |
| E003 | 税区分が対応表に無い／該当期間のエントリが無い／空欄で既定が適用できない | 明細行ごとに1件 |
| E004 | 日付が解析できない | `dateFormats` 全滅 |
| E005 | 金額が解析できない（小数含む）／列数不整合／必須列が無い・空／**未知の識別フラグ値** | |
| E006 | 出力テンプレートの必須列に値が入らない | `renderOutput` 時（error 伝票はスキップされるため重複しない） |
| E007 | 複合仕訳が出力テンプレートで表現不可 | `compoundEntries:'unsupported'` かつ `lines.length>2` |
| E008 | 伝票に明細行が1つしかない | グループ化設定の見直しを促す（既に error のある伝票には出さない） |

### 4.2 警告（warning：出力は続行。レポートに一覧）

| コード | 内容 | 判定 |
|---|---|---|
| W001 | 取引先名の完全一致衝突候補 | 正規化（NFKC・trim・空白除去・英字大小統一）後に同一だが元文字列が異なる組 |
| W002 | 取引先名の表記ゆれ候補 | 正規化＋法人格表記除去後のレーベンシュタイン距離 ≤ `partnerFuzzyThreshold`（既定2、法人格除去後5文字以下は1）。W001 のペアには出さない |
| W003 | 固定資産科目を含む伝票（取得・除却等） | `FIXED_ASSET` フラグ。文言は実装どおり「固定資産科目を含む伝票。固定資産台帳を別途インポートする場合、取得仕訳の扱いを確認」のみ。**どの設定でも除外しない**（A-2）。v3 リスク11 で提案した文言追記（「台帳へ除却・売却を登録する場合は自動生成の設定も確認」）は**未採用** |
| W004 | 減価償却関連科目を含む伝票 | **`DEPRECIATION` フラグの伝票全件**（混在伝票も含む）。「freeeの固定資産台帳から自動生成される減価償却仕訳と二重計上になる恐れ」。`fixedAssets:'exclude'` で除外されるのは、このうち `DEPRECIATION_MIXED` を持たない伝票のみ（`I002`） |
| W005 | 日付範囲がインボイス経過措置の切替日をまたぐ | `min(date) <= D && max(date) > D` |
| W006 | 会計期間外の伝票 | `fiscalYear` 設定時 |
| W007 | 期首残高と思われる伝票 | `OPENING_BALANCE` フラグ（§2.3 A-1 の条件）。既定で除外し期首残高セクションへ |
| W008 | 部門・タグ・補助科目を落とした | `departments:'drop'`／`tags:'drop'`／メモタグ列なし／ルール `drop` |
| W009 | 税額が逆算値と±1円超で乖離 | `taxAmount != null` かつ `rate` 既知かつ `amountMode != 'unknown'` |
| W010 | 負の金額 | |
| W011 | 伝票番号の重複（非連続） | `by_voucher_no` 時 |
| W012 | `confirmed:false` の対応表エントリを使用 | **`--dev` でも出す** |
| W013 | `--dev` で `TODO_VERIFY` 列名のまま実行 | 開発時のみ |
| W014 | `amountMode:'unknown'` のまま借貸チェック | |
| W015 | 同一補助科目名が複数の親科目に出現しルール適用結果が異なる | |
| W016 | 外部AI提案が要求されたが承認記録・フラグが揃わず Noop にフォールバック | **未実装**（フェーズ1。§8） |
| W017 | 減価償却科目と資金・損益科目が混在する伝票 | `DEPRECIATION_MIXED` フラグ。「償却仕訳に他科目が混在（期中売却の月割償却合算、少額減価償却資産の即時償却等の可能性）。伝票単位で出力に残した」。`fixedAssets:'exclude'` でも除外しない。**W004 と両方出る** |

### 4.3 情報（info）

I001 文字コード判定結果／I002 除外した伝票数（期首残高・減価償却）／I003 グループ化戦略と伝票数・明細数。

---

## §5. 差分レポート仕様

出力ファイル（`out/<実行日時>_<profile名>/`）：

| ファイル | 内容 |
|---|---|
| `freee_import.csv` | 変換結果（errorゼロ、または `--force` 時の除外後） |
| `report.md` | 人が読む総括 |
| `report_accounts.csv` | 勘定科目別集計 |
| `report_taxcodes.csv` | 税区分別集計 |
| `report_unmapped.csv` | 未マッピング一覧 |
| `report_diagnostics.csv` | 全診断（code, severity, entryId, sourceRow, message, detail JSON） |
| `run.json` | 実行メタ。`input: { fileName, encoding, hadBom, physicalRows, sha256 }`（`fileName` はパスではなくファイル名のみ）。ほかに profile名・各設定ファイルのsha256・件数・所要時間・CLIオプション。**明細データ（金額・科目・摘要）は含めない** |

CSV 4本は UTF-8 BOM 付き（Excel で開ける）。

`report.md` の構成（9節）：①概要／②勘定科目別 借方・貸方合計（移行元 vs 変換後・差額・件数・備考。除外伝票による差額は備考に自動記載）／③税区分別合計／④期首残高・除外伝票セクション（減価償却除外分・`--force` 除外分も含む）／⑤未マッピング一覧（suggester の提案があれば併記）／⑥取引先セクション（W001/W002ペア）／⑦警告一覧／⑧補助科目割当サマリ／⑨確認依頼事項（`DISCLAIMER` 固定文言：「本レポートは自動変換の下書きです。freeeへのインポートおよび勘定科目・税区分対応表の妥当性の最終確認は、会計事務所側の有資格者が行ってください。本ツールは税務・会計上の判断を行いません。」）。

---

## §6. 技術スタック

### 6.1 結論：Node.js 20 LTS ＋ TypeScript の CLI、変換ロジックは純関数モジュール

- **ローカル完結**の要件を CLI なら構造的に満たせる。`src/` に `fetch`/`http`/`https`/`net`/`child_process` 等の import が無いことをテストで担保する（§7 T12。検査範囲の限界は §6.5）。動作確認は Node 22.22.2（README）。
- **将来のブラウザUI化**：`papaparse` はブラウザで動き、`core` の変換部は `string`／設定オブジェクトのみを受け取る。**ただし `src/core/encoding.ts` は `iconv-lite` 経由で Node の `Buffer` に依存するため、ブラウザ版では encoding 層を `TextDecoder('shift_jis')`＋Shift_JISエンコード可能な別実装に差し替える必要がある**。「そのまま流用」できるのは `encoding.ts` を除く `core` 各モジュール。差し替えの注入口は **`ConvertInput.codec`**（`decodeBytes`/`encodeText`）で、未指定時は `defaultCodec`（`encoding.ts`）を使う。`convert()` 内で使うのは `decodeBytes` のみで、`encodeText` は CLI（ブラウザ版ではシェル側）が呼ぶ。ブラウザ用 codec は**未作成**。
- **n8n化**（フェーズ2、エイト）は `core` のnpm化後に判断。クラウド上のn8nで動かすとローカル完結原則と衝突するため、**事務所側PC／セルフホスト限定**。

### 6.2 依存ライブラリ（最小限）

| 区分 | パッケージ | 用途 | 備考 |
|---|---|---|---|
| runtime | `papaparse` | CSVパース/生成 | 依存なし・ブラウザ可 |
| runtime | `iconv-lite` | Shift_JIS（CP932）デコード／エンコード | **Node `Buffer` 依存**。ブラウザ版では差し替え（§6.1）。CP932 機種依存文字はテストで ①・㈱ の往復のみ確認 |
| dev | `typescript`, `tsx`, `@types/node`, `@types/papaparse` | | テストは `node:test`＋`node:assert` |

CLI引数は `node:util.parseArgs`。ネットワーク系依存はPoCに入れない。実行時依存が上記2つに限定されることもテストで検査する（README §冒頭）。

### 6.3 フォルダ構成（実装どおり）

```
accounting-converter/
  README.md   package.json   tsconfig.json   .gitignore（in/ out/ config/templates/ config/profile.json config/**/*.local.json）
  src/
    core/
      index.ts        # convert()（async）と公開API（Codec / defaultCodec / 型の再エクスポート）
      model.ts        # §2.3 の型（EntryFlag に DEPRECIATION_MIXED を含む）
      config.ts       # Profile型・verifyConfig()・configDiagnostics()・stripTodoVerify()
      encoding.ts     # decodeBytes / encodeText（Node依存。ブラウザ化時に差し替え）
      csv.ts          # parseCsv / toCsv（papaparse の薄いラッパ。物理行番号を保持）
      normalize.ts    # 名称正規化・金額/日付解析（全角・和暦）・レーベンシュタイン距離・法人格除去
      adapters/common.ts（列解決・グループ化・フラグ検出）  adapters/mf.ts  adapters/yayoi.ts  adapters/index.ts
      mapping.ts      # applyMappings（同期。科目・税区分・補助科目ルール・取引先別名。unmapped を返す）
      validate.ts     # §4 の検証ルール（W001〜W015、W017、E001、E008）
      output.ts       # renderOutput（freee用CSV。skipEntryIds を受ける）
      report.ts       # buildReport / renderReportMarkdown / renderReportCsvBundle / DISCLAIMER
      suggest.ts      # MappingSuggester インターフェース＋NoopSuggester（PoCはこれのみ。RuleSuggester はフェーズ1前半）
    cli/
      index.ts        # inspect / verify-config / convert（encodeText を直接呼んで書き出す）
      load.ts         # プロファイル読込（相対パス解決）・設定ファイルの sha256
  scripts/make-fixtures.ts   # 架空 fixtures の生成
  config/
    profile.sample.json  sources/  targets/  maps/*.sample.json   # 本番用テンプレート（TODO_VERIFY 付き）
    examples/            # テスト用（架空の列名 例_取引日 等。実際の各社CSV仕様ではない）
    templates/           # gitignore。公式テンプレート・実エクスポートの置き場（.gitkeep のみ）
  fixtures/  mf/*.csv  yayoi/*.txt      # 架空データ（expected/*.json は無い。期待値はテストコード内）
  test/  helpers.ts  mf.test.ts  yayoi.test.ts  rules.test.ts  config.test.ts  cli.test.ts  normalize.test.ts  local-only.test.ts
```

### 6.4 CLI

```
npx tsx src/cli/index.ts inspect       --input in/journal.csv [--encoding auto|utf8|shift_jis]   # 区切り文字カンマ固定・1行目をヘッダーと仮定して表示
npx tsx src/cli/index.ts verify-config --profile config/profile.json
npx tsx src/cli/index.ts convert       --profile config/profile.json --input in/journal.csv --out out/ [--dev] [--force] [--strict]
```

終了コード：0＝成功（警告なし）、1＝警告あり（出力あり）、2＝エラーあり（E000含む。出力なし）。

### 6.5 セキュリティ・ローカル完結の担保

- `core` はネットワーク・ファイルシステムに触れない（T12 で静的検査）。**検査の範囲は `src/` のソースの静的 import 検査と、実行時依存が `papaparse`・`iconv-lite` の2つに限定されることの検査のみ。依存パッケージ本体やNodeランタイム自体の挙動は対象外**。依存パッケージがネットワークアクセスを行わないことは、パッケージの性質（純粋な文字列処理ライブラリ）からの推定であり、READMEにこの範囲を明記済み。
- `run.json`・ログに明細を残さない。診断 `detail` に摘要全文を入れない（科目名の連結・金額程度）。
- `in/`・`out/`・`config/templates/`・実運用 `config/profile.json`・`*.local.json` は `.gitignore`。コミットされるのは `fixtures/`（架空）・`config/`（`TODO_VERIFY` 付き）・`config/examples/`（架空）のみ。
- 入力ファイル名に顧問先名・事務所名を含めない運用（`report.md`・`run.json` に転記されるため）。
- README に明記済み：「データを外部に送信しない」「税務・会計上の判断を行わない」「最終確認は有資格者が行う」「本ツールは外販未承認の社内PoCである」「インボイス経過措置の期間は国税庁一次情報での再確認未了」「外部通信検査の範囲」。

---

## §7. テスト方針

- `npm test`（`node --test`、`tsx` 経由）。fixtures＋`config/examples/` のプロファイルで `await convert()` を呼び、**診断コード・集計値をテストコード内で直接アサート**する（`expected/*.json` との比較方式は採用していない）。
- fixtures はすべて**架空**（`scripts/make-fixtures.ts` で生成）。取引先名の命名：`例_` 接頭辞が付くのは「例_ABC商事」「例_A銀行」「例_B銀行」。「サンプル商事株式会社」「（株）サンプル商事」「ダミー物産」「テスト工業有限会社」はプレースホルダー名のまま（いずれも実在の法人を指さない架空名。人名・住所・電話・登録番号を含めない）。列名・税区分名・フラグ値（`例_取引日`、`例S` 等）もテスト用の架空の名前で、実際の各社CSV仕様ではない。
- 弥生fixtureはShift_JIS、MFfixtureは既定でUTF-8 BOM付き。

| # | ケース | fixture／テスト | 期待 |
|---|---|---|---|
| T1 | 正常系 | `mf/normal.csv`, `yayoi/normal.txt`（`mf.test.ts` / `yayoi.test.ts`） | error 0、warning 0、出力行数＝伝票数、科目別合計一致 |
| T2 | 複合仕訳 | `mf/compound.csv` | `blank_side` で出力行数＝明細数、`unsupported` で E007 |
| T3 | 未マッピング | `mf/unmapped.csv` | E002、E003、出力なし |
| T4 | 借貸不一致 | `mf/unbalanced.csv` | E001（伝票IDと差額） |
| T5 | 重複取引先（「サンプル商事株式会社」「（株）サンプル商事」「ｻﾝﾌﾟﾙ商事株式会社」等の表記ゆれ） | `mf/partners.csv` | W001×1ペア（全角/半角差）、W002×1ペア（法人格表記差）、`aliases` で消失 |
| T6 | 固定資産・減価償却 | **`mf/fixed-assets.csv`（取得〈工具器具備品／普通預金〉・月次償却〈減価償却費／減価償却累計額〉・雑費の3行。`mf.test.ts`）＋`rules.test.ts` のインラインケース（除却〈現金＋減価償却累計額／車両運搬具〉・少額減価償却資産の即時償却〈減価償却費／未払金〉・期中売却合算〈減価償却費＋現金／固定資産売却益〉）** | 取得仕訳に W003、月次償却に W004（W003 は出ない）、除却仕訳に W003（W004 は出ない）、即時償却・期中売却合算に W004＋W017（フラグ `DEPRECIATION`＋`DEPRECIATION_MIXED`）。`fixedAssets:'exclude'` で**月次償却の伝票のみ**除外・I002、**取得・除却・W017 の伝票は出力に残る** |
| T7 | 期跨ぎ（2026-09-15〜10-15） | `mf/transition.csv` | W005。免税事業者仕入が日付で控80/控50に振り分け |
| T8 | 期首残高 | `yayoi/opening.txt`（`yayoi.test.ts`） | 摘要「期首残高」の伝票と、期首日×`openingBalanceCounterAccounts` の伝票に W007・除外。**期首日以外の「繰越利益剰余金」を含む決算振替仕訳、摘要に「繰越」単独を含む伝票は除外されない**（A-1） |
| T9 | 文字コード・ヘッダー | `mf/normal.csv`（BOM付き）, `mf/utf8-nobom.csv`, `yayoi/sjis-noheader.txt` | I001 の判定が正しい。BOM無しUTF-8とShift_JISを取り違えない。ヘッダー無しでindex読み |
| T10 | 金額・日付異常 | `mf/bad-formats.csv` | E004、E005、W010、全角数字は正常 |
| T11 | 設定検証 | `config/*.sample.json`（`config.test.ts` / `cli.test.ts`） | `verifyConfig()` が TODO_VERIFY・不正な `grouping.strategy`・不正な `amountMode`・不正な `options` 値を検出。`convert()` が E000 を返し例外を投げず、空の Dataset／Report を返す。`--dev` で W013、かつ `confirmed:false` 使用時に W012 |
| T12 | ローカル完結の静的検査 | `local-only.test.ts` | `src/` に `fetch`/`http`/`https`/`net`/`child_process` 等の import が無い。実行時依存が2パッケージに限定（範囲は §6.5） |
| T13 | 往復整合 | T1出力（`mf.test.ts`） | 再パースし科目別合計が一致 |
| 追加 | W006/W009/W011/W015/E005/E008、CLI 終了コード、正規化ユニット | `rules.test.ts` / `cli.test.ts` / `normalize.test.ts` | |

受け入れ基準：T1〜T13 が通ること、README の手順で社長のPCで `convert` が動くこと、公式テンプレート転記後に `verify-config` が通ること（最後の1つのみ社長作業に依存）。

---

## §8. AIマッピング提案（フェーズ1・今回は設計のみ）

### 8.1 差し込み口（実装済みはインターフェースと Noop のみ）

```ts
export interface UnmappedItem { kind: 'account'|'taxcode'|'subaccount'; sourceValue: string; count: number; debitTotal: number; creditTotal: number; parentAccount?: string }
export interface Suggestion { sourceValue: string; candidates: { target: string; confidence: number; reason: string }[]; provider: 'noop'|'rule'|'llm_local'|'llm_external' }
export interface MappingSuggester {
  readonly provider: Suggestion['provider'];
  suggest(items: UnmappedItem[], ctx: { targetAccounts: string[]; targetTaxCodes: string[]; sourceSystem: SourceSystem }): Promise<Suggestion[]>;   // 非同期。convert() が await する
}
```

- `NoopSuggester`：常に空を返す。**PoCで実装するのはこれのみ**。呼び出し元は `convert()`（§2.4 項8）。`ConvertInput.suggester` で差し替える。
- `RuleSuggester`（**フェーズ1前半・未実装**）：freee側科目一覧（社長が用意。TODO_VERIFY）との文字列類似で候補提示。外部通信なし。
- `LlmSuggester`（フェーズ1後半・未実装）：`sourceValue`（科目名・税区分名・補助科目名）と親科目名だけを送り、金額・摘要・取引先名・件数は送らない。`src/integrations/` に置き `core` は依存しない。

### 8.2 制約

1. 外部LLMへの送信は `approval-policy.md`「個人情報・機密情報の外部AIサービスへの入力」に該当し、**社長の事前承認が必要**。会計事務所→顧問先の同意はリョウが整理。設計上、CLIは `config/approvals.json`（承認者・日付・対象プロファイル・送信項目）と `--i-confirm-external-ai` が揃わない限り Noop にフォールバックし `W016` を出す（**`--suggester` フラグ・`approvals.json`・W016 とも未実装**。社長承認未了のため）。
2. ローカル完結原則との関係：(i) ローカルLLM（`llm_local`）、(ii) マスタ情報限定送信＋顧客同意、(iii) 架空・一般化した科目辞書をコホマダ側で事前作成し実運用は `RuleSuggester` が引く、の3案。**PoCは (iii) の考え方で架空データのみ**。商品化方針は社長判断（§9）。
3. 提案は `accounts.json` に `confirmed:false, source:'llm_suggested'` として書き込まれ（`--write-suggestions` 時のみ。未実装）、人間が `confirmed:true` にするまで W012／strict時は停止。**無審査適用の経路を作らない**。
4. レポートの未マッピング一覧に候補と `reason` を併記（`buildReport` の `suggestions` 引数で受ける口は実装済み）。

---

## リスク・注意点

1. 列定義の未確認が最大リスク。`TODO_VERIFY` が残ったまま実データに使わない（`E000` ゲートを外さない）。
2. 借貸チェックは同一伝票内で税込/税抜が統一されている前提。`amountMode` 誤設定は E001 大量発生で気づける（誤って通る設計にはなっていない）。
3. 取引先の名寄せは自動で行わない（意図的）。
4. 弥生汎用形式のグループ化戦略は実ファイルを見るまで決められない。両対応。
5. 経過措置の延長は未確定。対応表は現行制度で書き、法制化確認後に追記。**現行制度の期間自体も国税庁一次情報での再確認が未了**。
6. PoCは架空データ限定。実データ使用は社長承認・仮名化方針・事務所との秘密保持（リョウ）を経てから。
7. `iconv-lite` の CP932 機種依存文字（①・㈱・髙 等）は実ファイルで確認（テストでは ①・㈱ の往復のみ）。
8. A-1 の検出条件を絞ったことで、摘要に既定キーワードが無く相手科目も `openingBalanceCounterAccounts` に無い期首残高伝票は検出されず出力に含まれる。補完策は実在する手段に限定する：`report.md` ④「期首残高・除外伝票セクション」と、`report_diagnostics.csv` を W006（会計期間外）・W007（期首残高）で絞り込んだ結果を、専門家が期首日付（`fiscalYear.start`）の伝票と突合する運用で補う。
9. A-2 により、取得仕訳を通常仕訳としてインポートした後に固定資産台帳も別途インポートする場合、台帳側の登録方法（取得仕訳との紐付け）はfreeeの仕様に依存し未確認。W003 の文言で確認を促す。
10. **(f) で対応済み・残るリスク `[要税理士確認]`**：`depreciationAccounts`（既定「減価償却費」「一括償却資産償却」）／`fixedAssetAccounts`（コード側既定は空、サンプルで供給）の既定リストと、`DEPRECIATION_MIXED` による除外規則の境界線は、顧問先の会計方針（直接法／間接法、少額減価償却資産の特例・一括償却資産の適用、期中売却時の償却計上方法、台帳への登録範囲）によって変わる。既定リストと除外規則が当該顧問先に適合するかは移行のたびに税理士が確認する必要がある。ツールは既定を提供するのみで、方針の妥当性は判断しない。
11. **freee 台帳の自動生成範囲**：freee は除却・売却を台帳に登録した場合も除却・売却仕訳を自動生成する／しないを選択できるとされる（ミナ確認・本文未取得）。本書は「移行時点で在籍する資産のみ台帳に入れ、過去の除却・売却仕訳は通常仕訳として移行する」前提で W003 のみ（除外なし）としている。期中に除却した資産まで台帳に含める運用をとる場合の挙動は `[未確認]`（§9）。**v3 で提案した W003 への文言追記（「台帳へ除却・売却を登録する場合は自動生成の設定も確認」）は実装で未採用**（README §8）。必要になれば有資格者向けの運用手順書側で補う。

## 推奨案

- 本 v4 時点で設計書と実装は整合している。次の作業は社長の §3.7 転記と §9 の確認事項への回答であり、コード側の変更は要しない。
- エイトの n8n 化はフェーズ2まで保留。ブラウザ用 codec（§6.1）はフェーズ1。

## 代替案

- ブラウザ完結の単一HTMLツール（encoding 層の差し替えが必要。フェーズ1）。
- スプレッドシートのテンプレート＋手順書（レン案D）を先行させ、対応表をスプレッドシート→JSON書き出しで両立。

## 出典

- 本書は新規の外部調査を行っていない。根拠は先行5資料（2026-09-14付）と、そこに記載の出典URL（いずれもWebSearch要約ベース・本文未確認）。
- 実装との突合は `accounting-converter/README.md`（§8 を正とする）、`src/core/index.ts`・`validate.ts`・`adapters/common.ts`・`model.ts`、`fixtures/mf/fixed-assets.csv`、`test/rules.test.ts`（固定資産境界テスト）・`test/mf.test.ts`（T6 該当箇所）を 2026-09-18 に読んで行った。`mapping.ts`・`report.ts`・`config.ts`・`cli/` は README の記述を信頼し、コードは未読。
- アオイの監査結果（v1〜v3 とも PASS WITH CONDITIONS）、仕様変更 A-1/A-2/(f) の方針決定、v4 の反映項目（条件3〜7）は、秘書アイ経由で受領した指示に基づく。
- (f) の会計上の根拠（「減価償却累計額」が除却・売却仕訳にも現れること、freee 台帳が除却・売却仕訳の自動生成を選択できること）はミナの見解に基づく。ミナが参照した freeeヘルプの本文は本セッションでは未取得であり、メイ自身は確認していない。

## §9. 未確認事項・社長確認事項（v3 から変更なし）

**未確認（技術・会計）**
- freee汎用形式テンプレートの列名・列順・必須列・税込/税抜・複合仕訳の表現・文字コード・行数上限
- MF仕訳帳CSVの正確なヘッダー名・文字コード（BOM有無）・複合仕訳の表現・税込/税抜・決算整理仕訳列の有無・タグ列に複数タグがどう格納されるか
- 弥生汎用形式のヘッダー有無・列順・識別フラグ列の有無・日付表記・税区分結合表記の実例
- freee税区分の正式名称一覧（「課対仕入（控80）10%」等は検索要約ベース）
- freeeが口座を補助科目として受けるか、取引先/部門/メモタグ列がテンプレートに存在するか
- freeeで固定資産台帳をインポートする際、既に取り込んだ取得仕訳とどう紐付くか（A-2 の前提）
- freee の固定資産台帳に、移行期中に除却・売却した資産まで登録した場合に、除却・売却仕訳の自動生成と通常仕訳インポートがどう重複するか（ミナ確認によれば生成する／しないを選択できるとされるが、本文未取得。リスク11）
- `depreciationAccounts`／`fixedAssetAccounts` の既定リストと `DEPRECIATION_MIXED` の除外規則が、顧問先の会計方針（直接法／間接法・特例適用）に適合するか `[要税理士確認]`（リスク10）
- **インボイス経過措置の期間（80%：〜2026-09-30、50%：2026-10-01〜2029-09-30）の国税庁一次情報での再確認**（未了。リサに依頼中）
- Node.js 20 の `TextDecoder('shift_jis')` 可否、`iconv-lite` のCP932機種依存文字の扱い（①・㈱以外）
- 依存パッケージ（`papaparse`・`iconv-lite`）が外部通信を行わないことの、コード監査による裏付け（T12 の範囲外）

**社長確認事項**
1. 入力の優先順位：MF先行でよいか。想定顧客が弥生中心なら入れ替える
2. 公式テンプレート・サンプルエクスポートの取得と転記（§3.7）。保管場所はリポジトリ外でよいか
3. PoC用データ：架空のみで進める方針でよいか。実データを使う場合の仮名化の要否と担当
4. AI提案の方式（§8.2 (i)/(ii)/(iii)）のうち商品として目指す方向
5. 出力先テンプレート：freee汎用形式を既定でよいか
6. `fixedAssets` の既定：`warn`（減価償却仕訳も出力）か `exclude`（純粋な減価償却仕訳を除外）か。除外規則の境界線（リスク10）は税理士確認を前提とする
7. 期首残高キーワード（§2.3 A-1 既定）に事務所固有の表記を追加するか
8. 部門を使う顧問先が多いか

## §10. 人間承認が必要な事項（`approval-policy.md`。v3 から変更なし）

| # | 事項 | 承認者 | 状態 |
|---|---|---|---|
| 1 | 実在の会計事務所・顧問先の実データをPoC/検証に使用すること（仮名化方針を含む） | 社長（＋当該事務所） | 未承認。PoCは架空データのみ |
| 2 | 外部AIサービスへ顧客データ由来の情報（科目名等を含む）を送信すること | 社長（＋顧問先同意はリョウ） | 未承認。PoCでは実装しない |
| 3 | freee本番事業所へのCSVインポート実行 | 会計事務所側の有資格者（ツールは実行しない） | ツール対象外 |
| 4 | **本ツールの外販・配布**（規約・商標・免責の整理） | 社長（リョウの規約確認・必要なら弁護士） | **未承認。READMEに「外販未承認の社内PoC」と明記済み** |
| 5 | 公式テンプレート・エクスポートファイル、および公式ヘッダー文字列の転記結果をリポジトリに含めること | 社長（リョウの規約確認後） | 「含めない」を推奨。転記は `.local.json` に対して行う運用 |
| 6 | 勘定科目・税区分対応表の内容確定 | 有資格者（税理士・会計士）の監修 | 未着手 |
| 7 | n8n等クラウド環境での実行（ローカル完結原則の変更） | 社長 | 本PoCでは行わない |
| 8 | インボイス経過措置の期間を対応表に確定値として入れること | 社長（リサの国税庁一次情報確認後） | 再確認未了。現状は `confirmed:false` |

## 次に必要なアクション

1. **アオイ**：v4 の最終確認（条件3〜7 が実装と整合して反映されたか）。
2. **社長**：§3.7 の転記と §9 の確認事項1〜8。
3. **リサ**：インボイス経過措置の期間を国税庁一次情報で確認し、§9 の未確認を解消。
4. **リョウ**：公式テンプレート・転記結果の非配布運用（`.local.json`）の妥当性、README／レポート末尾の免責文言案。
5. **ミナ**：残る `[要税理士確認]`（リスク10）と `[未確認]`（リスク11）を、社長のヒアリング先税理士への確認事項としてヒアリング質問リストへ追加するか検討。
6. **メイ**：以後、実装と本書が食い違った場合は README §8 を正とし、次版で追随させる。フェーズ1（ブラウザ用 codec・`RuleSuggester`・非同期 suggester の本格利用）の設計は社長の §9 回答後に着手。
