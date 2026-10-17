# シフト表・フロコン表ツール（.xlsm）がMacBookで使えない原因調査 v2

- 事業タグ：kohomada（顧客向け納品ツールの保守）
- 作成日：2026-10-17／ステータス：Draft（社内向け調査メモ）／v1に対するアオイの監査（PASS WITH CONDITIONS）の指摘を反映
- 調査対象：社長から受け取った「シフト表・フロコン表ツール.xlsm」と「操作ガイド（2026年10月版）」
- 方法：xlsmを展開し、VBAのコード（olevbaで抽出）とシート構造を静的に解析した（アイ）。Mac版Excelの仕様はMicrosoftの一次情報で裏取りした（リサ）。
- **Mac実機での再現確認はまだしていない**。以下は、コード解析と公式資料から導いた原因の見立てである。
- 個人情報の扱い：ツールにはスタッフの氏名・従業員番号が入っているが、本メモには転記していない。

## 1. 結論

**見立て：主な原因は、ツールがWindowsでしか動かない部品に依存していること。** 次の2系統があり、裏付けの確度は系統ごとに違う。

1. **ActiveXのボタン（17個）**
   - 確度：[確認済み事実]（Microsoftの公式資料で裏付けあり）
   - Mac版Excelは、ActiveXコントロールをサポートしていない。毎週の取り込みで最初に押す「① CSV取込」「② シフト表作成」もActiveXのボタンである。
2. **Windows専用のCOMオブジェクト（`Scripting.Dictionary` ほか、合わせて30か所）**
   - 確度：[仮定]（可能性は高い。ただし公式の明記がなく、Mac実機での確認待ち）
   - 設定を読み込む共通処理 `LoadSettings` が、`Scripting.Dictionary` を12個作っている。フロコン表の日付切替・週切替・リセット・結合・印刷など、ほとんどの機能がこの処理を通る（[確認済み事実]：コード上の経路）。Macで `Scripting.Dictionary` が使えない場合、Macでも動くはずの図形ボタンから実行しても、途中で止まる。

[仮定] 以下は副次的な要因で、上の2つを直したあとに表面化すると見ている。

