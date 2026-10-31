# 会計ツールコンバータ PoC（フェーズ0）詳細設計書 v2 ― CSVベース・ローカル完結型

- 作成：メイ（AI Automation & Operations Architect）
- 関連タスク：T13「会計ツールのコンバータ構築（コホマダ金融）」
- 対象事業：株式会社コホマダ（AI・DX事業／金融関連事業）。KINOTO・個人FP事業の情報は含まない
- 実装担当：ノヴァ（Web & Three.js Technical Architect）。実装先：`accounting-converter/`
- 基準日：2026-09-14
- ステータス：v2 Draft。v1 に対するアオイの監査結果（PASS WITH CONDITIONS）と、ノヴァの実装で判明した整合事項を反映した「あるべき仕様」。ノヴァは本v2に合わせてコードを更新中であり、**本書の記載＝実装済みではない**（evidence-policy 原則13）
- 前版：`logs/kohomada_2026-09-14_会計ツールコンバータPoC詳細設計_v1.md`（上書きせず保存）
- 先行資料（すべて2026-09-14付・`logs/`配下）：技術実現可能性（メイ）／移行課題リサーチ（リサ）／会計リスク整理（ミナ）／規約法務論点整理（リョウ）／事業モデル仮説（レン）

> **本設計書の最重要前提（v1から変更なし）**：本セッションでは egress proxy により `support.freee.co.jp` `developer.freee.co.jp` `biz.moneyforward.com` `support.yayoi-kk.co.jp` がブロックされており、**freee・MF・弥生いずれの公式CSV列定義も直接確認できていない**。本書は列名・列順を一切断定せず、外部設定ファイルに切り出して `TODO_VERIFY:` プレースホルダで示す。正確な値は社長が公式テンプレートをダウンロードして転記する（§3.7）。コード側は `TODO_VERIFY` が残っていれば本番変換を拒否する（§3.8）。

---

## v1 からの変更点

| # | 区分 | 変更内容 | 該当節 |
|---|---|---|---|
| 1 | 仕様変更 A-1 | 期首残高（`OPENING_BALANCE`）検出：キーワード照合の対象を**摘要・メモのみ**に限定し、科目名は照合しない。既定キーワードから単独の「繰越」を除外。科目ベースの判定は `openingBalanceCounterAccounts` と会計期間開始日の**組合せ**のみ。「繰越利益剰余金」を含む決算振替仕訳等の誤除外を防ぐ | §2.3、§3.1 |
| 2 | 仕様変更 A-2 | 固定資産：`fixedAssets:"exclude"` の除外対象は**減価償却仕訳（`DEPRECIATION`）のみ**。取得仕訳（`FIXED_ASSET`）は資金移動を伴うため除外せず W003 警告のみ。ミナ指摘の二重計上リスクは freee が台帳から自動生成する減価償却仕訳との重複に限られるため | §1.2、§2.4、§4.2 |
| 3 | 整合 | `convert()` を非同期（`Promise<ConvertResult>`）に変更（`MappingSuggester.suggest` が `Promise` を返すため） | §2 |
| 4 | 整合 | `JournalLine.tagsRaw` を追加（MF「タグ」列等の受け皿。`memo` と分離） | §2.3 |
| 5 | 整合 | `E000`（設定検証エラー）を追加。`convert()` は設定不備を例外ではなく診断として返す | §2、§3.8、§4.1 |
| 6 | 整合 | `confirmed:false` の対応表エントリ使用は `--dev` でも W012 を出す（v1は「`--dev` 以外で」としていた） | §3.3、§4.2 |
| 7 | 整合 | `verifyConfig()` にグループ化戦略名・`amountMode` の値域検査を追加 | §3.8 |
| 8 | 整合 | `run.json` に `input`（ファイル名・文字コード・物理行数・SHA-256）を含める。明細データは含めない | §5 |
| 9 | 整合 | `RuleSuggester` の扱いを「フェーズ1前半。PoCでは `NoopSuggester` のみ実装」に統一（v1は §6.3 と §8 で矛盾） | §6.3、§8 |
| 10 | 体裁 | 要約・結論が参照する「未確認事項・社長確認事項」「人間承認が必要な事項」に節番号 §9・§10 を付与 | §9、§10 |
| 11 | 体裁 | 「確認済み事実」の見出しを「先行資料からの引用（本文未検証）」に改め、直下の注記と矛盾しないようにした | 同節 |
| 12 | テスト | T9 の fixture を `mf/normal.csv`（BOM付き）＋`mf/utf8-nobom.csv`（＋`yayoi/sjis-noheader.txt`）に修正 | §7 |
| 13 | テスト | fixtures の取引先名は `例_` 接頭辞で統一（「例_ABC商事」等） | §7 |
| 14 | 承認・未確認 | README 追記事項（外販未承認・入力ファイル名に顧問先名を含めない・国税庁一次情報での再確認未了・外部通信検査の範囲）を §9・§10 に反映 | §6.5、§9、§10 |
| 15 | 技術 | `src/core/encoding.ts` が Node の `Buffer` に依存するため、ブラウザ化時は encoding 層の差し替えが必要。「そのまま流用」の表現を修正 | §6.1、§6.2 |

---

## 要約

1. **PoCは「CSV in → CSV out、外部通信ゼロ」のNode.js CLI（TypeScript）**として作る。変換ロジックは純関数（`src/core/`）に閉じ込め、将来のブラウザUI化・n8n化で再利用できる構造にする（ただし encoding 層は環境依存のため差し替え前提。§6.1）。この形はリョウの規約整理がどちらに転んでも成立し、レンの差別化仮説（AIマッピング提案＋差分検証＋専門家最終確認）の土台になる。
2. **入力の第1優先はMF「仕訳帳」CSV、第2優先は弥生「汎用形式」CSV**。MFはヘッダー行を持つと見られ（検索要約ベース）、列名ベースの読み込みでパイプライン検証に集中できる。弥生は文字コード・ヘッダー有無・税区分結合コードの不確実性が大きく、アダプタ層で吸収する。**社長の想定顧客が弥生中心なら順序を入れ替える**（§9）。
3. **PoCで扱うのは：仕訳・勘定科目（対応表）・税区分（対応表、自動判定なし）・取引先（マッピング＋重複/表記ゆれ検出）。期首残高は検出・集計・レポートのみ。減価償却仕訳は検出して警告（設定で除外可）、固定資産の取得仕訳は警告のみで除外しない。部門・品目・メモタグは既定で落として警告**。
4. 検証は「停止（error）」と「警告で続行（warning）」に分け、**設定不備・借貸不一致・未マッピング科目/税区分・日付/金額の解析失敗は停止**、**重複取引先候補・固定資産/減価償却科目・インボイス経過措置切替日またぎ・部門等の欠落は警告**。
5. 差分レポートは Markdown と CSV の両方。**勘定科目別の借方/貸方合計（移行元 vs 変換後）**を中核に、未マッピング一覧・警告一覧を添える。
6. AIマッピング提案（フェーズ1）は `MappingSuggester` の差し込み口だけを用意し、**PoCでは `NoopSuggester` のみ**。外部LLMへの送信は `approval-policy.md` 上、社長の事前承認が必要であり、有効化には承認記録＋明示フラグを要する。
7. **人間の承認が必要な事項**は §10 に独立して列挙。PoCは架空データのみで動かし、外販は未承認。

