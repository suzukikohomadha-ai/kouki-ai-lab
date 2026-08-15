# 案A：収集元調査 ― RSSフィード提供有無・利用規約（暫定）

- 対象：株式会社コホマダ／案A（日本の規制・行政ニュース収集→AI要約→多言語ダイジェスト配信）
- 前提ドキュメント：`logs/kohomada_2026-08-15_日本進出n8nワークフロー案A_設計書_v1.md`（メイ、3節「著作権・利用規約リスクへの設計上の対策」を受けた追加調査）
- 作成：リサ　調査日：2026-08-15
- 調査方法：**WebSearchのみ**（`EGRESS_BLOCKED`によりWebFetch不可。JETRO公式サイトも含め遮断を確認済み）。以下はすべて「WebSearchが返した要約・スニペットに基づく二次情報」であり、各サイトの原文を直接開いて確認したものではない。

---

## 結論

- 調査対象6機関のうち、**経産省・中小企業庁・消費者庁・出入国在留管理庁（法務省）はRSS配信ページの存在がスニペット上で確認でき、いずれも「政府標準利用規約／公共データ利用規約（PDL1.0）」に基づき、出典明記を条件に複製・翻案・商用利用まで許容する記載がスニペット上に現れた**。案Aの「AI要約・翻訳して配信する」用途と比較的親和性が高い可能性がある。
- 一方、**JETROはRSSフィードの存在自体を複数回の検索でも一次確認できず確度が低い**。さらにJETROの利用規約（特にビジネス短信・購読サービス系）は「著作権はJETROに帰属し、許可なく複製・編集・改変・頒布・転載を禁じる」という、政府標準利用規約とは異なる厳格な文言がスニペットに現れた。
- 暫定評価として、**経産省・中小企業庁・消費者庁・出入国在留管理庁（法務省）は出典明記・改変明示を条件に親和性がありそうだが、JETROは案Aのサンプル収集元としては慎重に扱うべき**。ただしすべて二次情報に基づく暫定評価であり、法的な適否を断定するものではない。

---

## 確認済み事実（実在確認のみ、原文未読）

1. 経済産業省 RSS配信：`https://www.meti.go.jp/rss/`
2. 中小企業庁 RSS：`https://www.chusho.meti.go.jp/rss/index.xml`
3. 消費者庁 RSS：`https://www.caa.go.jp/rss/`
4. 法務省 RSS案内：`https://www.moj.go.jp/content/rss.html`（出入国在留管理庁専用URLは今回未特定）
5. 経産省 利用規約：`https://www.meti.go.jp/main/rules.html`
6. 中小企業庁 利用規約：`https://www.chusho.meti.go.jp/riyou_kiyaku.html`／`riyou_kiyakubessi.html`
7. 消費者庁 利用規約：`https://www.caa.go.jp/terms_of_use/`
8. 出入国在留管理庁 著作権・リンク：`https://www.moj.go.jp/isa/copyright/index.html`／`index2.html`
9. JETRO 利用規約・免責事項：`https://www.jetro.go.jp/legal/`
10. JETROビジネス短信（購読サービス）規約：`https://www.jetro.go.jp/biznews/subscription_back/terms.html`
11. 「政府標準利用規約（第2.0版）」がCC BY 4.0相当と紐づけて解説されるページ（内閣官房IT総合戦略室・デジタル庁）の実在

---

## 情報源ごとの暫定評価

| 情報源 | RSS提供 | 利用規約の傾向（二次情報） | 案Aでの暫定評価 |
|---|---|---|---|
| JETRO（英語版含む） | `[未確認]` 存在を示唆するスニペットはあるが具体URL未特定、確度低い | `[未確認・二次情報]` サイト全体規約「著作権はJETRO帰属」、購読サービスは「無断複製・転載禁止」と厳格寄り | **サンプル収集元として現時点では推奨しない**。RSS実在・規約原文の一次確認が先に必要 |
| 経済産業省 | `[確認済み・存在ページのみ]` | `[未確認・二次情報]` PDL1.0準拠、出典明記で複製・翻案・商用利用可 | 出典明記・改変明示前提でリスク低めの可能性。原文未読のため断定不可 |
| 中小企業庁 | `[確認済み・存在ページのみ]` | `[未確認・二次情報]` PDL1.0準拠、出典明記で自由利用可 | 同上 |
| 消費者庁 | `[確認済み・存在ページのみ]` | `[未確認・二次情報]` 規約ページ実在確認。PDL1.0準拠かは今回未確定 | 同上（留保あり） |
| 出入国在留管理庁（法務省） | `[未確認]` 法務省全体の案内のみ確認、庁専用URL未特定 | `[未確認・二次情報]` 出典明記・改変明示条件で商用利用含め自由利用可 | 規約面は良好そうだがRSS URL未特定 |

### その他、存在確認のみの候補（利用規約は今回未調査）

