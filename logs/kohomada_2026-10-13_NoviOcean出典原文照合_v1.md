# NoviOcean記事 出典原文照合 v1（リサ補佐）

## NoviOcean note記事 出典の原文照合（W1〜W17）結果

**方法**：curlで生のHTML/PDF、WP REST API（pages/postsを全件取得：固定ページ・投稿あわせて142件）、e-Gov API v2から原文を取得しました。テキスト化したあと、grepで文字列を検索して照合しています。WebFetchは使っていません。
- 保存先：/tmp/claude-0/-home-user-kouki-ai-lab/0eee871f-920f-5845-89e7-8eec54443fa3/scratchpad/verify/（raw/ nov/ html/ third/）
- リポジトリのファイルは編集していません。
- 確認日：2026-10-13

### サマリー
| 判定 | 件数 | 項目 |
|---|---|---|
| 一致 | 8 | W3・W6・W7・W8・W11・W13・W14・W16 |
| 一部一致 | 8 | W2・W4・W5・W9・W10・W12・W15・W17 |
| 不一致 | 1 | W1（本文の主語が誤り） |
| 取得不能 | 0 | （e-Govの閲覧ページは中身がJavaScriptで後から表示されるため、本文は取得できません。条文はAPIで照合しました） |

**最優先で直すもの**
1. **W1**：「14,125の島のうち人が住む島は417」は誤りです。417は、本州など5島を除いた離島14,120島のうちの有人島の数です。
2. **W2**：離島振興法の主語は「国及び地方公共団体」、義務の強さは「適切な配慮をするものとする」です。
3. **W17**：施行令第1条の「海域における風力とする」は2019年の制定時からある規定です。令和7年政令第448号で新設されたものではないため、出典を差し替える必要があります。
4. **W8**：引用の掲載ページは養殖ページ（/fish-farms/）でした。

---

### W1 国交省「日本の島嶼の構成」｜不一致
**原文**
- 「○ 離島振興対策実施地域にある有人離島 （令和８年４月１日現在）」
- 「我が国は14,125の島嶼により構成され、本州、北海道、四国、九州、沖縄本島を除く14,120島が離島。」
- 「このうち、離島振興法による離島振興対策実施地域に含まれる有人離島は255島。」

**図の構成**
- 14,125（全島嶼）＝5（本州、北海道、四国、九州及び沖縄本島）＋14,120（離島）
- 14,120（離島）の内訳：417（有人島）／13,704（無人島）
- 417（有人島）の内訳：305（離島振興法の対象。うち255が離島振興法、50が他の法律）／112（法の対象外）

**注記**
- 「（注）令和２年国勢調査結果に基づく有人離島の数を都道県に聞き取り。内水面離島である沖島（滋賀県）を含む。」「（出典）国土地理院調べ」
- 表には「指定地域 77地域（255島）／関係自治体 26都道県、111市町村」とあります。

**差分**
- 417は、5島を除いた離島14,120島のうちの有人島の数です。本文の「14,125の島のうち人が住む島は417島」は誤りです。
- 417＋13,704＝14,121で、14,120と1島合いません。これは資料自体の数字です。注記にある沖島（内水面離島）の扱いが原因の可能性がありますが、未確認です。本文にはこの合計を書かないでください。
- 255・77地域・26都道県111市町村・基準日は一致しました。

**修正案**
「日本は14,125の島で構成され、本州・北海道・四国・九州・沖縄本島を除く14,120島が離島です。このうち人が住む離島（有人離島）は417島あります（国土交通省、令和8年4月1日現在）。離島振興法の離島振興対策実施地域に含まれる有人離島は255島で、77地域・26都道県111市町村にわたります。」

### W2 離島振興法 第17条の3｜一部一致
e-Gov APIで取得しました。現行版は2024-04-01施行の改正（令和5年法律第34号）を反映したものです。第17条の3の文言は、2023-04-01施行の令和4年法律第92号で現在の形になりました。2027-04-01施行予定の改正でも変わりません。