---

## 結論

- PoCの目的は「変換精度100%」ではなく、**(a) 列定義を設定に外出しした変換パイプラインが動くこと、(b) 停止/警告の分類が会計上のリスク（ミナ整理）に対応していること、(c) 差分レポートが専門家の最終確認に使える形であること**の実証に置く。
- 規約（リョウ）・ヒアリング（ミナ質問リスト）の結果を待たずに着手できる範囲は §1〜§7 のすべて（架空データ前提）。着手できないのは「実データでの検証」「公式列定義の確定」「外部LLM利用」で、いずれも社長の作業・承認が前提（§9・§10）。
- ノヴァは §6.3 の構成・§2 の関数シグネチャ・§3 の設定雛形・§7 のテストに従う。列名はすべて `TODO_VERIFY:` 付きで置き、`verify-config` が未転記を検出する。

---

## 先行資料からの引用（本文未検証）

> 以下はすべて先行5資料からの引用であり、各資料はWebSearch要約ベースで一次情報の本文を直接確認できていない。本書もその制約を引き継ぐ。「確認済み」とは扱わない。

- freeeは「他社会計ソフトから仕訳データを移行する」機能とCSVテンプレート（Shift-JIS版／UTF-8版）を公式に用意しているとされる。弥生会計形式・マネーフォワード形式・freee汎用形式など複数の形式があるとされる〔メイ技術検討・リサ調査〕。
- 弥生会計（デスクトップ）は仕訳日記帳を「弥生インポート形式」「汎用形式」でエクスポートでき、汎用形式は区切り文字にカンマを指定できるとされる〔メイ技術検討〕。やよいの青色申告オンラインのエクスポートCSVにはヘッダー行が付かないという指摘がある〔リサ調査〕。
- 弥生会計の消費税は「税区分」と「税計算区分」に分かれ、テキストのインポート/エクスポート時は結合した形式で記載されるとされる〔ミナ整理〕。
- MFクラウド会計「仕訳帳」CSVの項目は、取引No・取引日・勘定科目・補助科目・部門・取引先・税区分・インボイス・金額・摘要・タグ・メモ等とされる〔リサ調査。正確な列名・列順は未確認〕。
- freeeは取引先名・品目名・部門名の完全一致の重複を許可しない仕様があるとの指摘がある〔リサ調査（第三者ブログの要約）〕。
- freeeは固定資産台帳に登録すると減価償却仕訳を自動生成するため、台帳インポートと減価償却費を含む仕訳インポートを両方行うと二重計上の恐れがあるとされる〔ミナ整理・freee公式ヘルプの要約〕。
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

**優先順位の理由**：MFはヘッダー行あり・UTF-8想定で「列名で読む」実装が安定しやすく、まず骨格（正規化→マッピング→検証→出力→レポート）を確実に動かせる。弥生は読み込み側固有の不確実性があり、骨格が固まった後にアダプタ1枚を追加する形が手戻りが少ない。両方ともPoC内で実装する。

> 補足：freeeが「マネーフォワード形式」「弥生会計形式」テンプレートを用意しているとされる〔リサ調査〕。公式テンプレート確認の結果、MF/弥生のエクスポートをほぼそのまま受け付けられると判明した場合、コンバータの価値は「形式変換」ではなく「マッピング・検証・差分レポート」に寄る。出力先は `targets/*.json` で差し替え可能にしておく。

### 1.2 データ種別ごとの扱い

| データ種別 | PoCでの扱い | 備考 |
|---|---|---|
| 仕訳（日付・伝票番号・借方/貸方科目・金額・摘要） | **変換する** | 中核 |
| 勘定科目 | **対応表で変換**（`maps/accounts.json`）。未対応は停止 | 対応表は有資格者が確定 |
| 補助科目 | **ルールで freee タグ（取引先／メモタグ）へ割当**。品目・部門への割当はルール記述のみ許可し、出力は警告付き | §3.5 |
| 税区分 | **対応表で変換**（`maps/taxcodes.json`）。自動判定はしない。未対応は停止 | 日付依存の対応（経過措置）を表現可能 |
| 取引先 | MFの取引先列／補助科目由来の取引先を**そのまま出力**＋**重複・表記ゆれ候補を警告** | 名寄せは `maps/partners.json` の別名表で人間が指定したときのみ |
| 期首残高（開始残高・繰越仕訳） | **検出して除外し、集計をレポートに出す**。変換しない | freee開始残高テンプレートはフェーズ1。検出条件は §2.3（A-1） |
| 減価償却仕訳（`DEPRECIATION`） | **検出して警告 W004**（既定 `warn`）。`fixedAssets:"exclude"` で**出力から除外** | freee台帳自動生成仕訳との二重計上リスク対応（A-2） |
| 固定資産の取得・除却等の仕訳（`FIXED_ASSET`） | **検出して警告 W003 のみ。除外しない**（`exclude` 設定でも除外しない） | 資金移動（預金減等）を伴うため除外すると残高が崩れる（A-2） |
| 部門 | **既定で落として警告**。設定で出力列へ素通し可 | 出力列の存在が未確認 |
| 品目・メモタグ | **PoCでは生成しない**（MF「タグ」列等は `tagsRaw` に保持し、既定は警告付きで落とす。設定でメモタグへ素通し可） | フェーズ1 |
| 固定資産台帳・給与・債権債務残高 | **対象外** | 先行資料どおり |

---

## §2. 処理パイプライン

```
[bytes] → decode → parseCsv → toDataset(adapter) → applyMappings → validate → renderOutput → buildReport
            §2.1      §2.2         §2.3              §2.4          §2.5        §2.6          §2.7
```

`src/core/` は純関数（ファイル・ネットワーク・`process` に触れない）。最上位は次の1関数：

```ts
export async function convert(input: ConvertInput): Promise<ConvertResult>;   // 副作用なし。suggester が非同期のため Promise

export interface ConvertInput {
  bytes: Uint8Array;                 // 入力CSVの生バイト
  profile: Profile;                  // §3.1（読み込み済みJSONを束ねたオブジェクト）
  fileName?: string;
  suggester?: MappingSuggester;      // §8。省略時 NoopSuggester
  options?: { dev?: boolean; force?: boolean; strict?: boolean };
}
export interface ConvertResult {
  dataset: Dataset | null;           // E000 のときは null
  diagnostics: Diagnostic[];         // error/warning/info
  outputCsv: string | null;          // error が1件でもあれば null（--force 時はエラー伝票除外で出力）
  report: Report | null;
  stats: { rows: number; entries: number; lines: number; errors: number; warnings: number };
}
```

