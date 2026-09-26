# 『繋』拡張：動画管理画面バックエンド（BaaS）料金・仕様 再確認 v3

- 基準日：2026-09-26
- 事業：株式会社コホマダ（コホマダAI）
- タスク：T182（最新版再確認・v2 の未確認事項を原文で解消）
- 作成：メイ（AI Automation & Operations Architect）
- 状態：Draft（調査のみ。契約・アカウント作成・Cloud Billing アカウントのリンク・支払い方法登録は一切行っていない）
- 前版：`logs/kohomada_2026-09-26_繋_動画管理BaaS料金調査_v2.md`（残置）。v3 の変更点は末尾「v2 からの変更点」を参照。

## 出典一覧（URL・発行主体・取得日）

| # | 種別 | URL | 発行主体 | 取得日・方法・更新日 |
|---|---|---|---|---|
| S1 | 一次情報（本文直接取得） | https://firebase.google.com/pricing?hl=ja | Google（Firebase 料金ページ） | 2026-09-26 取得（`firebase.txt`、HTTP 200）。翻訳メタデータ「POT-Creation-Date: 2026-09-02」 |
| S2 | 一次情報（本文直接取得） | https://supabase.com/pricing | Supabase Inc.（Pricing） | 2026-09-26 取得（`supabase.txt`、HTTP 200）。更新日の記載なし |
| S3 | 一次情報（本文直接取得・**v3 で新規**） | https://firebase.google.com/docs/storage/faqs-storage-changes-announced-sept-2024?hl=ja | Google（Firebase Docs「Cloud Storage for Firebase の料金とデフォルト バケットの変更に関するよくある質問」） | 2026-09-26 取得（`fb_storage_faq.txt`）。ページ記載「最終更新日 2026-03-26 UTC」 |
| S4 | 一次情報（本文直接取得・**v3 で新規**） | https://cloud.google.com/storage/pricing?hl=ja | Google Cloud（Cloud Storage の料金） | 2026-09-26 取得（`gcs_pricing.txt`）。ページに最終更新日の記載なし。「料金の更新は、2022 年 10 月 1 日と 2023 年 4 月 1 日に実施」との記述あり |
| S5 | 一次情報（本文直接取得・**v3 で新規**） | https://firebase.google.com/support/faq?hl=ja | Google（Firebase よくある質問） | 2026-09-26 取得（`fb_faq.txt`）。ページ記載「最終更新日 2025-04-24 UTC」 |
| S6 | 一次情報（**本文未取得**・検索結果の要約のみ） | https://supabase.com/docs/guides/platform/free-project-pausing | Supabase Inc.（Docs） | 2026-09-26 WebSearch 要約のみ `[要追加確認]` |

S1〜S5 が根拠の主軸。S6 は検索要約のみで原文未確認。

---

## 結論

1. `[確認済み事実]` Cloud Storage for Firebase の利用には **Blaze（従量課金）プランへの登録が必須**。Blaze でも無料使用枠は維持される（S3：「Cloud Storage for Firebase を使用するにはプロジェクトが 従量課金制の Blaze のお支払いプラン に登録されていることが求められるようになりました。Blaze のお支払いプランでも、引き続き無料使用枠をご利用いただけます。」）。S1 の料金ページで Cloud Storage の Spark 列がすべて「Not applicable」であることと整合する。
2. `[確認済み事実]` 前回 hint の「2026年2月以降バケット作成にカード登録必須」は、正確には次のとおり（S3）。
   - **2024-10-30 以降**：新しいデフォルトバケットのプロビジョニングには Blaze 登録が必要。新バケットの名前形式は `PROJECT_ID.firebasestorage.app`、Google Cloud Storage の料金に従い、US-CENTRAL1／US-EAST1／US-WEST1 で「Always Free」階層が使える。
   - **2026-02-03 以降**：既存の `*.appspot.com` デフォルトバケットへのアクセス維持にも Blaze 登録が必要（当初 2025-10 予定を延長）。未アップグレードの場合、コンソールアクセスを失い API は 402／403 を返す。
   - Blaze へのアップグレードとは「プロジェクトを **Cloud Billing アカウントにリンク**する」こと（S3：「プロジェクトを従量課金制の Blaze のお支払いプランにアップグレードするには、プロジェクトを Cloud Billing アカウント にリンクする必要があります。」）。**「カード登録」という語は S3 原文にはない**。支払い方法の具体的な種類は S3・S5 に明記されておらず、クレジットカード必須とは断定できない。