**原文**
- 見出し：（エネルギー対策の推進）
- 第1項：「国及び地方公共団体は、離島振興対策実施地域において、その自然的特性を生かしたエネルギーを利用することが、その経済的社会的環境に応じたエネルギーの安定的かつ適切な供給の確保及びエネルギーの供給に係る環境への負荷の低減を図る上で重要であることに鑑み、地域の実情に応じた再生可能エネルギーの効果的かつ効率的な活用の観点から行う再生可能エネルギーの供給体制の整備に必要な支援その他再生可能エネルギーの利用を推進するために必要な支援等の施策の充実について適切な配慮をするものとする。」
- 第2項：「前項に規定するもののほか、国及び地方公共団体は、離島振興対策実施地域におけるエネルギーの利用に関する条件の他の地域との格差の是正、島民の生活の利便性の向上、産業の振興等を図るため、離島振興対策実施地域における石油製品の価格の低廉化その他のエネルギーに関する対策の推進について適切な配慮をするものとする。」

**差分**
- 本文が「」で引いている2つの語句は、原文と一字一句一致しました。
- ただし本文は、主語（国及び地方公共団体）、義務の強さ（配慮義務）、対象地域（「離島」ではなく「離島振興対策実施地域」）を示していません。
- 201行目「国も離島の再エネ導入を支援する立場を法律で示しています」は言い過ぎです。主語は国だけではなく、義務も「適切な配慮」にとどまります。

**修正案**
- 本文：「離島振興法第17条の3は、国及び地方公共団体が、離島振興対策実施地域において『再生可能エネルギーの供給体制の整備に必要な支援』等の施策の充実や、『石油製品の価格の低廉化』等の対策の推進について『適切な配慮をするものとする』と定めています。」
- 201行目：「国や自治体が離島の再エネ活用に配慮することが、法律に定められています」

### W3 NEDO 100980752.pdf｜一致
**原文**
- 「NEDO水素・燃料電池成果報告会2024　発表No. P2-46」
- 「団体名：一般財団法人 電力中央研究所、株式会社ネクステムズ、沖縄電力株式会社」「発表日：2024年7月19日」
- 「■背景と目的　離島では、大規模系統に非接続、かつ電力需要が少ないことから、再エネ導入に伴う系統不安定化に早い段階で直面すると考えられる。」

**差分**：引用は一字一句一致しました（PDF上の改行のみ）。発表者・日付も一致しています。
**補足**：資料のテーマは宮古島の水素事業の実現可能性調査です。必要なら「（宮古島の水素活用に関する調査の背景説明）」と添えてもよいでしょう（任意）。

### W4 /validation/（WPの更新日 2026-09-21）｜一部一致
**原文**
- Stage 1：「Concept Validation / 2016–2019 / TRL 1–3 / Concept development and numerical validation.」
- Stage 2：「1:6 Scale Prototype / 2019–2021 / TRL 4–5 / Tank testing and power-take-off validation.」
- Stage 3：「1:5 NO2+ Hybrid — wave and solar / 2022–2025 / TRL 6 / Offshore testing at Svanholmen — fourteen months of operation.」
- Stage 4（Current）：「NO3 Triple Hybrid — wave, wind and solar / 2026 / TRL 6–7 / Testing hydrodynamic behaviour and simulation-model accuracy for the full-scale Medi Wave 850H design.」
- Stage 5（Next）：「Full-Scale Pilot with a Utility Partner / 2027–2028 / TRL 7–8 / First customer pilot — integrated offshore performance validation.」
- Stage 6（Planned）：「Hybrid Ocean Energy Farms / 2029+ / TRL 9 / Commercial arrays and large-scale deployment.」
- 表の下：「Stages 1 to 3 are complete and rest on measured results · stage 4 is running now · stages 5 and 6 are planned programme phases [projected]」
- その他の文言：
  - 「NO3 is not a commercial power station, and this page does not present it as one.」
  - 「A first customer pilot with a utility partner, planned for 2027–2028. No full-scale unit is operating offshore today. [projected]」
  - 「Recognition is not validation.」
  - NO3の検証対象外の一覧：「NO3 does not validate: The full power train / The Pelton system / The wind system / The solar system / Commercial energy production」

