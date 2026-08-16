ステータス：Draft（調査担当：リサ。独立監査＝アオイ未実施）
基準日：2026-08-16
調査対象：メイ作成の設計書（`logs/kohomada_2026-08-16_NoimosAI相当自動化設計書_v1.md`）で「リサへの追加調査依頼」とされた分類C（外部有料API/ツールが実質必須と見込まれる機能）4点

# NoimosAI相当自動化 フェーズ2外部API候補調査

## 結論

分類Cの3領域（GEO言及監視／SEOキーワードデータ／ソーシャルリスニング）はいずれも、実在する外部有料サービスが複数存在することを確認した。ただし本セッションでは全て**WebSearch経由の二次情報（第三者比較ブログ）**に依るものであり、各社公式サイトへの直接fetchによる一次確認はできていない（ネットワークegressブロックのため）。料金・機能は情報源により表記の粒度・時点が異なるため、契約検討時には必ず各社公式サイト・営業窓口での再確認が必要。NoimosAI自体の技術的中身についても、公式ドキュメントを直接確認できず、第三者ブログ（jinrai.co.jp）が「SemrushやApolloと連携」と記載している程度の間接情報にとどまる。契約可否の最終判断は社長に委ねる。

## 確認済み事実

`[未確認・二次情報]`のラベルなしで記載する項目も、**すべてWebSearch要約からの情報であり、公式一次情報での直接検証は未実施**である前提で読むこと。

### 1. AI検索エンジンでのブランド言及・引用監視サービス（GEO監視）

**海外製**

| サービス | 料金（月額） | 備考 |
|---|---|---|
| Otterly.ai | $29〜 | 出典：alhena.ai比較記事 |
| Peec AI | Brand $95（50プロンプト・1プロジェクト）／Pro $245（150プロンプト・2プロジェクト）／Advanced $495（350プロンプト・5プロジェクト）。代理店向けEssential $245（10,000クレジット）／Growth $495（25,000クレジット） | 出典：indexly.ai |
| Scrunch AI | 約$250〜、7日間無料トライアル | 出典：frictionai.co等の比較記事 |
| AthenaHQ | Self-Serve $295〜（初月$95のプロモ有）、無料Essentialプラン有、Enterprise個別見積り | 出典：athenahq.ai比較記事 |
| Mentionable | €79〜 | 出典：WebSearch要約 |
| RankScale | $20〜（クレジット制） | 出典：WebSearch要約 |
| ZipTie | $179〜 | 出典：WebSearch要約 |
| MaxAEO | 年払いで$15〜、ビジネスプランで最大$399、Enterprise個別 | 出典：maxaeo.ai |
| Ahrefs Brand Radar | 基本Lite $129/月＋Brand Radar AIインデックス$199/月/プラットフォーム、または全6プラットフォーム束ねて$699/月（6エンジン網羅で実質月額$828前後） | 出典：layer3labs.io等の比較記事。ChatGPT/Perplexity/Google AI Overviews/Geminiに対応 |
| Semrush AI Toolkit | 単体$99/月、または「Semrush One」Starter $199／Pro+ $299／Advanced $549。カスタムプロンプト25件・AI Analysisレポート日次300クエリまで、ChatGPT/Google AI/Perplexity/Gemini対応 | 出典：explodingtopics.com等 |

**国産（日本語UI対応）**

| サービス | 提供元 | 料金 | 備考 |
|---|---|---|---|
| DolphinX AIO | 株式会社メディアリーチ | 6ヶ月契約：ライト¥30,000／プロ¥50,000／ビジネス¥100,000（月額・税別）。12ヶ月契約：ライト¥27,000／プロ¥45,000／ビジネス¥85,000。同社SEOツールとのセット契約でさらに割引。7日間無料トライアル、クレジットカード不要 | ChatGPT・Gemini・Claude・Perplexity等最大7種のAIに対応、海外18ヶ国への対応拡大をプレスリリースで発表（出典：prtimes.jp、mediareach.co.jp、jiji.com） |
| AIsearchmap（AIサーチマップ） | 株式会社CINC（Keywordmap） | 無料プラン（モニター利用の申請制）／エンタープライズプラン（個別見積り） | ChatGPT・Gemini・Perplexity・AI Mode・AI Overviews対応、競合との言及シェア(SoV)可視化。出典：prtimes.jp、keywordmap.jp |
| Brand UP | `[要追加調査]` | `[未確認]` | ChatGPT/Gemini/Perplexity対応の国産オールインワン型と紹介されているが、料金は本調査で確認できていない |

