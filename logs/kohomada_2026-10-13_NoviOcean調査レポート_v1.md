# NoviOcean 調査レポート v1（コホマダnote記事の土台）

- 作成：リサ（Research & Evidence Analyst）／確認日：2026-10-13
- 状態：Draft（調査レポート。記事本文ではない）
- 保存先（ジン側で保存予定）：/home/user/kouki-ai-lab/logs/kohomada_2026-10-13_NoviOcean調査レポート_v1.md
- 読んだ手順書：/home/user/kouki-ai-lab/logs/kohomada_2026-10-13_NoviOcean_note記事作成プロンプト_v3.md（2章・4章）、.claude/rules/evidence-policy.md、Skill fact-check-and-citations（SKILL.md・checklist.md）、market-research-protocol（SKILL.md・protocol.md）

> **調査方法についての注意（アオイ監査向け）**：noviocean.energy の各ページは WebFetch で取得した。このツールは取得したページを要約モデル経由で返すため、本レポートの英語「原文」は、そのモデルが抜き出した短い引用（各125字以内）になっている。HTMLを生のまま照合したわけではない。記事で原文を引用する箇所は、公開前にアオイが実際のページで一字一句を確認すること。WordPress REST API（/wp-json/wp/v2/pages, /posts, /search）でページ一覧と更新日は取得できた。

---

## 結論（要点サマリー）

1. **会社**：NoviOcean AB（スウェーデン・Täby）。社名・ブランド・製品群がすべて「NoviOcean」。2016年から開発を続けており、創業者兼CEOはJan G. Skjoldhammer氏。[確認済み事実：同社サイト]。登記集約サイト（allabolag.se）では org.nr 559083-1672、登録日2016-11-01、取締役会長はMats Andersson氏、従業員数「0」と表示される。[確認済み事実（二次・登記集約サイト）／Bolagsverketの原本は未確認]
2. **現行製品はMedi Wave 850H**。1つの浮体に波力300kW・風力350kW・太陽光200kWを載せ、定格合計850kW。**定格850kWは「management estimate（経営陣の推定）」**とされている。風力はWind Harvest製、太陽光はMidsummer製で、両社の数値は「partner-reported（提携先の申告）」。
3. **現在の段階**：2026年はNO3デモ機が海上で試験中（Stage 4、TRL 6–7）。実機サイズのパイロットは2027–2028年の「projected（予定）」、商用ファームは2029年以降の「planned」。同社自身が **"No full-scale unit is operating offshore today."（実機サイズの装置は現時点で海上稼働していない）** と明記している。NO3は発電系（Pelton・風力・太陽光）や商業発電の検証を目的としていない。
4. **Alta Wave 1000Hは将来の開発品**。波の強い海域向けの1MW設計で、"not a parallel near-term programme"（並行して進める短期計画ではない）とされている。2024年の報道や英サリー大学レビューに出てくる「1MW・設備利用率約40%・38×9m・140t」は、Alta Wave系の設計値。**Medi Wave 850Hの数値として使ってはならない**（サイト自体が "V2 publishes no Medi Wave capacity factor" と書いている）。
5. **主な数値はすべて試算・推定値**（1台あたり年間約2,500MWh、軽油100万L削減、CO2約2,500t削減、発電原価約7c€/kWh等）。サイト上に「modeled」「projected」「illustrative」「management estimate」のラベルが付いている。
6. **価格・導入費用・日本での実証予定**：Medi Wave 850Hの本体価格・CAPEXは**公開情報なし**。日本での実証・導入実績・代理店・提携の記載も**見つからなかった**（サイト内で「japan」を検索してヒットしたのは、出典の記載がない2023年の一般記事1件のみ）。コホマダとの独占契約は、同社サイト上では確認できない（[ユーザー提供情報]としてのみ扱う）。
7. **日本側の文脈（一次情報）**：島嶼は14,125、有人島は417、離島振興法の対象有人離島は255島（77地域）。いずれも令和8年4月1日現在、国土交通省の資料による。離島振興法 第17条の3は再エネの供給体制整備への支援を定めている。**重要：再エネ海域利用法（2026-04-01から題名は「海洋再生可能エネルギー発電設備の整備に関する法律」）は、施行令第1条で対象を「海域における風力」に限っている。波力は同法の促進区域制度の対象外と読める**。そのため、記事で「同法の枠組みで導入できる」とは書けない。[要弁護士確認]
8. **同社サイト内に矛盾が複数ある**：受賞数（6勝と5勝）、パイロットの時期（2026–2027と2027–2028）、アレイ規模（最大5MWと20–50MW超）、発電原価の位置づけ（初期商用で10–14c€／パイロット段階で7c€）、EU LIFE助成の500kWパイロット（2025/26予定）が実現していない、など。詳細は後述。

---

## 確認済み事実

### A. 会社概要

| 項目 | 内容 | ラベル | 出典 |
|---|---|---|---|
| 社名・所在地 | "NoviOcean AB" / "Lövängsvägen 91, 187 30 Täby, Sweden" | [確認済み事実] | S1, S13, S16 |
| 位置づけ | "NoviOcean AB is a systems integrator." "NoviOcean is now both the company name and the name of the brand and the product family." | [確認済み事実] | S15 |
| 自己紹介 | "A Swedish ocean-energy company building one floating offshore platform that harvests wave, wind and sun together."（波・風・太陽光を1つの浮体で同時に取り出す、スウェーデンの海洋エネルギー企業） | [確認済み事実] | S13 |
| 開発開始 | "developing hybrid offshore energy since 2016"（設立年は明記なし） | [確認済み事実] | S13 |
| 体制 | "A small core team across engineering, policy, finance and hands-on mechanics." Teamページにはコアメンバー10名、取締役・戦略顧問3名、専門協力者5名が掲載 | [確認済み事実] | S13, S14 |
| CEO | Jan G. Skjoldhammer（"Founder, CEO and Inventor"、元SAS機長） | [確認済み事実] | S14 |
| CTO | Stefan Björklund（"Ph.D. in mechanical engineering, 33 years teaching and researching at KTH Stockholm"） | [確認済み事実] | S14 |
| 登記（集約サイト） | NoviOcean AB、org.nr 559083-1672、登録日2016-11-01、Aktiv、SNI 35120／72109、会長 Mats Lennart Andersson、株式資本50 Tkr、従業員数0、2025年12月期の当期損益 −2,600 TSEK、自己資本 −6,920 TSEK | [確認済み事実（二次）] ※Bolagsverket原本は未確認。売上はページ内で「9」と「20259」が矛盾 | S30 |
| 旧社名 | 同社の2024-02-07付記事に「（旧Novige AB）現NoviOcean AB」とある。EU LIFE事業の受益者は「Novige AB, Västerås」 | [確認済み事実]／法人の同一性は[未確認] | S20, S22 |
| 別法人の存在 | 集約サイトに「Novige AB 559430-4452、Täby・同住所、Active、2023年」が別に掲載されている | [確認済み事実（二次）]／NoviOcean ABとの関係は[未確認] | S31 |

> 記事では「スウェーデンのNoviOcean AB」「2016年から開発」までにとどめるのが安全。従業員数・財務数値は記事に書かない（投資判断材料と誤読されるおそれ、かつ二次情報のため）。