**C9（Medi Waveページの表記）**：「The NO3 triple-hybrid demonstrator has been deployed at sea and is undergoing testing and validation of our design and simulation models. The next major milestone is the full-scale Medi Wave pilot with a utility partner, advancing toward commercial deployment. [projected]」。projectedのラベルは、先の見通しを含む段落全体に付いています。Validation側では「stage 4 is running now」となっており、内容は矛盾しません。

**差分**
- 段階5の「電力会社などと組んだ」は、相手が決まっているように読めます。「など」も原文にありません。
- 段階1〜4は、本文の要約で問題ありません。

**修正案（段階5）**：「電力会社をパートナーとして行う計画の、実機サイズの初号パイロット（最初の顧客パイロット）」

**C2の補足**
- 2026-07-18の投稿（https://noviocean.energy/2026/07/18/noviocean-presents-the-medi-wave-850h-at-the-swedish-polish-chamber-of-commerce/）には「Phase 1 commercial pilot deployment is targeted for 2026–2027.」とあり、原文で確認できました。
- 同じ投稿の「Our NO3 prototype is currently deploying at our offshore test site near Stockholm」も確認済みです。

### W5 /technology/（更新日 2026-09-23）｜一部一致
**原文（仕組み）**
- 「Instead of a dam and a head of water, large floats ride the passing waves and lift against the sea.」
- 「Medi Wave uses independent side floats to convert wave motion into hydraulic pressure, driving a turbine based on proven hydropower technology.」
- 手順：「Independent side floats respond to passing waves.」→「Their movement drives hydraulic cylinders.」→「Pressurised water powers a Pelton turbine and generator.」
- 「No gearbox or generator underwater.」

**原文（データ）**
- 「Measured production profiles from Galway Bay, Ireland, over the first fifteen days of April. Wind alone rarely holds above a tenth of its rated capacity. Waves hold a third. Run together, the floor rises to between forty and fifty per cent」
- 「Galway Bay, Ireland, 1–15 April. Source: Seabased. Curves are redrawn for the web from the published production profiles; the baseload levels — 10%, 30% and 40–50% — are the reported values.」

**差分**
- 「側面の」は原文の「side floats」と一致します。
- 「上下に」は直訳ではありませんが、「ride the passing waves and lift」の意訳として許容範囲です。
- データは、Seabasedが公表した実測（measured）の発電プロファイルを、NoviOceanが描き直したものです。数値は報告値です。年は記載されていません。

**修正案（M3）**：「同社は、他社（Seabased社）が公表した、アイルランド・ゴールウェイ湾の4月1〜15日（約2週間）の発電実測データを引用し、風力単独では定格の1割程度を下回りがちな最低出力が、波と組み合わせると4〜5割に上がると説明しています。NoviOcean自身の実測ではなく、限られた期間・海域のデータです。」

### W6 トップページ｜一致
**原文**
- 「One platform, one mooring, one export cable, one permit, one installation instead of three separate projects.」
- 「2× / the energy of offshore wind / from the same sea area / modeled」
- 写真キャプション：「NO3 demonstrator · June 2026」（alt：「NoviOcean NO3 demonstrator on the water in June 2026, testing platform behaviour for the Medi Wave 850H design」）

**差分**：ありません。「試算（モデル計算）」の注記は適切です。