### 2. SEOキーワード検索ボリューム・難易度データAPI/ツール

| サービス | 料金体系 | 備考 |
|---|---|---|
| Ahrefs | Lite契約 $129/月（年払いで$99/月とする情報源もあり）。API単体アクセスの公開価格はなく営業への問い合わせが必要。ある第三者記事はAPI Standardティア$500/月〜＋最低契約の合算で実質月額$949前後と試算 | 出典：nextgrowth.ai。**同一サービスでも情報源により金額の粒度・前提が異なる点に注意（矛盾ではなく、契約形態の違いによる差の可能性が高いが未確認）** |
| Semrush | Webサイト契約Proプラン$139.95/月。API利用は別途ユニット購入が必要とみられるが、本調査ではAPI単体の具体的単価までは確認できていない | `[未確認]` API課金体系の詳細 |
| DataForSEO | 従量課金（最低デポジット$50）。確認できた単価例：検索ボリューム取得（Google/DataForSEO）$0.18/タスク、Bulk Clickstream Search Volume $0.012/タスク＋$0.00012/件、**AI Keyword Search Volume**（AI検索向けキーワードボリューム専用製品）$0.01/タスク＋$0.0001/件 | 出典：dataforseo.comのURL自体は検索結果に複数登場（`dataforseo.com/pricing/keywords-data`等）が直接fetch不可。金額はWebSearch要約経由 |
| Google Ads API（キーワードプランナー） | API利用自体は無料。ただしMCCアカウント・開発者トークンの申請/承認が必要で、Google広告アカウント（一時停止中でも可）の保有が前提 | 出典：qiita.com、listeningmind.marketing-office.jp、business.google.com（Google公式ヘルプページも検索結果に含まれるが直接fetch不可） |

### 3. ソーシャルリスニングツール

| サービス | 料金 | データ保持・プライバシー | 備考 |
|---|---|---|---|
| Brandwatch | 約$1,000/月〜（10,000メンション相当）、ただし年間契約必須で$10,000〜$60,000以上の前払い契約が一般的 | データ保持は階層制（30日履歴が最安、1年で追加コスト増、2年以上のアーカイブはEnterprise限定） | 出典：pulsarplatform.com、toolradar.com等の比較記事 |
| Meltwater | 年間契約$6,000（標準）〜$15,000以上（広範なアクセス） | `[未確認]` 具体的なデータ保持ポリシーは検索結果から確認できず | 出典：vendr.com |
| Talkwalker | Enterprise年額$9,600〜（機能・ユーザー数・データ範囲で変動） | `[未確認]` | 出典：ai-cmo.net、syncly.app |
| Mention.com | プラン数3種＋無料版・無料トライアル有り。**具体的な各プランの料金・機能詳細は本調査では確認できず**`[未確認]` | GDPR第28条・英国データ保護法に対応するデータ処理契約（DPA）を`gdpr@mention.com`宛の申請で提供。ただし「Mentionのクライアントの権限を借りて利用する場合、データの保存・アクセス・削除・共有・保持方針はそのクライアント自身が定める」という記載があり、Mention.com自体の標準保持期間の明記は確認できなかった | 出典：mention.comの利用規約・trustradius.com等（`mention.com`は直接fetch不可） |
| ホットリンク「BuzzSpreader Powered by クチコミ@係長」 | クロスメディアプラン ¥380,000/月 という記載あり | `[未確認]` | 「国内最大級のデータを保有」「1,000社以上導入」との記載は第三者サイト経由であり出典の一次性が弱く`[未確認・要一次確認]`とする |
| ユーザーローカル「Social Insight」 | ビジネス版／エンタープライズ版とも要問い合わせ（非公開） | `[未確認]` | 出典：sns.userlocal.jp（公式ページURLは検索結果にあるが直接fetch不可） |