### B. Medi Wave 850H（現行製品）

出典：S2（/medi-wave-850h/、WP更新 2026-09-23）、S3（/technology/、WP更新 2026-09-23）、S1（トップ）

| 項目 | 原文（抜粋） | ラベル（サイト表記） |
|---|---|---|
| コンセプト | "One floating platform combining wave, wind and solar power"（トップ） | — |
| 定格内訳 | Wave "300 kW management estimate" / Wind "350 kW partner-reported" / Solar "200 kW partner-reported" | 左記のとおり |
| 定格合計 | "Total rated power is 850 kW."（management estimate） | management estimate |
| 確立技術の比率 | "(350 kW + 200 kW) / 850 kW = 65% of rated capacity from established specialist technologies."（定格の65%は実績のある専門メーカーの技術） | management estimate |
| 年間発電量の構成 | "Wind + solar ≈ 55%" "Wave ≈ 45%"／"Rated capacity is the installed nameplate; annual production is modelled and site-dependent."（年間発電量は試算値で、設置場所により変わる） | modeled |
| TRL（技術成熟度） | 太陽光 "approximately TRL 9"、風力 "approximately TRL 7 completed and progressing toward TRL 8 and certification"、波力 "Presently TRL 6 and progressing toward TRL 7"。"Technology-readiness levels on this page are screening self-assessments made by NoviOcean and its partners." "They are not independent certifications."（TRLは自社・提携先による自己評価で、独立した認証ではない） | 自己評価 |
| 太陽光デッキ | "Approximately 1,000–1,300 m² of flexible CIGS panels, project-dependent" | management estimate |
| 風車 | "Five to seven modular 50–75 kW vertical-axis turbines, project-dependent" | partner-reported |
| フロート | "The full commercial configuration carries fourteen side floats"（2026年のデモ機は縮小構成） | management estimate |
| 寿命 | "50-year financial lifetime"／PTO（発電機構）は50年設計基準 | management estimate |
| 運転波高 | "Designed for normal operation in 0.5–5 m waves" | NoviOcean design target |
| 耐候 | "survivability engineered for extreme seas with waves up to 30 m and wind speeds up to 80 m/s." | NoviOcean design target |
| 大型化計画 | "planned larger 3 MW and 5 MW units, with 10 MW a possible longer-term development." | development plan |
| 未公表事項 | "Platform mass, structure geometry and capacity factor are being confirmed"（質量・形状・設備利用率は確認中で未公表） | — |
| 未検証事項 | "Marine integration and final configuration still require engineering and validation."（海上での統合と最終構成は、今後の設計・検証が必要） | — |
| 独自性の主張 | "NoviOcean is the only ocean energy company using the highly effective, proven, long-lasting Pelton turbine." | management estimate ※「唯一」は自社主張。記事では使わない |
| 画像の但し書き | "For illustration only — the actual design is shared in closer dialogues." / "Platform illustrations are conceptual"（実際の設計は個別の協議で開示） | — |

### C. How It Works／Key Advantages／Technology Ecosystem（/technology/ 内の各セクション）

- 仕組み：フロートが波で動き、油圧シリンダーを駆動して、Pelton水車と発電機を回す。"The shared hydraulic principle has been tested in earlier NoviOcean prototypes." "This is distinct from certification of the complete Medi Wave system."（原理は過去の試作機で試験済みだが、Medi Waveシステム全体の認証とは別物）[確認済み事実] S3
- 図のキャプション："The float and hydraulic unit show NoviOcean's earlier Alta Wave test hardware."（写っているのは旧Alta Waveの試験機材）。Pelton水車の図は同型の代表例で、同社製の部品ではない。[確認済み事実] S3
- 出力の平準化："Wind alone rarely holds above a tenth of its rated capacity. Waves hold a third." "Run together, the floor rises to between forty and fifty per cent."（風力単独では定格の1割を超える状態が続きにくく、波力は3分の1。組み合わせると最低出力が40〜50%に上がる）。**このデータの出典は Seabased 社のゴールウェイ湾データ（4月1〜15日）で、"reported values"（報告値）**。NoviOcean自身の実測ではない。[確認済み事実] S3
- 同一海域でのエネルギー量：トップページに "2×" "the energy of offshore wind from the same sea area modeled"（同じ海域の洋上風力の約2倍。**試算**）。Technologyページには、共設置（co-location）の文献値として水平軸 "+10–20%"、垂直軸 "+15–30%"、出力密度 "Up to 3×" があり、"Published co-location findings are indicative and study- and site-dependent, not guaranteed performance gains."（文献値は目安で、研究・場所に依存し、性能向上を保証するものではない）と付記されている。設計目標は "approximately 15 MW of installed wave, wind and solar capacity per square kilometre" "with a projected capacity factor comparable to offshore wind"（NoviOcean design target）。[確認済み事実] S1, S3
  - 記事で「2倍」と書く場合は「同社試算（modeled）」と明記すること。「3倍」は他研究の文献値なので、同社の性能として書かない。
- インフラの共有："One platform, one mooring, one export cable, one permit, one installation instead of three separate projects."（3つの別プロジェクトの代わりに、浮体・係留・送電ケーブル・許認可・設置がそれぞれ1つで済む）[確認済み事実・同社主張] S1
- 10MW負荷の比較表：本文に "modeled" とあり、"Qualitative system ratings from NoviOcean's own system modelling — relative, not absolute."（同社モデルによる相対的・定性的な評価）[確認済み事実] S3, S6

### D. Alta Wave 1000H（将来開発）

出典 S4（/alta-wave-1000h/、ページ題 "Alta Wave 1000H - Future Development"、WP更新 2026-09-23）

- "Alta Wave is a future specialized solution for very high-energy wave regions."（波エネルギーが非常に大きい海域向けの、将来の専用ソリューション）／"Alta Wave is not a parallel commercialization programme and does not draw on the resources committed to Medi Wave 850H."（Medi Wave 850Hと並行した商用化計画ではなく、その資源も使わない）
- 設計値：波650kW／風300kW／太陽光50kW、"1,000 kW"（management estimate）、設備利用率 "Approximately 40%"（modeled）、"38 × 9 × 4 metres"、"140 tonnes"（management estimate）。"Rated values are design figures for a future unit, not measured output."（将来機の設計値であり、実測値ではない）
- "Five competition wins, awarded to 'the hybrid 1 MW wave, wind and solar power plant at sea'"（externally validated）
- 時期：日付の入ったスケジュールはない（"follows later, when a very high-energy site calls for it"）

### E. 用途（Applications）

出典 S5〜S10。共通の前提：1台＝850kW、年間約2,500MWh（modeled）、軽油削減 "400 litres per MWh"（modeled）、CO2 "~1 tonne CO₂e per MWh"（modeled）。いずれのページにもJapanの記載はない。

