# 会計ツールコンバータ PoC（フェーズ0）詳細設計書 ― CSVベース・ローカル完結型

- 作成：メイ（AI Automation & Operations Architect）
- 関連タスク：T13「会計ツールのコンバータ構築（コホマダ金融）」
- 対象事業：株式会社コホマダ（AI・DX事業／金融関連事業）。KINOTO・個人FP事業の情報は含まない
- 実装担当（予定）：ノヴァ（Web & Three.js Technical Architect）。実装先：`accounting-converter/`（本日時点で未作成。ノヴァが新規作成する）
- 基準日：2026-09-14
- ステータス：Draft（未監査。アオイの監査前）
- 先行資料（すべて2026-09-14付・`logs/`配下）：
  - 技術実現可能性（メイ）`kohomada_2026-09-14_会計ツールコンバータ技術実現可能性_v1.md`
  - 移行課題リサーチ（リサ）`kohomada_2026-09-14_会計ツールコンバータ移行課題リサーチ_v1.md`
  - 会計リスク整理（ミナ）`kohomada_2026-09-14_会計ツールコンバータ会計リスク整理_v1.md`
  - 規約法務論点整理（リョウ）`kohomada_2026-09-14_会計ツールコンバータ規約法務論点整理_v1.md`
  - 事業モデル仮説（レン）`kohomada_2026-09-14_会計ツールコンバータ事業モデル仮説_v1.md`

> **本設計書の最重要前提**：本セッションでは egress proxy により `support.freee.co.jp` `developer.freee.co.jp` `biz.moneyforward.com` `support.yayoi-kk.co.jp` がブロックされており、**freee・MF・弥生いずれの公式CSV列定義も直接確認できていない**。したがって本書は列名・列順を一切断定せず、すべて**外部設定ファイル（マッピング設定）に切り出し、`TODO_VERIFY:` プレースホルダで示す**。正確な値は、社長が公式テンプレートをダウンロードして転記する（§3.7の手順）。コード側は「`TODO_VERIFY` が1つでも残っていれば本番変換を拒否する」仕組みを持つ（§3.8）。

---

## 要約

1. **PoCは「CSV in → CSV out、外部通信ゼロ」のNode.js CLI（TypeScript）**として作る。変換ロジックは純関数（ファイル・ネットワークに触らない`src/core/`）に閉じ込め、将来ブラウザUI化・n8n化する際もそのまま流用できる構造にする。この形は、リョウの規約整理がどちらに転んでも（API利用規約が厳しくても）成立し、レンの差別化仮説（AIマッピング提案＋差分検証＋専門家最終確認）の土台にもなる。
2. **入力の第1優先はMF「仕訳帳」CSV、第2優先は弥生「汎用形式」CSV**。理由：MFはヘッダー行を持つと見られ（検索要約ベース）、列名ベースの読み込みでパイプライン自体の検証に集中できる。弥生は文字コード（Shift_JIS想定）・ヘッダー有無・「税区分＋税計算区分」結合コードという読み込み側の不確実性が大きく、アダプタ層で吸収する設計にしておき、MFで骨格を固めた直後に着手する。**ただし、社長の想定顧客が弥生中心であれば順序を入れ替える**（§9 社長確認事項）。
3. **PoCで扱うのは：仕訳（変換）・勘定科目（対応表で変換）・税区分（対応表で変換、自動判定はしない）・取引先（マッピング＋重複/表記ゆれ検出）。期首残高は「検出・集計・レポート」のみで変換しない**（freeeは開始残高を別テンプレートで受け付けるため、フェーズ1）。固定資産・減価償却関連は**検出して警告**（ミナ指摘の二重計上リスクへの直接対応）。部門・品目・メモタグは**既定で落として警告**（設定で素通し可）。
4. 検証は「停止（error）」と「警告で続行（warning）」に分け、**借貸不一致・未マッピング科目/税区分・日付/金額の解析失敗は停止**、**重複取引先候補・固定資産科目・インボイス経過措置切替日（2026-09-30/10-01）またぎ・部門等の欠落は警告**とする。
5. 差分レポートは Markdown（人が読む）と CSV（Excelで突合）の両方を出す。**勘定科目別の借方/貸方合計（移行元 vs 変換後）**を中核とし、未マッピング一覧・警告一覧を添える。
6. AIによるマッピング提案（フェーズ1）は、`MappingSuggester` インターフェースの差し込み口だけを用意し、**PoCでは無効（NoopSuggester）**。外部LLMに顧客データを送ることは `approval-policy.md` 上、社長の事前承認が必要であり、ローカル完結原則とも衝突するため、有効化には明示フラグ＋承認記録を要する設計にする。
7. **人間の承認が必要な事項**（実データの使用、外部LLM利用、freeeへの実インポート、外販時の規約・商標）は§10に独立して列挙した。PoCは架空データのみで動かす。

---

## 結論

- PoCの目的は「変換精度100%」ではなく、**(a) 列定義を設定ファイルに外出しした変換パイプラインが動くこと、(b) 停止/警告の分類が会計上のリスク（ミナ整理）に対応していること、(c) 差分レポートが専門家の最終確認に使える形であること**、の3点の実証に置く。
- 規約（リョウ）・ヒアリング（ミナの質問リスト）の結果を待たずに着手できる範囲は、本書の§1〜§7のすべて（架空データ前提）。着手できないのは「実データでの検証」「公式列定義の確定」「外部LLM利用」の3点で、いずれも社長の作業・承認が前提。
- ノヴァは本書§6のフォルダ構成・§2の関数シグネチャ・§3の設定ファイル雛形・§7のテストケースに従って実装に入れる。列名は全て `TODO_VERIFY:` 付きで置き、`verify-config` コマンドが未転記を検出する仕組みを最初に作る。

---

## 確認済み事実（先行資料からの引用。すべて検索要約ベースで本文未確認の制約を引き継ぐ）

- freeeは「他社会計ソフトから仕訳データを移行する」機能とCSVテンプレート（Shift-JIS版／UTF-8版）を公式に用意している。テンプレートには弥生会計形式・マネーフォワード形式・freee汎用形式など複数の形式がある〔メイ技術検討・リサ調査〕。
- 弥生会計（デスクトップ）は仕訳日記帳を「弥生インポート形式」「汎用形式」でエクスポートできる。汎用形式では区切り文字にカンマを指定できる〔メイ技術検討〕。やよいの青色申告オンラインのエクスポートCSVにはヘッダー行が付かない、という指摘がある〔リサ調査〕。
- 弥生会計の消費税は「税区分」と「税計算区分」に分かれ、テキストのインポート/エクスポート時は結合した形式で記載される〔ミナ整理〕。
- MFクラウド会計の「仕訳帳」CSVの項目は、取引No・取引日・勘定科目・補助科目・部門・取引先・税区分・インボイス・金額・摘要・タグ・メモ等とされる〔リサ調査。正確な列名・列順は未確認〕。
- freeeは取引先名・品目名・部門名の**完全一致の重複を許可しない**仕様があり、事前の名寄せが必要になるとの指摘がある〔リサ調査（第三者ブログの要約）〕。
- freeeは固定資産台帳に登録すると減価償却仕訳を自動生成するため、台帳インポートと減価償却費を含む仕訳インポートを両方行うと**二重計上の恐れがある**〔ミナ整理・freee公式ヘルプの要約〕。
- インボイス制度の経過措置は、現行制度では2026年9月30日までが仕入税額相当額80%控除、2026年10月1日〜2029年9月30日が50%控除〔ミナ整理〕。令和8年度税制改正大綱による延長は**未確認**（本書は延長を前提にしない）。
- 弥生Web APIは金融機関口座連携中心の規約に見え、汎用開発者向けAPIは確認できていない。freee/MFのAPI規約原文も未確認〔リョウ整理〕。→ **本PoCはAPIを一切使わない**ため、この未確定に依存しない。