- 首相官邸：`https://www.kantei.go.jp/rss.html`
- 内閣府：`https://www.cao.go.jp/rss/`
- 厚生労働省：`https://www.mhlw.go.jp/rss/index.html`
- 金融庁：`https://www.fsa.go.jp/kouhou/rss.html`
- 政府広報オンライン：`https://www.gov-online.go.jp/rss/`
- e-Gov（法令検索・パブコメ）：`https://www.e-gov.go.jp/service-policy/rssfeed.html`

---

## リスク・注意点

1. JETROはRSS実在が未確定。案Aの説明文で「JETROも収集元として使える」と前提を置くと、実装段階で手戻りが起きるリスクがある。
2. 利用規約は原文未読。「PDL1.0準拠で出典明記すれば自由利用可」という要約が複数機関で共通して現れているが、「AI要約」「第三者への自動配信」という利用形態がPDL1.0上どう扱われるかは条文の細部を読まないと判断できない。
3. RSS配信の対象範囲（全件かカテゴリ限定か）・更新頻度・件数上限は今回未確認。
4. JETROの規約は一枚岩ではない可能性がある（一般利用規約と購読制サービス規約が別建て）。「JETROは使えない」と一括りに断定するのは早計。

---

## 推奨案

1. 経産省・中小企業庁・消費者庁・出入国在留管理庁（法務省）は、原文（利用規約全文）の一次確認ができ次第、案Aのサンプル収集元候補として優先的に検討する。原文確認はWebFetchが使える別環境、または社長・専門家によるブラウザでの直接確認が必要。
2. JETROは、RSSの実在・具体的URL・利用規約の原文が確認できるまで、案Aのサンプル収集元候補から一旦除外することを推奨する。
3. 「AI要約・翻訳して第三者へ自動配信する」という利用形態が各機関の想定する二次利用の範囲に含まれるかは今回のWebSearchでは確認できていない。`ryo-legal-compliance`による論点整理、または問い合わせフォームでの確認を推奨する。
4. e-Gov・首相官邸・内閣府等は、規制・行政ニュースというテーマに親和性が高い可能性があるため、次回追加調査の候補とする。

## 代替案

- RSSが確認できた機関のみに限定し、JETRO対応は別タスクとして後回しにする
- 利用規約の原文確認をリョウに依頼してから収集元を確定する
- メール購読ベースの情報源（JETROニュースレター等）は、個人購読前提の性質のため案Aの対象から除外する

---

## 出典

すべてWebSearch経由（2026-08-15検索・確認）。原文は未読のため、内容の正確性は各URLへの直接アクセスによる一次確認が別途必要。

- JETRO：`https://www.jetro.go.jp/en/news/`、`https://www.jetro.go.jp/legal/`、`https://www.jetro.go.jp/biznews/subscription_back/terms.html`、`https://www.jetro.go.jp/mail/list/`
- 経済産業省：`https://www.meti.go.jp/rss/`、`https://www.meti.go.jp/main/rules.html`
- 中小企業庁：`https://www.chusho.meti.go.jp/rss/index.xml`、`https://www.chusho.meti.go.jp/riyou_kiyaku.html`、`riyou_kiyakubessi.html`
- 消費者庁：`https://www.caa.go.jp/rss/`、`https://www.caa.go.jp/terms_of_use/`
- 出入国在留管理庁・法務省：`https://www.moj.go.jp/content/rss.html`、`https://www.moj.go.jp/isa/publications/newslist/index.html`、`https://www.moj.go.jp/isa/copyright/index.html`、`index2.html`
- 政府標準利用規約・公共データ利用規約の解説：内閣官房IT総合戦略室資料、Wikipedia（参考・二次情報）
- その他：`kantei.go.jp/rss.html`、`cao.go.jp/rss/`、`mhlw.go.jp/rss/index.html`、`fsa.go.jp/kouhou/rss.html`、`gov-online.go.jp/rss/`、`e-gov.go.jp/service-policy/rssfeed.html`

---

## 未確認事項

- JETROのRSS実在有無・正式URL
- JETRO利用規約のコンテンツ種別ごとの適用範囲
- 経産省・中小企業庁・消費者庁・出入国在留管理庁の利用規約原文が「AI要約・第三者自動配信」を許容する趣旨かの条文レベル確認
- 出入国在留管理庁専用のRSS URL
- 各RSSフィードの配信範囲・更新頻度・件数上限
- e-Gov・首相官邸・内閣府・金融庁等の利用規約詳細

## 次に必要なアクション

1. 別環境またはブラウザで、JETRO`jetro.go.jp/legal/`と各機関の利用規約全文を一次確認する
2. JETROのRSS実在をページ内で直接確認する
3. 一次確認が済んだ情報源から、`ryo-legal-compliance`に「AI要約・第三者配信」という利用形態の論点整理を依頼する
4. 確認が取れた収集元のみをメイ・エイトに引き継ぐ（未確認のものは引き続きハードコードしない）
5. 本調査結果を社長に共有し、収集元候補の絞り込みについて承認を得る

**本調査はWebSearchのみによる二次情報であり、法的な適否を判断・断定するものではありません。実際の収集元の最終確定・利用規約の適法性判断は、原文の一次確認と、必要に応じた専門家確認を経てから行ってください。**