**E-1. Remote Islands & Coastal Communities（S5、更新 2026-09-23）**
- 課題："Island electricity is imported, expensive and exposed to weather no one controls."／"An island pays the commodity price of diesel and then pays again to move it."（島は軽油の代金を払い、さらに輸送費も払う）
- シミュレーターの既定値：需要 "12 GWh/yr illustrative default"、電気料金 "300 €/MWh illustrative default"。"Demand and price above are illustrative defaults, not your site's figures."
- 1台あたりの年間効果（すべてmodeled）："1,000,000 litres"（軽油）、"~2,500 tonnes"（CO2e）、"~2,500 MWh"："Representative modelled production, not a forecast for any particular island."（代表的な試算値で、特定の島の予測ではない）
- 発電原価："~70 €/MWh (~7 c€/kWh)"。"illustrative scaled-production assumption"（量産時を想定した例示的な前提）、"Not a first full-scale pilot cost"（初号パイロットの原価ではない）
- 発電原価の段階別目安（illustrative estimates）：初期商用展開 "10–14 c€/kWh"、累計約50台 "5–7 c€/kWh"、累計約200台 "4–6 c€/kWh"。"Generation cost is not the electricity sales price."（発電原価は電力の販売価格ではない）
- 販売の考え方："offer electricity at approximately 75% of the relevant displaced energy cost"（置き換える電源コストの約75%で電力を提供することを目指す）
- 導入の流れ（例）：01 評価 → 02 初号機の設置・検証 → 03 需要に応じて増設。"Ownership and financing are agreed project by project."（所有形態と資金調達は案件ごとに決める）

**E-2. Coastal Data Centers（S6）**
- "Load growth is arriving faster than onshore grid connections are being built."（需要の伸びに陸上の系統接続整備が追いついていない）／"NoviOcean publishes no figure for global or regional data-center electricity demand."（データセンター需要の数値は公表していない）
- "The design is intended to scale from single units to offshore arrays of up to 5 MW."（management estimate）※Medi Waveページの「20–50 MW and beyond」と食い違う（矛盾一覧を参照）
- 既定値：12台、44 GWh/yr、160 €/MWh（illustrative）

**E-3. Desalination & Water Security（S7）**
- "Freshwater is an energy product before it is anything else."（真水は何よりもまずエネルギーの産物である）
- 造水量："70,000–100,000 litres per hour per unit"（modeled）。"Electricity or water, not both."（電力と造水は配分の問題で、両方を同時に最大にはできない）。"The split between the two uses is a project decision, not an additive total"
- 発電原価の出典表記："Conservative end of the Stage A range, 4–8 c€/kWh, deck slide 26 projected"

**E-4. Aquaculture & Fish Farms（S8）**
- "Frequently off-grid or weak-grid, often diesel-dependent, and relevant across South America, Asia, Norway and other coastal markets."（系統がない・弱いことが多く、軽油に依存しがち。南米・アジア・ノルウェーなどに関係する）← アジアへの言及あり。日本個別の記載はない
- 比較表："Offshore fish farms diesel-based — total cost of energy 15–30 ¢/kWh" と "NoviOcean, stage A unit-level generation cost 4–8 c€/kWh" を並べたうえで、"The three bars therefore indicate scale, not a like-for-like comparison"（規模感を示すもので、同一条件の比較ではない）、"quoted in cents per kWh without a stated currency"（通貨単位の記載なし）
- "Nothing below is a committed project."（以下に確定案件はない）／"We will tell you honestly whether a NoviOcean unit fits it — including when the answer is that it does not."

**E-5. Further Applications（S9）**
- "NoviOcean counts approximately twelve credible applications"（management estimate）。優先4用途は "because their customers are ready to talk now"（顧客側がすでに話を進められる状態にあるため）
- その他8用途：港湾、洋上石油・ガス、洋上風力との共設置、遠隔沿岸地域・リゾート、水素製造、鉱山、系統連系された長い海岸線、海岸防護・多目的インフラ

**E-6. Simulator（S11）**
- "Nothing here is tuned to a particular place"（特定の場所に合わせた調整はしていない）。地点入力なし。既定4台＝3.4MW
- 前提：発電原価 "7 c€/kWh (€70/MWh)" は **"Stage A, commercial pilot. Unit-level generation cost"（projected）**。系統接続・送電ケーブル・現地許認可は含まない
- 設置水深 "20–200 m"（management estimate）
- 免責："This tool is a scenario model for discussion." "it does not establish hourly supply or remove backup requirements."（時間単位の供給やバックアップ電源の不要化を示すものではない）
- **CAPEX・本体価格の記載はない**

### F. Validation（S10、/validation/、更新 2026-09-21）

| Stage | 時期 | TRL | 内容 | ラベル |
|---|---|---|---|---|
| 1 Concept Validation | 2016–2019 | 1–3 | "Concept development and numerical validation." | measured |
| 2 1:6 Scale Prototype | 2019–2021 | 4–5 | "Tank testing and power-take-off validation." | measured |
| 3 1:5 NO2+ Hybrid（波＋太陽光） | 2022–2025 | 6 | Svanholmen（ストックホルム群島）で "fourteen months of operation" | measured |
| 4 NO3 Triple Hybrid | 2026 | 6–7 | "Testing hydrodynamic behaviour and simulation-model accuracy for the full-scale Medi Wave 850H design." | current |
| 5 Full-Scale Pilot with a Utility Partner | 2027–2028 | 7–8 | "First customer pilot" | projected |
| 6 Hybrid Ocean Energy Farms | 2029+ | 9 | 商用アレイ | planned/projected |

- NO3が検証しないもの：全体の発電系、Pelton系、風力系、太陽光系、商業発電。"NO3 is not a commercial power station, and this page does not present it as one." "No full-scale unit is operating offshore today."
- 試験の実績：1:6模型の水槽試験6週間、陸上リグ24か月、1:5海上試験14か月（"durations are elapsed test-programme time, not continuous running hours"：経過期間であり、連続運転時間ではない）。独立モデリングは "externally validated" とされるが、大学名・解析機関名は書かれていない
- 特許：3ファミリー・20か国（management estimate）
- "Recognition is not validation."（受賞は技術の検証ではない）
- 支援元のロゴ：Swedish Energy Agency、Vinnova、EU LIFE Programme。Shenzhen IEIC と MIR Green Energy にも言及あり
- NO3の写真キャプション："NO3 demonstrator · June 2026"（トップ S1）

### G. Partners（S12）

- 技術パートナー：**Wind Harvest**（垂直軸風車、https://www.windharvest.com）、**Midsummer**（"Midsummer is a Swedish manufacturer of thin-film CIGS solar cells."、https://www.midsummer.se）
- 資金・インキュベーター：EU LIFE Programme、Energimyndigheten、Almi、Vinnova、Swedish Scaleups、Create、Åforsk、SynerLeap、Region Västmanland
- 学術・試験機関：WavEC Offshore Renewables、KTH、Uppsala University、SSPA、MARIN、DMEC、Linnaeus University、Chalmers、ECN（École Centrale de Nantes）
- 産業：Clean Projects、Ocean Energy Europe、Hausch、Seaflex、Trelleborg
- 各社との関係は**グループ単位の説明だけ**で、契約の種別は記載されていない。日本・コホマダ・販売代理店の記載もない
- **提携先側の公式発表**：Wind Harvest・Midsummer とも、NoviOceanとの提携を発表した資料は見つからなかった（Midsummerの開示資料フィード〔MFN〕も検索したが該当なし）。→ [未確認]。記事では「NoviOceanによると、風力はWind Harvest、太陽光はMidsummerの技術を採用」と、同社の説明として書く

