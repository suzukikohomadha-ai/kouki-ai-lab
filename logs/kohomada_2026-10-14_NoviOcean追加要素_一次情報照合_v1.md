# NoviOcean記事ブラッシュアップ用 追加要素の一次情報照合 v1

## 照合結果レポート（リサ補佐・読み取りのみ・確認日 2026-10-14）

方法：curl で生の HTML、PDF、WP REST JSON を取得し、テキストに変換してから grep で照合しました。下の引用はすべてこの生テキストからのものです。リポジトリのファイルは編集していません。
- 取得物：/tmp/claude-0/-home-user-kouki-ai-lab/0eee871f-920f-5845-89e7-8eec54443fa3/scratchpad/verify2/raw/
- テキスト化したもの：/tmp/claude-0/-home-user-kouki-ai-lab/0eee871f-920f-5845-89e7-8eec54443fa3/scratchpad/verify2/txt/

---

### D-1【最重要】離島の電源は内燃力（ディーゼル）発電が中心か

**判定：取得できた（官公庁・自治体の一次資料）。電力会社サイトの直接取得はできなかった。**
- 東京電力（tepco.co.jp）は、英語版・日本語版・東京電力パワーグリッドのプレス PDF のすべてが 403 でした。プロキシではなく、サイト側の「Access Denied」です。
- 沖縄電力（okiden.co.jp）も 403 でした。
- 九州電力の候補 URL は 404 でした。
- 資源エネルギー庁（enecho）・経産省審議会の PDF は 403、電力・ガス取引監視等委員会（emsc）は 502 でした。
- 代わりに次の4資料を取得しました。

**(a) 環境省 PDF【前回 403 → 今回 200】**
- URL：https://www.env.go.jp/content/900468363.pdf
- 発行主体：環境省 地球環境局地球温暖化対策課 ほか
- 資料名：「（新）離島の低炭素地域づくり推進事業」平成26年度要求額 3,100百万円
- 日付：PDF 作成日 2013-08-26
- 原文：「本土と系統連系がない（オフグリッド）離島は、CO2 排出量が大きく、高コストのディーゼル発電に依存している。」

**(b) 環境省 PDF（より新しい版）**
- URL：https://www.env.go.jp/content/900443200.pdf
- 資料名：「離島の低炭素地域づくり推進事業」平成28年度予算（案）額 1,000百万円
- 日付：PDF 作成日 2016-01-19
- 原文：「本土と系統連系されていない離島（オフグリッド）はCO2排出量が大きく高コストのディーゼル発電に依存。更に、本土に比べて電力系統が脆弱のため、現状では、再生可能エネルギーの大幅な導入拡大が困難」
- 同じ趣旨の文が https://www.env.go.jp/content/900468230.pdf（「離島の再エネ・減エネ加速化事業【２５年度補正】」2013-12）にもあります：「本土と系統連系されていない（オフグリッド）離島は、ＣＯ２排出量が大きく、高コストのディーゼル発電等の化石燃料由来のエネルギーに依存しており」

**(c) 鹿児島県掲載の委託報告書（2023年3月）**
- URL：https://www.pref.kagoshima.jp/ac10/documents/106647_20230601213056-1.pdf
- 資料名：「離島における再エネ主力電源化に向けた可能性調査事業業務委託 報告書（概要版）」令和5年3月
- 作成：株式会社建設技術研究所（鹿児島県の委託による県公開資料）
- 原文：「鹿児島県の南北 600km に及ぶ海域に位置する離島（うち，特別措置法適用の有人離島は 26）には約 16 万人もの人々の暮らしや産業があり，これらの活動を支える電気は主に重油を使用した内燃力発電所による発電によって賄われている。」
- 同資料の別の原文：「【独立系統型離島】 • 島内に内燃力発電があり，島内のみに閉じた送配電網が整備されている。」