### 4. NoimosAI自体のデータソース・技術（参考情報・すべて間接情報）

- `[未確認・二次情報]` 第三者ブログ（jinrai.co.jp、直接fetch不可）の記述によれば、NoimosAIの「GEOエージェント」は情報の根拠（ソース）を構造化しAIが理解しやすい形式でアウトプットを生成する設計とされ、**外部データソースとして「SemrushやApollo」と連携し実データに基づいた分析・出力を行う**という記載がある。ただしこれはNoimosAI公式ドキュメントの直接確認ではなく、第三者ブログの記述の要約に過ぎない。
- `[未確認・二次情報]` 料金の再確認（複数の比較サイト経由）：Pro $99/ユーザー/月（AIクレジット月10,000、ナレッジベース5GB、メディアストレージ5GB、ワークスペース最大2、アプリ最大5）、Team $249、Advanced $499。設計書に記載の料金と整合するが、いずれも一次ページ未確認。
- `[未確認・二次情報]` 連携先として言及される外部サービス：Google Analytics 360、Google Calendar、Google Drive、Google Search Console、Slack、WordPress、YouTube、Facebook、Instagram、Threads、TikTok、Twitter/X。
- 公式URL自体（`https://noimosai.com/ja/pricing`、`https://noimosai.com/ja/capabilities/social-media`、`https://noimosai.com/ja/integrations`等）は検索結果に存在を確認したが、**このセッションでは一切直接fetchできていない**（`EGRESS_BLOCKED`）。設計書側の指摘どおり、料金・機能の正確な一次確認は依然として未了。

## 推測・仮説

- `[仮定]` NoimosAIが謳う機能の多くは、自社で大規模なGEO/SEO/ソーシャルリスニングの独自データ基盤をゼロから構築するのではなく、Semrush・Apolloのような既存の専門データベンダーAPIを裏側で統合して提供している可能性が高い（jinrai.co.jpの記述が事実であれば）。ただし一次情報未確認のため断定しない。
- `[仮定]` 分類Cの費用感は、GEO監視だけでも国産ツールで月額数万円台（DolphinX AIOのライトプランで月2.7万〜3万円）、海外ツールでは$95〜$500超/月と幅が大きい。ソーシャルリスニングは特に海外エンタープライズ製品（Brandwatch/Meltwater/Talkwalker）で年間契約数百万円規模になりうる一方、国産の限定機能ツールはより安価な可能性がある。ただし国産ソーシャルリスニングツールの多くは料金非公開（要問い合わせ）であり、比較には個別見積りが必要。

## 分析

- **GEO監視**：フェーズ2で最初に着手しやすいのは国産のDolphinX AIO（月額2.7万円〜という比較的低い参入コスト、日本語UI、7日間無料トライアル）または無料枠のあるAIsearchmap。ただし「複数のAI検索エンジンを横断的に、リアルタイムで、競合比較まで」という設計書の想定水準に届くかは、料金の高いプラン（プロ・ビジネス）や海外製ツールの検討が必要になる可能性がある。
- **SEOキーワードデータ**：既存契約済みサービスが無い前提では、DataForSEOの従量課金モデル（最低$50デポジット）が最も低コストで試せる選択肢に見える。特に「AI Keyword Search Volume」という、AI検索向けキーワードボリュームに特化した製品が存在する点は、NoimosAI的なSEO×GEO統合の設計思想と親和性が高い可能性がある。ただしGoogle Ads APIは無料だが、通常の検索ボリューム（人間の検索）に限られ、AI検索でのボリュームは対象外である点に注意。
- **ソーシャルリスニング**：海外エンタープライズ製品（Brandwatch/Meltwater/Talkwalker）は年間契約・数百万円規模になりうり、コホマダ・KINOTOの事業規模に対して過大な可能性がある。国産のホットリンク・ユーザーローカル製品、またはMention.comのような中小規模向け海外ツールの方が、初期検討にはコスト的に現実的と見込まれるが、いずれも詳細料金が非公開/未確認のため、個別の見積り取得が前提となる。
- 全体として、分類Cの実際の費用対効果判断には、**各社への個別問い合わせ・無料トライアルの実施**が不可欠であり、本調査（第三者比較記事の要約）だけでは契約可否を判断できない。