### W7 /medi-wave-850h/（更新日 2026-09-23）｜一致
**原文**
- 「Total rated power is 850 kW. [management estimate]」
- 「Rated capacity is the installed nameplate; annual production is modelled and site-dependent. Marine integration and final configuration still require engineering and validation. Source: NoviOcean design basis.」
- 「Wind — Wind Harvest VAWT」「Compact vertical-axis turbines standing on the platform itself, in modular units.」
- 「Solar — Midsummer CIGS」「Lightweight flexible CIGS panels across the deck」
- 「For illustration only — the actual design is shared in closer dialogues.」

**差分**
- ありません。
- 「約2,500MWh」はこのページにはなく、/remote-islands/ と /applications/ にあります（W9参照。R9の指摘どおり）。

### W8 「Sea state at the specific site is what decides feasibility.」｜一致（掲載ページを特定）
全142ページ・投稿の content.rendered を横断検索しました。該当したのは **https://noviocean.energy/fish-farms/**（Aquaculture & Fish Farms、更新日 2026-09-21）の1ページのみです。

**原文**
- Step one「Sea-state and site review」の本文：「Sea state at the specific site is what decides feasibility: a sheltered inshore location carries far less wave energy than an exposed one, and for some farms the honest answer is that the wave contribution would be small.」
- 同じページの別の箇所：「Sea state at the specific site decides feasibility. There is no general answer for aquaculture as a category — only an answer for a farm.」

**差分**：引用は実在します。ただし養殖ページの文脈で書かれた一文です。

**修正案**：「同社も養殖向けの説明で『その場所の海の状態が、実現できるかどうかを決める』としています」とし、出典一覧の Aquaculture（/fish-farms/）を根拠に追加します。

### W9 /remote-islands/（更新日 2026-09-23）｜一部一致
**原文**
- 「An island pays the commodity price of diesel and then pays again to move it — freight, handling, storage and losses.」
- 「~2,500 MWh / Electricity produced per unit, per year / Representative modelled production, not a forecast for any particular island. [modeled]」
- 導入の流れ：
  - 「Step 01 Assess the project — Assess local wave, wind and solar resources, electricity demand, site conditions and existing generation costs.」
  - 「Step 02 Deploy and verify — Deploy a first unit sized to the project and verify performance under local conditions.」
  - 「Step 03 Expand with demand」
- 「Ownership and financing are agreed project by project.」

**差分**
- 「①候補地の評価」は、Step 01の「プロジェクトの評価（資源・需要・現場条件・既存の発電コスト）」より狭い意味になっています。
- 本文の「所有の形などは」では、financingが省かれています。投資勧誘と読まれないための意図的な省略なら「など」で許容範囲です。

**修正案**：「①現地の波・風・日射、電力需要、現場条件、既存の発電コストの評価 → ②初号機の設置と現地条件での性能確認 → ③需要に応じた増設」

### W10 用途ページ｜一部一致
**原文**
- /data-centers/：「Load growth is arriving faster than onshore grid connections are being built.」（一致）
- /desalination/：
  - 「Freshwater is an energy product before it is anything else.」（一致）
  - 「Electricity or water, not both. The energy that makes fresh water is the same energy that would otherwise go to the grid. These two modes are alternatives — never add them together.」
- /fish-farms/：「Frequently off-grid or weak-grid, often diesel-dependent, and relevant across South America, Asia, Norway and other coastal markets.」
- /further-applications/：「Twelve applications. Four of them lead.」に続き、「The four priority applications: Remote Islands & Coastal Communities / Coastal Data Centers / Desalination & Water Security / Aquaculture & Fish Farms」
- /applications/：「Priority early applications」の筆頭が「Remote islands and coastal communities」

**差分**
- 淡水化の「両方を同時に最大にはできない」は、原文の「二者択一で、足し合わせない」と意味がずれています。
- 養殖の「アジアにも触れています」は、南米・ノルウェーが並記されている点を落としています。
- 「軽油」はdieselの訳語として限定的です。