`convert()` は最初に `verifyConfig(profile)`（§3.8）を実行し、失敗時は **例外を投げず `E000` 診断を返して終了**する（CLIが終了コード2に変換）。

### 2.1 decode（文字コード判定）

```ts
export function decodeBytes(bytes: Uint8Array, hint: 'auto'|'utf8'|'shift_jis'): { text: string; encoding: 'utf8'|'shift_jis'; hadBom: boolean }
export function encodeText(text: string, enc: 'utf8_bom'|'utf8'|'shift_jis'): Uint8Array
```

- 先頭 `EF BB BF` → UTF-8（BOM除去）。それ以外で `auto`：`TextDecoder('utf-8', { fatal: true })` で試し、例外なら Shift_JIS（CP932）として `iconv-lite` でデコード。判定結果は `I001`。
- 出力エンコードは `target.encoding`。既定 `utf8_bom`。freeeが実際に受け付ける文字コードは公式テンプレートで確認（TODO_VERIFY）。
- **実装上の注意（v2追記）**：`iconv-lite` は Node の `Buffer` を前提とするため、`encoding.ts` は Node 環境依存になる。`core` の他モジュールは `encoding.ts` に依存せず `string` を受け取る設計とし、ブラウザ化時は `encoding.ts` のみ `TextDecoder`／別ライブラリ実装に差し替える（§6.1）。

### 2.2 parseCsv

```ts
export function parseCsv(text: string, opts: { delimiter: ','|'\t'; hasHeader: boolean|'auto'; headerSignature?: string[] }): { header: string[]|null; rows: RawRow[] }
export interface RawRow { rowNumber: number; cells: string[] }   // 1始まりの物理行番号
```

- RFC 4180準拠。`papaparse` を利用。
- `hasHeader:'auto'`：1行目が `headerSignature` を1つ以上含めばヘッダー。含まなければヘッダー無しとして列インデックスで読む（弥生対応）。
- 空行はスキップ。列数不整合は `E005`。

### 2.3 toDataset（正規化：中間モデルへ）

```ts
export type SourceSystem = 'mf_journal' | 'yayoi_generic';
export type EntryFlag = 'OPENING_BALANCE' | 'CLOSING_ADJUSTMENT' | 'FIXED_ASSET' | 'DEPRECIATION' | 'COMPOUND';

export interface Dataset {
  source: SourceSystem;
  sourceFile: { name: string; encoding: string; hadBom: boolean; hasHeader: boolean; physicalRows: number };
  entries: JournalEntry[];
}

export interface JournalEntry {
  entryId: string;                 // "E000001" 連番
  voucherNo: string | null;
  date: string;                    // ISO "YYYY-MM-DD"
  description: string;             // 摘要（伝票単位。行ごとに異なる場合は先頭行を採用し、各行は line.memo に保持）
  lines: JournalLine[];            // 最低2行
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
  memo: string | null;             // 行単位の摘要・仕訳メモ
  tagsRaw: string | null;          // (v2追加) MF「タグ」列など。memo と分離して保持
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
  provenance: { account: 'table'; tax: 'table'|'table_dated'; subAccount: `rule:${string}`|'none'; partner: 'column'|'subaccount'|'alias'|'none' };
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

**アダプタ**（`adapters/mf.ts`, `adapters/yayoi.ts`）は `sourceConfig.columns` に従い `RawRow` → 行ごとの `{debit?, credit?, voucherNo, date, description, groupKey}` を作り、`grouping` 戦略で束ねる：

- `'by_voucher_no'`：同一 `voucherNo` の連続行を1伝票（MF「取引No」想定）。
- `'by_flag'`：識別フラグ列で単一／複合開始／複合中／複合終了を判定（弥生インポート形式で知られる方式。汎用形式に同様のフラグがあるかは**未確認**）。フラグ値は `grouping.flagValues` に外出し。
- `'each_row'`：1行＝1伝票。

**正規化の細則**：
- 日付：`dateFormats` で順に解析。和暦は `"GYY/MM/DD"` を含めた場合のみ `eraTable` で解釈。失敗は `E004`。
- 金額：全角→半角、カンマ・空白・円記号除去、`△`/`▲`/`-` は負号。小数は `E005`。負は `W010`。空欄は「行なし」。
- 科目照合キーは NFKC＋trim＋連続空白1つ化。出力値は `accountRaw` を対応表で引いた結果。

**フラグ付与（v2で A-1 を反映）**。正規表現・リストは `options.detectors` に外出し：

- `OPENING_BALANCE`（期首残高）は次の **いずれか** で付与する：
  - (a) **摘要（`entry.description`）または行メモ（`line.memo`）**が `openingBalanceKeywords` のいずれかを含む。**科目名は照合対象にしない**。既定キーワードは `["期首残高", "開始残高", "前期繰越", "前期より繰越", "期首繰越"]`。**単独の「繰越」は既定に含めない**（「繰越利益剰余金」を含む決算振替仕訳等の誤除外を防ぐため。事務所がキーワードを追加する場合は設定で行う）。
  - (b) 伝票日付が `fiscalYear.start` と一致し、**かつ** いずれかの行の科目が `openingBalanceCounterAccounts`（既定 `["元入金", "資本金", "繰越利益剰余金", "開始残高", "期首残高"]`。相手科目として使われる科目のリスト）に含まれる。日付条件と科目条件は**両方必要**（AND）。期首日以外の「繰越利益剰余金」を含む仕訳は付与しない。
- `DEPRECIATION`：いずれかの行の科目が `depreciationAccounts`（既定 `["減価償却費", "減価償却累計額", "一括償却資産償却"]`）に含まれる。
- `FIXED_ASSET`：いずれかの行の科目が `fixedAssetAccounts`（既定 `["建物", "建物附属設備", "構築物", "機械装置", "車両運搬具", "工具器具備品", "土地", "ソフトウェア", "一括償却資産", "リース資産"]`）に含まれる。
- `CLOSING_ADJUSTMENT`：決算整理仕訳フラグ列がある場合（列の有無は未確認）。
- `COMPOUND`：`lines.length > 2`。

### 2.4 applyMappings

```ts
export async function applyMappings(ds: Dataset, maps: Maps, opts: MappingOptions, suggester: MappingSuggester): Promise<{ dataset: Dataset; diagnostics: Diagnostic[] }>
```

各 `JournalLine` について順に：

1. **勘定科目**：`maps.accounts[照合キー]`。ヒット→`freeeAccount`（＋`freeeSubAccount`）。ミス→`E002`。`confirmed:false` のエントリ使用は **`--dev` の有無にかかわらず `W012`**（`--strict` では error 扱い）。
2. **税区分**：`maps.taxcodes`（§3.4）。日付範囲付きエントリは伝票日付で選ぶ。ミス→`E003`。空欄で科目が `defaultForBlank.appliesToAccounts` にあれば既定値、それ以外の空欄は `E003`。
3. **補助科目→freeeタグ**：`maps.subaccountRules`（§3.5）を上から評価し最初のマッチを適用。マッチなし→`defaultAction`。
4. **取引先**：取引先列（MF） > 補助科目ルールの `partner` > null。`maps.partners.aliases` に一致すれば置換。
5. **部門**：`opts.departments = 'drop'|'passthrough'`。`drop` で値があれば `W008`。
6. **タグ**：`opts.tags = 'drop'|'memo_tag'`。`drop` で `tagsRaw` に値があれば `W008`。
7. **除外処理**（v2で A-2 を反映）：`opts.openingBalances = 'exclude_and_report'` なら `OPENING_BALANCE` 伝票を出力対象から外し `I002`。`opts.fixedAssets = 'exclude'` なら **`DEPRECIATION` 伝票のみ**出力対象から外し `I002`。**`FIXED_ASSET` 伝票はどの設定でも除外しない**。
8. `suggester.suggest()` は未マッピング一覧確定後に一度だけ呼び、提案を `detail.suggestions` に添える（PoCは Noop）。提案は自動適用しない。

### 2.5 validate（§4）

```ts
export function validate(ds: Dataset, rules: ValidationConfig): Diagnostic[]
```

### 2.6 renderOutput

```ts
export function renderOutput(ds: Dataset, target: TargetConfig): { csv: string; diagnostics: Diagnostic[] }
```

- `target.columns` の順に `from`（中間モデルのパス式）から値を取り出す。
- `rowModel:'debit_credit_pair'`（既定）：単純仕訳は1行。複合仕訳は `compoundEntries`：`'blank_side'`（片側空欄で複数行、伝票番号で結ぶ。freeeが受け付けるかは TODO_VERIFY）／`'unsupported'`（`E007`）。
- `rowModel:'one_row_per_line'`：将来用。
- RFC 4180エスケープ。改行は `target.newline`（既定 CRLF）。
- errorが1件でもあればCLIはfreee用CSVを書き出さない。`--force` でエラー伝票を除外して出力（レポートに除外一覧を明記）。

### 2.7 buildReport（§5）

```ts
export function buildReport(ds: Dataset, diags: Diagnostic[], ctx: { profileName: string; runAt: string; sourceFile: string }): Report
export function renderReportMarkdown(r: Report): string
export function renderReportCsvBundle(r: Report): { accounts: string; unmapped: string; diagnostics: string; taxcodes: string }
```

---

## §3. マッピング設定の仕様

形式は **JSON**（コメントは `"_comment"` キー）。`profile.json` が各ファイルを束ねる。

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
    "departments": "drop",
    "tags": "drop",                    // "drop" | "memo_tag"
    "fixedAssets": "warn",             // "warn" | "exclude"（exclude は DEPRECIATION のみ除外）
    "openingBalances": "exclude_and_report",   // "exclude_and_report" | "include_with_warning"
    "invoiceTransitionDates": ["2026-09-30"],  // 切替の「最終日」。延長が法制化されたら追記
    "partnerFuzzyThreshold": 2,
    "detectors": {
      "openingBalanceKeywords": ["期首残高", "開始残高", "前期繰越", "前期より繰越", "期首繰越"],   // 摘要・メモのみに適用。単独「繰越」は含めない
      "openingBalanceCounterAccounts": ["元入金", "資本金", "繰越利益剰余金", "開始残高", "期首残高"], // fiscalYear.start と同日の伝票にのみ適用
      "depreciationAccounts": ["減価償却費", "減価償却累計額", "一括償却資産償却"],
      "fixedAssetAccounts": ["建物", "建物附属設備", "構築物", "機械装置", "車両運搬具", "工具器具備品", "土地", "ソフトウェア", "一括償却資産", "リース資産"]
    }
  }
}
```

