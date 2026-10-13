# Heura紹介note記事v1 出典照合結果（リサ）

- タスク：T227／事業タグ：kohomada／確認日：2026-10-13／対象：logs/kohomada_2026-10-13_Heura紹介note記事_v1.md

## 結論

T227のnote記事（/home/user/kouki-ai-lab/logs/kohomada_2026-10-13_Heura紹介note記事_v1.md）について、「出典・基準日」に載っている全24URLを2026-10-13にWebFetchで開き、本文と照合しました。全件開けたので、照合不能は0件です（Foovoは1回目が503で、再取得で開けました。PDF 2件は画像化して読みました）。

- 結果：不一致1件、一部不一致6件。あわせて、出典リストの書誌情報に誤りや欠けが4件あります。
- 架空の出典や存在しない事実は見つかりませんでした。
- ご指定の重点項目は、次の3点を除いて一致しました。
  - 「創業以来初」のEBITDA黒字の出典の付け方
  - 南欧集中・ライセンス供与の出典の付け方
  - 大阪府ページを出典にした「原産国名」の記述

## 照合結果（確認日：2026-10-13）

| 本文の該当箇所 | 記述 | 出典 | 判定 | 出典の該当箇所の要旨 | 修正案 |
|---|---|---|---|---|---|
| L52 | 2017年、バルセロナ中心部のコワーキングオフィスで創業。運営はFoods For Tomorrow S.L. | Heura Know us | 一致 | 「founded in 2017, in a co-working office in the centre of Barcelona」。フッターに「FOODS FOR TOMORROW S.L.」 | なし。参考：EIBの案件ページでは「FOODS FOR TOMORROW SLU」と表記されています |
| L54 | 公式サイトは「Marc」「Bernat」と名前だけ | Know us | 一致 | 「Marc and Bernat」と名前のみ。姓はない | なし |
| L54 | 報道ではMarc Coloma氏（CEO）とBernat Añaños氏と紹介 | vegconomist（2025-02-07）、AgFunderNews | 一致（2つの出典を合わせて成立） | vegconomist：本文に「Marc Coloma, CEO and co-founder」。Bernatは写真キャプションに「Bernat Ananos」（ñなし）とあるだけ。AgFunderNews：「Bernat Añaños and Marc Coloma」が2017年に創業した共同創業者。ただしColomaのCEOという肩書はない | 修正は必須ではありません。厳密にするなら「Coloma氏がCEOであることはvegconomist等、Añaños氏の氏名はAgFunderNewsで確認」と書き分けます |
| L65 | 2024年2月、シリーズBで4,000万ユーロ。出資者はUpfield、Unovis Asset Management、European Circular Bioeconomy Fund、Newtree Impact | The Plant Base Mag（2024-02-07） | 一致 | €40m、Series B、2024年2月7日公開。投資家4社の名前が一致 | なし |
| L68 | 2025年5月、EIBから2,000万ユーロの融資。InvestEUの保証付き | Green Queen | 一致（ただし日付は出典に書かれていない） | 「€20M ($22.2M) loan」「guaranteed by InvestEU」。記事は2025-05-13公開だが、融資の実行日・調印日の記載はない。補足として、EIBの案件ページ（eib.org/en/projects/all/20240549）に調印日2025年5月8日、2,000万ユーロ、InvestEUの記載がある | 「2025年5月」を裏付ける一次情報として、EIBの案件ページかプレスリリース（2025-204）を出典に追加します |
| L71 | AgFunderNewsとFoovoが、2026年第1四半期にEBITDAが**創業以来初めて**黒字になったと報道 | AgFunderNews（2026-05-14）、Foovo（2026-05-26） | **一部不一致** | AgFunderNews：「reached operational profitability in the first quarter of 2026」。初めてかどうか、創業以来かどうかの記述はない。Foovo：2026年第1四半期に創業以来初めて黒字化と記載 | 「2026年第1四半期にEBITDAが黒字になったと報じています（AgFunderNews、Foovo）。Foovoは、これを創業以来初めてと伝えています」のように、出典ごとに分けて書きます |
| L73 前半 | 南欧（スペイン・ポルトガル・フランス・イタリア）に集中し、英国・スイス・オーストリアでは縮小（Green Queen、AgFunderNews、Foovo） | 同左の3件 | **一部不一致** | 南欧集中は3件とも一致。英国・スイス・オーストリアの縮小はGreen Queen（「dialling down its footprint in the UK, Switzerland, and Austria」）とFoovo（La Vanguardiaの引用）にはあるが、AgFunderNewsは「northern Europe」から引いたと書くだけで、国名はない | 縮小の部分の出典を「Green Queen、Foovo」にします。AgFunderNewsは「北欧州からの縮小」として扱います |
| L73 後半、L131 | 直接展開しない地域でライセンス供与やホワイトラベルを模索していると報道 | 文脈上、Green Queen、AgFunderNews、Foovoの3件に依拠しているように読める | **一部不一致** | AgFunderNewsだけが、ホワイトラベル生産と製造・技術プラットフォームのライセンス供与を明記。FoovoはB2Bでのプラットフォーム提供に触れるだけで、「ライセンス」「ホワイトラベル」という言葉は使っていない。Green Queenには記載がない | 「（AgFunderNews）」と出典を明記し、Green Queenを外します。Foovoを残すなら「B2B提供の方針（Foovo）」と書き分けます |
| L77 | FoodTech 500の2023年版で7位。ICEXのサイトに掲載。賞ではなくランキング | ICEX Foods & Wines from Spain（2024-06-26） | 一致 | 「Top Ten of the 2023 FoodTech 500 list」「Heura (number 7)」とある。Forward Foodingの名前は本文になく、forwardfooding.comへのリンクがあるだけ | 必須ではありません。「Forward Foodingが発表」と書くなら、Forward Foodingの公式ページを出典に追加するのが望ましいです |
| L81 | Sell Heuraページに、販売店・小売チェーン・飲食店・外食チェーン・卸売事業者向けの、国を選ぶ問い合わせフォームがある | Sell Heura | 一致 | 業種の選択肢：Store、Retail Chain、Retail Distributor、Restaurant、Restaurant Chain、Food Service Distributor。「Country」欄がある | なし |
| L91〜95 | 商品20品目（形状別に整理） | Products | 一致 | ページ上の20品目と過不足なく一致。表記の差は「Burger with fine herbes」（記事はherbs）、「Chunks Plant-based Protein」（記事はOriginal Chunks）、「Chorizo Sausages」、「Meatballs Originals」 | 必須ではありません。綴りを公式表記にそろえるなら「fine herbes」 |
| L101 | 各商品ページに100gあたりの栄養成分が載っている | Original Chunksほか | 一致 | Original Chunksのページに100gあたりの平均値（エネルギー・たんぱく質・鉄・B12等）がある | なし |
| L107 | 鶏肉風は大豆、牛肉風はえんどう豆が主原料 | FAQs | 一致 | 「soya beans (chicken-like products) or peas (beef-like products)」 | なし |
| L111 | Original Chunksの原材料 | 商品ページ | 一致 | 「Water, soy protein concentrate (25%), rapeseed oil, extra virgin olive oil, salt, flavouring, spices and vitamin B12」 | なし。参考：同じページに「180g冷凍品はグルテンの痕跡を含む可能性」とあります（L160の小麦の論点に関係します） |
| L112 | Burgersの原材料と「大豆を含む可能性あり」 | 商品ページ | 一部不一致（軽微） | 原材料の順番は一致。表示は「May contain traces of soy」で、微量混入の可能性という意味 | 「微量の大豆を含む可能性がある旨の表示があります」とします |
| L113 | F'sh filletsの原材料 | 商品ページ | 一致 | 水、大豆たん白［濃縮物12%・分離物4.4%］、米・とうもろこし・ひよこ豆の粉、なたね油、香料、EVOO、安定剤（メチルセルロース）…。「May contain traces of gluten」もある | なし。グルテン混入の可能性の注記を、L160の論点に加えることを推奨します |
| L117 | オリーブオイルの値上がりを受け、Burgers・Snacks・Nuggets・Slices・Breaded EscalopesをEVOO＋なたね油のブレンドに変更。Heura-Swapは高オレイン酸ひまわり油 | Last Product Updates | 一致 | EVOOが2021年比で200%値上がりしたこと、上記5品目のブレンド変更、「high oleic sunflower oil」の記載がある。日付の記載はない | なし |
| L117 | 原材料表示でなたね油がオリーブオイルより先に書かれている | 各商品ページ | 一致 | Original Chunks、Burgers、F'sh、York Hamのいずれも、なたね油がEVOOより前 | なし |
| L119 | York Ham Styleは4℃保存、開封後24時間以内。FAQはチルド品の冷凍を勧めない | York Ham Style、FAQs | 一致 | 「Conserve at 4°C」「consumed within 24h once opened」「Do not refreeze」。FAQ：「We recommend not freezing refrigerated Heura®」 | なし |
| L125 | 販売店検索に、日本を含むアジアの国はない | Find us | 一致 | 13か国（スペイン、ポルトガル、フランス、ベルギー、英国、イタリア、オランダ、オーストリア、スイス、ドイツ、ポーランド、チェコ、メキシコ）。アジアはない | なし |
| L127 | 2019年、Green Mondayと組んでGrand Hyatt Singaporeでアジア初の提供。香港ではGreen Commonの店舗で販売 | vegconomist、Green Queen（2019） | 一致（2つの出典を合わせて成立） | vegconomist：「the first Asia launch for Heura」「in collaboration with the Green Monday initiative」。本文に年はなく、メタデータに2019-08-29と2020-04-22がある。Green Commonの記載はない。Green Queen：2019年9月10日公開（2019年12月12日更新）。Grand Hyatt SingaporeとGreen Monday、「launch at Green Common outlets across the city this September」の記載がある。「first in Asia」ではなく「Asian debut」という表現 | 本文はそのままで構いません。出典リストのGreen Queenの日付を「公開：2019-09-10、更新：2019-12-12」に直します |
| L133 | KPMG FASは2023年3月の資料で、日本の植物肉市場について「正確なデータは存在しない」としている | KPMG PDF（2023年3月） | **一部不一致** | p.3「日本と世界のPBM市場成長性の比較」の図中に「PBM市場規模に関する正確なデータは存在しないものの、各機関は今後、世界市場は日本と比較して大きく伸長すると予測」とある。PBM市場規模一般についての注記で、日本市場に限った記述ではない。作成者表記は「KPMGジャパン 消費財・小売セクター／株式会社KPMG FAS パートナー 梶川慎也」 | 「KPMGの資料（2023年3月）は、植物肉（PBM）の市場規模について『正確なデータは存在しない』と断ったうえで、日本の成長率を世界より低く示しています」とします |
| L133 | 伸びが緩やかな理由として、大豆製品の食文化・ヴィーガン人口の少なさ・肉消費が米国の半分以下を挙げている | 同上 | 一致 | p.2：肉類の消費量が米国の半分以下、豆製品から植物性たんぱく質をとる食文化。p.3：PBM市場の成長率は低い。p.5：ヴィーガン人口が少ない | なし |
| L152 | 食品衛生法第27条に基づき輸入の都度の届出が必要。届出のない食品は販売・営業に使えない。届出先は検疫所。初回は事前相談が勧められている | 厚生労働省「食品等輸入手続について」 | 一致 | 第27条に基づく届出義務、「輸入届出を行わない食品等については、販売又は営業上使用することはできません」とある。届出は検疫所が受け付ける。初めて輸入する人には検疫所窓口への相談を案内。計画輸入制度では都度の届出が不要になる例外がある。更新日の記載はない | 任意です。「原則として輸入の都度（計画輸入制度等の例外あり）」と補うと正確になります |
| L160 | 2026年4月時点で義務表示の特定原材料は9品目（えび、カシューナッツ、かに、くるみ、小麦、そば、卵、乳、落花生）。大豆は推奨20品目の一つ | 消費者庁食品表示課の資料（第20回協議会 資料3-2、令和8年5月27日） | 一致 | p.2：令和8年4月にカシューナッツが特定原材料に移行し、「義務9品目・推奨20品目」。p.1：推奨品目に大豆が含まれる。ただしp.5に、カシューナッツ追加について「公布日から起算して2年間の経過措置」とある | 任意です。「カシューナッツの追加には2年間の経過措置があります」と注記すると正確になります |
| L161 | 肉を連想させる商品名でも、表示全体で誤認させなければ問題になりにくい。英語表記でも誤認のおそれがある | 消費者庁プラントベース食品Q&A | 一致（文脈の補足を推奨） | Q1：「表示全体から…食肉であるかのように誤認する表示になっていなければ、景品表示法上問題となることはありません」。Q8は輸入品の英語名「Milk」「butter」についての回答で、肉の名称の事例ではない。ページに更新日はなく、Q13に「現時点（令和3年8月）」とある | 「英語表記（Q&AではMilk・butter等の例）でも誤認のおそれがあるとされており…」と、例が乳製品であることを明示します |
| L162 | 大豆は遺伝子組換え表示の対象。2023年4月から「遺伝子組換えでない」と書けるのは、遺伝子組換え原料が**検出されない**場合に限られる | 山梨県「遺伝子組換え表示制度」 | **一部不一致** | 大豆は対象（「大豆（枝豆及び大豆もやし含む）」）。山梨県のページの書き方は「分別生産流通管理を行い、遺伝子組換えの混入がないと認められる」場合で、「検出されない」という言葉は使っていない（ページ更新日：2024-12-24） | 出典の表現どおり「分別生産流通管理を行い、遺伝子組換えの混入がないと認められる場合に限られています」とします。「不検出」と書くなら消費者庁の一次資料を出典に追加します |
| L163 | 輸入した加工食品には**原産国名**と、輸入者の名称・所在地の表示が必要（大阪府） | 大阪府「食品関連事業者及び製造所等について」 | **不一致（原産国名の部分）**／輸入者の部分は一致 | 輸入者：「輸入品は、輸入業者の営業所の所在地及び輸入業者の氏名又は名称を表示してください」。「原産国」という言葉はページのどこにもない（ページ更新日：2024-06-11） | 原産国名の記述には、消費者庁の食品表示基準など、原産国名を明記した一次資料を別に出典として付けます。付けられない場合は「大阪府の解説によると、輸入品には輸入者の名称・所在地の表示が必要です」までに縮めます |

