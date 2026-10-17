# NoviOcean note記事 v6：出典の再確認（2026-10-17）

**結論：どの出典にも変化はありません。** 出典欄の全30 URLを本日取得でき、すべてHTTP 200でした。記事の引用文言と数値は、本日の原文でもすべて同じです。修正が必要な箇所はありません。リポジトリのファイルは編集していません。

方法：curlで生のHTML／PDF／JSONを取得してテキスト化し、文字列で照合しました。WebFetchは使っていません。取得物の保存先は /tmp/claude-0/-home-user-kouki-ai-lab/0eee871f-920f-5845-89e7-8eec54443fa3/scratchpad/verify3/ です（raw、txt、nov、egov、status.txt）。

### 1. HTTPステータス：変化なし
- **結果**：30 URLすべてが200で、リダイレクトはありませんでした（取得記録は status.txt）。
- **Ellevio**：記事に載せている https://www.ellevio.se/en/about-us/sustainability/startup-4-climate/ が、本日は200で直接返りました。最終URLは記事のURLと同じです。

### 2. NoviOcean：変化なし
- **ページの更新日時**：WP REST APIで全48ページの modified を、前回の pages*.json と比べました。差分はありません。
  - Validation：2026-09-21T02:02:27
  - Medi Wave 850H：2026-09-23T17:05:01
  - Remote Islands：2026-09-23T17:06:58
  - Technology：2026-09-23T17:06:05
  - Simulator：2026-09-21T02:02:01
  - Further Applications：2026-09-21T02:01:01
  - トップ（home-v2）：2026-09-21T01:58:04
  - About：2026-09-23T16:31:21
- **新しい投稿**：ありません。投稿は前回と同じ94件で、modified の差分もありません。いちばん新しい投稿は 2026-07-18 の記事です。日本・独占・パイロット時期・社名に関わる新しい発表はありません。サイト全体で「Japan」「exclusive」も見つかりませんでした。
- **2024年2月7日の記事**（novige-ab-receives-a-multi-million-eur-grant…）：同じ日付で今も公開されています。
- **記事の文言との照合（本日の原文で確認）**：
  - Validation：段階表の 2027–2028／2029+、"No full-scale unit is operating offshore today"、fourteen months と但し書き "Durations are elapsed test-programme time, not continuous running hours"、"Recognition is not validation"
  - 850 kW と management estimate：複数ページ
  - ~2,500 MWh と modeled：Remote Islands、Simulator、Applications
  - 2× と modeled：トップ
  - 0.5–5 m と NoviOcean design target：Medi Wave 850H
  - 20–200 m：Simulator
  - "No gearbox or generator underwater"、Seabased、Galway Bay、1–15 April：Technology
  - approximately twelve と8用途：トップ、Further Applications
  - "One platform…instead of three separate projects"、2016–2019、systems integrator：トップ
  - Wind Harvest と Midsummer：全ページ
  - 2026–2027：7月18日の記事
- **本文テキストの差分**：前回の本文と比べて出た差分は、改行位置の違い（変換方法の差）だけでした。内容は変わっていません。

### 3. 官公庁など：変化なし
- **国交省PDF**：前回とファイルが完全に同じ（MD5一致）です。「令和８年４月１日現在」「417」「255島」の記載はそのままです（14,125 は島嶼の総数として別に記載）。
- **NEDO P2-46**：MD5一致です。引用文「離島では、大規模系統に非接続、かつ電力需要が少ないことから、再エネ導入に伴う系統不安定化に早い段階で直面すると考えられる。」が原文どおりあります。日付 2024年7月19日、電力中央研究所・ネクステムズ・沖縄電力の記載もあります。
- **水産庁 260630-4.pdf**：MD5一致です。「沖合養殖の拡大」と、引用している2つの文言が原文どおりあります。
- **環境省 900443200.pdf**：前回とテキストが同じです。「高コストのディーゼル発電に依存」があります。
- **鹿児島県PDF**：前回とテキストが同じです（6ページ）。「主に重油を使用した内燃力発電所による発電によって賄われている」があります。
- **e-Gov（API v2）**：
  - 離島振興法：現行版は2024-04-01施行版です。第17条の3の1項（再生可能エネルギーの供給体制の整備に必要な支援…適切な配慮をするものとする）と2項（石油製品の価格の低廉化）は記事の記載どおりです。
    - 2027-04-01施行予定の改正（医療法等の一部を改正する法律による）が登録されていますが、前回確認時から登録済みのものです。改正後の版でも第17条の3の文言は変わらないことを確認しました。
  - 海洋再エネ法：題名は「海洋再生可能エネルギー発電設備の整備に関する法律」です（現行版、2026-04-01施行）。
  - 同法施行令：第1条は「…海域における風力とする。」のままです（現行版、2026-04-01施行）。

### 4. 第三者：変化なし
- **LIFE**：「LIFE NOVIOCEAN」「Coordinating Beneficiary: Novige AB」があります。
- **Vinnova**：Coordinator は Novige AB です。
- **Ellevio**：「The winners of the 2023 competition were the start-ups Cemvision and Novige」があります。
- **Mission Innovation**：日付は 20-October-2021 です。Jan Skjoldhammer 氏と「MI Champion」の記載があります。

### 5. kohomadha.com：変化なし
- 200で表示されます。タイトルは「海外進出・日本展開のワンストップサポート|株式会社コホマダ|マーケティング」です。
- 記事の会社紹介（海外に挑む日本企業と、日本で事業を広げたい海外企業を支援）と内容が合っています。

### 確認日を2026年10月17日に一本化してよいか
**一本化して問題ありません。** URLを掲げた出典は、本日すべて取得でき、内容も変わっていませんでした。URLを載せていない2024年2月7日のNoviOcean記事も、本日WP APIで公開を確認しています。

出典欄の冒頭は、たとえば「確認日はすべて2026年10月17日です。」とできます。その場合、開発段階図の中の「確認日 2026年10月13日」も合わせて直す必要があります（入稿メモ4のとおりカエデへ依頼）。