## 推測・仮説

- [推測] MF仕訳帳CSVは1行に借方・貸方の両側を持ち、複合仕訳は同一「取引No」の複数行で表現される。弥生汎用形式も1行に借方・貸方両側を持ち、複合仕訳は伝票番号（または識別フラグ）でグループ化される。→ 本書の中間モデルはこの両方を「グループ化戦略」の設定で吸収する（§2.3）。実際の表現は公式テンプレート・実エクスポートで要確認。
- [推測] MFのエクスポートはUTF-8（BOM付きの可能性）、弥生デスクトップのエクスポートはShift_JIS（CP932）。→ 文字コードは自動判定＋設定で強制の両方を持つ（§2.1）。
- [仮説] freee汎用形式テンプレートも1行に借方・貸方両側を持つ。複合仕訳の表現方法（片側空欄で複数行か、別の方式か）は不明。→ 出力側の設定 `compoundEntries` で切り替える（§3.2）。
- [仮説] 弥生の摘要・MFの摘要はfreeeの「摘要」相当列にそのまま入れられる。

---

## §1. PoCのスコープ

### 1.1 入力・出力

| 項目 | 内容 |
|---|---|
| 入力（第1優先） | MFクラウド会計「仕訳帳」エクスポートCSV（`source: mf_journal`） |
| 入力（第2優先） | 弥生会計「汎用形式」エクスポート（拡張子.txt/.csv、カンマ区切り。`source: yayoi_generic`） |
| 出力 | freee会計「他社会計ソフトインポート」用CSV（freee汎用形式テンプレート準拠を既定。`target: freee_generic`）＋差分レポート（Markdown＋CSV） |
| 実行環境 | 会計事務所（または社長）のPC上のNode.js CLI。**ネットワーク通信なし** |

**優先順位の理由**：MFはヘッダー行あり・UTF-8想定で「列名で読む」実装が安定しやすく、まずパイプラインの骨格（正規化→マッピング→検証→出力→レポート）を確実に動かせる。弥生は「ヘッダー無しの可能性」「Shift_JIS」「税区分結合コード」という読み込み側固有の不確実性があり、骨格が固まった後にアダプタ1枚を追加する形が手戻りが少ない。**両方ともPoC内で実装する**（弥生は第2週目）。

> 補足：freeeは「マネーフォワード形式」「弥生会計形式」のテンプレートも用意しているとされる〔リサ調査〕。もし公式テンプレート確認の結果、MF/弥生のエクスポートをほぼそのまま受け付けられると判明した場合、**コンバータの価値は「形式変換」ではなく「マッピング・検証・差分レポート」に完全に寄る**。出力先テンプレートは設定（`targets/*.json`）で差し替え可能にしておき、この判断を後回しにできるようにする。

### 1.2 データ種別ごとの扱い

| データ種別 | PoCでの扱い | 備考 |
|---|---|---|
| 仕訳（日付・伝票番号・借方/貸方科目・金額・摘要） | **変換する** | 中核 |
| 勘定科目 | **対応表で変換**（`maps/accounts.json`）。未対応は停止 | 対応表は人間（有資格者）が確定 |
| 補助科目 | **ルールで freee タグ（取引先／メモタグ）へ割当**。PoCでは品目・部門への割当はルール記述のみ許可し、出力は警告付き | §3.5 |
| 税区分 | **対応表で変換**（`maps/taxcodes.json`）。自動判定はしない。未対応は停止 | 日付依存の対応（経過措置）を表現可能 |
| 取引先 | MFの取引先列／補助科目由来の取引先を**そのまま出力**（名寄せの自動変更はしない）＋**重複・表記ゆれ候補を警告** | 名寄せは `maps/partners.json` の別名表で人間が指定したときのみ適用 |
| 期首残高（開始残高・繰越仕訳） | **検出して除外し、集計をレポートに出す**。変換しない | freee開始残高テンプレートはフェーズ1 |
| 固定資産関連仕訳（減価償却費・固定資産科目） | **検出して警告**（既定）。設定で `exclude` に切替可 | 二重計上リスク対応 |
| 部門 | **既定で落として警告**。設定で出力列へ素通し可 | 出力列の存在が未確認 |
| 品目・メモタグ | **PoCでは生成しない**（MFの「タグ」列等はメモタグへ素通し可、既定は警告付きで落とす） | フェーズ1 |
| 固定資産台帳・給与・債権債務残高 | **対象外** | 先行資料どおり |

---

## §2. 処理パイプライン

```
[bytes] → decode → parseCsv → toDataset(adapter) → applyMappings → validate → renderOutput → buildReport
            §2.1      §2.2         §2.3              §2.4          §2.5        §2.6          §2.7
```

すべて `src/core/` の純関数。ファイル読み書き・標準出力は `src/cli/` のみが行う。最上位は次の1関数：

```ts
export function convert(input: ConvertInput): ConvertResult;  // 同期・副作用なし

export interface ConvertInput {
  bytes: Uint8Array;                 // 入力CSVの生バイト
  profile: Profile;                  // §3.1（source/target/maps/options を束ねたもの）
  fileName?: string;
  suggester?: MappingSuggester;      // §8。省略時 NoopSuggester
}
export interface ConvertResult {
  dataset: Dataset;                  // 正規化・マッピング済み中間モデル
  diagnostics: Diagnostic[];         // error/warning/info
  outputCsv: string | null;          // errorが1件でもあれば null
  report: Report;                    // §2.7
  stats: { rows: number; entries: number; lines: number; errors: number; warnings: number };
}
```

### 2.1 decode（文字コード判定）

```ts
export function decodeBytes(bytes: Uint8Array, hint: 'auto'|'utf8'|'shift_jis'): { text: string; encoding: 'utf8'|'shift_jis'; hadBom: boolean }
```

- 先頭が `EF BB BF` → UTF-8（BOM除去）。
- それ以外で `hint === 'auto'`：`new TextDecoder('utf-8', { fatal: true })` で試し、例外なら Shift_JIS（CP932）として `iconv-lite` でデコード。UTF-8として成功しても、Shift_JIS特有のパターン誤判定はほぼ起きない（UTF-8はバイト列の整合性で判定できる）。
- 判定結果を `Diagnostic(info, 'I001')` として残す。
- 出力側のエンコードは `target.encoding`（`utf8_bom` | `utf8` | `shift_jis`）。freeeテンプレートはShift-JIS版とUTF-8版の両方があるとされるため、既定は `utf8_bom`（Excelで開いたときの文字化け回避）。**どちらをfreeeが実際に受け付けるかは公式テンプレートで確認**（TODO_VERIFY）。

### 2.2 parseCsv

```ts
export function parseCsv(text: string, opts: { delimiter: ','|'\t'; hasHeader: boolean|'auto'; headerSignature?: string[] }): { header: string[]|null; rows: RawRow[] }
export interface RawRow { rowNumber: number; cells: string[] }   // rowNumberは1始まり（ヘッダー含む物理行番号）
```

- RFC 4180準拠（ダブルクォート内の改行・カンマ・`""`エスケープ）。`papaparse` を利用（Node/ブラウザ両対応・依存なし）。
- `hasHeader: 'auto'` の場合、1行目のセルが `headerSignature`（設定の期待ヘッダー名のいずれか）を1つ以上含めばヘッダーとみなす。含まなければヘッダー無しとして列インデックスで読む（弥生対応）。
- 空行・末尾改行はスキップ。列数がヘッダー列数と異なる行は `E005`（§4）。

### 2.3 toDataset（正規化：中間モデルへ）

**中間モデル（列名に依存しない共通スキーマ）**：