### H. Awards & Support（S17）と第三者による裏付け

| 項目 | 同社サイトの記載 | 第三者・一次情報 | ラベル |
|---|---|---|---|
| Startup 4 Climate 2023 | 優勝。ニュース見出しでは "Secures 1M SEK Prize" | Ellevio公式（主催：Ellevio＋GodEl）：2023年の勝者はCemvisionとNovige。"awarded a prize of SEK 2 million"（2社分の合計か1社分かは明記なし） | [確認済み事実]（受賞）／賞金額は記載が食い違うため並記 |
| Stena Line Propeller Prize 2021 | "the first outside recognition of the hybrid ocean-energy concept" | Stena Line公式の発表は未取得。業界誌（Offshore Energy）に "Novige wins Stena Line Propeller Prize" の見出しあり（年は検索結果上で未確定） | [確認済み事実（同社）]／第三者一次は[未確認] |
| Mission Innovation Champion | Sweden、2020年、Jan Skjoldhammer氏個人が受賞 | Mission Innovation公式記事（2021-10-20）で "Since being named an MI Champion" とChampionであることは確認。受賞年はそのページに記載なし | [確認済み事実]（年は同社記載のみ） |
| Shenzhen IEIC 2024 | "won its 2024 Swedish Division" | 深圳市政府英語サイト（Shenzhen Daily、2024-12-02）で、第8回大会の決勝にNoviOceanのSkjoldhammer氏が参加したことは確認。順位・受賞は未確認 | 参加は[確認済み事実]／Swedish Division優勝は[未確認（第三者）] |
| Guldstänk Innovator of the Year | 年・主催者の記載なし | 未調査 | [未確認] |
| EU Seal of Excellence | "A mark of quality, not a competition result, and NoviOcean does not count it among the five wins." | 未確認 | [未確認（第三者）] |
| 公的資金 | "about €2.9M, 2016–2025"（measured）。EU CINEA-LIFE、Swedish Energy Agency、Vinnova ほか | 下記の個別事業を確認 | — |
| EU LIFE | 2024-02-07の記事：CINEAから2.1M EUR、"NoviOcean NO500" "rated at 500 kW" を "by 2025/26" に洋上試験サイトで | **EU LIFE公式DB**：LIFE20 CCM/SE/001589「LIFE NOVIOCEAN」、受益者 Novige AB（Västerås）、期間 2021-07-01〜2025-06-30、総予算 €3,898,852、EU拠出 €2,144,368、場所 Sweden/France、期待成果に「パイロット機による年750MWh」 | [確認済み事実] |
| Vinnova | — | **Vinnova公式**：「NoviOcean technology optimization & validation…」Novige AB、SEK 900,000、2020-11〜2022-11、Completed／「Waverider – a 10MW wave energy concept」（2018、SEK 300,000、検索結果による） | 前者は[確認済み事実]、後者は検索結果のみ |
| Swedish Energy Agency | ロゴ掲載 | 2021年の業界報道（Ocean Energy Europe等）で予算5.6 MSEKの承認と報じられている。Energimyndighetenの公式DBは未取得 | [未確認（一次）] |
| 市場の関心 | 6グループ（電力会社、島しょ地域、港湾、洋上風力、研究機関、政府）。"interest is not a commitment"（関心は契約・確約ではない） | — | management estimate |

**受賞数**：トップは "Six Global Innovation Competitions Wins"、Awards・Validationページは "Five competition wins from five entries, plus one EU award"、Alta Waveページは "Five competition wins"。→ 記事では「同社によると5つのコンペで受賞、加えて欧州委員会のSeal of Excellence」とするか、個別に名前を挙げるのが安全。

### I. Insights & News（S18、WP投稿一覧 S19）

- 最新の投稿：2026-07-18「NoviOcean presents the Medi Wave 850H at the Swedish-Polish Chamber of Commerce」。本文に "Phase 1 commercial pilot: 2026–2027"、後継機は3MW・5MW
- アジア関連：2025-11 Singapore International Energy Week（BAPSEA代表団）、2025-10 Vibrant Gujarat（インドでのパイロット可能性について4件の面談）、2025-10 ドバイ・インド、2024-12 深圳IEIC。**日本の記載なし**
- 報道：Fox News（2024-10）、New Atlas（2024-10-08）、InvestorNytt（2025-04）など
- 「Wave energy potential in Japan」（URLは2023/12/27）：海岸線29,751km、波エネルギー密度22.5kW/m、年5,900TWh等の記載があるが、**出典は一切示されていない** → 記事で使わない

### J. Contact（S16）／Investor Relations（S21）

- 連絡先：jan.skjoldhammer@／variya.kietprungvej@（Business Development Director）／fika.triandini@（Investment and Finance Manager）、+46 (0)73 394 84 17。地域窓口・代理店の掲載なし
- Investor Relations：次フェーズ（2026–2028）の資金需要 "€8.2M"（projected）、MIR Green Energyとコスタリカでのパイロット開発に関するMOU（management estimate、"early-stage"）、フィリピンでのMOUは "under evaluation"、アフリカでは名称非公開の戦略パートナーと協議中。**日本の記載なし。CAPEX・本体価格の記載もない**。段階別の顧客コスト "4–8 c€/kWh"、本格商用時 "2–5 c€/kWh"
- → 記事は投資勧誘と誤読されないよう、IRページへのリンクやこれらの数値を載せないのが望ましい（判断はリョウ）

### K. 第三者報道・学術

- **New Atlas（2024-10-08、Loz Blain）**：当時の1MW設計（波650kW・太陽光50kW・垂直軸風車6基、38×9m・約140t）。同社の見通しとして、設備利用率40–70%、1台約3.5GWh/年、初号機€3.6M・100台目で約€2M、LCoE初期約US$275/MWh、パイロットは2026–27年、商用は2031–32年。数値はほぼ同社の説明による。[確認済み事実（報道）]。**現行のMedi Wave 850Hの数値ではない**
- **英サリー大学レビュー**（TechXplore 2026-02-18で紹介。論文 "Hybrid offshore renewable energy harvest system: a review"、Energy Conversion and Management、DOI 10.1016/j.enconman.2025.120654）：NoviOceanの設備利用率を "around 40%" と紹介。→ Alta Wave系の設計値（modeled）を引いたものとみられる [推測]。論文本文は未取得
- Offshore Energy誌の記事（クラウドファンディング、1:1機の2027年試験、2032年商用化など）：記事本文が取得できず、日付も未確認 → 使わない

### L. 日本市場の文脈（官公庁等の一次情報）