**修正案**
- 淡水化：「同じエネルギーを電気として使うか造水に使うかは二者択一で、両方の数字を足し合わせることはできない、とも説明しています」
- 養殖：「…ディーゼル燃料に頼りがちだと説明し、南米・アジア・ノルウェーなどを対象地域に挙げています」
- 出典一覧に Further Applications（/further-applications/）と Applications（/applications/）を追加します（R7）。

### W11 水産庁 260630-4.pdf｜一致
**原文**
- 表紙：「経営環境の変化にも対応できる経営体の育成（海面養殖業、内水面漁業・養殖業、陸上養殖業、栽培漁業、経営安定対策）　令和８年7月　水産庁」
- p.5「1-1．養殖業の成長産業化 （2）沖合養殖の拡大」の「水産基本計画（要約）」：
  - 「漁場環境への負荷や赤潮被害の軽減が可能な沖合の漁場が活用できるよう、静穏水域を創出するなど沖合域を含む養殖適地を確保。」
  - 「台風等による波浪の影響を受けにくい浮沈式生簀等を普及させるとともに、生簀の大規模化による省力化や生産性の向上を推進。」

**資料の日付**
- 掲載ページ https://www.jfa.maff.go.jp/j/council/seisaku/kikaku/260630.html の見出しは「水産政策審議会 第119回企画部会(令和8年7月14日(火曜日))」で、この資料が配布資料として載っています。
- ファイル名・ページ名の「260630」と開催日は一致しませんが、資料表紙の「令和８年7月」と本文の記載は整合します。

**差分**
- 引用は一字一句一致しました。
- 引用は「沖合養殖の拡大」の項目にあり、直前の文が沖合に触れています。このため、M6の「沖合へ広がり」は資料の範囲で言い換えられます。

**修正案**：「水産庁の資料（令和8年7月、水産政策審議会企画部会の配布資料）は、水産基本計画の『沖合養殖の拡大』の項目で、『沖合域を含む養殖適地を確保』するとともに『台風等による波浪の影響を受けにくい浮沈式生簀等を普及させるとともに、生簀の大規模化による省力化や生産性の向上を推進』すると示しています。」

### W12 2024-02-07記事（投稿日 2024-02-07、更新日 2026-08-31）｜一部一致
**原文**
- 「Novige AB received a 2.1 million EUR grant from the European Climate, Infrastructure and Environment Executive Agency (CINEA) under the LIFE programme to design, build, deploy, test, and certify its first full-scale pilot WEC unit, NoviOcean NO500 in an offshore test site by 2025/26.」
- 「Published as Novige AB. The company is now NoviOcean AB.」

**投資関連の文言**
- このページの本文には「NOW OPEN FOR INVESTMENTS」はありません。
- ただし、ページ下部の「Related on this site」に次のカードがあります。
  - 「Investor Relations — The funding rail, the capital-efficient route, and how to request the package.」
  - 「Want the current plan, not the 2021 one? The programme status, the pilot schedule and the funding position are shared in conversation」
- ナビゲーションにも「Investor Relations」があります。これはサイト共通のヘッダーです。
- 「NOW OPEN FOR INVESTMENTS AND PARTNERSHIPS」は、別の投稿（https://noviocean.energy/2024/03/07/noviocean-now-open-for-investments-and-partnerships/）のタイトルでした。

**差分**
- 本文の「旧Novige AB、現NoviOcean AB」は意訳で、原文の文言とは違います。
- C3（「2025/26までに500kWの実機パイロット」）は原文で確認できました。

**修正案**：「同社は2024年の記事に『Novige ABとして公開。現在の社名はNoviOcean AB』と付記しています」

**リョウ・アオイ向けメモ**：記事から投資家向け情報へ1クリックで進める導線があります。リンクを残すか外すかは、法務の判断材料にしてください。