3. `[確認済み事実]` 新形式バケットの無料枠と超過単価（S1・S4）：保存 5 GB-月／クラスA（アップロード等）5,000 回／クラスB（ダウンロード等）50,000 回／データ転送 100 GB/月（Always Free、US 3 リージョン合算）。超過後は Standard Storage の保存 $0.000027397/GiB-時（月換算約 $0.02/GiB `[推測]`）、インターネット向けデータ転送（アジア宛含む）$0.12/GiB（0〜10 TiB）、クラスA $0.005/1,000 回、クラスB $0.0004/1,000 回。
4. `[確認済み事実]` Blaze には**使用量上限（自動停止）の機能はない**。予算アラートのみ（S5：「いいえ、現状では Blaze プランで使用量の上限を設定することはできません。」）。ただし Cloud Storage 側では「API リクエストの上限」を設定できる（S4）。
5. `[確認済み事実]` Supabase Free：ファイルストレージ 1 GB／Egress 5 GB／Cached Egress 5 GB／最大アップロード 50 MB／1週間非アクティブで一時停止／アクティブ2プロジェクトまで。Pro $25/月〜：100 GB／250 GB／250 GB／最大 500 GB、超過 $0.0213/GB・$0.09/GB・$0.03/GB、Spend Cap がデフォルト ON（S2）。
6. `[推奨対応]` 段階別の第一候補は v2 を踏襲。PoC/UI 開発＝Supabase Free、本運用＝Firebase Blaze（新形式バケット・US リージョン）を第一候補、Supabase Pro を代替。Blaze 移行は Cloud Billing アカウントのリンク・従量課金・US 保管を伴い、社長判断事項。

---

## 確認済み事実

### 1. 比較表（原文引用付き）

#### 1-1. Firebase Cloud Storage（S1・S3・S4）