| 事実 | 原文 | ラベル | 出典 |
|---|---|---|---|
| 島の数 | 「我が国は14,125の島嶼により構成され、本州、北海道、四国、九州、沖縄本島を除く14,120島が離島。」有人島417（注：令和2年国勢調査結果に基づき都道県に聞き取り）、無人島13,704 | [確認済み事実]（令和8年4月1日現在） | J1 |
| 離島振興法の対象 | 「離島振興法による離島振興対策実施地域に含まれる有人離島は255島。」指定地域「77地域（255島）」、関係自治体「26都道県、111市町村」、人口「34万人（全国の0.27%）」 | [確認済み事実] | J1 |
| 他法の対象 | 沖縄38、奄美8、小笠原4（法の対象は計305） | [確認済み事実] | J1 |
| 離島振興法とエネルギー | 第17条の3（エネルギー対策の推進）第1項「再生可能エネルギーの供給体制の整備に必要な支援」、第2項「石油製品の価格の低廉化」。第1条（目的）に「多様な再生可能エネルギーの導入及び活用」。最終改正は令和4年法律第92号（令和5年4月1日施行）まで確認（それ以降の改正の有無は未確認） | [法令上の根拠] | J2 |
| 離島の電力事情（沖縄・旧資料） | 「離島への電力供給は、小型の火力発電及び海底ケーブルを使った送電によりほぼ100%に達しているものの、離島の規模の狭小性と遠隔性により、燃料費や修繕費が著しく高く、本島に比べて供給コストが高い。」 | [確認済み事実]　**ただし平成21年時点の資料（内閣府沖縄部会）**。記事で使うなら「内閣府資料（2009年時点）」と明記 | J3 |
| 離島の系統課題（最新） | 「離島では、大規模系統に非接続、かつ電力需要が少ないことから、再エネ導入に伴う系統不安定化に早い段階で直面すると考えられる。」 | [確認済み事実]（NEDO成果報告会2024、2024-07-19、電力中央研究所・ネクステムズ・沖縄電力） | J4 |
| オフグリッド離島のディーゼル依存 | 環境省資料（検索結果の抜粋）：「本土と系統連系されていない（オフグリッド）離島は、ＣＯ２排出量が大きく、高コストのディーゼル発電等の化石燃料由来のエネルギーに依存しており」 | **[未確認]**：env.go.jp がWebFetchに403を返し、本文を直接確認できなかった。アオイまたは社長が原典を確認すれば、最も使いやすい一次資料になる | J5 |
| 離島ユニバーサルサービス | 電力・ガス取引監視等委員会の資料（検索結果）：離島は主要系統に接続されておらず、燃料がA重油に限られる等の理由で発電コストが構造的に高い。そのため一般送配電事業者が離島にも他地域と同水準の料金で供給する制度がある | **[未確認]**（egc.meti.go.jp も403、emsc は名前解決エラー。検索結果の抜粋のみ） | J6 |
| 再エネ海域利用法の対象 | 施行令第1条（令和7年政令第448号で改正、令和8年4月1日施行）：「海洋再生可能エネルギー発電設備の整備に関する法律（平成三十年法律第八十九号。以下「法」という。）第二条第三項の政令で定めるものは、海域における風力とする。」 | [法令上の根拠]（新日本法規の掲載による。e-Gov API の題名表示も新題名と一致）。**波力は同法の促進区域制度の対象外と読める → [要弁護士確認]** | J7, J8 |
| 同法のEEZ拡大 | 2025年改正でEEZへ対象を拡大（2025-04-11成立と報道） | 報道ベース・[要追加調査]（官報・e-Govで確認） | J9 |
| 日本の波力実証（最新） | NEDO「未来型新エネ実証制度（海洋エネルギー分野）／防波堤に設置する波力発電装置の技術開発実証事業」：東京電力リニューアブルパワー、「最大平均発電出力 65kW（有義波高2.5mにおける平均発電出力）」、「2027年度に実証試験を行い、発電性能、耐久性、利用率等を検証」、「量産時に発電コストを洋上風力と同等程度にすることを目標」 | [確認済み事実]（発表日 2026-07-21） | J10 |
| 日本の過去の波力事例 | 久慈（岩手、2016年設置・系統接続）、平塚（2020年2月運用開始、定格45kW） | 検索結果・二次情報のみ → [未確認（一次）] | — |
| 沖合養殖の政策 | 水産庁（令和8年7月）：水産基本計画（要約）「台風等による波浪の影響を受けにくい浮沈式生簀等を普及させるとともに、生簀の大規模化による省力化や生産性の向上を推進。」串間市の大規模沖合養殖の実証で燃油費削減率は計画25%に対し実績29〜35%（表6）。検討の方向性に「イニシャル・ランニングコストを低減させるために養殖業者の協業化の推進が必要ではないか。」 | [確認済み事実]。**沖合養殖の「電力」需要を直接扱った官公庁資料は見つからなかった** | J11 |
| 海水淡水化 | 離島の淡水化装置が島のピーク負荷の1割以上を占めるという東京大学の研究概要などは検索結果のみ | [未確認（一次）]。記事では数値を使わない | — |
| 波力のFIT/FIP上の扱い | 調査したが確認できず | [未確認] | — |

---

## 推測・仮説

- [推測] 2024年までの報道・学術レビュー（1MW、設備利用率40%、38×9m、初号機€3.6M）は、現在「Alta Wave 1000H（将来開発）」と位置づけられている設計を指している。現行サイトのAlta Wave設計値と一致するため。同社が主力をMedi Wave 850H（中小の波向け）に切り替えたとみられる。
- [推測] EU LIFE事業（NO500・500kW、2025/26予定、事業期間は2025-06-30まで）で予定されていた実機サイズのパイロットは、現時点では実現していない（現サイトに "No full-scale unit is operating offshore today" とあるため）。理由は一次情報で確認できていない。
- [推測] 一部の画像は生成AIによる画像の可能性がある。ファイル名に "replicate-prediction-…"（受賞ロゴ、NO1試作機関連）や "DreamShaper_v7…"（「水槽試験中のAlta Wave油圧ユニット」「Pelton水車」）が含まれ、これらは画像生成サービス・モデルの名前と一致する。実写として扱わず、使うなら同社に確認する。
- [推測] Medi Waveの対象（運転波高0.5–5m、水深20–200m）から見て、日本沿岸の多くの海域は物理的な前提条件の範囲に入りうる。ただし個別の波浪データで評価しない限り何も言えない（同社も "Sea state at the specific site is what decides feasibility." としている）。
- [仮説] 読者の優先順位：同社の段階（実機サイズのパイロットは2027–28年予定、商用は2029年以降）を考えると、読者に期待する行動は「購入・発注の検討」ではなく、「将来の候補地評価・情報交換・共同検討の相談」が現実的。第1読者（離島の自治体・地域新電力）は、同社が最初に挙げる用途と国の離島政策（離島振興法第17条の3）の両方に合うので、優先順位は妥当と考える。ただし再エネ海域利用法の対象外である点から、許認可の道筋は不透明。

---

## 分析（記事設計への示唆）