### W13 /about/・/team/・/company/・/partners/｜一致
**原文**
- /about/：
  - 「A systems integrator, not a single-technology developer.」
  - 「The company is registered in Täby, Stockholm, Sweden, and has been developing hybrid offshore energy since 2016.」
  - 「Jan G. Skjoldhammer — Founder, CEO and Inventor. Developing hybrid offshore energy since 2016.」
- /team/：「NoviOcean runs with a small core team covering engineering, policy, finance, business development and hands-on mechanics.」
- /company/：「NoviOcean AB is a systems integrator. It combines a proprietary wave-energy system with mature specialist generation technologies and established marine construction methods」
- /partners/：「Academic and knowledge partners — The universities, institutes and test facilities that have modelled, tank-tested and reviewed the machine.」の欄に、KTH Royal Institute of Technology・Uppsala University・Chalmers University of Technologyのロゴ（alt「… — a NoviOcean partner」）があります。

**差分**
- M1は「同社によると、2016年からハイブリッド型の洋上エネルギーの開発に取り組んでいる」とするのが原文に忠実です。
- 体制の説明では、finance・business developmentが抜けています。「など」で許容範囲です。

### W14 第三者の4件｜一致
- **LIFE DB**：「Acronym: LIFE NOVIOCEAN」「Coordinating Beneficiary: Novige AB」。期間は2021-07-01〜2025-06-30です。「受益者」は「調整受益者（Coordinating Beneficiary）」とするとより正確です。
- **Vinnova**：事業名「NoviOcean; technology optimization & validation with potential partners / investors / customers」。「Coordinator Novige AB」、2020年11月〜2022年11月、SEK 900 000。
- **Ellevio**：記事のURLは https://www.ellevio.se/en/about-us/sustainability/startup-4-climate/ へリダイレクトされます。URLの差し替えを推奨します。
  - 「we at Ellevio are arranging the Startup 4 Climate competition」「we and GodEl」
  - 「The winners of the 2023 competition were the start-ups Cemvision and Novige」
  - 主催にEllevioが含まれることも確認できました。
- **Mission Innovation**（2021年10月20日、Champions Cornerの記事）：
  - 「Jan Skjoldhammer is the founder and the creative mind behind the unique NoviOcean concept and CEO of Novige AB.」
  - 質問「How do you intend to leverage (have leveraged) being an MI Champion?」への回答に「Since being named an MI Champion…」とあります。
  - Championであることは、Champions Cornerの枠組みと本人の回答で示されています。

### W15 内閣府 04-15.pdf｜一部一致
**原文**
- 「３ー２ー⑤ 離島振興　５ 離島地域の電力供給　＜現状＞　有人離島への電力供給は、小型の火力発電及び海底ケーブルを使った送電によりほぼ100％に達しているものの、離島の規模の狭小性と遠隔性により、燃料費や修繕費が著しく高く、本島に比べて供給コストが高い。」
- 資料中のデータの時点：「※平成21年3月31日現在」（発電設備）、「＜系統規模と供給コスト（平成20年度）＞ ※沖縄電力(株)作成資料より引用」

**発行**
- PDF本体には発行主体の記載がありません。
- 掲載している内閣府のページ（/senmoniinkai/4/）は「第４回沖縄振興審議会総合部会専門委員会　○日時：平成２２年２月２２日」で、この資料は「資料４ …説明資料 その１５」です。

**差分**
- 引用は一字一句一致しました。
- 「2009年時点の内閣府の資料」は不正確です。資料は2010年2月の会議資料で、データは2009年3月末時点と2008年度のものです。

**修正案**
- 本文：「内閣府の沖縄振興審議会の専門委員会（2010年2月）で示された資料（2009年3月末時点等のデータ）では、…」
- 出典：「内閣府 第4回沖縄振興審議会総合部会専門委員会 資料4（その15）『離島振興 ５ 離島地域の電力供給』（平成22年2月22日）」