| 項目 | `*.appspot.com` legacy buckets（2024-10-30 より前に作成） | `*.firebasestorage.app` および追加バケット（2024-10-30 以降に作成） | 原文引用 |
|---|---|---|---|
| Spark での提供 | 2026-02-03 以降不可 | 不可（作成に Blaze 必要） | S1：Spark 列すべて「Not applicable」。S3：「2026 年 2 月 3 日 以降、*.appspot.com デフォルト バケットがあり、Firebase プロジェクトがまだ Spark のお支払いプランに登録されている 場合、バケットへのコンソール アクセス権が失われ、API 呼び出しで 402 エラーと 403 エラーが返されるようになります。」 |
| 新規作成の可否 | 不可（削除後も同名形式は作成不可） | Blaze 登録済みなら可 | S3：「2024 年 10 月 30 日 以降 : PROJECT_ID .appspot.com デフォルト バケットを削除すると、同じ名前形式のバケットをプロビジョニングできなくなります。」 |
| 無料枠：保存容量 | 5 GB、超過 $0.026/GB | 5 GB-月、超過 Standard Storage $0.000027397/GiB-時（表示中リージョンの毎時料金。月換算約 $0.02/GiB `[推測]`） | S1：「No-cost up to 5 GB Then $0.026/GB」／「No-cost up to 5 GB-months Then Cloud Storage pricing」。S4：「Standard Storage 5 GB-月」「$0.000027397 / 1 gibibyte hour」 |
| 無料枠：ダウンロード量 | 1 GB/日、超過 $0.12/GB | 100 GB/月、超過 $0.12/GiB（0〜10 TiB、世界各地・アジア宛とも） | S1：「No-cost up to 1 GB/day Then $0.12/GB」／「No-cost up to 100 GB/month」。S4：「北米から各 Google Cloud データ転送先（オーストラリアと中国を除く）への 100 GB のデータ転送」「アジア（中国を除く、香港は含む）へのデータ転送 0 gibibyte to 10 tebibyte $0.12 / 1 gibibyte」 |
| 無料枠：アップロード操作 | 20K/日、超過 $0.05/10K | 5K/月（クラスA）、超過 $0.005/1,000 回 | S1：「No-cost up to 20K/day Then $0.05/10K」／「No-cost up to 5K/month」。S4：「クラス A オペレーション 5,000」「Standard Storage $0.005（1,000 オペレーションあたり、フラット Namespace、単一リージョン）」 |
| 無料枠：ダウンロード操作 | 50K/日、超過 $0.004/10K | 50K/月（クラスB）、超過 $0.0004/1,000 回 | S1：「No-cost up to 50K/day Then $0.004/10K」／「No-cost up to 50K/month」。S4：「クラス B オペレーション 50,000」「$0.0004」 |
| 操作回数の数え方 | 記載なし | 再開可能アップロードは複数リクエストでも 1 クラスA。転送費はアクセスした量に基づく | S4：「JSON API または gRPC を使用して実行される単一オブジェクトの 書き換え または 再開可能なアップロード は、完了に複数のリクエストが必要な場合でも、1 つのクラス A オペレーションとして課金されます。」「データ転送費用 と 取得料金 は、オブジェクト全体のサイズではなく、アクセスされたデータの量に基づきます。」 |
| 最大ファイルサイズ | 記載なし `[未確認]` | 記載なし `[未確認]` | S1・S3・S4 の取得本文に上限の記載なし |
| 無料枠の条件：リージョン | 記載なし | **US-CENTRAL1／US-EAST1／US-WEST1 のみ、3リージョン合算** | S4：「Cloud Storage の Always Free の割り当ては、US-WEST1、US-CENTRAL1、US-EAST1 の各 リージョン の使用量に適用されます。使用量はこの 3 つのリージョン全体で集計されます。」 |
| 無料枠の条件：課金プラン | Blaze 必須（2026-02-03 以降） | Blaze 必須 | S3：「Cloud Storage for Firebase を使用するには、 従量課金制の Blaze のお支払いプラン が必要になりました。」 |
| Blaze 登録の要件 | 同右 | Cloud Billing アカウントのリンク。IAM ロール「オーナー」が必要 | S3：「プロジェクトを従量課金制の Blaze のお支払いプランにアップグレードするには、プロジェクトを Cloud Billing アカウント にリンクする必要があります。」「料金プランをアップグレードするには、プロジェクトの IAM ロールが オーナー である必要があります。」 |
| 無料枠のリセット | 日次 | 日次（S1）。Always Free は月次上限（S4） | S1：「No-cost limits are enforced daily and refreshed at midnight.」S4：「1 か月あたりの無料使用量上限」 |
| 支出上限 | なし。予算アラートのみ | 同左＋Cloud Storage の API リクエスト上限 | S5：「いいえ、現状では Blaze プランで使用量の上限を設定することはできません。」「Blaze ユーザーはプロジェクトまたはアカウントの予算を定義し、支出がこうした上限に近づいた場合にアラートを受け取ることができます。」S4：「Always Free の使用量上限を超えて課金されるのを防ぐために、 API リクエストの上限 を設定できます。」 |
| 無料トライアル | Google Cloud 無料トライアル（$300・90日） | 同左 | S5：「$300 分の無料 Cloud Billing クレジットを含む 90 日間の無料トライアル期間」「無料トライアルの有効期限が切れた後、無料トライアルの Cloud Billing アカウントを有料アカウントにアップグレードしていない場合 、リンクされた Firebase プロジェクトは自動的に Spark お支払いプランにダウングレード されます。」 |

付随サービス（Spark・Blaze 共通の無料枠、S1）：Cloud Firestore Standard 保存 1 GiB／egress 10 GiB/月／書込 20K/日／読取 50K/日、Authentication 50K MAU、Cloud Functions 呼び出し 2百万/月・Outbound 5 GB/月（超過 $0.12/GB）、Hosting 保存 10 GB・転送 360 MB/日（超過 $0.15/GB）。

#### 1-2. Supabase（S2）— v2 と同一