1. **書いてよい核（帰属付き）**：「波・風・太陽光を1つの浮体に統合」「係留・送電ケーブル・許認可・設置を1つにまとめる発想」「出力の平準化（同社による。データは他社の報告値）」「同海域で洋上風力の約2倍（同社試算）」「NO3デモ機が2026年に海上試験中」「実機サイズのパイロットは2027–28年予定」
2. **書いてはいけない／注意すること**：設備利用率40%、1MW、価格（€3.6M等）を現行製品の数値として書く／「唯一のPelton採用」「世界初」／TRLを認証であるかのように書く／受賞数「6冠」の断定／日本で導入できる・法制度の対象になると示唆すること。
3. **用途別の日本の課題データ**：離島は国交省のデータ（J1）と離島振興法（J2）で裏付けが強い。ディーゼル依存の表現は、NEDO（J4）と内閣府の旧資料（J3）で一応裏付けられる。環境省資料（J5）の原文確認が取れれば、さらに強くなる。養殖は「沖合化・大規模化は国の方針」（J11）まで。データセンターと淡水化は日本側の一次データを確保できていないため、定性的な記述にとどめる。
4. **コホマダの位置づけ**：同社サイトに日本・代理店の記載がないため、独占契約は[ユーザー提供情報]としてのみ書ける。読者から「NoviOcean側の公式な裏付けは？」と見られるリスクがある → 社長経由でNoviOcean側の掲載（Partners等）や共同での告知が可能か、確認する価値がある。

---

## リスク・注意点

- **限定表現の欠落**：記事に出てくる数値のほぼすべてに modeled／projected／management estimate／illustrative が付いている。和訳の際は「同社試算」「同社見込み」「同社推定」を必ず残す。
- **現行品と将来品の混同**：第三者記事の多くは旧1MW設計（Alta Wave系）を扱っている。
- **投資勧誘と誤読されるリスク**：同社サイトにはInvestor Relations（€8.2Mの資金需要）がある。2024年の記事見出しは "NOW OPEN FOR INVESTMENTS"、報道ではクラウドファンディングにも触れている。→ 記事からリンクしない、触れないことを推奨（最終判断はリョウ）。
- **法制度**：波力は再エネ海域利用法の対象外と読める（施行令第1条）。一般海域を占用する根拠（都道府県の条例など）、漁業との調整、電気事業法上の扱いは未調査 → [要弁護士確認]・[要追加調査]。
- **画像・ロゴ**：受賞ロゴ・支援機関ロゴは第三者の商標。社長はNoviOceanのロゴ・画像の使用許可を得ているが、第三者ロゴの使用可否は別問題 → リョウが確認。
- **法人の同一性**：LIFE事業の受益者は「Novige AB（Västerås）」。現在はNoviOcean AB（Täby、559083-1672）で、同じ住所に別法人「Novige AB（559430-4452）」がある。記事で過去の助成を「NoviOceanが受けた」と書く場合は「同社（旧Novige AB）」とするのが安全。法人の同一性はBolagsverketで確認していない。
- **サイト更新頻度**：主要ページは2026-08-31作成・09-21〜23更新と新しい。記事の公開直前に数値が変わっていないか、再確認が必要。

---

## 推奨案

1. [推奨対応] 記事の数値は「1台あたり定格850kW（同社推定）」「年間約2,500MWh（同社試算・設置場所により異なる）」「同海域で洋上風力の約2倍（同社試算）」の3つ程度に絞る。どれにも「同社によると」を付ける。
2. [推奨対応] 段階表（Stage 1〜6）を図解し、「現在はStage 4（2026年デモ機）」「実機サイズのパイロットは2027–28年予定」と正直に示す。読者の信頼につながり、CTAを「早期の情報交換・候補地の初期相談」に置く根拠にもなる。
3. [推奨対応] 日本の課題データは J1（島の数・令和8年4月1日現在）、J2（離島振興法第17条の3）、J4（NEDO 2024）を軸にする。J5（環境省）は原文を確認できた場合だけ使う。
4. [推奨対応] 再エネ海域利用法は「現行制度は洋上風力が対象」と事実だけを書くか、触れない。どちらにするかはリョウの判断。
5. [推奨対応] 価格は「本体価格・導入費用の公開情報はなし（2026-10-13時点）。費用は設置条件により個別にお見積り」とする。発電原価（7c€/kWh等）を載せるなら「同社が示す将来段階の発電原価の目安（試算・系統接続費等を含まない）」と限定し、販売価格ではないことも明記する。載せない方が安全。
6. [推奨対応] 日本での実証は「[要確認]（公開情報なし）」とする。

## 代替案

- [代替案] 読者の第1順位を「導入パートナー候補（商社・エンジニアリング・建設・地域新電力）」に上げる案。根拠：製品がパイロット前の段階で、自治体単独では実証の主体になりにくい [推測]。また、同社の導入フローが「評価→初号機の設置・検証→増設」で、所有・資金調達は案件ごとに決まるため。ただし社長の承認済み方針（第1読者は離島の自治体等）を変える提案なので、ジン経由で社長判断とする。

---

## 記事に使える画像リスト（すべて https://noviocean.energy/wp-content/uploads/ 配下）

クレジット例：「出典：NoviOcean」。イメージ図には「イメージ図（同社によると実際の設計は個別協議で開示）」を添える。

**イメージ図（レンダリング・For illustration only／conceptual）**

| # | パス | 内容（alt） | 扱い |
|---|---|---|---|
| 1 | 2026/09/01-medi-wave-front-right-hero-photoreal.webp | Medi Wave 850H 右前方からの見た目 | イメージ図（キャプションに "For illustration only"） |
| 2 | 2026/09/02-medi-wave-front-left-hero-photoreal.webp | 左前方 | イメージ図 |
| 3 | 2026/09/03-medi-wave-centered-front-photoreal.webp | 正面 | イメージ図 |
| 4 | 2026/09/05-medi-wave-right-end-view-photoreal.webp | 右端 | イメージ図 |
| 5 | 2026/09/06-medi-wave-rear-three-quarter-photoreal.webp | 後方斜め | イメージ図 |
| 6 | 2026/09/07-medi-wave-high-front-aerial-photoreal.webp | 高所からの空撮風 | イメージ図 |
| 7 | 2026/09/08-medi-wave-straight-top-down-photoreal.webp | 真上から | イメージ図 |
| 8 | 2026/09/09-medi-wave-low-waterline-photoreal.webp | 喫水線付近 | イメージ図 |
| 9 | 2026/09/noviocean-island-community-nearshore.webp | 離島コミュニティ（concept） | イメージ図（第1読者向けのリードに最適） |
| 10 | 2026/09/noviocean-offshore-fish-farm-aquaculture.webp | 養殖（concept） | イメージ図 |
| 11 | 2026/09/noviocean-coastal-data-centre.webp | 沿岸データセンター（concept） | イメージ図 |
| 12 | 2026/09/noviocen-medi-wave-water-desalination.webp | 海水淡水化（concept） | イメージ図（ファイル名の綴りは原文どおり） |
| 13 | 2026/09/noviocean-utility-scale-platform-array.webp | アレイ（concept） | イメージ図 |
| 14 | 2026/09/noviocean-port-container-terminal.webp ほか（offshore-wind-farm-co-location／coastal-resort-hotel／open-ocean-single-platform／offshore-oil-and-gas-platform、noviocen-medi-wave-agliculter.webp） | その他の用途 | イメージ図 |
| 15 | 2026/07/alta-wave01.webp | **Alta Wave 1000H（将来開発）** | イメージ図。Medi Waveと混同しないキャプションが必須 |