```jsonc
// config/sources/mf-journal.json   ※列名はすべて未確認。公式エクスポートのヘッダーを転記する
{
  "system": "mf_journal",
  "encoding": "auto",
  "delimiter": ",",
  "hasHeader": "auto",
  "headerSignature": ["TODO_VERIFY:取引No", "TODO_VERIFY:取引日"],
  "dateFormats": ["YYYY/MM/DD", "YYYY-MM-DD", "YYYY/M/D"],
  "amountMode": "TODO_VERIFY:tax_included",
  "grouping": { "strategy": "by_voucher_no" },
  "columns": {
    "voucherNo":        { "header": "TODO_VERIFY:取引No" },
    "date":             { "header": "TODO_VERIFY:取引日" },
    "debit.account":    { "header": "TODO_VERIFY:借方勘定科目" },
    "debit.subAccount": { "header": "TODO_VERIFY:借方補助科目" },
    "debit.department": { "header": "TODO_VERIFY:借方部門" },
    "debit.partner":    { "header": "TODO_VERIFY:借方取引先" },
    "debit.taxCode":    { "header": "TODO_VERIFY:借方税区分" },
    "debit.invoice":    { "header": "TODO_VERIFY:借方インボイス" },
    "debit.amount":     { "header": "TODO_VERIFY:借方金額(円)" },
    "debit.taxAmount":  { "header": "TODO_VERIFY:借方税額" },
    "credit.account":   { "header": "TODO_VERIFY:貸方勘定科目" },
    "credit.subAccount":{ "header": "TODO_VERIFY:貸方補助科目" },
    "credit.department":{ "header": "TODO_VERIFY:貸方部門" },
    "credit.partner":   { "header": "TODO_VERIFY:貸方取引先" },
    "credit.taxCode":   { "header": "TODO_VERIFY:貸方税区分" },
    "credit.invoice":   { "header": "TODO_VERIFY:貸方インボイス" },
    "credit.amount":    { "header": "TODO_VERIFY:貸方金額(円)" },
    "credit.taxAmount": { "header": "TODO_VERIFY:貸方税額" },
    "description":      { "header": "TODO_VERIFY:摘要" },
    "memo":             { "header": "TODO_VERIFY:仕訳メモ", "optional": true },
    "tags":             { "header": "TODO_VERIFY:タグ", "optional": true },
    "closingFlag":      { "header": "TODO_VERIFY:決算整理仕訳", "optional": true }
  },
  "_comment": "header は公式エクスポートのヘッダー文字列と完全一致させる。TODO_VERIFY: の後ろは推定名。"
}
```