## 出典リスト（L246〜281）の書誌の誤り・欠け

1. Green Queen（EIB融資の記事、L267）：記事タイトルが違います。現在表示されているタイトルは「Spain's Plant-Based Meat Leader Bags €20M EU Bank Investment & Promises Q4 Profitability」です。記事にあるタイトルはページのメタ情報上のもので、本文の見出しではありません。表示どおりに直します。
2. Green Queen（香港・シンガポールの記事、L271）：日付が「未確認」になっていますが、確認できました。「公開：2019-09-10、更新：2019-12-12」と記載します。
3. 山梨県（L279）：更新日は2024-12-24です。
4. 大阪府（L280）：更新日は2024-06-11です。
5. 追加推奨：EIBの案件ページ https://www.eib.org/en/projects/all/20240549 （調印日2025-05-08、2,000万ユーロ、InvestEU）。

## 件数のまとめ

- 一致：19件（このうち2件は2つの出典を合わせて成立、3件は表現の補足を推奨）
- 一部不一致：6件（L71、L73前半、L73後半・L131、L112、L133、L162）
- 不一致：1件（L163の原産国名）
- 照合不能：0件
- 出典リストの書誌の誤り・欠け：4件（上記の追加推奨1件は含まない）

## 最優先で直すべき点

1. **L163（不一致）**：大阪府のページに「原産国」の記載がありません。一次資料を出典に差し替えるか、記述を削ります。
2. **L71**：「創業以来初めて」はFoovoだけの記述です。AgFunderNewsにはないので、出典ごとに書き分けます。
3. **L73・L131**：ライセンス供与・ホワイトラベルの出典はAgFunderNewsだけです。英国・スイス・オーストリアの縮小は、AgFunderNewsではなくGreen QueenとFoovoが出典です。出典の付け方を直します。
4. **L162**：山梨県のページの表現（「混入がないと認められる」）に合わせます。
5. **L133**：「正確なデータは存在しない」は、日本市場に限らない注記です。対象範囲がずれないように直します。
6. **L268の出典タイトルとL271の日付**を修正します。