**(d) 沖縄県「沖縄県クリーンエネルギー・イニシアティブ 資料編」**
- URL：https://www.pref.okinawa.jp/_res/projects/default_project/_page_/001/015/062/02okinawacleanenergyinitiativeshiryohen.pdf
- 日付：PDF 作成日 2021-03-25
- 表の名前：「表 1-1 沖縄県の火力発電設備（沖縄電力(株)保有）（2019 年 3 月 31 日現在）」
- 表の出典表記：「『電力設備詳細』（沖縄電力(株)WEB サイト）」
- 「内燃力」の欄には次の発電所が並び、合計は「189,860」kW、「55 基」です（基準日 2019-03-31）：久米島・渡嘉敷・渡名喜・粟国・南大東・北大東・宮古・宮古第二・新多良間・石垣・石垣第二・波照間・与那国
- 宮古・石垣には重油ガスタービンもあります。

**全国の数値（離島の総数・非連系の割合など）：一次資料からは取得できませんでした。** 検索で「有人離島312、うち非連系31%」（2009年、JSTサイエンスポータル）が出ましたが、原文を照合しておらず古いので使わないでください。

**推奨文言案：**
> 環境省の事業資料は、本土と送電網がつながっていない（オフグリッド）離島について「高コストのディーゼル発電に依存」していると説明しています（環境省、平成28年度予算資料）。たとえば鹿児島県の離島では、電気は「主に重油を使用した内燃力発電所」で賄われていると県の調査報告書（2023年3月）に記載されています。

**注意点：**
- 環境省の資料は 2013〜2016 年のものです。記事では「環境省の資料（2016年）では」のように年を明記してください。
- 「離島の多く」と量で言い切る根拠（全国の数値）は取れていません。上の案のように、帰属を明示し、具体例で限定する書き方を推奨します。

---

### D-2 運転波高と設置水深：一致

**運転波高**
- ページ：https://noviocean.energy/medi-wave-850h/（WP modified 2026-09-23T17:05:01）
- 原文：「Operation and survivability. Designed for normal operation in 0.5–5 m waves, with survivability engineered for extreme seas with waves up to 30 m and wind speeds up to 80 m/s.」
- ラベル：**NoviOcean design target**

**設置水深**
- ページ：https://noviocean.energy/simulator/（modified 2026-09-21T02:02:01）
- 原文：「Deployable depth 20–200 m」と「Deployable in 20–200 m water depth」
- ラベル：この2行にはラベルが付いていません。
  - 直後の入力表（「NoviOcean scenario model — published inputs, August 2026」）には「management estimate」が多く付いていますが、水深の行に直接付いているわけではありません。
  - 同じページには「These are all of the inputs the model uses. Nothing else feeds it — there is no site data, no measured resource and no live feed behind these results.」と書かれています。

**推奨文言案：**
- 波高：「NoviOceanは通常運転を波高0.5〜5mで想定（同社の設計目標値）」
- 水深：「設置水深は20〜200mとしている（同社シミュレーターページの記載）」
- 水深を「management estimate」と書くのは避けてください。

### D-3 「No gearbox or generator underwater.」：一致

- ページ：https://noviocean.energy/technology/（modified 2026-09-23T17:06:05）
- 直前の見出し：「The mechanism / Buoyancy does the lifting.」
- 原文：「No gearbox or generator underwater. Medi Wave uses independent side floats to convert wave motion into hydraulic pressure, driving a turbine based on proven hydropower technology.」
- 直後の文：「Earlier Alta Wave single-float concept, illustrating the hydraulic operating principle. Medi Wave applies the same principle with multiple independent side floats.」
- ラベル：なし（同社の説明文）

### D-4 Stage 3「fourteen months」：一致。経過期間に関する但し書きも原文にある

- ページ：https://noviocean.energy/validation/（modified 2026-09-21T02:02:27）
- 段階表の原文：「Completed / Stage 3 / 1:5 NO2+ Hybrid — wave and solar / 2022–2025 TRL 6 / Offshore testing at Svanholmen — fourteen months of operation.」
- 本文の原文：「2022–2025 · TRL 6. A wave-and-solar hybrid prototype moored at Svanholmen in the Stockholm archipelago, with fourteen months of offshore operation through real Baltic weather.」
- 但し書きの原文（一字一句）：「Source: NoviOcean development record, as presented in the company's extended presentation (2026). Durations are elapsed test-programme time, not continuous running hours.」