```jsonc
// config/sources/yayoi-generic.json   ※ヘッダー無しの可能性があるため index 指定を主にする
{
  "system": "yayoi_generic",
  "encoding": "shift_jis",
  "delimiter": ",",
  "hasHeader": "auto",
  "headerSignature": ["TODO_VERIFY:伝票No", "TODO_VERIFY:取引日付"],
  "dateFormats": ["YYYY/MM/DD", "GYY/MM/DD"],
  "eraTable": { "R": 2018, "H": 1988 },
  "amountMode": "TODO_VERIFY:tax_included",
  "grouping": {
    "strategy": "TODO_VERIFY:by_flag",
    "flagColumn": { "index": 0 },
    "flagValues": { "single": ["TODO_VERIFY:2000"], "compoundStart": ["TODO_VERIFY:2111"], "compoundMiddle": ["TODO_VERIFY:2100"], "compoundEnd": ["TODO_VERIFY:2101"] }
  },
  "columns": {
    "voucherNo":        { "index": "TODO_VERIFY:1" },
    "closingFlag":      { "index": "TODO_VERIFY:2", "optional": true },
    "date":             { "index": "TODO_VERIFY:3" },
    "debit.account":    { "index": "TODO_VERIFY:4" },
    "debit.subAccount": { "index": "TODO_VERIFY:5" },
    "debit.department": { "index": "TODO_VERIFY:6" },
    "debit.taxCode":    { "index": "TODO_VERIFY:7" },
    "debit.amount":     { "index": "TODO_VERIFY:8" },
    "debit.taxAmount":  { "index": "TODO_VERIFY:9" },
    "credit.account":   { "index": "TODO_VERIFY:10" },
    "credit.subAccount":{ "index": "TODO_VERIFY:11" },
    "credit.department":{ "index": "TODO_VERIFY:12" },
    "credit.taxCode":   { "index": "TODO_VERIFY:13" },
    "credit.amount":    { "index": "TODO_VERIFY:14" },
    "credit.taxAmount": { "index": "TODO_VERIFY:15" },
    "description":      { "index": "TODO_VERIFY:16" },
    "memo":             { "index": "TODO_VERIFY:21", "optional": true }
  },
  "_comment": "index は0始まり。並びは弥生インポート形式について第三者情報で流布している列順の『仮置き』であり、汎用形式が同じ並びかは未確認。"
}
```

列指定は `{ "header": … }` と `{ "index": n }` を両方許可し、両方あればheader優先、ヘッダー無しではindexにフォールバック。

### 3.2 `targets/freee-generic.json`（(b) 出力列順・列名）

v1 と同一（`templateInfo`・`encoding:"utf8_bom"`・`rowModel:"debit_credit_pair"`・`compoundEntries:"TODO_VERIFY:blank_side"`・`columns[]` すべて `TODO_VERIFY:` 付き）。ノヴァは v1 §3.2 の雛形をそのまま使用してよい。

### 3.3 `maps/accounts.json`（(c) 勘定科目対応表）

v1 と同一構造（`entries: { <照合キー>: { freeeAccount, freeeSubAccount?, confirmed, source, note? } }`）。
**変更**：`confirmed:false` のエントリを使用した場合、**`--dev` の有無にかかわらず `W012`** を出す。`--strict` では error 扱い。

### 3.4 `maps/taxcodes.json`（(d) 税区分対応表・日付依存対応可）

v1 と同一（`defaultForBlank`、`entries[].sourceTaxCode/freeeTaxCode/rate/effectiveFrom/effectiveTo/confirmed`）。80%/50%の期間は現行制度に基づく（国税庁一次情報での再確認は未了）。延長は法制化確認後に `entries` を追記する。

### 3.5 `maps/subaccount-rules.json`（(e) 補助科目→freeeタグ割当ルール）

v1 と同一（`defaultAction`、`rules[].id/when/then/note`）。

### 3.6 `maps/partners.json`

v1 と同一（`aliases`。自動名寄せはしない）。

### 3.7 「公式テンプレートから転記する手順」（社長作業・1回限り）

v1 と同一（7ステップ：テンプレートDL→テキストエディタでヘッダー転記→税込/税抜・複合仕訳・必須列・文字コードの反映→MF/弥生の架空数件エクスポートでヘッダー/列順確認→`config/templates/` にのみ保管しコミットしない→`verify-config` が通るまで繰り返す）。
**追記**：エクスポート時の入力ファイル名に顧問先名・事務所名を含めない（`in/journal.csv` のような無機質な名前にする。`run.json` にファイル名が記録されるため）。

### 3.8 `verifyConfig()` と `verify-config` コマンド

`src/core/config.ts` の `verifyConfig(profile): Diagnostic[]`（純関数）が以下を検査し、1件でも error があれば `convert()` は `E000` を返して終了する。CLI `verify-config` は同関数を呼び結果を表示（失敗なら終了コード2）。

- 値・キーに `TODO_VERIFY` 接頭辞が残っていないか（残っていればファイル・パスを列挙）
- `target.columns` の `required:true` 列がすべて `from` を持つか
- `source.columns` の必須キー（date, debit.account, debit.amount, credit.account, credit.amount）が定義されているか
- **（v2追加）`grouping.strategy` が `by_voucher_no | by_flag | each_row` のいずれかか。`by_flag` のとき `flagColumn`・`flagValues` が揃っているか**
- **（v2追加）`amountMode` が `tax_included | tax_excluded | unknown` のいずれかか（`unknown` は W014 を伴う）**
- `taxcodes.entries` に同一 `sourceTaxCode` で日付範囲が重複するものがないか
- `accounts.entries` の `confirmed:false` 件数（警告として件数表示）
- `--dev` 指定時のみ、`TODO_VERIFY` を「推定名のまま」として扱い `W013` を出して続行する（fixtures での開発用）。**`--dev` でも `W012`（confirmed:false 使用）は出す**。

---

## §4. 検証ルール

### 4.1 停止（error：freee用CSVを出力しない）

| コード | 内容 | 判定 |
|---|---|---|
| **E000** | **（v2追加）設定検証エラー** | `verifyConfig()` の error。`TODO_VERIFY` 残存・必須列欠落・不正な戦略名/amountMode・税区分日付重複 |
| E001 | 伝票単位の借方合計 ≠ 貸方合計 | `amountMode:'unknown'` のときは W014 を併発 |
| E002 | 勘定科目が対応表に無い | 未マッピング一覧に元科目名・件数・借方/貸方合計・初出行 |
| E003 | 税区分が対応表に無い／該当期間のエントリが無い | 同上 |
| E004 | 日付が解析できない | `dateFormats` 全滅 |
| E005 | 金額が解析できない／列数不整合／必須列が空 | |
| E006 | 出力テンプレートの必須列に値が入らない | `renderOutput` 時 |
| E007 | 複合仕訳が出力テンプレートで表現不可 | `compoundEntries:'unsupported'` かつ `lines.length>2` |
| E008 | 伝票に明細行が1つしかない | グループ化設定の見直しを促す |

### 4.2 警告（warning：出力は続行。レポートに一覧）