## 推測・未確認事項（照合の範囲外）

- 「スペイン政府系の貿易振興機関ICEX」という位置づけと、「Forward FoodingがFoodTech 500を発表」という点は、ICEXのページの本文では確認できていません（ICEXのページにはforwardfooding.comへのリンクがあるだけ）。
- EIBのプレスリリース（2025-204）は検索結果の抜粋を見ただけで、本文は開いていません。調印日はEIBの案件ページで確認しました。
- 本照合は法的な妥当性の判断ではありません。L152〜163の表示・輸入の論点の最終確認は、リョウ（法務担当）と専門家に委ねます。

## 次に必要なアクション

1. カエデが上記6点を修正して、v2を作成する。
2. アオイが本表をもとに再監査する。
3. 必要なら、私（リサ）がv2の修正箇所だけ再照合する。

## 照合したURL（すべて2026-10-13に確認）

- Heura公式サイト：[Know us](https://heurafoods.com/know-us)／[Sell Heura](https://heurafoods.com/sell-heura)／[Products](https://heurafoods.com/products)／[FAQs](https://heurafoods.com/faqs)／[Original Chunks](https://heurafoods.com/products/original-chunks-plant-based-protein)／[Burgers](https://heurafoods.com/products/burgers-plant-based-protein)／[York Ham Style](https://heurafoods.com/products/lonchas-finas)／[F'sh fillets](https://heurafoods.com/products/f-sh-fillets)／[Last Product Updates](https://heurafoods.com/food-activism/last-product-updates)／[Find us](https://heurafoods.com/find-us)
- 報道：
  - [vegconomist（B Corp）](https://vegconomist.com/company-news/heura-improves-b-corp-rating-top-spot-category/)
  - [The Plant Base Mag](https://www.theplantbasemag.com/news/heura-raises-40m-in-series-b-funding-round)
  - [Green Queen（EIB）](https://www.greenqueen.com.hk/heura-foods-plant-based-meat-funding-eib-vegan-cheese/)
  - [AgFunderNews](https://agfundernews.com/heura-foods-hits-positive-ebitda-in-q1-a-turning-point-for-the-european-plant-based-sector)
  - [Foovo](https://foodtech-japan.com/2026/05/26/heura/)
  - [vegconomist（Grand Hyatt）](https://vegconomist.com/gastronomy-and-catering/grand-hyatt-singapore-becomes-first-in-asia-to-launch-heura/)
  - [Green Queen（香港・シンガポール）](https://www.greenqueen.com.hk/spanish-startup-foods-for-tomorrow-launches-heura-plant-based-chicken-hong-kong-singapore/)
- 公的機関・業界機関・調査機関：
  - [ICEX](https://www.foodswinesfromspain.com/en/foodtech/news/spanish-foodtech-500-list)
  - [厚生労働省](https://www.mhlw.go.jp/stf/seisakunitsuite/bunya/0000144562.html)
  - [消費者庁 資料3-2](https://www.mhlw.go.jp/content/10905000/001704059.pdf)
  - [消費者庁 プラントベースQ&A](https://www.caa.go.jp/notice/other/plant_based/)
  - [山梨県](https://www.pref.yamanashi.jp/shoku-portal/shokuhinhyoji/idenshikumikae.html)
  - [大阪府](https://www.pref.osaka.lg.jp/o100110/shokuhin/prcessed_food/food_related_busines.html)
  - [KPMG](https://assets.kpmg.com/content/dam/kpmg/jp/pdf/2023/jp-plant-based-meat.pdf)
- 補強用（記事の出典リストには未掲載）：
  - [EIB案件ページ](https://www.eib.org/en/projects/all/20240549)
  - [EIBプレスリリース 2025-204](https://www.eib.org/en/press/all/2025-204-eib-finances-with-eur20-million-heura-foods-to-develop-innovative-and-sustainable-plant-based-food-products)（検索結果の抜粋のみ確認）