**推奨文言案：**「同社によれば約14か月の洋上試験を実施（試験プログラムの経過期間であり、連続運転時間ではないと同社は注記）」

### D-5 12用途の内訳：一致

- ページ：https://noviocean.energy/further-applications/（modified 2026-09-21T02:01:01）
- 原文：「NoviOcean counts approximately twelve credible applications for the same hybrid platform. Four are given priority because their customers are ready to talk now, ... The eight below stay on the map: they are real routes to market, and any one of them can move forward with the right project partner and site.」
- ラベル：management estimate
- 優先4用途：Remote Islands & Coastal Communities／Coastal Data Centers／Desalination & Water Security／Aquaculture & Fish Farms
- 残り8用途の原文名称：
  1. Ports and harbors
  2. Offshore oil and gas facilities
  3. Offshore-wind co-location
  4. Remote coastal regions and resorts
  5. Hydrogen production
  6. Mines
  7. Larger grid-connected coastlines
  8. Coastal protection and multipurpose infrastructure
- 注意：原文は「approximately twelve」です。「約12」と書いてください。

---

### 公開日前チェック（NoviOcean）：変化なし

WP modified は前回取得時とまったく同じでした。

| ページ | modified |
|---|---|
| /validation/ | 2026-09-21T02:02:27 |
| /medi-wave-850h/ | 2026-09-23T17:05:01 |
| /remote-islands/ | 2026-09-23T17:06:58 |
| トップ（home-v2、id 91022） | 2026-09-21T01:58:04 |

- 段階表は現在も同じです：Stage 4「2026 TRL 6–7」Current、Stage 5「Full-Scale Pilot with a Utility Partner 2027–2028 TRL 7–8」Next、Stage 6「2029+ TRL 9」Planned。
- 「No full-scale unit is operating offshore today.」も現存しています（/validation/、ラベル projected）。原文：「A first customer pilot with a utility partner, planned for 2027–2028. No full-scale unit is operating offshore today.」
- 「850 kW」（300 wave / 350 wind / 200 solar、management estimate）、「~2,500 MWh per year」（modeled）も現存しています（/remote-islands/、/medi-wave-850h/、/simulator/）。

**記事で混同しないよう注意：** トップページにある「TRL 7 → 8 … approximately TRL 7 completed and progressing toward TRL 8 and certification.」は、提携先の **Wind Harvest VAWT（風車）** についての記述で、ラベルは partner-reported です。NoviOcean 自身の TRL（現在 6–7）と取り違えないでください。

---

### https://kohomadha.com/：表示される（HTTP 200）

- title：「海外進出・日本展開のワンストップサポート|株式会社コホマダ|マーケティング」
- 見出し：「グローバル展開を、"実行できる"戦略で支援」
- 原文：「株式会社コホマダは、海外進出・日本市場展開をトータルで支援するパートナーです。」
- 原文：「動画制作・SNS運用・PR戦略を組み合わせたマーケティングから、法人設立や販売導線構築、EC・小売チャネルの開拓まで、グローバルビジネスに必要なプロセスをワンストップで提供。」
- その他の掲載内容：TSUNAGU（AI SDR＋iPaaS の業務自動化）、テレビ東京『全力イノベーターズ』出演、著書『スリランカ起業記』、鳥取県海外よろずビジネスサポート駐在員
- 最終更新日：ページ内に表記がなく、取得できませんでした。

---

### 未解決（取得できなかったもの）

- 東京電力パワーグリッド：伊豆・小笠原の内燃力発電所の公式ページ（403）
- 沖縄電力の公式ページ（403）。沖縄県の資料が同社サイトを出典として転載しているもので代替しています。
- 九州電力送配電の離島資料
- 資源エネルギー庁・電力・ガス取引監視等委員会の離島供給資料（403／502）
- 全国の離島数と非連系の割合

これらは公開時点で社長のブラウザから直接確認することを推奨します。