| コード | 内容 | 判定 |
|---|---|---|
| W001 | 取引先名の完全一致衝突候補 | 正規化（NFKC・trim・空白除去・英字大小統一）後に同一だが元文字列が異なる組 |
| W002 | 取引先名の表記ゆれ候補 | 正規化＋法人格表記除去後のレーベンシュタイン距離 ≤ `partnerFuzzyThreshold`（既定2、5文字以下は1） |
| W003 | 固定資産科目を含む伝票（取得・除却等） | `FIXED_ASSET` フラグ。「固定資産台帳を別途インポートする場合、取得仕訳の扱いを確認」。**どの設定でも除外しない**（A-2） |
| W004 | 減価償却関連科目を含む伝票 | `DEPRECIATION` フラグ。「freeeの固定資産台帳から自動生成される減価償却仕訳と二重計上になる恐れ」。`fixedAssets:'exclude'` なら**この伝票のみ**出力から除外して `I002`（A-2） |
| W005 | 日付範囲がインボイス経過措置の切替日をまたぐ | `min(date) <= D && max(date) > D` |
| W006 | 会計期間外の伝票 | `fiscalYear` 設定時 |
| W007 | 期首残高と思われる伝票 | `OPENING_BALANCE` フラグ（§2.3 A-1 の条件）。既定で除外し期首残高セクションへ |
| W008 | 部門・タグ等を落とした | `departments:'drop'`／`tags:'drop'` で値があった |
| W009 | 税額が逆算値と±1円超で乖離 | `taxAmount != null` かつ `rate` 既知 |
| W010 | 負の金額 | |
| W011 | 伝票番号の重複（非連続） | |
| W012 | `confirmed:false` の対応表エントリを使用 | **`--dev` でも出す** |
| W013 | `--dev` で `TODO_VERIFY` 列名のまま実行 | 開発時のみ |
| W014 | `amountMode:'unknown'` のまま借貸チェック | |
| W015 | 同一補助科目名が複数の親科目に出現しルール適用結果が異なる | |
| W016 | 外部AI提案が要求されたが承認記録・フラグが揃わず Noop にフォールバック | §8（フェーズ1） |

### 4.3 情報（info）

I001 文字コード判定結果／I002 除外した伝票数（減価償却・期首残高）／I003 グループ化戦略と伝票数・明細数。

---

## §5. 差分レポート仕様

出力ファイル（`out/<実行日時>_<profile名>/`）：

| ファイル | 内容 |
|---|---|
| `freee_import.csv` | 変換結果（errorゼロ、または `--force` 時） |
| `report.md` | 人が読む総括 |
| `report_accounts.csv` | 勘定科目別集計 |
| `report_taxcodes.csv` | 税区分別集計 |
| `report_unmapped.csv` | 未マッピング一覧 |
| `report_diagnostics.csv` | 全診断（code, severity, entryId, sourceRow, message, detail JSON） |
| `run.json` | 実行メタ。**（v2）`input: { fileName, encoding, hadBom, physicalRows, sha256 }` を含む**。ほかに profile名・各設定ファイルのsha256・件数・所要時間・CLIオプション。**明細データ（金額・科目・摘要）は含めない** |

`report.md` の構成（v1と同一）：概要／勘定科目別 借方・貸方合計（移行元 vs 変換後・差額・件数・備考。除外伝票による差額は備考に自動記載）／税区分別合計／期首残高・除外伝票セクション（減価償却除外分も含む）／未マッピング一覧／取引先セクション（W001/W002ペア）／警告一覧／補助科目割当サマリ／確認依頼事項（固定文言：「本レポートは自動変換の下書きです。freeeへのインポートおよび勘定科目・税区分対応表の妥当性の最終確認は、会計事務所側の有資格者が行ってください。本ツールは税務・会計上の判断を行いません。」）。

---

## §6. 技術スタック

### 6.1 結論：Node.js 20 LTS ＋ TypeScript の CLI、変換ロジックは純関数モジュール

- **ローカル完結**の要件を CLI なら構造的に満たせる。`src/core/` に `fetch`/`http`/`fs`/`process` を import しないことをテストで担保する（§7 T12。検査範囲の限界は §6.5）。
- **将来のブラウザUI化**：`papaparse` はブラウザで動き、`core` の変換部は `string`／設定オブジェクトのみを受け取る。**ただし `src/core/encoding.ts` は `iconv-lite` 経由で Node の `Buffer` に依存するため、ブラウザ版では encoding 層を `TextDecoder('shift_jis')`＋Shift_JISエンコード可能な別実装に差し替える必要がある**。「そのまま流用」できるのは `encoding.ts` を除く `core` 各モジュール。差し替えを容易にするため、`core/index.ts` は `decodeBytes/encodeText` を注入可能（`ConvertInput.codec?`）にしておく。
- **n8n化**（フェーズ2、エイト）は `core` のnpm化後に判断。クラウド上のn8nで動かすとローカル完結原則と衝突するため、**事務所側PC／セルフホスト限定**。

### 6.2 依存ライブラリ（最小限）

| 区分 | パッケージ | 用途 | 備考 |
|---|---|---|---|
| runtime | `papaparse` | CSVパース/生成 | 依存なし・ブラウザ可 |
| runtime | `iconv-lite` | Shift_JIS（CP932）デコード／エンコード | **Node `Buffer` 依存**。ブラウザ版では差し替え（§6.1）。Node標準 `TextDecoder('shift_jis')` の可否はノヴァが実機確認 |
| dev | `typescript`, `tsx`, `@types/node`, `@types/papaparse` | | テストは `node:test`＋`node:assert` |

CLI引数は `node:util.parseArgs`。ネットワーク系依存はPoCに入れない。

### 6.3 フォルダ構成

```
accounting-converter/
  README.md   package.json   tsconfig.json   .gitignore（in/ out/ config/templates/ config/profile.json）
  src/
    core/
      index.ts        # convert()（async）のみ公開
      model.ts        # §2.3 の型
      encoding.ts     # decodeBytes / encodeText（Node依存。ブラウザ化時に差し替え）
      csv.ts  normalize.ts
      adapters/mf.ts  adapters/yayoi.ts  adapters/index.ts
      mapping.ts  validate.ts  output.ts  report.ts
      suggest.ts      # MappingSuggester インターフェース＋NoopSuggester（PoCはこれのみ。RuleSuggester はフェーズ1前半）
      config.ts       # Profile型・verifyConfig()
    cli/index.ts      # convert / verify-config / inspect
  config/  profile.sample.json  sources/  targets/  maps/  templates/(gitignore)
  fixtures/  mf/*.csv  yayoi/*.txt  expected/*.json
  test/*.test.ts
```

### 6.4 CLI

```
npx tsx src/cli/index.ts inspect       --input in/journal.csv [--encoding auto|utf8|shift_jis]
npx tsx src/cli/index.ts verify-config --profile config/profile.json
npx tsx src/cli/index.ts convert       --profile config/profile.json --input in/journal.csv --out out/ [--dev] [--force] [--strict]
```