```ts
export type SourceSystem = 'mf_journal' | 'yayoi_generic';

export interface Dataset {
  source: SourceSystem;
  sourceFile: { name: string; encoding: string; hadBom: boolean; hasHeader: boolean; physicalRows: number };
  entries: JournalEntry[];
}

export interface JournalEntry {
  entryId: string;                 // "E000001" 連番（レポート・診断の参照キー）
  voucherNo: string | null;        // 伝票番号／取引No（元値）
  date: string;                    // ISO "YYYY-MM-DD"
  description: string;             // 摘要（伝票単位。行ごとに異なる場合は先頭行を採用し、各行は line.memo に保持）
  lines: JournalLine[];            // 借方・貸方の明細行（最低2行）
  amountMode: 'tax_included' | 'tax_excluded' | 'unknown';   // source設定から
  flags: EntryFlag[];              // 'OPENING_BALANCE' | 'CLOSING_ADJUSTMENT' | 'FIXED_ASSET' | 'DEPRECIATION' | 'COMPOUND'
  sourceRows: number[];            // 元CSVの物理行番号
}

export interface JournalLine {
  side: 'debit' | 'credit';
  accountRaw: string;              // 元の勘定科目名（無加工）
  account: string;                 // 照合用正規化名（NFKC・trim・連続空白圧縮）。出力には使わない
  subAccountRaw: string | null;
  departmentRaw: string | null;
  partnerRaw: string | null;       // MFの取引先列。弥生はnull
  taxCodeRaw: string | null;       // 弥生は「税区分+税計算区分」結合文字列のまま
  amount: number;                  // 整数円（税込/税抜は entry.amountMode）
  taxAmount: number | null;        // 税額列がある場合
  invoiceRaw: string | null;       // MFの「インボイス」列など。PoCでは素通し・判定に使わない
  memo: string | null;             // 行単位の摘要・仕訳メモ・タグ等
  sourceRow: number;
  mapped?: MappedLine;             // §2.4で埋まる
}

export interface MappedLine {
  freeeAccount: string;
  freeeSubAccount: string | null;
  freeeTaxCode: string;
  partner: string | null;
  item: string | null;             // PoCでは常にnull（ルールが指定しても警告して落とす）
  department: string | null;       // 既定null
  memoTags: string[];
  provenance: { account: 'table'; tax: 'table'|'table_dated'; subAccount: `rule:${string}`|'none'; partner: 'column'|'subaccount'|'alias'|'none' };
}

export interface Diagnostic {
  code: string;                    // 'E001' 等（§4）
  severity: 'error' | 'warning' | 'info';
  message: string;                 // 日本語・人が読む
  entryId?: string;
  sourceRow?: number;
  detail?: Record<string, string | number | boolean | null>;   // 生データの全文は入れない（金額・科目名程度）
}
```

**アダプタ**（`src/core/adapters/mf.ts`, `yayoi.ts`）は、`sourceConfig.columns`（§3.1）に従って `RawRow` → 行ごとの `{debit?: JournalLine, credit?: JournalLine, voucherNo, date, description, groupKey}` を作り、`grouping` 戦略で `JournalEntry` に束ねる：

- `grouping.strategy = 'by_voucher_no'`：`voucherNo` が同じ連続行を1伝票にする（MF「取引No」想定）。
- `grouping.strategy = 'by_flag'`：識別フラグ列の値で「単一／複合開始／複合中／複合終了」を判定（弥生インポート形式で知られる方式。汎用形式に同様のフラグがあるかは**未確認**。無ければ `by_voucher_no` を使う）。フラグ値は設定 `grouping.flagValues` に外出し。
- `grouping.strategy = 'each_row'`：1行＝1伝票（両側とも埋まっている前提）。

**正規化の細則**：
- 日付：`sourceConfig.dateFormats`（例 `["YYYY/MM/DD","YYYY-MM-DD","YYYY/M/D"]`）で順に解析。和暦（`R08/04/01` 等）は `dateFormats` に `"GYY/MM/DD"` を含めた場合のみ解釈（元号記号→年の変換表は設定に持つ）。失敗は `E004`。
- 金額：全角数字→半角、カンマ・空白・円記号除去、`△`/`▲`/`-` は負号。小数は `E005`（円未満は想定外）。負の金額は `W010`。空欄は0ではなく「行なし」と解釈（片側空欄の複合仕訳行）。
- 科目名照合キー `account` は NFKC＋trim＋連続空白1つ化。**出力値は `accountRaw` を対応表で引いた結果**であり、正規化はあくまで照合用。
- フラグ付与（正規表現は設定 `options.detectors` に外出し）：
  - `OPENING_BALANCE`：摘要または科目に「開始残高」「期首残高」「前期繰越」「繰越」等を含む、または伝票日付が会計期間開始日と等しく相手科目が「元入金／資本金／繰越利益剰余金」等（設定のリスト）。
  - `DEPRECIATION`：いずれかの行の科目が「減価償却費」「減価償却累計額」「一括償却資産」等（設定のリスト）。
  - `FIXED_ASSET`：「建物」「建物附属設備」「構築物」「機械装置」「車両運搬具」「工具器具備品」「土地」「ソフトウェア」「一括償却資産」等（設定のリスト）。
  - `CLOSING_ADJUSTMENT`：決算整理仕訳フラグ列がある場合（弥生「決算」列／MF「決算整理仕訳」列の有無は**未確認**）。
  - `COMPOUND`：`lines.length > 2`。

### 2.4 applyMappings

```ts
export function applyMappings(ds: Dataset, maps: Maps, opts: MappingOptions, suggester: MappingSuggester): { dataset: Dataset; diagnostics: Diagnostic[] }
```

各 `JournalLine` について順に：

1. **勘定科目**：`maps.accounts[account照合キー]` を引く。ヒット→`freeeAccount`（＋対応表に `freeeSubAccount` があればそれ）。ミス→`E002`（停止）。`confirmed: false` のエントリを使った場合は `W012`。
2. **税区分**：`maps.taxcodes` を引く（§3.4）。エントリが複数あり `effectiveFrom/effectiveTo` を持つ場合は伝票日付で選ぶ。ミス→`E003`。税区分列が空で、科目が「対象外」既定リスト（現金・預金等、設定）にあれば `maps.taxcodes.defaultForBlank` を使う。それ以外の空欄は `E003`。
3. **補助科目→freeeタグ**：`maps.subaccountRules`（§3.5）を上から評価し最初にマッチしたルールを適用。マッチなし→`defaultAction`（既定 `memo_tag`。`drop` なら `W008`）。
4. **取引先**：優先順位 = 取引先列（MF） > 補助科目ルールで `partner` に割り当てた値 > null。`maps.partners.aliases` に一致すれば置換（`provenance.partner='alias'`）。
5. **部門**：`opts.departments = 'drop'|'passthrough'`。`drop` で値があれば `W008`。
6. `suggester` は「未マッピング一覧が確定した後」に一度だけ呼ばれ、提案を `diagnostics` の `detail.suggestions` に添える（PoCは Noop）。**提案は自動適用しない**。

### 2.5 validate（§4に規則一覧）

```ts
export function validate(ds: Dataset, rules: ValidationConfig): Diagnostic[]
```

### 2.6 renderOutput

```ts
export function renderOutput(ds: Dataset, target: TargetConfig): { csv: string; diagnostics: Diagnostic[] }
```

- `target.columns` の順に、各列の `from`（中間モデルのパス式）から値を取り出して行を組み立てる。
- `target.rowModel`：
  - `'debit_credit_pair'`（既定・freee汎用形式想定）：伝票の借方行と貸方行を対にして1出力行にする。単純仕訳（借1・貸1）は1行。**複合仕訳**は `target.compoundEntries` に従う：
    - `'blank_side'`：借方行・貸方行を別々の出力行にし、相手側の列を空欄、伝票番号列で結ぶ（freeeがこの表現を受け付けるかは **TODO_VERIFY**）。
    - `'unsupported'`：複合仕訳を `E007` にして出力対象から外す（レポートに一覧）。
  - `'one_row_per_line'`：1明細＝1行（借方/貸方区分列を持つテンプレート向け。将来用）。