### W16 NEDO 800068054.pdf｜一致
**原文**
- 「NEDOエネルギー・地球環境分野成果報告会2026（分野名：シーズ発掘）　発表No.：i-31」
- 「未来型新エネ実証制度（海洋エネルギー分野）／防波堤に設置する波力発電装置の技術開発実証事業」
- 「団体名：東京電力リニューアブルパワー株式会社」「発表日：2026年7月21日」
- 「■課題と今後の取組 ➢ 2027年度に実証試験を行い、発電性能、耐久性、利用率等を検証」

**差分**：M7の修正案（「2027年度の実証試験に向けた技術開発が進められています」）が正確です。

### W17 再エネ海域利用法・施行令｜一部一致
**法律**（法令ID 430AC0000000089、平成30年法律第89号）
- 現行の題名は「海洋再生可能エネルギー発電設備の整備に関する法律」です。2026-04-01施行の令和7年法律第59号の改正によります。
- 2025-06-11版までの題名は「海洋再生可能エネルギー発電設備の整備に係る海域の利用の促進に関する法律」でした。
- e-Govの略称は「再エネ海域利用法」です。
- 第2条第3項：「『海洋再生可能エネルギー源』とは、…海域における風力その他の海域において電気のエネルギー源として利用することができるものとして政令で定めるものをいう。」
- 改正後は、促進区域に加えて、排他的経済水域での設置の許可・募集区域の制度も含んでいます（第1条・第2条第7項）。

**施行令**（法令ID 431CO0000000046、平成31年政令第46号。現行は2026-04-01施行、令和7年政令第448号による改正版）
- 第1条（海洋再生可能エネルギー源）：「海洋再生可能エネルギー発電設備の整備に関する法律（平成三十年法律第八十九号。以下「法」という。）第二条第三項の政令で定めるものは、海域における風力とする。」

**差分**
- 「海域における風力とする」は、2019-04-01の施行令制定時の版から同じ文言です。令和7年政令第448号は、題名の変更に伴う整備政令にすぎません。
- このため、出典を「施行令の改正（令和7年政令第448号）」とするのは不適切です。施行令の本文を出典にしてください。
- 本文の「国が海域を指定して発電事業者を選ぶ現行の促進区域制度」という書き方は、制度の一部（促進区域）にしか触れていません。

**修正案**：「海洋再生可能エネルギー発電設備の整備に関する法律（いわゆる再エネ海域利用法）は、対象とするエネルギー源を政令で定めるとしており、同法施行令第1条は『海域における風力とする』と定めています。波力を含む設備を日本の海域に設置する場合の制度上の扱いや、漁業との調整などは、今後確認していく事項です」

---

### 閲覧用のe-Gov URL
法令IDはAPIで実在を確認しました。閲覧ページはいずれもHTTP 200を返します（本文はJavaScriptで後から表示されます）。
- 離島振興法：https://laws.e-gov.go.jp/law/328AC1000000072
  - 第17条の3へのアンカー：https://laws.e-gov.go.jp/law/328AC1000000072#Mp-At_17_3 （ステータス200は確認済み。アンカーの位置へ移動するかはブラウザで確認が必要です）
- 再エネ海域利用法（現行の題名）：https://laws.e-gov.go.jp/law/430AC0000000089 （R2のAPI URL https://laws.e-gov.go.jp/api/1/lawdata/430AC0000000089 から差し替え）
- 同法施行令：https://laws.e-gov.go.jp/law/431CO0000000046 （R1の新日本法規URLから差し替え）
  - 版を固定する場合：https://laws.e-gov.go.jp/law/431CO0000000046/20260401_507CO0000000448 （ステータス200は確認済み）

### その他
- 下書き112行目の「14,125…417」（W1）は、公開すると事実誤認になります。必ず修正が必要です。
- 英語の引用（W4〜W10・W12・W13）はすべて、実ページの原文で存在を確認しました。訳文の確定には、上記の文言案を使ってください。