| 項目 | Free | Pro（$25/月〜） | 原文引用（S2） |
|---|---|---|---|
| 月額 | $0 | $25/月（1プロジェクト込み、追加 $10/月〜） | 「Start for Free $ 0 / month」／「From $ 25 / month First project included. Additional projects from $10/mo.」 |
| ファイルストレージ | 1 GB | 100 GB、超過 $0.0213/GB | 「1 GB file storage」／「100 GB file storage then $0.0213 per GB」 |
| Egress（非キャッシュ） | 5 GB | 250 GB、超過 $0.09/GB | 「5 GB egress」／「250 GB egress then $0.09 per GB」 |
| Cached Egress（CDN キャッシュヒット分） | 5 GB | 250 GB、超過 $0.03/GB | 「5 GB cached egress」／「250 GB cached egress then $0.03 per GB」 |
| 最大アップロードサイズ | **50 MB** | 500 GB | 「Max file upload size 50 MB / 500 GB」 |
| CDN | Basic CDN | Smart CDN | 「Content Delivery Network Basic CDN / Smart CDN」 |
| 操作回数上限 | 記載なし（API requests Unlimited） | 同左 | 「Unlimited API requests」 |
| データベース | 500 MB | 8 GB、超過 $0.125/GB | 「500 MB database size」／「8 GB disk size per project then $0.125 per GB」 |
| MAU | 50,000 | 100,000、超過 $0.00325/MAU | 「50,000 monthly active users」／「100,000 monthly active users then $0.00325 per MAU」 |
| 一時停止 | 1週間非アクティブで停止、アクティブ2プロジェクトまで | Never | 「Free projects are paused after 1 week of inactivity. Limit of 2 active projects.」 |
| リージョン条件 | 記載なし `[未確認]` | 記載なし | — |
| カード登録要否 | 記載なし `[未確認]` | 記載なし | — |
| 支出上限 | — | Spend Cap デフォルト ON | 「The Pro Plan has a spend cap enabled by default to keep costs under control.」 |
| バックアップ | なし | 日次・7日保持 | 「Automatic backups Not included in free / 7 days」 |

### 2. 前回 hint との差分（v3 確定版）

| 前回 hint の記述 | 照合結果 | 判定 |
|---|---|---|
| 「Firebase Spark無料枠(Storage5GB…)」 | Cloud Storage は Spark では利用不可（S1・S3）。5 GB の無料枠は Blaze 上で維持される無料使用枠。 | **不一致**（プラン帰属の誤り） |
| 「転送量約30GB相当」 | legacy `*.appspot.com` の「1 GB のダウンロード/日」（S3・S1）の月換算と推定 `[推測]`。新形式バケットは 100 GB/月（S1・S4）。 | **legacy のみ該当。新規構築では 100 GB/月** |
| 「2026年2月以降バケット作成にカード登録必須」 | 正確には：(a) 新規バケット作成に Blaze 必須は **2024-10-30 以降**、(b) **2026-02-03** は既存 `*.appspot.com` バケットのアクセス維持期限、(c) Blaze 登録＝**Cloud Billing アカウントのリンク**。「カード登録」の語は原文になし（S3）。 | **表現を置き換え**（日付の対象・要件の内容とも修正） |
| 「Supabase Free無料枠(Storage1GB/Egress5GB)」 | 一致。Cached Egress 5 GB・最大 50 MB・1週間停止が hint に未記載。 | **一致（補足あり）** |
| 「Storage容量はFirebaseが優位」 | 5 GB vs 1 GB で数値上は優位。Blaze 必須・US リージョン限定の条件付き。 | **条件付きで一致** |
| 「動画配信は転送量消費が早く早期有料化の可能性あり」 | Supabase Free は 5+5 GB で早期超過。Firebase 新形式は 100 GB/月で余裕。 | **一致（Firebase 側は緩和方向）** |

### 3. 情報源間の矛盾（隠さず記録）

- S5（Firebase 一般 FAQ、最終更新 2025-04-24）には「Cloud Storage for Firebase は、 App Engine の無料枠にデフォルトのバケットを作成します。そのため、クレジット カード番号を入力したり、 Cloud Billing アカウントを有効にしたりすることなく、Firebase と Cloud Storage for Firebase をすばやく起動し、実行することができます。」という記述が残っている。これは S3（最終更新 2026-03-26）の「Blaze 必須」と矛盾する。**S3 の方が新しく、当該変更に特化したページ**であるため S3 を優先し、S5 の当該箇所は更新前の記述と判断する `[推測]`。
- v2 で記録した「検索要約では新バケット名が appspot.com」という矛盾は、S3 原文により **`PROJECT_ID.firebasestorage.app` が正**と確定（検索要約側の転記誤り）。

---

## 推測・仮説