## リスク・注意点

- 本調査はWebFetchが全面的にブロックされた状態で行われた特殊なセッションであり、**すべての料金・機能情報は第三者比較ブログ経由の二次情報**である。特に料金は変動が早い領域であり、記載時点（比較記事の公開時期は多くが未確認）から実際の契約時点で変わっている可能性が高い。
- 一部の情報源（例：ホットリンクの「国内最大級のデータ」「1,000社以上導入」等の実績訴求）は、提供元自身のマーケティング表現である可能性があり、客観的な裏付けが取れていない。
- ソーシャルリスニングツールは個人の発言データを扱うため、契約前に必ず各社の正式なプライバシーポリシー・データ処理契約（DPA）・GDPR等の法域対応を公式サイト・営業窓口で確認する必要がある（`.claude/rules/security-policy.md`）。本調査ではMention.comのDPA提供窓口の存在のみ確認でき、具体的な保持期間等の詳細は未確認。
- 契約は`.claude/rules/approval-policy.md`により対外契約・費用発生を伴うため社長の事前承認が必須（設計書ですでに明記済み）。

## 推奨案

1. まず国産のGEO監視ツール（DolphinX AIO ライトプラン、またはAIsearchmap無料プラン）の無料トライアル・申請を試し、実際の機能・データ精度を低コストで確認することを提案する。
2. SEOキーワードデータはDataForSEOの従量課金モデルで小規模に試し、費用感を実測してから本格導入を判断することを提案する。
3. ソーシャルリスニングは、コホマダ・KINOTOの監視対象範囲（Web全体か、特定キーワード・特定サイトに絞るか）を先に社長・レン・サトルとすり合わせたうえで、範囲に見合う規模のツール（国産の中小規模ツールか、海外エンタープライズ製品か）を絞り込むことを推奨する。

## 代替案

- 分類Cすべてを見送り、設計書のフェーズ1（既存資産の延長）のみで運用を続け、外部有料ツールは当面契約しないという選択肢もある（追加コストゼロ）。
- あるいは、NoimosAI本家（Pro $99/月〜）を実際に契約し、個別の分類Cツールをバラバラに揃えるより一括で機能を得る、という設計書の代替案Bも依然として選択肢に残る（ただし料金・データの外部依存度の観点は設計書の記載どおり）。

## 出典

**重要な限定事項**：以下はすべてWebSearchツールによる検索結果の要約からの引用であり、本セッションでは対象サイトへの直接WebFetchができなかった（`EGRESS_BLOCKED`、`noimosai.com`のみならず`google.com`宛リクエストでも同様のブロックを確認）。公開日・更新日の多くは検索結果の要約からは特定できておらず、`[公開日不明]`として扱う。取得日（本セッションでの検索実施日）：2026-08-16。