**実写とみられる写真（イメージ図表記なし）**

| # | パス | 内容 | 扱い |
|---|---|---|---|
| 16 | 2026/09/NoviOcean-NO3-June-2026.webp | "NO3 demonstrator · June 2026"（2026年6月の海上NO3） | 実写とみられる。「現在の段階」を示すのに最適 |
| 17 | 2026/07/STAGE-1-TRL-1-3-2016-2017-2018.webp | 初期フロートと開発チーム | 実写とみられる |
| 18 | 2026/07/STAGE-2-TRL-4-5-2019-2020-2021.webp | 1:6模型の水槽試験 | 実写とみられる |
| 19 | 2026/07/STAGE-3-TRL-6-2022-2023-2024.webp | 1:5 NO2+（Svanholmen） | 実写とみられる |
| 20 | 2023/10/01.webp | 黄色い試作フロート（"prototype hardware under offshore testing in Sweden"） | 実写とみられる。Technologyページでは「旧Alta Wave試験機」と説明 |
| 21 | 2026/07/Jan-Skjoldhammer-CEO-Founder-Inventor.webp | CEO | 人物写真。肖像の利用は要確認 |
| 22 | 2024/12/1733769783275.webp | 授賞式の壇上 | 大会名が書かれていない |
| 23 | 2026/07/noviocean-whatelogo.webp | NoviOceanロゴ（白） | 使用許可済み（社長確認） |

**使用を避けるか確認が必要なもの**：2023/12/DreamShaper_v7_*.webp、2024/01/replicate-prediction-*.webp（生成AI画像の可能性 [推測]）、受賞・支援機関の第三者ロゴ（商標。リョウの確認事項）、2024/04/Screenshot-2024-04-21-*.webp（旧Alta Waveの単一フロートのシミュレーション。キャプションに "not Medi Wave" とある）。

---

## サイト内・情報源間の矛盾一覧（隠さず並記）

| # | 論点 | 記載A | 記載B |
|---|---|---|---|
| C1 | 受賞数 | トップ："Six Global Innovation Competitions Wins" | Awards／Validation："Five competition wins from five entries, plus one EU award"。Alta Wave："Five competition wins" |
| C2 | パイロット時期 | 2026-07-18の投稿："Phase 1 commercial pilot: 2026–2027" | Validation／Medi Wave："Stage 5 full-scale pilot 2027–2028 (projected)" |
| C3 | パイロット（過去の計画） | LIFE記事（2024-02-07）：NO500・500kWを "by 2025/26"。New Atlas（2024）：パイロット2026–27、商用2031–32 | 現サイト："No full-scale unit is operating offshore today"、商用は2029+ |
| C4 | アレイ規模 | Data Centers："offshore arrays of up to 5 MW" | Medi Wave仕様："projects of 20–50 MW and beyond" |
| C5 | 7c€/kWhの位置づけ | Simulator："Stage A, commercial pilot. Unit-level generation cost" | Remote Islands："illustrative scaled-production assumption" "Not a first full-scale pilot cost"。同ページの初期商用は "10–14 c€/kWh" |
| C6 | 設備利用率 | Medi Wave関連："V2 publishes no Medi Wave capacity factor" | サリー大学レビュー（報道）："around 40%"（Alta Wave系の値とみられる）。New Atlas："40–70%" |
| C7 | Startup 4 Climate賞金 | 同社ニュース："1M SEK Prize" | Ellevio："a prize of SEK 2 million"（受賞2社） |
| C8 | 年間発電量と定格のラベル | トップ：風力・太陽光は "partner-reported" | Medi Wave："Total rated power is 850 kW. management estimate" |
| C9 | NO3のラベル | Validation：Stage 4は "current" | Medi Waveページの一部："The NO3 triple-hybrid demonstrator has been deployed at sea and is undergoing testing" に "projected" ラベルが付いている（取得結果による。表記の誤りの可能性） |
| C10 | 法人 | LIFE受益者：Novige AB（Västerås） | 現在：NoviOcean AB（Täby、559083-1672）。同住所に別法人 Novige AB（559430-4452） |
| C11 | 従業員 | Teamページ：コアメンバー10名ほか | 登記集約サイト：従業員数0（業務委託等の可能性があるが[未確認]） |

---

## 出典一覧（確認日はすべて2026-10-13）

**NoviOcean公式（発行主体：NoviOcean AB。更新日はWP REST APIの modified 値）**

- S1 トップ https://noviocean.energy/ （更新 2026-09-21）
- S2 Medi Wave 850H https://noviocean.energy/medi-wave-850h/ （2026-09-23）
- S3 Technology（How It Works／Key Advantages／Technology Ecosystem／Future Development を含む） https://noviocean.energy/technology/ （2026-09-23）
- S4 Alta Wave 1000H https://noviocean.energy/alta-wave-1000h/ （2026-09-23）
- S5 Remote Islands https://noviocean.energy/remote-islands/ （2026-09-23）
- S6 Coastal Data Centers https://noviocean.energy/data-centers/ （2026-09-21）
- S7 Desalination https://noviocean.energy/desalination/ （2026-09-21）
- S8 Aquaculture https://noviocean.energy/fish-farms/ （2026-09-21）
- S9 Further Applications https://noviocean.energy/further-applications/ （2026-09-21）
- S9b Applications https://noviocean.energy/applications/ （2026-09-21）
- S10 Validation https://noviocean.energy/validation/ （2026-09-21）
- S11 Simulator https://noviocean.energy/simulator/ （2026-09-21）
- S12 Partners https://noviocean.energy/partners/ （2026-09-21）
- S13 About https://noviocean.energy/about/ （2026-09-23）
- S14 Team https://noviocean.energy/team/ （2026-09-21）
- S15 Company https://noviocean.energy/company/ （2026-09-21）
- S16 Contact https://noviocean.energy/contact/ （2026-09-21）
- S17 Awards & Support https://noviocean.energy/awards-and-support/ （2026-09-21）
- S18 Insights & News https://noviocean.energy/insights-news/ （2026-09-21）
- S19 投稿一覧（REST API） https://noviocean.energy/wp-json/wp/v2/posts ／ページ一覧 https://noviocean.energy/wp-json/wp/v2/pages?per_page=100
- S20 LIFE助成記事 https://noviocean.energy/2024/02/07/novige-ab-receives-a-multi-million-eur-grant-to-build-its-first-full-scale-500-kw-pilot-wave-energy-converter-wec-2/ （本文中の日付 2024-02-07）
- S21 Investor Relations https://noviocean.energy/investor-relations/ （2026-09-21）※参照のみ。記事への掲載は非推奨
- S23 2026-07-18投稿 https://noviocean.energy/2026/07/18/noviocean-presents-the-medi-wave-850h-at-the-swedish-polish-chamber-of-commerce/
- S24 Japan記事（出典記載なし・使用不可） https://noviocean.energy/2023/12/27/wave-energy-potential-in-japan/

**第三者**