- `[推測]` 「約30GB相当」は legacy バケットの 1 GB/日 × 30 日。
- `[推測]` Standard Storage の月額換算：$0.000027397/GiB-時 × 730 時間 ≈ $0.020/GiB-月。S4 のデュアルリージョン説明文にも「1 GB あたり月額 $0.022」の例があり、桁として整合。S4 テキストの毎時料金表がどのリージョン表示時のものかは明示されていない（既定表示が Iowa (us-central1) と推定）。
- `[推測]` S4 の Always Free「北米から各 Google Cloud データ転送先（オーストラリアと中国を除く）への 100 GB」は、日本のエンドユーザーへのインターネット配信にも適用されると解釈できる（除外がオーストラリア・中国のみのため）。S1 の「No-cost up to 100 GB/month」もこれに対応すると考えられるが、S4 の文言は「Google Cloud データ転送先」であり、インターネット向け egress への適用範囲は `[要追加確認]`。
- `[仮定]` 動画ストリーミングの Range リクエストは、S4 の記述（転送費は「アクセスされたデータの量」ベース）から、転送量は実際に読まれた分のみ課金される。操作回数（クラスB）の数え方は S4 の取得本文に Range 固有の記述がなく `[未確認]`。

---

## 分析

### 4. 動画配信での無料枠超過の目安（試算・v2 踏襲＋超過単価を反映）

`[仮定]` 動画1本 50 MB／月間視聴 100 回（フル視聴・キャッシュヒットなし）／月間アップロード 10 本／1 GB ≒ 1 GiB として概算。『繋』の実仕様は `[要ヒアリング]`。

| 指標 | 月間消費 | Firebase 新形式（Blaze・US） | Firebase legacy（参考） | Supabase Free | Supabase Pro |
|---|---|---|---|---|---|
| 転送量 | 5 GB/月 | 100 GB/月 → 約 2,000 視聴まで無料。超過 $0.12/GiB | 1 GB/日 → 1日 20 視聴まで無料。超過 $0.12/GB | Egress 5 GB → 100 視聴で上限（キャッシュヒット分は Cached 5 GB へ、最大約 200 視聴） | 250+250 GB → 約 5,000〜10,000 視聴 |
| 保存容量 | 0.5 GB/月 累積 | 5 GB-月 → 約 100 本（10か月）。超過約 $0.02/GiB-月 `[推測換算]` | 5 GB → 同上。超過 $0.026/GB | 1 GB → 20 本（2か月） | 100 GB → 約 2,000 本 |
| 最大ファイルサイズ | 50 MB/本 | 記載なし `[未確認]` | 同左 | **50 MB 上限** | 500 GB |
| 操作回数 | アップ 10、DL 100〜 | クラスA 5K/月・クラスB 50K/月 → 余裕。超過 $0.005／$0.0004 per 1,000 | 20K/日・50K/日 → 余裕 | 上限記載なし | 同左 |
| 超過後の月額目安（10倍＝月1,000視聴・50 GB 時） | — | 無料枠内（$0） | 1 GB/日超過分に $0.12/GB | 不可（Free 継続不可） | 枠内（$25 固定） |
| 超過後の月額目安（100倍＝月10,000視聴・500 GB 時） | — | (500−100) GiB × $0.12 ≈ **$48/月** | (500−30) × $0.12 ≈ $56/月 | 不可 | Spend Cap ON なら停止／OFF なら (500−250) × $0.09 ≈ $22.5 + $25 ≈ **$47.5/月**（キャッシュ率 0 の場合） |

超過タイミング：
- Supabase Free：保存は 2か月目、転送は月 100 視聴で上限。50 MB 制限が動画に厳しい。UI 開発・小サンプル PoC 専用。
- Firebase 新形式（Blaze）：仮定規模なら月額 $0 の可能性が高い。ただし支出上限機能はなく、予算アラートと API リクエスト上限で防御する。
- Supabase Pro：仮定規模では枠内・$25 固定。

### 5. 設計上の論点（v2 踏襲＋更新）