- Alhena AI, "7 Best AI Brand Visibility Tracking Tools in 2026" https://alhena.ai/blog/ai-brand-visibility-tracking-tools/ ［公開日不明・取得日2026-08-16］
- Indexly, "Understanding Peec AI Pricing" https://indexly.ai/blog/peec-ai-pricing/
- FrictionAI, "AthenaHQ Alternatives" https://www.frictionai.co/blog/athenahq-alternatives
- Layer3Labs, "Ahrefs Brand Radar Review 2026" https://www.layer3labs.io/guides/ahrefs-brand-radar-review
- ExplodingTopics, "Semrush AI Visibility Toolkit vs Ahrefs Brand Radar" https://explodingtopics.com/blog/ai-visibility-vs-brand-radar
- 株式会社メディアリーチ プレスリリース（DolphinX AIO） https://prtimes.jp/main/html/rd/p/000000031.000092256.html
- DolphinX公式料金ページ（URL確認のみ・直接fetch不可） https://dolphinx.jp/pricing/aio
- 株式会社CINC プレスリリース（AIsearchmap） https://prtimes.jp/main/html/rd/p/000000488.000019378.html
- Keywordmap（CINC） https://keywordmap.jp/news/aisearchmap-release/
- NextGrowth.ai, "DataForSEO API: Complete 2026 Guide" https://nextgrowth.ai/dataforseo-api-guide/
- DataForSEO公式価格ページ群（URL確認のみ・直接fetch不可） https://dataforseo.com/pricing/keywords-data、https://dataforseo.com/pricing/ai-optimization/ai-keyword-search-volume
- Qiita, "AdWords APIでキーワードプランナーの検索ボリューム・CPC・競合性を取得する" https://qiita.com/zak_y/items/58e07ef042605b113f86
- Pulsar Platform, "Best Social Listening Tools 2026" https://www.pulsarplatform.com/guides/best-social-listening-tools-2026-guide-for-enterprise-buyers
- Vendr, "Meltwater Software Pricing & Plans 2026" https://www.vendr.com/marketplace/meltwater
- Mention公式 利用規約 https://mention.com/en/terms-and-conditions/（DPA関連。直接fetch不可）
- ホットリンク関連紹介記事 https://www.sns-recruitpartner.com/acting/hotlink.html
- ユーザーローカル Social Insight 料金ページ（URL確認のみ・直接fetch不可） https://sns.userlocal.jp/document/price/
- 株式会社仁頼「NoimosAIの料金・評判｜$99〜3プランとGEO機能」 https://jinrai.co.jp/en/blog/2026/07/26/noimosai-price-review/（NoimosAIのSemrush/Apollo連携に関する記述の出典。第三者ブログであり、NoimosAI公式ドキュメントの直接確認ではない）
- NoimosAI公式料金ページ（URL確認のみ・直接fetch不可） https://noimosai.com/ja/pricing

## 未確認事項

- `[未確認]` 上記すべての料金・機能情報は、各社公式サイトでの一次確認が未実施（WebFetch全面ブロックのため）。契約検討前に必ず公式サイト・営業窓口で再確認が必要。
- `[未確認]` Semrush APIの単体課金体系（ユニット単価等）の詳細
- `[未確認]` Mention.com・ユーザーローカルSocial Insight・国産「Brand UP」の具体的な料金プラン
- `[未確認]` Meltwater・Talkwalkerの正式なデータ保持期間・プライバシーポリシーの詳細
- `[未確認]` ホットリンク「国内最大級のデータ」「1,000社以上導入」等の実績値の一次裏付け
- `[未確認]` NoimosAIが実際にSemrush・Apollo等と技術連携しているかどうかの公式ドキュメントでの確認（第三者ブログの記述のみ）
- `[未確認・要環境確認]` このセッションでWebFetchが全ドメインでブロックされた原因（プロキシ設定・一時的な制限か恒常的な制限かは不明）

## 次に必要なアクション

1. 社長へ：本調査は二次情報のみに基づくため、契約を具体的に検討する段階になったら、候補（GEO：DolphinX AIO／AIsearchmap、SEOデータ：DataForSEO、ソーシャルリスニング：ホットリンクまたはMention.com等）に絞って公式サイト・営業窓口への直接問い合わせ・無料トライアル利用を推奨する。
2. 次回以降のセッションで、WebFetchのegressブロックが解消されているかを確認し、可能であれば各社公式ページの一次情報での裏取りを追加で行うことを推奨する。
3. アオイへ：本調査結果を含む成果物を対外的に使用する場合（社長への提案資料化等）は、事実と推測の区別・出典明記の観点で監査を依頼すること。