- S22 EU LIFE公式DB（欧州委員会／CINEA）LIFE20 CCM/SE/001589 https://webgate.ec.europa.eu/life/publicWebsite/project/LIFE20-CCM-SE-001589/upscaling-and-demonstration-of-noviocean-a-breakthrough-wave-energy-converter-the-hydro-power-plant-at-sea （ページに更新日の記載なし）
- S25 Vinnova https://www.vinnova.se/en/p/noviocean-technology-optimization--validation-with-potential-partners--investors--customers （事業期間 2020-11〜2022-11）
- S26 Ellevio Startup 4 Climate https://www.ellevio.se/en/startup4climate （公開日の記載なし）
- S27 Mission Innovation https://mission-innovation.net/champions-corner-swedish-entrepreneur-fights-climate-change-with-the-power-of-ocean-waves/ （2021-10-20）
- S28 深圳市政府（Shenzhen Daily） https://www.sz.gov.cn/en_szgov/news/latest/content/post_11835861.html （2024-12-02）
- S29 New Atlas https://newatlas.com/energy/noviocean-wave-solar-wind-offshore-energy/ （2024-10-08）
- S29b TechXplore（サリー大学レビューの紹介） https://techxplore.com/news/2026-02-turbines-combined-tidalwave-power-generation.html （2026-02-18）／論文 DOI 10.1016/j.enconman.2025.120654（本文は未取得）
- S30 allabolag.se（登記集約・二次情報） https://www.allabolag.se/5590831672
- S31 funnelfeedr（登記集約・二次情報） https://funnelfeedr.com/en/company/se/novige-ab-5594304452

**日本（官公庁等）**

- J1 国土交通省「日本の島嶼の構成」（令和8年4月1日現在） https://www.mlit.go.jp/kokudoseisaku/chirit/content/001477518.pdf （発行日の記載なし・基準日は左記）
- J2 離島振興法（昭和28年法律第72号）e-Gov https://laws.e-gov.go.jp/law/328AC1000000072 （API経由で取得。令和4年法律第92号まで確認）
- J3 内閣府 沖縄振興審議会 専門委員会資料「3-2-⑤ 離島振興」 https://www8.cao.go.jp/okinawa/siryou/singikai/senmoniinkai/4/04-15.pdf （データは平成21年時点）
- J4 NEDO 水素・燃料電池成果報告会2024 P2-46（電力中央研究所・ネクステムズ・沖縄電力、発表日 2024-07-19） https://www.nedo.go.jp/content/100980752.pdf
- J5 環境省（オフグリッド離島のディーゼル依存）https://www.env.go.jp/content/900468363.pdf ほか ※403エラーで本文を取得できず・未確認
- J6 電力・ガス取引監視等委員会（離島ユニバーサルサービス）https://www.egc.meti.go.jp/activity/emsc_electricity/pdf/005_06_01.pdf ※403エラーで未確認
- J7 再エネ海域利用法（平成30年法律第89号）e-Gov API https://laws.e-gov.go.jp/api/1/lawdata/430AC0000000089 （題名「海洋再生可能エネルギー発電設備の整備に関する法律」と表示）
- J8 同法施行令の改正（令和7年政令第448号、公布 2025-12-26、施行 2026-04-01）新日本法規の掲載 https://www.sn-hoki.co.jp/data/pickup_hourei/onct/KAIYOUSAISEIKANOUENERUGIHATUDENSETUBISEIBI-REI20251226-448-1.html ※法令集出版社の掲載。e-Govでの最終確認を推奨
- J9 EEZ拡大の改正（2025-04成立）：報道のみ・[要追加調査]
- J10 NEDOエネルギー・地球環境分野成果報告会2026 i-31（東京電力リニューアブルパワー、発表日 2026-07-21） https://www.nedo.go.jp/content/800068054.pdf
- J11 水産庁「経営環境の変化にも対応できる経営体の育成（海面養殖業…）」令和8年7月 https://www.jfa.maff.go.jp/j/council/seisaku/kikaku/attach/pdf/260630-4.pdf （p.4の資料出典は「R8.4.20 水産政策審議会第29回総会及び第115回企画部会合同会議資料」から抜粋）

---

## 未確認事項一覧

1. Medi Wave 850Hの本体価格・CAPEX・導入費用：**公開情報なし**
2. 日本での実証予定・導入実績・許認可・日本の提携先：**公開情報なし**
3. コホマダとの独占販売契約：NoviOcean側の公開情報では確認できない（[ユーザー提供情報]のみ）
4. Wind Harvest・Midsummer側による提携の公式発表：見つからず
5. Bolagsverketの原本（NoviOcean ABの登記、旧社名、Novige AB 559430-4452との関係）
6. Stena Line Propeller Prize 2021、Shenzhen IEIC Swedish Division優勝、Guldstänk、EU Seal of Excellence：主催者側の一次情報は未確認（MIはChampionであることのみ確認、Startup 4 Climateは確認済み）
7. Energimyndigheten（5.6 MSEK）の公式DB上の記録
8. EU LIFE事業（2025-06-30終了）の成果・最終報告と、NO500パイロットが実施されなかった理由
9. 環境省・電力ガス取引監視等委員会の離島ディーゼル関連資料の原文（403エラーで未取得）
10. 離島の発電単価の最新の一次データ（円/kWh）
11. 波力発電のFIT/FIP上の扱い、一般海域の占用手続、漁業調整など、日本での設置に関する法制度 → [要弁護士確認]・[要追加調査]
12. 再エネ海域利用法の改正後の条文（e-Gov上の最新版）と、EEZ改正の施行状況
13. 沖合養殖・海水淡水化のエネルギー消費に関する日本の官公庁の一次データ
14. サリー大学レビュー論文の本文（40%がどの設計・出典を指すか）
15. 画像の撮影・生成の区分（特に replicate-prediction／DreamShaper のファイル名の画像）
16. 未取得のページ：/book-a-meeting/、旧ページ群（/about-us/、/numbers-sdg/、/investment/、/business-timeline-finance-customers/、/podcasts-and-interviews/ 等。2024–2025年更新で、現行のナビゲーション外とみられる）、YouTubeチャンネル

## 次に必要なアクション

1. （ジン→社長）追加の確認を1回にまとめて依頼：(a) NoviOcean側から価格の目安や日本での実証の予定を開示してもらえるか、(b) NoviOceanのサイト・SNSでコホマダとの独占契約を告知してもらえるか（記事の信頼性が上がる）、(c) 画像のうち実写と生成画像の区別をNoviOceanに確認できるか
2. （リョウ）再エネ海域利用法の対象外である点の書き方、投資勧誘リスク（IRページ）、第三者ロゴの使用、「独占販売契約」の表記を確認
3. （アオイ）本レポートの英語引用は、要約ツール経由の抜き出しである。記事で引用する箇所は、実際のページで一字一句を照合すること。J5・J6は原典が取得できれば差し替え、取得できなければ不使用とする
4. （レン＋サトル）上の「推奨案」と「矛盾一覧」を前提に構成する。数値は3つ程度に絞り、段階表で現在地を正直に示す構成を推奨
5. 記事公開の直前に、noviocean.energy の主要ページ（S1〜S11）の更新日と数値を再確認する

※本レポートは調査結果の整理であり、法務・許認可・投資に関する最終判断は行っていません。外部への送信・公開・NoviOceanへの連絡は一切行っていません。