- **リージョン／データ所在**：Firebase の Always Free は US 3 リージョン合算（S4）。東京リージョン（asia-northeast1、S4 のリージョン一覧に存在）を選ぶと無料枠なし・全量課金。
- **CDN**：Supabase は Free で Basic CDN、Pro で Smart CDN（S2）。Cloud Storage 単体では CDN は別サービス（S4：「Cloud CDN の場合、Cloud Storage のデータ転送料金は免除されますが、キャッシュ フィル料金が適用される場合があります。」）。Cloud CDN の料金は本調査の対象外 `[要追加調査]`。
- **費用の上限管理**：Supabase Pro は Spend Cap デフォルト ON（S2）。Firebase Blaze は使用量上限なし・予算アラートのみ（S5）、Cloud Storage の API リクエスト上限設定は可（S4）。
- **一時停止リスク**：Supabase Free は 1 週間非アクティブで停止（S2）。復元可能期間は S6 要約で「1年」とあるが原文未確認。
- **メタデータ・認証**：両者とも管理画面規模では無料枠で十分。

---

## リスク・注意点

1. Firebase で Storage を使う時点で Blaze（Cloud Billing アカウントのリンク）が必須。無料枠内なら $0 だが、超過時は自動課金され、Blaze 自体には使用量上限がない（S5）。
2. Firebase 無料枠は US 3 リージョン限定（S4）。東京リージョンでは無料枠なし。
3. Supabase Free の 50 MB 上限・1 GB・1週間停止は動画用途では実運用に耐えない可能性が高い。
4. 料金・無料枠は改定される（S1 に 2025-08-01／2026-09-01 の改定注記、S3 に期限延長の履歴、S4 に「Always Free の内容は変更される場合があります。」）。契約前に再確認すること。
5. S5 には更新前と見られる記述（カード不要）が残っており、古い解説記事等を根拠に「Spark で Storage が使える」と判断しないこと。
6. 動画に顧客・第三者が映る場合、海外リージョンへの保存は `.claude/rules/security-policy.md`・承認ポリシーの「個人情報の外部ツールへの入力」に該当しうる `[要確認]`。

---

## 推奨案

`[推奨対応]` v2 を踏襲。

| 段階 | 第一候補 | 理由 | 条件 |
|---|---|---|---|
| フェーズ0：UI・機能開発、小サンプル動画での PoC | **Supabase Free** | カード不要（S2 に支払い方法の記載なし `[未確認]`）・$0。DB/Auth/Storage/Edge Functions が1プロジェクトで揃う | 50 MB 以下のサンプルに限定。週1回以上のアクセスで停止回避 |
| フェーズ1：実動画での本運用（仮定規模） | **Firebase Blaze（`*.firebasestorage.app`・us-central1 等）** | 無料枠 5 GB／100 GB/月が大きく、仮定規模なら月額 $0 の可能性が高い。100倍規模でも約 $48/月と Supabase Pro と同水準 | Cloud Billing アカウントのリンク・従量課金・US 保管の承認。予算アラート＋API リクエスト上限を必ず設定 |
| フェーズ1 の代替 | **Supabase Pro（$25/月）** | Spend Cap ON で費用固定。CDN 込み。フェーズ0 からの移行が同一基盤 | 月 $25 の固定費を許容 |

判断の分岐点：
- 「固定費ゼロ最優先・Cloud Billing リンクと US 保管を許容」→ Firebase Blaze
- 「費用上限を確実に固定・日本外保管を避けたい可能性・開発基盤を1つに統一」→ Supabase（Free → Pro）

## 代替案

- `[代替案]` 動画本体のみ動画専用ホスティング／CDN に置き、BaaS はメタデータ・認証のみ。候補の料金は `[要追加調査]`。
- `[代替案]` YouTube 限定公開等を配信面に使い、管理画面は URL 管理のみ。アクセス制御・ブランド要件は `[要ヒアリング]`。

---

## 人間の承認が必要な事項（契約・登録は行っていない）

`.claude/rules/approval-policy.md` に基づき、以下はすべて社長の判断・実行事項。本レポートではいずれも実施していない。

1. Firebase プロジェクトの Blaze アップグレード＝Cloud Billing アカウントの作成・リンク（支払い方法の登録を伴う。方法の種類は S3・S5 に明記なし）
2. Google Cloud 無料トライアル（$300・90日）の申込可否（S5。トライアル終了後に有料アカウントへ未移行なら Spark へ自動ダウングレード＝Storage 利用不可になる点に注意）
3. Supabase アカウント／プロジェクト作成（Free 含む）、および Pro プラン契約（$25/月）
4. 動画の保管リージョン（US か日本か）の決定。顧客・第三者が映る動画を海外リージョンへ保存する場合は個人情報の外部入力として承認対象
5. 決定後の n8n 等からの本番接続（`n8n-automation/CLAUDE.md` の運用ルールに従う）