終了コード：0＝成功（警告なし）、1＝警告あり（出力あり）、2＝エラーあり（E000含む。出力なし）。

### 6.5 セキュリティ・ローカル完結の担保

- `core` はネットワーク・ファイルシステムに触れない（T12 で静的検査）。**検査の範囲は `src/core/**` のソース文字列のみであり、依存パッケージ（`papaparse`・`iconv-lite`）やNodeランタイム自体の挙動は対象外**。依存パッケージがネットワークアクセスを行わないことは、パッケージの性質（純粋な文字列処理ライブラリ）からの推定であり、READMEにこの範囲を明記する。
- `run.json`・ログに明細を残さない。診断 `detail` に摘要全文を入れない。
- `in/`・`out/`・`config/templates/`・実運用 `config/profile.json` は `.gitignore`。コミットされるのは `fixtures/`（架空）と `*.sample.json` のみ。
- 入力ファイル名に顧問先名・事務所名を含めない運用（`run.json` に記録されるため）。
- README に明記：「データを外部に送信しない」「税務・会計上の判断を行わない」「最終確認は有資格者が行う」「本ツールは外販未承認の社内PoCである」「インボイス経過措置の期間は国税庁一次情報での再確認未了」「外部通信検査は `src/core` のソース文字列のみが対象」。

---

## §7. テスト方針

- `node --test`（`tsx` 経由）。fixtures＋`--dev` 相当のプロファイルで `await convert()` を呼び、診断コード集合と集計値を `expected/*.json` と比較。
- fixtures はすべて**架空**。**取引先名は `例_` 接頭辞で統一**（「例_ABC商事」「例_テスト工業」「例_ダミー物産」）。人名・住所・電話・登録番号を含めない。金額は端数を含む。
- 弥生fixtureはShift_JIS、MFfixtureは既定でUTF-8 BOM付き。

| # | ケース | fixture | 期待 |
|---|---|---|---|
| T1 | 正常系 | `mf/normal.csv`, `yayoi/normal.txt` | error 0、warning 0、出力行数＝伝票数、科目別合計一致 |
| T2 | 複合仕訳 | `mf/compound.csv` | `blank_side` で出力行数＝明細数、`unsupported` で E007 |
| T3 | 未マッピング | `mf/unmapped.csv` | E002×1種、E003×1種、出力なし |
| T4 | 借貸不一致 | `mf/unbalanced.csv` | E001（伝票IDと差額） |
| T5 | 重複取引先（「例_ABC商事」「例_ＡＢＣ商事」「（株）例_ABC商事」） | `mf/partners.csv` | W001×1ペア、W002×1ペア、`aliases` で消失 |
| T6 | 固定資産・減価償却 | `mf/fixed-assets.csv` | 取得仕訳に W003、償却仕訳に W004。`fixedAssets:'exclude'` で**償却仕訳のみ**除外・I002、**取得仕訳は出力に残る**（A-2） |
| T7 | 期跨ぎ（2026-09-15〜10-15） | `mf/transition.csv` | W005。免税事業者仕入が日付で控80/控50に振り分け |
| T8 | 期首残高 | `yayoi/opening.txt` | 摘要「期首残高」の伝票と、期首日×`openingBalanceCounterAccounts` の伝票に W007・除外。**期首日以外の「繰越利益剰余金」を含む決算振替仕訳、摘要に「繰越」単独を含む伝票は除外されない**（A-1） |
| T9 | 文字コード・ヘッダー | `mf/normal.csv`（BOM付き）, `mf/utf8-nobom.csv`, `yayoi/sjis-noheader.txt` | I001 の判定が正しい。BOM無しUTF-8とShift_JISを取り違えない。ヘッダー無しでindex読み |
| T10 | 金額・日付異常 | `mf/bad-formats.csv` | E004、E005、W010、全角数字は正常 |
| T11 | 設定検証 | `config/*.sample.json` | `verifyConfig()` が TODO_VERIFY・不正な `grouping.strategy`・不正な `amountMode` を検出。`convert()` が E000 を返し例外を投げない。`--dev` で W013、かつ `confirmed:false` 使用時に W012 |
| T12 | ローカル完結の静的検査 | `src/core/**` | `fetch`/`http`/`https`/`net`/`fs`/`child_process`/`process.env` の文字列が含まれない（範囲は §6.5） |
| T13 | 往復整合 | T1出力 | 再パースし科目別合計が一致 |

受け入れ基準：T1〜T13 が通ること、README の手順で社長のPCで `convert` が動くこと、公式テンプレート転記後に `verify-config` が通ること。

---

## §8. AIマッピング提案（フェーズ1・今回は設計のみ）

### 8.1 差し込み口

```ts
export interface UnmappedItem { kind: 'account'|'taxcode'|'subaccount'; sourceValue: string; count: number; debitTotal: number; creditTotal: number; parentAccount?: string }
export interface Suggestion { sourceValue: string; candidates: { target: string; confidence: number; reason: string }[]; provider: 'noop'|'rule'|'llm_local'|'llm_external' }
export interface MappingSuggester {
  readonly provider: Suggestion['provider'];
  suggest(items: UnmappedItem[], ctx: { targetAccounts: string[]; targetTaxCodes: string[]; sourceSystem: SourceSystem }): Promise<Suggestion[]>;
}
```

- `NoopSuggester`：常に空。**PoCで実装するのはこれのみ**。
- `RuleSuggester`（**フェーズ1前半・PoCでは実装しない**）：freee側科目一覧（社長が用意。TODO_VERIFY）との文字列類似で候補提示。外部通信なし。
- `LlmSuggester`（フェーズ1後半）：`sourceValue`（科目名・税区分名・補助科目名）と親科目名だけを送り、金額・摘要・取引先名・件数は送らない。`src/integrations/` に置き `core` は依存しない。

### 8.2 制約

1. 外部LLMへの送信は `approval-policy.md`「個人情報・機密情報の外部AIサービスへの入力」に該当し、**社長の事前承認が必要**。会計事務所→顧問先の同意はリョウが整理。CLIは `config/approvals.json`（承認者・日付・対象プロファイル・送信項目）と `--i-confirm-external-ai` が揃わない限り Noop にフォールバックし `W016`。
2. ローカル完結原則との関係：(i) ローカルLLM（`llm_local`）、(ii) マスタ情報限定送信＋顧客同意、(iii) 架空・一般化した科目辞書をコホマダ側で事前作成し実運用は `RuleSuggester` が引く、の3案。**PoCは (iii) の考え方で架空データのみ**。商品化方針は社長判断（§9）。
3. 提案は `accounts.json` に `confirmed:false, source:'llm_suggested'` として書き込まれ（`--write-suggestions` 時のみ）、人間が `confirmed:true` にするまで W012／strict時は停止。**無審査適用の経路を作らない**。
4. レポートの未マッピング一覧に候補と `reason` を併記。