- 出力値のエスケープはRFC 4180。改行コードは `target.newline`（既定 `CRLF`）。
- エラーが1件でもある場合、CLIはfreee用CSVを**書き出さない**（レポートのみ）。`--force` で「エラー伝票を除外して出力」を許可するが、レポートに除外一覧を明記。

### 2.7 buildReport（§5）

```ts
export function buildReport(ds: Dataset, diags: Diagnostic[], ctx: { profileName: string; runAt: string; sourceFile: string }): Report
export function renderReportMarkdown(r: Report): string
export function renderReportCsvBundle(r: Report): { accounts: string; unmapped: string; diagnostics: string; taxcodes: string }
```

---

## §3. マッピング設定の仕様

形式は **JSON**（YAMLはパーサ依存を増やすため不採用。コメントは `"_comment"` キーで記述）。`profile.json` が各ファイルを束ねる。

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
    "fixedAssets": "warn",            // "warn" | "exclude" | "include"
    "openingBalances": "exclude_and_report",
    "invoiceTransitionDates": ["2026-09-30"],   // 経過措置切替の「最終日」。延長が法制化されたら追記
    "partnerFuzzyThreshold": 2,
    "detectors": {
      "openingBalanceKeywords": ["開始残高", "期首残高", "前期繰越", "繰越"],
      "depreciationAccounts": ["減価償却費", "減価償却累計額", "一括償却資産"],
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
  "_comment": "header の値は公式エクスポートのヘッダー文字列と完全一致させる。TODO_VERIFY: の後ろは推定名であり確認前の値。"
}
```

```jsonc
// config/sources/yayoi-generic.json   ※ヘッダー無しの可能性があるため index 指定を主にする
{
  "system": "yayoi_generic",
  "encoding": "shift_jis",              // 判定失敗時のフォールバックにもなる。実ファイルで要確認
  "delimiter": ",",
  "hasHeader": "auto",
  "headerSignature": ["TODO_VERIFY:伝票No", "TODO_VERIFY:取引日付"],
  "dateFormats": ["YYYY/MM/DD", "GYY/MM/DD"],
  "eraTable": { "R": 2018, "H": 1988 },  // 和暦記号→西暦オフセット（R08→2026）。弥生が和暦を出すかは未確認
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
  "_comment": "index は0始まり。上記の並びは弥生インポート形式について第三者情報で流布している列順を『仮置き』したものであり、汎用形式が同じ並びかは未確認。公式ヘルプ『データのエクスポート』の項目一覧と実エクスポートで確定させる。"
}
```

列指定は `{ "header": "…" }`（ヘッダー名一致）と `{ "index": n }` の両方を許可し、両方あればheaderを優先、ヘッダー無しファイルではindexにフォールバックする。

### 3.2 `targets/freee-generic.json`（(b) 出力列順・列名）

```jsonc
{
  "system": "freee_generic",
  "templateInfo": {
    "name": "TODO_VERIFY:仕訳インポート（UTF-8）.csv",
    "downloadedFrom": "TODO_VERIFY:https://support.freee.co.jp/hc/ja/articles/50792412666137",
    "downloadedAt": "TODO_VERIFY:YYYY-MM-DD",
    "sha256": "TODO_VERIFY"
  },
  "encoding": "utf8_bom",
  "newline": "CRLF",
  "rowModel": "debit_credit_pair",
  "compoundEntries": "TODO_VERIFY:blank_side",
  "columns": [
    { "name": "TODO_VERIFY:日付",        "from": "entry.date",                 "format": "YYYY/MM/DD", "required": true },
    { "name": "TODO_VERIFY:伝票番号",    "from": "entry.voucherNo",            "required": false },
    { "name": "TODO_VERIFY:借方勘定科目", "from": "debit.mapped.freeeAccount",   "required": true },
    { "name": "TODO_VERIFY:借方補助科目", "from": "debit.mapped.freeeSubAccount" },
    { "name": "TODO_VERIFY:借方税区分",  "from": "debit.mapped.freeeTaxCode",   "required": true },
    { "name": "TODO_VERIFY:借方金額",    "from": "debit.amount",               "required": true },
    { "name": "TODO_VERIFY:借方取引先",  "from": "debit.mapped.partner" },
    { "name": "TODO_VERIFY:借方部門",    "from": "debit.mapped.department" },
    { "name": "TODO_VERIFY:借方メモタグ", "from": "debit.mapped.memoTags", "join": "," },
    { "name": "TODO_VERIFY:貸方勘定科目", "from": "credit.mapped.freeeAccount",  "required": true },
    { "name": "TODO_VERIFY:貸方補助科目", "from": "credit.mapped.freeeSubAccount" },
    { "name": "TODO_VERIFY:貸方税区分",  "from": "credit.mapped.freeeTaxCode",  "required": true },
    { "name": "TODO_VERIFY:貸方金額",    "from": "credit.amount",              "required": true },
    { "name": "TODO_VERIFY:貸方取引先",  "from": "credit.mapped.partner" },
    { "name": "TODO_VERIFY:貸方部門",    "from": "credit.mapped.department" },
    { "name": "TODO_VERIFY:貸方メモタグ", "from": "credit.mapped.memoTags", "join": "," },
    { "name": "TODO_VERIFY:摘要",        "from": "entry.description" }
  ],
  "_comment": "columns は公式テンプレートの1行目（ヘッダー）を列順どおりに転記する。テンプレートに存在しない列は削除し、存在するが中間モデルに対応が無い列は from:null で空欄出力する。金額列が税込か税抜か、税額列の有無も要確認。"
}
```

### 3.3 `maps/accounts.json`（(c) 勘定科目対応表）

```jsonc
{
  "version": 1,
  "reviewedBy": "TODO:有資格者の氏名またはイニシャル（ファイル名には実名を使わない）",
  "reviewedAt": null,
  "entries": {
    "現金":     { "freeeAccount": "現金",     "freeeSubAccount": null, "confirmed": true,  "source": "manual" },
    "普通預金": { "freeeAccount": "普通預金", "freeeSubAccount": null, "confirmed": true,  "source": "manual" },
    "売掛金":   { "freeeAccount": "売掛金",   "confirmed": true, "source": "manual" },
    "雑費":     { "freeeAccount": "雑費",     "confirmed": false, "source": "llm_suggested", "note": "候補。要確認" }
  }
}
```

- キーは**照合用正規化後の元科目名**（アダプタが同じ正規化をかけて引く）。
- `confirmed: false` のエントリはPoCの `--dev` モード以外では使用時に `W012`、`--strict` では `E002` 相当に格上げ。
- `source` は `manual | llm_suggested | rule_suggested`（§8）。

### 3.4 `maps/taxcodes.json`（(d) 税区分対応表・日付依存対応可）

```jsonc
{
  "version": 1,
  "reviewedBy": null,
  "defaultForBlank": { "freeeTaxCode": "TODO_VERIFY:対象外", "appliesToAccounts": ["現金", "普通預金", "当座預金", "売掛金", "買掛金"] },
  "entries": [
    { "sourceTaxCode": "TODO_VERIFY:課税売上 10%",  "freeeTaxCode": "TODO_VERIFY:課税売上10%",  "rate": 0.10, "confirmed": false },
    { "sourceTaxCode": "TODO_VERIFY:課税仕入 10%",  "freeeTaxCode": "TODO_VERIFY:課対仕入10%",  "rate": 0.10, "confirmed": false },
    { "sourceTaxCode": "TODO_VERIFY:課税仕入 8%（軽）", "freeeTaxCode": "TODO_VERIFY:課対仕入（軽）8%", "rate": 0.08, "confirmed": false },
    { "sourceTaxCode": "TODO_VERIFY:課税仕入 免税事業者 10%",
      "freeeTaxCode": "TODO_VERIFY:課対仕入（控80）10%", "rate": 0.10,
      "effectiveFrom": "2023-10-01", "effectiveTo": "2026-09-30", "confirmed": false },
    { "sourceTaxCode": "TODO_VERIFY:課税仕入 免税事業者 10%",
      "freeeTaxCode": "TODO_VERIFY:課対仕入（控50）10%", "rate": 0.10,
      "effectiveFrom": "2026-10-01", "effectiveTo": "2029-09-30", "confirmed": false },
    { "sourceTaxCode": "TODO_VERIFY:対象外", "freeeTaxCode": "TODO_VERIFY:対象外", "rate": 0, "confirmed": false }
  ],
  "_comment": "sourceTaxCode は元CSVの税区分文字列（弥生は税区分+税計算区分の結合表記のまま）。freeeTaxCode の名称例『課対仕入（控80）10%』はリサ調査の検索要約に現れた表記であり、freee上の正式名称は未確認。80%/50%の期間は現行制度に基づく。税制改正大綱による延長は未確定のため、法制化を確認した後に entries を追記する（コードは日付範囲を一般化して扱うので改修不要）。"
}
```

- 同じ `sourceTaxCode` に日付範囲が異なる複数エントリがあれば伝票日付で選ぶ。範囲外なら `E003`（「対応表に該当期間のエントリがない」）。
- `rate` は税額整合チェック（`W009`）にのみ使う。

### 3.5 `maps/subaccount-rules.json`（(e) 補助科目→freeeタグ割当ルール）

```jsonc
{
  "version": 1,
  "defaultAction": "memo_tag",       // "partner" | "memo_tag" | "drop" | "item"(PoCでは警告) | "department"(PoCでは警告)
  "rules": [
    { "id": "r01-receivables-to-partner",
      "when": { "parentAccountIn": ["売掛金", "買掛金", "未収入金", "未払金", "前受金", "前払金", "預り金"] },
      "then": { "assign": "partner" },
      "note": "債権債務の補助科目は取引先名である前提（ミナ整理：取引先別内訳の維持）" },
    { "id": "r02-bank-branch-to-subaccount",
      "when": { "parentAccountIn": ["普通預金", "当座預金", "定期預金"] },
      "then": { "assign": "freee_sub_account" },
      "note": "口座名は freee の補助科目（口座）へ。freee側が口座を補助科目として受けるかは TODO_VERIFY" },
    { "id": "r03-pattern-department",
      "when": { "subAccountMatches": "^(本社|支店|営業所|.*部)$" },
      "then": { "assign": "department" },
      "note": "PoCでは警告付きで落とす（options.departments=drop）" },
    { "id": "r99-fallback",
      "when": {},
      "then": { "assign": "memo_tag" } }
  ]
}
```

- `when` は `parentAccountIn`（借方/貸方の親科目）、`subAccountMatches`（正規表現）、`sourceSystemIs` の AND。空 `{}` は常にマッチ。
- 適用結果は `mapped.provenance.subAccount = "rule:<id>"` に残し、レポートの「補助科目割当サマリ」（ルールID別の件数）に集計する。

### 3.6 `maps/partners.json`（取引先の別名・名寄せ指示）

```jsonc
{
  "version": 1,
  "aliases": { "（株）サンプル商事": "サンプル商事株式会社", "ｻﾝﾌﾟﾙ商事(株)": "サンプル商事株式会社" },
  "_comment": "自動名寄せはしない。W001/W002 の候補を人間が見て、統一する場合だけここに書く。"
}
```

### 3.7 「公式テンプレートから転記する手順」（社長作業・1回限り）

1. freeeヘルプ「他社会計ソフトから仕訳データを移行する」（URLは先行資料の出典欄）から仕訳インポート用テンプレート（UTF-8版・Shift-JIS版）をダウンロードする。**Excelで開かず**、テキストエディタ（VS Code等）で開く（Excelは先頭の0や日付表記を書き換えるため）。
2. 1行目のヘッダーを、`config/targets/freee-generic.json` の `columns[].name` に**列順どおり・文字列完全一致**で転記する（全角/半角・括弧の種類・空白まで一致させる）。テンプレートに無い列は削除、ある列で対応先が無いものは `"from": null` を追加する。
3. 同ページに「金額は税込か税抜か」「複合仕訳の書き方」「必須列」「文字コード」「行数上限」の記載があれば、`amountMode` / `compoundEntries` / `required` / `encoding` に反映し、`templateInfo` にファイル名・取得日を記録する。
4. MF：試用または社長ご自身の事業所の「仕訳帳」から**架空データ数件だけ**をCSVエクスポートし、ヘッダー行を `config/sources/mf-journal.json` の `header` に転記。金額列が税込か、複合仕訳が同一取引Noの複数行か、文字コード（BOMの有無）をメモする。
5. 弥生：同様に汎用形式で数件エクスポート。ヘッダー行の有無・文字コード・列順・識別フラグ列の有無・日付表記（西暦/和暦）を確認し、`config/sources/yayoi-generic.json` の `index`／`grouping` を確定する。
6. **ダウンロードした公式テンプレート・エクスポート実ファイルは `accounting-converter/config/templates/`（`.gitignore` 対象）にのみ置き、リポジトリにコミットしない**（各社の著作物であり再配布の可否が未確認。リョウの論点）。
7. `npx tsx src/cli/index.ts verify-config --profile config/profile.json` を実行し、`TODO_VERIFY` が0件になるまで繰り返す。

### 3.8 `verify-config` コマンドの仕様

- profile が参照する全JSONを読み、以下を検査して結果を表示、1つでも失敗なら終了コード2：
  - 値・キーに `TODO_VERIFY` 接頭辞が残っていないか（残っていればファイル名・パスを列挙）
  - `target.columns` の `required: true` 列がすべて `from` を持つか
  - `source.columns` の必須キー（date, debit.account, debit.amount, credit.account, credit.amount）が定義されているか
  - `taxcodes.entries` に同一 `sourceTaxCode` で日付範囲が重複するものがないか
  - `accounts.entries` の `confirmed:false` 件数（警告として件数表示）
- `convert` は既定で `verify-config` を内部実行し、失敗なら変換しない。`--dev` フラグ付きのときのみ（fixturesでの開発用）`TODO_VERIFY` を「推定名のまま」として扱い、`W013` を出して続行する。

---

## §4. 検証ルール

### 4.1 停止（error：freee用CSVを出力しない）

| コード | 内容 | 判定 |
|---|---|---|
| E001 | 伝票単位の借方合計 ≠ 貸方合計 | `sum(debit.amount) !== sum(credit.amount)`（税込/税抜の区別は同一伝票内で統一されている前提。`amountMode:'unknown'` のときは `W014` を併発） |
| E002 | 勘定科目が対応表に無い | `maps.accounts` 未ヒット。レポートの未マッピング一覧に「元科目名・出現件数・借方/貸方合計・最初の出現行」を出す |
| E003 | 税区分が対応表に無い／該当期間のエントリが無い | 同上（税区分版） |
| E004 | 日付が解析できない | `dateFormats` 全滅 |
| E005 | 金額が解析できない／列数不整合／必須列が空 | 数値化失敗、小数、ヘッダー列数≠行列数、`required` 列の空値 |
| E006 | 出力テンプレートの必須列に値が入らない | `renderOutput` 時 |
| E007 | 複合仕訳が出力テンプレートで表現不可 | `compoundEntries:'unsupported'` かつ `lines.length>2` |
| E008 | 伝票に明細行が1つしかない（片側のみ） | グループ化の失敗を疑う。`grouping` 設定の見直しを促す |

### 4.2 警告（warning：出力は続行。レポートに一覧）

| コード | 内容 | 判定 |
|---|---|---|
| W001 | 取引先名の完全一致衝突候補 | 出力に載る取引先名について、正規化（NFKC・trim・空白除去・英字大小統一）後に同一になるが元文字列が異なる組がある（例：`ABC商事` と `ＡＢＣ商事`）。freeeが完全一致重複を許可しない仕様〔リサ調査〕を踏まえ、事前名寄せを促す |
| W002 | 取引先名の表記ゆれ候補 | 正規化＋法人格表記（株式会社/（株）/㈱/有限会社 等）除去後のレーベンシュタイン距離 ≤ `partnerFuzzyThreshold`（既定2。文字数5以下なら1）。候補ペアと出現件数を列挙 |
| W003 | 固定資産科目を含む伝票 | `FIXED_ASSET` フラグ。「固定資産台帳を別途インポートする場合、取得仕訳の扱いを確認」 |
| W004 | 減価償却関連科目を含む伝票 | `DEPRECIATION` フラグ。「freeeの固定資産台帳から自動生成される減価償却仕訳と二重計上になる恐れ」。`options.fixedAssets:'exclude'` なら出力から除外して `I002` |
| W005 | 日付範囲がインボイス経過措置の切替日をまたぐ | `min(date) <= D && max(date) > D`（D = `invoiceTransitionDates` の各日付）。「切替日前後で税区分の対応（控80/控50等）が正しく分かれているかを確認」 |
| W006 | 会計期間外の伝票 | `fiscalYear` 設定時、期間外 |
| W007 | 期首残高・繰越と思われる伝票 | `OPENING_BALANCE` フラグ。既定で出力から除外し、集計をレポート「期首残高セクション」に出す |
| W008 | 部門・品目・タグ等の情報を落とした | `departments:'drop'` 等で値があった |
| W009 | 税額が金額と税率から逆算した値と±1円超で乖離 | `taxAmount != null` かつ `rate` 既知のとき。`tax_included`: 期待税額 = floor(amount × rate / (1+rate))、`tax_excluded`: amount × rate。端数処理差を考慮し±1円は許容 |
| W010 | 負の金額 | 赤伝・訂正仕訳の可能性。freee側の扱いを確認 |
| W011 | 伝票番号の重複（非連続の同一番号） | `by_voucher_no` で離れた位置に同一番号 |
| W012 | `confirmed:false` の対応表エントリを使用 | 科目・税区分 |
| W013 | `--dev` モードで `TODO_VERIFY` 列名のまま実行 | 開発時のみ |
| W014 | `amountMode:'unknown'` のまま借貸チェックを実施 | 設定未確定 |
| W015 | 同一補助科目名が複数の親科目に出現し、ルール適用結果が異なる | 例：「本社」が普通預金の下（→補助科目）と経費の下（→部門）に出る |

### 4.3 情報（info）

I001 文字コード判定結果／I002 除外した伝票数（固定資産・期首残高）／I003 グループ化戦略と伝票数・明細数。

---

## §5. 差分レポート仕様

出力ファイル（`out/<実行日時>_<profile名>/`）：

| ファイル | 内容 |
|---|---|
| `freee_import.csv` | 変換結果（errorゼロのときのみ） |
| `report.md` | 人が読む総括 |
| `report_accounts.csv` | 勘定科目別の集計 |
| `report_taxcodes.csv` | 税区分別の集計 |
| `report_unmapped.csv` | 未マッピング一覧 |
| `report_diagnostics.csv` | 全診断（code, severity, entryId, sourceRow, message, detail JSON） |
| `run.json` | 実行メタ（profile名・設定ファイルのsha256・件数・所要時間）。**明細データは含めない** |

`report.md` の構成：

1. **概要**：入力ファイル名・文字コード・物理行数・伝票数・明細数・error/warning件数・出力有無・プロファイル名と設定ファイルのハッシュ（「どの対応表で変換したか」の証跡）
2. **勘定科目別 借方/貸方合計（移行元 vs 変換後）**：表。列＝`元科目名 | freee科目名 | 元・借方合計 | 元・貸方合計 | 変換後・借方合計 | 変換後・貸方合計 | 差額 | 件数 | 備考`。複数の元科目が同一freee科目へ統合される場合は、freee科目側で小計行を出す。**除外伝票（期首残高・固定資産除外）は「変換後」から外れるため差額が出る**。その旨を備考に自動記載
3. **税区分別 合計**：`元税区分 | freee税区分 | 適用日付範囲 | 金額合計 | 税額合計 | 件数`
4. **期首残高・除外伝票セクション**：除外した伝票の一覧と、科目別の借方/貸方合計（freeeの開始残高登録の下書き資料として使える）
5. **未マッピング一覧**：科目・税区分それぞれ `元の値 | 件数 | 借方合計 | 貸方合計 | 初出行 | 提案（§8。PoCでは空）`
6. **取引先セクション**：出力される取引先名の一覧（件数付き）、W001/W002 の候補ペア
7. **警告一覧**：コード別件数 → 個別（伝票ID・行番号・メッセージ）
8. **補助科目割当サマリ**：ルールID別の適用件数
9. **確認依頼事項**（固定文言）：「本レポートは自動変換の下書きです。freeeへのインポートおよび勘定科目・税区分対応表の妥当性の最終確認は、会計事務所側の有資格者が行ってください。本ツールは税務・会計上の判断を行いません。」

CSV版は上記2・3・5・7を機械可読にしたもの。すべての金額は整数円。

---

## §6. 技術スタック提案

### 6.1 結論：Node.js 20 LTS ＋ TypeScript の CLI、変換ロジックは純関数モジュール

**推奨する**。理由：

- **ローカル完結**の要件（コホマダのサーバーへデータを送らない）を、CLIなら構造的に満たせる。`src/core/` に `fetch`/`http`/`fs`/`process` を一切import しないことをテストで機械的に担保する（§7）。
- **将来のブラウザUI化**：`papaparse` はブラウザでも動き、`core` は `Uint8Array`/`string` と設定オブジェクトだけを受け取るので、ブラウザでは `File.arrayBuffer()` → `convert()` → `Blob` ダウンロード、という薄いシェルを足すだけで済む（それでもデータはブラウザ内に留まる＝ローカル完結を維持）。ノヴァのWeb技術と直接つながる。
- **n8n化**（フェーズ2、エイト担当）は `core` をnpmパッケージ化してCodeノードから呼ぶ想定。ただし n8n をクラウドで動かすと「コホマダのサーバーにデータを送る」ことになり、ローカル完結原則と衝突する。**n8n化するなら事務所側のPC/セルフホストに限定**する（この判断はリョウの規約結果を待つ）。
- Python案（技術検討v1で併記）は捨てない選択肢だが、ブラウザ流用性と社長・ノヴァの技術スタック（JS/Three.js/Wix）との親和性でNodeを優先。

### 6.2 依存ライブラリ（最小限）

| 区分 | パッケージ | 用途 | 備考 |
|---|---|---|---|
| runtime | `papaparse` | CSVパース/生成 | 依存なし・ブラウザ可 |
| runtime | `iconv-lite` | Shift_JIS（CP932）のデコード／エンコード | Node標準の `TextDecoder('shift_jis')` はfull-ICU同梱のNodeで動く見込み〔要ノヴァ実機確認〕だが、**エンコード**（Shift_JIS出力）はNode標準にないため必要。ブラウザ版ではデコードのみ `TextDecoder` で代替可 |
| dev | `typescript`, `tsx`, `@types/node`, `@types/papaparse` | ビルド・実行・型 | テストは `node:test`＋`node:assert`（追加依存なし） |

CLI引数解析は `node:util.parseArgs`（Node 18.3+標準）を使い、`commander` 等は入れない。レーベンシュタイン距離・NFKC正規化（`String.prototype.normalize`）は自前実装／標準API。**LLMクライアント等のネットワーク系依存はPoCに入れない**。

### 6.3 フォルダ構成

```
accounting-converter/
  README.md                      # 使い方・ローカル完結の説明・免責
  package.json  tsconfig.json  .gitignore   # in/ out/ config/templates/ config/profile.json(実運用用) を除外
  src/
    core/
      index.ts                   # convert() のみ公開
      model.ts                   # §2.3 の型
      encoding.ts                # decodeBytes / encodeText
      csv.ts                     # parseCsv / toCsv（papaparse薄ラッパ）
      normalize.ts               # 名称正規化・金額/日付解析・レーベンシュタイン
      adapters/mf.ts  adapters/yayoi.ts  adapters/index.ts
      mapping.ts                 # applyMappings
      validate.ts                # §4
      output.ts                  # renderOutput
      report.ts                  # buildReport / renderReportMarkdown / renderReportCsvBundle
      suggest.ts                 # MappingSuggester インターフェース＋NoopSuggester＋RuleSuggester（§8）
      config.ts                  # Profile型・verifyConfig()（純関数：読み込み済みJSONを検査）
    cli/
      index.ts                   # convert / verify-config / inspect（ヘッダーと先頭3行を表示）
  config/
    profile.sample.json  sources/  targets/  maps/   # §3（TODO_VERIFY付き）
    templates/                   # gitignore。公式テンプレート・実エクスポートの置き場
  fixtures/                      # 架空データ（§7）
    mf/*.csv  yayoi/*.txt  expected/*.json
  test/*.test.ts
```

### 6.4 CLI

```
npx tsx src/cli/index.ts inspect       --input in/journal.csv [--encoding auto|utf8|shift_jis]
npx tsx src/cli/index.ts verify-config --profile config/profile.json
npx tsx src/cli/index.ts convert       --profile config/profile.json --input in/journal.csv --out out/ [--dev] [--force] [--strict]
```

終了コード：0＝成功（警告なし）、1＝警告あり（出力あり）、2＝エラーあり（出力なし）または設定検証失敗。

### 6.5 セキュリティ・ローカル完結の担保

- `core` はネットワーク・ファイルシステムに触れない（テストで静的検査）。
- `run.json`・ログに明細（金額・科目・摘要）を残さない。診断 `detail` は科目名・金額など最小限に留め、摘要全文は入れない。
- `in/`・`out/`・`config/templates/`・実運用の `config/profile.json` は `.gitignore`。コミットされるのは `fixtures/`（架空）と `*.sample.json` のみ。
- README に「本ツールはデータを外部に送信しません」「税務・会計上の判断を行いません」「実行結果の最終確認は有資格者が行ってください」を明記。

---

## §7. テスト方針

- テストランナー：`node --test`（`tsx` 経由）。`convert()` を fixtures＋`--dev` 相当のプロファイル（推定列名のまま）で呼び、`diagnostics` のコード集合と `report` の集計値を `expected/*.json` と比較する。
- fixtures はすべて**架空**（社名例：「サンプル商事株式会社」「テスト工業有限会社」「ダミー物産」。人名は使わない。住所・電話・登録番号を含めない）。金額は端数を含む値を使う（税額整合チェックのため）。
- 弥生fixtureはShift_JISで保存したファイルを用意（テスト内で `iconv-lite` を使って生成してもよい）。MFfixtureはUTF-8 BOM付き。

| # | ケース | fixture | 期待 |
|---|---|---|---|
| T1 | 正常系（単純仕訳のみ・全科目/税区分マッピング済） | `mf/normal.csv`, `yayoi/normal.txt` | error 0、warning 0、出力行数＝伝票数、科目別合計が元と一致 |
| T2 | 複合仕訳（借1・貸3、借2・貸2） | `mf/compound.csv` | `compoundEntries:'blank_side'` で出力行数＝明細数、`'unsupported'` で E007 |
| T3 | 未マッピング科目・税区分 | `mf/unmapped.csv` | E002×1種、E003×1種、出力なし、未マッピング一覧に件数・合計 |
| T4 | 借貸不一致 | `mf/unbalanced.csv` | E001（該当伝票IDと差額）、他伝票は正常 |
| T5 | 重複取引先（全角/半角・（株）表記ゆれ） | `mf/partners.csv` | W001×1ペア、W002×1ペア、`aliases` 設定時は警告消失 |
| T6 | 固定資産科目・減価償却費 | `mf/fixed-assets.csv` | W003、W004。`fixedAssets:'exclude'` で出力から除外・I002・レポート除外セクションに記載 |
| T7 | 期跨ぎ（2026-09-15〜2026-10-15） | `mf/transition.csv` | W005。免税事業者仕入の税区分が日付で控80/控50に振り分けられる |
| T8 | 期首残高（開始残高伝票を含む） | `yayoi/opening.txt` | W007、出力から除外、期首残高セクションに科目別合計 |
| T9 | 文字コード・ヘッダー | `yayoi/sjis-noheader.txt`, `mf/utf8-bom.csv` | I001 が正しい判定、ヘッダー無しでindex読みが機能 |
| T10 | 金額・日付フォーマット異常 | `mf/bad-formats.csv` | E004、E005、W010（負値）、全角数字は正常解析 |
| T11 | 設定検証 | `config/*.sample.json` | `verifyConfig()` が TODO_VERIFY を検出して失敗、`--dev` で W013 |
| T12 | ローカル完結の静的検査 | `src/core/**` | `fetch`/`http`/`https`/`net`/`fs`/`child_process`/`process.env` の文字列がcoreに含まれない |
| T13 | 往復整合 | T1出力 | 出力CSVを再パースし、科目別借方/貸方合計が中間モデルの集計と一致 |

受け入れ基準（PoC完了の定義）：T1〜T13 が通ること、`README` の手順で社長のPCで `convert` が動くこと、公式テンプレート転記後に `verify-config` が通ること（この最後の1つだけ社長作業に依存）。

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

- `NoopSuggester`：常に空（**PoC既定**）。
- `RuleSuggester`（フェーズ1前半・ローカル）：freee側の科目一覧（`ctx.targetAccounts`＝社長が用意するfreee標準科目リスト。これも TODO_VERIFY）との文字列類似（完全一致→正規化一致→レーベンシュタイン→部分一致）で候補を出す。外部通信なし。
- `LlmSuggester`（フェーズ1後半）：`ctx` と `UnmappedItem` の **`sourceValue`（科目名・税区分名・補助科目名）と親科目名だけ**をプロンプトに含め、金額・摘要・取引先名・件数は送らない。実装は `core` の外（`src/integrations/`）に置き、`core` は依存しない。

### 8.2 制約（設計に組み込む）

1. **外部LLMへ送る内容が顧客データ由来である以上、`approval-policy.md`「個人情報・機密情報の外部AIサービスへの入力」に該当し、事前に社長の承認が必要**。加えて、会計事務所→顧問先の同意（契約上の整理はリョウ）。CLIは `--suggester llm_external` を指定しただけでは動かず、`config/approvals.json`（承認者・日付・対象プロファイル・送信項目の種類）が存在し、かつ `--i-confirm-external-ai` フラグが揃わない限り `NoopSuggester` にフォールバックし `W016` を出す。
2. **ローカル完結原則との関係**：外部LLMを使った時点で「データを外部に送らない」という商品上の約束は成り立たなくなる。選択肢は (i) ローカルLLM（Ollama等、PCまたは事務所内サーバー）で `llm_local` を使う、(ii) 送信対象を科目名等のマスタ情報に限定し、その旨を顧客に明示して同意を取る、(iii) AI提案はコホマダ側が**架空・一般化した科目名辞書**を事前に作るために使い（顧客データを使わない）、実運用ではその辞書を `RuleSuggester` が引く、の3案。**PoCでは (iii) の考え方で、架空データのみを扱う**。どれを商品化するかは社長判断（§9）。
3. 提案は必ず `accounts.json` に `confirmed:false, source:'llm_suggested'` として書き込まれ（`--write-suggestions` 指定時のみ）、人間が `confirmed:true` にするまで本番変換では警告／strict時は停止。**AIの提案を無審査で適用する経路を作らない**。
4. レポートの未マッピング一覧に候補と `reason` を併記し、専門家がその場で採否を判断できる形にする（レンの差別化仮説「AI提案＋差分検証＋専門家最終確認」の具体形）。

---

## リスク・注意点

1. **列定義の未確認**が最大のリスク。本書の列名・列順・識別フラグ値・税区分名称は**すべて推定**であり、`TODO_VERIFY` が残ったまま実データに使うと誤変換が起きる。`verify-config` のゲートを外さないこと。
2. 借貸チェックは「同一伝票内で税込/税抜が統一されている」前提。MF/弥生のエクスポートが税抜金額＋税額列の形だった場合、`amountMode` を正しく設定しないと E001 が大量発生する（逆に、誤って通る事態は起きない設計）。
3. 取引先の名寄せを**自動では行わない**ため、警告が多いと人手作業が残る。これは意図的（勝手に統合すると債権債務内訳が崩れる）。
4. 弥生汎用形式のグループ化戦略（フラグか伝票番号か）は実ファイルを見るまで決められない。アダプタを両対応にしておく。
5. 経過措置の延長（税制改正大綱）は未確定。対応表の日付範囲は現行制度で書き、法制化を確認した後に追記する。
6. PoCは架空データ限定。実データ（1事務所1クライアント分）を使う段階は、社長承認・仮名化方針の決定・事務所との秘密保持の整理（リョウ）を経てから。
7. `iconv-lite` の CP932 対応（機種依存文字：①、㈱、髙 など）は実ファイルで確認する。
8. 「freeeがMF形式・弥生形式を直接受け付ける」なら形式変換部分の価値は薄い。PoCの評価軸を「マッピング・検証・レポートの有用性」に置く（レン・ミナの整理と整合）。

## 推奨案

- ノヴァは §6.3 の骨格 → `verify-config`（§3.8）→ MFアダプタ＋T1/T3/T4 → 検証ルール全部＋T5〜T7・T10 → レポート → 弥生アダプタ＋T8/T9 → T12/T13、の順で進める（1〜2週間目安、技術検討v1のロードマップどおり。目安であり確定見積りではない）。
- 社長は並行して §3.7 の転記作業（15〜30分程度を想定）を行う。これが済むと `--dev` なしで動かせる。
- エイトのn8n化は本PoCでは着手せず、`core` のnpm化後（フェーズ2）に判断する。

## 代替案

- **ブラウザ完結の単一HTMLツール**から始める案：配布が楽（HTMLファイル1つ）で「データが外に出ない」ことを直感的に示せる。ただしShift_JIS出力・大量行のテスト・CLI自動テストのしやすさで劣るため、PoCはCLI、フェーズ1でブラウザシェルを追加する順が妥当。
- **Excel/スプレッドシートのテンプレート＋手順書**（技術検討v1・レン案D）を先に出して需要を測る案：本PoCと矛盾せず、対応表（`accounts.json`/`taxcodes.json`）の内容をスプレッドシートで管理→JSONに書き出す運用にすれば両立できる。

## 出典

- 本書は新規の外部調査を行っていない（列定義ページはegress proxyで到達不能のため）。根拠はすべて冒頭記載の先行5資料（2026-09-14付）と、そこに記載の出典URL（いずれもWebSearch要約ベース・本文未確認）に依る。
- インボイス経過措置の期間（80%：〜2026-09-30、50%：2026-10-01〜2029-09-30）：ミナ整理の記載を引用。国税庁一次情報での再確認はリサに依頼中。
- Node.js標準API（`TextDecoder`, `util.parseArgs`, `node:test`, `String.prototype.normalize`）の利用可否はノヴァが実機で確認する（本書は仕様書URLを添付していない）。

## 未確認事項・社長確認事項

**未確認（技術）**
- freee汎用形式テンプレートの列名・列順・必須列・金額の税込/税抜・複合仕訳の表現・文字コード・行数上限
- MF仕訳帳CSVの正確なヘッダー名・文字コード（BOM有無）・複合仕訳の表現・金額の税込/税抜・決算整理仕訳列の有無
- 弥生汎用形式のヘッダー有無・列順・識別フラグ列の有無・日付表記（西暦/和暦）・税区分結合表記の実例
- freee税区分の正式名称一覧（「課対仕入（控80）10%」等の表記は検索要約ベース）
- freeeが口座（普通預金の補助）を補助科目として受けるか、取引先/部門/メモタグ列がテンプレートに存在するか
- Node.js 20 の `TextDecoder('shift_jis')` 可否、`iconv-lite` のCP932機種依存文字の扱い

**社長確認事項**
1. 入力の優先順位：MF先行でよいか。想定顧客が弥生中心なら弥生先行に入れ替える
2. 公式テンプレート・サンプルエクスポートの取得と転記（§3.7）を行っていただけるか。取得したファイルの保管場所（リポジトリ外）でよいか
3. PoC用データ：架空データのみで進める方針でよいか。実データを使う場合、仮名化（取引先名の置換・摘要の削除）の要否と担当
4. AI提案の方式（§8.2の (i)ローカルLLM／(ii)マスタ限定送信＋同意／(iii)架空辞書事前作成）のうち、商品として目指す方向
5. 出力先テンプレート：freee汎用形式を既定でよいか（公式にMF形式/弥生形式テンプレートがあると判明した場合の扱い）
6. 固定資産関連仕訳の既定動作：警告のみ（`warn`）か、除外（`exclude`）か
7. 部門を使っている顧問先が多いか（多ければPoC内で `passthrough` の検証を優先）

## 人間承認が必要な事項（`approval-policy.md`）

| # | 事項 | 承認者 | 状態 |
|---|---|---|---|
| 1 | 実在の会計事務所・顧問先の実データをPoC/検証に使用すること（仮名化方針を含む） | 社長（＋当該事務所） | 未承認。PoCは架空データのみ |
| 2 | 外部AIサービス（LLM API）へ顧客データ由来の情報（科目名等を含む）を送信すること | 社長（＋顧問先同意の整理はリョウ） | 未承認。PoCでは実装しない |
| 3 | freee本番事業所へのCSVインポート実行 | 会計事務所側の有資格者（ツールは実行しない） | 本ツールの対象外操作 |
| 4 | 本ツールを外販・配布すること（規約・商標・免責の整理） | 社長（リョウの規約確認・必要なら弁護士） | 未承認。規約原文の確認待ち |
| 5 | 公式テンプレート・エクスポートファイルをリポジトリに含めること | 社長 | 本書は「含めない」を推奨 |
| 6 | 勘定科目・税区分対応表の内容確定 | 有資格者（税理士・会計士）の監修 | 未着手 |
| 7 | n8n等クラウド環境での実行（ローカル完結原則の変更） | 社長 | 本PoCでは行わない |

## 次に必要なアクション

1. **アオイ**：本書の監査（推定と確認済みの区別、`TODO_VERIFY` 運用の妥当性、承認事項の網羅性）。
2. **ノヴァ**：監査後、`accounting-converter/` を新規作成し §6.3 の骨格と `verify-config`・MFアダプタ・T1/T3/T4 から着手。不明点は本書の該当§番号で質問する。
3. **社長**：§3.7 の転記作業と、§9「社長確認事項」1〜7への回答。
4. **リサ**：インボイス経過措置の期間（現行・延長）を国税庁一次情報で再確認し、`taxcodes.json` の日付範囲の根拠を確定。
5. **リョウ**：公式テンプレートをローカル保管・非配布とする運用の妥当性、外販時の免責文言（README／レポート末尾）の案。
6. **メイ**：ノヴァの実装中に生じる設計判断（グループ化戦略の実態等）を本書v2に反映。エイトとのn8n化検討はフェーズ2まで保留。