---

## 未確認事項（v3 時点で残るもの）

- `[未確認]` Blaze／Cloud Billing アカウントに登録できる支払い方法の種類（クレジットカード以外の可否）。S3・S5 に明記なし
- `[未確認]` Firebase Cloud Storage の最大ファイルサイズ。Range リクエスト時のクラスB 操作回数の数え方
- `[要追加確認]` S4 の Always Free「100 GB のデータ転送」がインターネット向け（日本の視聴者向け）egress に適用されるかの明文
- `[未確認]` S4 毎時料金表のリージョン帰属（既定表示が us-central1 と推定）。月額表示は取得本文に含まれず換算値
- `[未確認]` Supabase Free 登録時のカード要否、東京リージョンの有無、無料枠超過時の挙動、停止後の復元可能期間（S6 原文未取得）
- `[要ヒアリング]` 『繋』の動画仕様（本数・1本のサイズ・尺・月間視聴数・視聴者の所在・動画に映る人物の有無）

### v2 で「未確認」だったが v3 で解消したもの

| v2 の未確認事項 | v3 での確定内容 | 出典 |
|---|---|---|
| S3（Firebase FAQ）の原文：2026-02-03 の文言・対象 | 2026-02-03 は既存 `*.appspot.com` バケットのアクセス維持期限。新規作成の Blaze 必須は 2024-10-30 以降。未対応時は 402／403 | S3 |
| 新形式バケットの無料枠超過後の Cloud Storage 単価 | Standard Storage $0.000027397/GiB-時（≈$0.02/GiB-月）、egress $0.12/GiB（0〜10 TiB）、クラスA $0.005／クラスB $0.0004 per 1,000 | S4 |
| Firebase Blaze の支出上限の有無 | 使用量上限なし。予算アラートのみ。Cloud Storage 側で API リクエスト上限は設定可 | S5・S4 |
| Blaze 登録の要件 | Cloud Billing アカウントのリンク、IAM オーナー権限 | S3 |
| $300 無料クレジットの条件 | Google Cloud 無料トライアル（90日・$300）。期限後未移行なら Spark へ自動ダウングレード | S5 |
| 検索要約の「新バケット名が appspot.com」矛盾 | `PROJECT_ID.firebasestorage.app` が正 | S3 |

## 次に必要なアクション

1. 社長：『繋』の動画仕様（`[要ヒアリング]`）を確定する
2. アオイ：本レポート（v3）の監査（出典・数値・断定表現）
3. 社長：フェーズ0 を Supabase Free で始めるか、最初から Blaze／Pro に進むかを決定（承認事項 1〜4）
4. リサ（任意）：Supabase Docs（Pausing／Billing FAQ）原文と Cloud CDN 料金の取得（残る未確認事項の解消）
5. エイト：決定後、管理画面と n8n の連携設計（アップロード通知・メタデータ登録等）に着手

---

## v2 からの変更点

1. 前回 hint「2026年2月以降バケット作成にカード登録必須」を S3 原文に基づき置換：新規バケット作成の Blaze 必須は 2024-10-30 以降、2026-02-03 は既存 `*.appspot.com` バケットのアクセス維持期限、Blaze 登録＝Cloud Billing アカウントのリンク（「カード登録」の語は原文になし）。
2. v2 の未確認事項のうち 6 件（FAQ 原文・超過単価・支出上限・Blaze 登録要件・$300 クレジット条件・バケット名の矛盾）を S3・S4・S5 の原文で `[確認済み事実]` に移行。試算表に超過単価を反映（100倍規模で Firebase 約 $48/月）。
3. S5 に残る更新前の記述（「クレジット カード番号を入力…することなく」）と S3 の矛盾を「情報源間の矛盾」節に明記し、S3 を優先する判断理由を記載。推奨案・承認事項は v2 を踏襲しつつ、Blaze の支出上限なし（予算アラート＋API リクエスト上限で防御）を条件に追記。