---

## リスク・注意点

1. 列定義の未確認が最大リスク。`TODO_VERIFY` が残ったまま実データに使わない（`E000` ゲートを外さない）。
2. 借貸チェックは同一伝票内で税込/税抜が統一されている前提。`amountMode` 誤設定は E001 大量発生で気づける（誤って通る設計にはなっていない）。
3. 取引先の名寄せは自動で行わない（意図的）。
4. 弥生汎用形式のグループ化戦略は実ファイルを見るまで決められない。両対応。
5. 経過措置の延長は未確定。対応表は現行制度で書き、法制化確認後に追記。**現行制度の期間自体も国税庁一次情報での再確認が未了**。
6. PoCは架空データ限定。実データ使用は社長承認・仮名化方針・事務所との秘密保持（リョウ）を経てから。
7. `iconv-lite` の CP932 機種依存文字（①・㈱・髙 等）は実ファイルで確認。
8. A-1 の検出条件を絞ったことで、摘要に既定キーワードが無い期首残高伝票（例：摘要空欄で相手科目が `openingBalanceCounterAccounts` に無い）は検出されない可能性がある。レポートの「期首日の伝票一覧」（W006 と同じ日付集計）を専門家が確認する運用で補う。
9. A-2 により、取得仕訳を通常仕訳としてインポートした後に固定資産台帳も別途インポートする場合、台帳側の登録方法（取得仕訳との紐付け）はfreeeの仕様に依存し未確認。W003 の文言で確認を促す。

## 推奨案

- 実装順：骨格 → `verifyConfig`/`E000` → MFアダプタ＋T1/T3/T4/T11 → 検証ルール全部＋T5〜T7・T10 → レポート → 弥生アダプタ＋T8/T9 → T12/T13。
- 社長は並行して §3.7 の転記。エイトの n8n 化はフェーズ2まで保留。

## 代替案

- ブラウザ完結の単一HTMLツール（encoding 層の差し替えが必要。フェーズ1）。
- スプレッドシートのテンプレート＋手順書（レン案D）を先行させ、対応表をスプレッドシート→JSON書き出しで両立。

## 出典

- 本書は新規の外部調査を行っていない。根拠は先行5資料（2026-09-14付）と、そこに記載の出典URL（いずれもWebSearch要約ベース・本文未確認）。
- アオイの監査結果（PASS WITH CONDITIONS）および仕様変更 A-1/A-2 の方針決定は、秘書アイ経由で受領した指示に基づく。
- Node.js標準API の利用可否・`iconv-lite` の `Buffer` 依存はノヴァの実装で確認中（本書は仕様書URLを添付していない）。

## §9. 未確認事項・社長確認事項

**未確認（技術）**
- freee汎用形式テンプレートの列名・列順・必須列・税込/税抜・複合仕訳の表現・文字コード・行数上限
- MF仕訳帳CSVの正確なヘッダー名・文字コード（BOM有無）・複合仕訳の表現・税込/税抜・決算整理仕訳列の有無
- 弥生汎用形式のヘッダー有無・列順・識別フラグ列の有無・日付表記・税区分結合表記の実例
- freee税区分の正式名称一覧（「課対仕入（控80）10%」等は検索要約ベース）
- freeeが口座を補助科目として受けるか、取引先/部門/メモタグ列がテンプレートに存在するか
- freeeで固定資産台帳をインポートする際、既に取り込んだ取得仕訳とどう紐付くか（A-2 の前提）
- **インボイス経過措置の期間（80%：〜2026-09-30、50%：2026-10-01〜2029-09-30）の国税庁一次情報での再確認**（未了。リサに依頼中）
- Node.js 20 の `TextDecoder('shift_jis')` 可否、`iconv-lite` のCP932機種依存文字の扱い
- 依存パッケージ（`papaparse`・`iconv-lite`）が外部通信を行わないことの、コード監査による裏付け（T12 の範囲外）

**社長確認事項**
1. 入力の優先順位：MF先行でよいか。想定顧客が弥生中心なら入れ替える
2. 公式テンプレート・サンプルエクスポートの取得と転記（§3.7）。保管場所はリポジトリ外でよいか
3. PoC用データ：架空のみで進める方針でよいか。実データを使う場合の仮名化の要否と担当
4. AI提案の方式（§8.2 (i)/(ii)/(iii)）のうち商品として目指す方向
5. 出力先テンプレート：freee汎用形式を既定でよいか
6. `fixedAssets` の既定：`warn`（減価償却仕訳も出力）か `exclude`（減価償却仕訳を除外）か
7. 期首残高キーワード（§2.3 A-1 既定）に事務所固有の表記を追加するか
8. 部門を使う顧問先が多いか

## §10. 人間承認が必要な事項（`approval-policy.md`）

| # | 事項 | 承認者 | 状態 |
|---|---|---|---|
| 1 | 実在の会計事務所・顧問先の実データをPoC/検証に使用すること（仮名化方針を含む） | 社長（＋当該事務所） | 未承認。PoCは架空データのみ |
| 2 | 外部AIサービスへ顧客データ由来の情報（科目名等を含む）を送信すること | 社長（＋顧問先同意はリョウ） | 未承認。PoCでは実装しない |
| 3 | freee本番事業所へのCSVインポート実行 | 会計事務所側の有資格者（ツールは実行しない） | ツール対象外 |
| 4 | **本ツールの外販・配布**（規約・商標・免責の整理） | 社長（リョウの規約確認・必要なら弁護士） | **未承認。READMEに「外販未承認の社内PoC」と明記** |
| 5 | 公式テンプレート・エクスポートファイルをリポジトリに含めること | 社長 | 「含めない」を推奨 |
| 6 | 勘定科目・税区分対応表の内容確定 | 有資格者（税理士・会計士）の監修 | 未着手 |
| 7 | n8n等クラウド環境での実行（ローカル完結原則の変更） | 社長 | 本PoCでは行わない |
| 8 | インボイス経過措置の期間を対応表に確定値として入れること | 社長（リサの国税庁一次情報確認後） | 再確認未了。現状は `confirmed:false` |

## 次に必要なアクション

1. **ノヴァ**：本v2に沿ってコードを更新（A-1/A-2、`convert` 非同期、`tagsRaw`、`E000`、W012、`verifyConfig` 拡張、`run.json.input`、T6/T8/T9 の期待値、fixtures の `例_` 接頭辞、README追記）。
2. **アオイ**：v2 の再監査（条件付き合格の条件が満たされたか）。
3. **社長**：§3.7 の転記と §9 の確認事項1〜8。
4. **リサ**：インボイス経過措置の期間を国税庁一次情報で確認し、§9 の未確認を解消。
5. **リョウ**：公式テンプレートの非配布運用の妥当性、README／レポート末尾の免責文言案。
6. **メイ**：ノヴァの実装で判明した事項を v3 に反映。