- パスの区切りを「`\`」で決め打ちしている
- Windowsの環境変数（`USERPROFILE` など）を使っている
- Macのサンドボックスによるファイルアクセス制限（バックアップ・CSVのコピー・PDF保存）

## 2. コード解析の結果（[確認済み事実]：xlsmの中身から確認）

### 2-1. ActiveXボタン（クラスID `{D7053240-CE69-11CD-A777-00DD01143C57}`＝Forms.CommandButton）

| シート | ActiveXボタン | 呼んでいる処理（ガイド上の操作） |
|---|---|---|
| スタッフ一覧 | 2個 | `ImportCsvWithBackup`（① CSV取込）、`ImportWeek`（② シフト表作成） |
| ホビー・トレカ | 1個 | `BuildWeekByName`（フロコン表 一括作成） |
| アパレル・家電 | 1個 | 同上 |
| フロコン(ホビトレ) | 3個 | 結合／結合解除／リセット |
| フロコン(アパ家) | 4個 | 結合／結合解除／リセット／トレカタスクリスト取込 |
| フロコン(BO) | 3個 | 旧式のボタン（作成1個：`makeFloorControlBO`、作成してから印刷1個、1週間分の印刷1個：`PrintOut`） |
| チェックリスト | 1個 | （チェックリストの処理） |
| ハイソル備考 | 2個 | 行の表示・非表示とシート保護 |

※ シートXMLでは、各コントロールが代替画像の分と合わせて2回ずつ数えられるため、表の個数はその半分にしている（実体は17個）。

図形にマクロを登録したボタンは別にあり、ActiveXではない。具体的には次のとおり。
- 目次：前の月の写しを消す、1週間分を出す×3
- スタッフ一覧：未割当の人を移す
- フロコン表(BO)：結合／結合解除／リセット

### 2-2. Windows専用のCOMオブジェクト

| ProgID | 件数 | 主な場所 |
|---|---|---|
| `Scripting.Dictionary` | 25 | modCommon（`LoadSettings` で12個）、modAddon、modWeek、modAlloc |
| `Scripting.FileSystemObject` | 3 | CSVの写しを保存（modWeek）、CSV取込（main）、共有ドライブの判定（modAddon） |
| `VBScript.RegExp` | 1 | main `RemoveBanPattern` |
| `WScript.Shell` | 1 | modAddon `PickFolder`（PDFの保存先選び） |

`LoadSettings` を呼んでいる処理（抜粋）：
- フロコン表の日付切替（`OnDateChanged`、各フロコン表シートの `Worksheet_Change` から呼ばれる）
- リセット・結合
- 1週間分の印刷・PDF（`PrintWeek`）
- 一括作成

### 2-3. その他、Windowsを前提にした書き方

- パス区切りの「`\`」決め打ち：
  - バックアップフォルダ（`BackupDir`／`MakeBackupFolders`）
  - バックアップの `SaveCopyAs`（`SaveBookCopy`）
  - CSVの写し、PDFのファイル名
  - 旧処理 `main.②シフト表作成` の `SaveAs` にも残っている。ただし今のボタンからは呼ばれない。
- `Environ$`：
  - `USERPROFILE`：CSV選択の初期フォルダ、PDF保存先の初期フォルダ
  - OneDrive系の変数：共有ドライブの判定（`IsSyncedOrShared`）。この判定は `BackupDir` からも呼ばれる。
- `ChDrive`：ドライブ文字を前提にしている
- `GetOpenFilename("CSVファイル,*.csv")`：ファイルの種類で絞り込む書き方
- `FileDialog(4)`：フォルダを選ぶ画面
- `ExportAsFixedFormat`（PDF出力）、`MkDir`、`CopyFile`

## 3. Mac版Excelの仕様（リサの裏取り・確認日はすべて2026-10-17）

| 論点 | 判定 | 根拠 |
|---|---|---|
| ActiveXコントロールはMac非対応 | [確認済み事実] | Microsoft「Assign a macro to a Form or a Control button」に「ActiveX controls are not supported on the Mac.」とある。適用対象はExcel for Microsoft 365 for Macなど。 https://support.microsoft.com/en-us/office/assign-a-macro-to-a-form-or-a-control-button-d58edd7d-cb04-4964-bead-9c72c843a283 |
| フォームコントロールのボタンはMacで使える | [確認済み事実] | 同じ記事の「Newer Mac versions」タブに、Macでの登録手順がある |
| FileSystemObjectはMacで使えない | [確認済み事実]（ただしExcel 2011向けの文書） | Microsoft Learn（アーカイブ）「Performing File and Folder Operations Programmatically in Excel 2011 for the Mac」（2012年） https://learn.microsoft.com/en-us/previous-versions/office/developer/office-2010/jj614412(v=office.14) |
| Scripting.DictionaryはMacで使えない | [未確認]（公式の明記はなく、Q&Aでのユーザー報告のみ） | Microsoft Q&A「VBA on Mac issue」（2025-12-17）に、ユーザーの報告と代わりにCollectionを使う回答がある。Microsoftの公式見解ではない。 https://learn.microsoft.com/en-us/answers/questions/5667028/vba-on-mac-issue |
| VBScript.RegExp／WScript.ShellはMacで使えない | [未確認] | 公式の明記はない。[仮定] これらのWindows部品（vbscript.dll／wshom.ocx）はmacOSに無いので、使えない可能性は高い |
| EnvironはMacでは使えない | [確認済み事実] | Microsoft Learn「Environ function」に「Not available on the Macintosh.」とある。 https://learn.microsoft.com/en-us/office/vba/language/reference/user-interface-help/environ-function |
| Mac版Officeはサンドボックス化されており、外部ファイルへのアクセスに許可が要る | [確認済み事実]（Office 2016 for Mac向けの文書） | Microsoft Learn「Office for Mac for VBA」 https://learn.microsoft.com/en-us/office/vba/api/overview/office-mac ／「Request access to multiple files」（GrantAccessToMultipleFiles） https://learn.microsoft.com/en-us/office/vba/office-mac/grantaccesstomultiplefiles |
| GetOpenFilenameのフィルター、FileDialogのMacでの挙動 | [未確認]（コミュニティの報告が食い違っている） | 公式の記述はない |
| ネットから入手したファイルのマクロが既定でブロックされる仕組み | [確認済み事実] Macには該当しない | Microsoft Learn「Macros from the internet are blocked by default in Office」（2026-07-31更新）に「The change doesn't affect Office on a Mac」とある。 https://learn.microsoft.com/en-us/microsoft-365-apps/security/internet-macros-blocked |
| ファイルを開くときのマクロ有効化の確認 | [確認済み事実] | 既定の設定では、開くたびに確認が出る。Microsoft「Enable or disable macros in Office for Mac」 https://support.microsoft.com/en-us/office/enable-or-disable-macros-in-office-for-mac-c2494c99-a637-4ce6-9b82-e02cbb85cb96 |

## 4. 予想される症状（[仮定]：コードと仕様から推定。実機では未確認）

| 操作（ガイドの番号） | Macで予想される症状 | 原因 |
|---|---|---|
| 2. ①CSV取込・②シフト表作成 | ボタンが反応しない | ActiveX |
| 3. 未割当の人を移す | 図形ボタンなので処理は始まるが、`Scripting.Dictionary` でエラーになる可能性 | COM |
| 4. フロコン表の日付切替 | 日付を選ぶと、`LoadSettings` でエラーになる可能性 | COM |
| 5. 売場シートの週切替 | コード上は `Workbook_SheetChange` → `OnSheetChange` → `RefreshDatePickers` → `LoadSettings` の順に通る（[確認済み事実]）。Macでエラーになるかは実機で確認 | COM |
| 7. 結合・結合解除 | ホビトレ・アパ家はボタンが反応しない。BOは図形ボタンだが途中でエラーの可能性 | ActiveX／COM |
| 8. リセット・一括作成 | 同上 | ActiveX／COM |
| 9. 1週間分の印刷・PDF | 図形ボタンだが、最初の `LoadSettings` でエラーになる可能性。`WScript.Shell` は `On Error Resume Next` の中にあるので止まらず、保存先の初期フォルダが決まらないだけの可能性 | COM／Environ |
| 11. 前の月の写しを消す | バックアップのパス（「`\`」区切り）と、`Environ` を使った共有ドライブの判定で失敗する可能性 | パス／Environ |

[未確認] 社長の言う「使えない症状」の具体的な中身は、まだ聞けていない。たとえば次のどれに当たるかで、見立ての当たり外れを確かめられる。
- ボタンが押せない
- エラーメッセージが出る（何と出るか）
- マクロが無効になっている

[仮定] フロコン表を開いたときの処理（`OnActivate`）は `On Error Resume Next` の中で `LoadSettings` を呼んでいる。そのため、エラーが出ずに「何も起きない」ように見える場合がある。

## 5. 未確認事項・次に確かめること

1. [要ヒアリング] 症状の具体的な中身。次の3点を確認したい。
   - どの操作で、何が起きたか（エラー文があれば画面の写真）
   - MacのExcelのバージョン（Microsoft 365 for Macかどうか）
   - マクロを有効にして開いているか
2. [要追加調査] Mac実機での確認：
   - `CreateObject` で各ProgIDを作ったときのエラー番号
   - `Application.PathSeparator` の戻り値
   - フィルター付きの `GetOpenFilename`
   - `FileDialog(4)` が動くかどうか
3. 改修方針（例）。ここは社長の判断が要る。
   - ActiveXボタンを図形ボタンかフォームコントロールのボタンに置き換える
   - `Scripting.Dictionary` を、自前のクラスかCollectionに置き換える
   - パス・環境変数・ファイル選択を `#If Mac` で分岐させる
   - 代案：Mac利用者にはWindows環境で使ってもらう
4. ガイドの更新が必要になる。改修後は、ボタンの見た目、Macでの「コンテンツの有効化」の手順、ファイルアクセス許可のダイアログについて追記する。

## 6. 人間の承認が必要な事項

- 改修するかどうかと、その方針の決定（顧客への納品物の変更にあたる）
- 顧客への説明や連絡文の送付（下書きを作ったうえで、社長が承認する）
