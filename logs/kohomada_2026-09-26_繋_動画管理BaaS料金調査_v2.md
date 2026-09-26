# 『繋』拡張：動画管理画面バックエンド（BaaS）料金・仕様 再確認 v2

- 基準日：2026-09-26
- 事業：株式会社コホマダ（コホマダAI）
- タスク：T182（最新版再確認）
- 作成：メイ（AI Automation & Operations Architect）
- 状態：Draft（調査のみ。契約・アカウント作成・カード登録は一切行っていない）
- 前版：v1 の成果物ファイルは本リポジトリに存在しない。比較対象は `office/state.js` の T182 `hint` 文のみ。

## 出典一覧（URL・発行主体・取得日）

| # | 種別 | URL | 発行主体 | 取得日・方法 |
|---|---|---|---|---|
| S1 | 一次情報（本文を直接取得） | https://firebase.google.com/pricing?hl=ja | Google（Firebase 料金ページ） | 2026-09-26、秘書アイがHTTP取得しプレーンテキスト化（scratchpad `firebase.txt`、HTTP 200）。本文中の翻訳メタデータに「POT-Creation-Date: 2026-09-02」とあり、ページ生成は2026-09-02以降と推定 |
| S2 | 一次情報（本文を直接取得） | https://supabase.com/pricing | Supabase Inc.（Pricing） | 2026-09-26、同上（`supabase.txt`、HTTP 200）。ページ上に更新日の記載なし |
| S3 | 一次情報（**本文未取得**・検索結果の要約のみ） | https://firebase.google.com/docs/storage/faqs-storage-changes-announced-sept-2024 | Google（Firebase Docs FAQ） | 2026-09-26、WebSearch の結果要約のみ。本セッションでは直接取得できていないため `[要追加確認]` |
| S4 | 一次情報（**本文未取得**・検索結果の要約のみ） | https://supabase.com/docs/guides/platform/free-project-pausing | Supabase Inc.（Docs） | 同上 `[要追加確認]` |
| S5 | 一次情報（**本文未取得**・検索結果の要約のみ） | https://supabase.com/blog/storage-500gb-uploads-cheaper-egress-pricing | Supabase Inc.（Blog、2025-07頃と検索要約に記載） | 同上 `[要追加確認]` |

S1・S2 が本レポートの根拠の主軸。S3〜S5 は検索エンジンの要約経由であり、原文の文言・日付は未確認として扱う。

---

## 結論

1. `[確認済み事実]` Firebase の料金ページ（S1）では、Cloud Storage の全項目が **Spark（無料）プラン列で「Not applicable」** となっており、無料枠（保存5GB／ダウンロード100GB/月 等）はいずれも **Blaze（従量課金）プランの列**に記載されている。つまり「Spark 無料枠で Storage 5GB」という前回 hint の表現は現ページと一致しない（Storage を使うには Blaze が前提）。
2. `[確認済み事実]` Firebase の新形式バケット（`*.firebasestorage.app` および追加バケット）の無料枠は **保存 5 GB-months／ダウンロード 100 GB/月／アップロード操作 5K/月／ダウンロード操作 50K/月**。ただし **無料枠は us-central1・us-west1・us-east1 のバケットのみ**（S1 明記）。
3. `[確認済み事実]` Supabase Free は **ファイルストレージ 1 GB／Egress 5 GB／Cached Egress 5 GB／最大アップロード 50 MB／1週間非アクティブで一時停止／アクティブ2プロジェクトまで**（S2）。Pro は $25/月〜で **100 GB／250 GB／250 GB／最大 500 GB**、超過単価はそれぞれ $0.0213/GB・$0.09/GB・$0.03/GB。
4. 前回 hint の「転送量約30GB相当」は現ページに直接の記載なし。旧形式 `*.appspot.com` バケットの「1 GB/日」から月換算した推定値と考えられる（`[推測]`）。新形式バケットでは 100 GB/月。
5. 前回 hint の「2026年2月以降バケット作成にカード登録必須」は **料金ページ（S1）には記載なし**。検索結果要約（S3）では「2026-02-03 以降、`appspot.com` デフォルトバケットの利用継続に Blaze が必要」「未作成のデフォルトバケットは Blaze でないと作成不可」との記述があるが、原文未取得のため `[要追加確認]`。「カード登録」は Blaze＝Cloud Billing アカウント必須からの推論であり、料金ページの明文ではない。
6. `[推奨対応]` 第一候補は **段階別**とする（詳細は「推奨案」節）。PoC/UI開発段階＝Supabase Free（カード不要）。本運用段階＝Firebase Blaze（us リージョン・新形式バケット）を第一候補、Supabase Pro を代替。ただし Blaze 移行はカード登録・従量課金の承認が必要で、社長判断事項。

---

## 確認済み事実

### 1. 動画管理バックエンド用途に関係する項目の比較表（原文引用付き）

#### 1-1. Firebase（S1）

| 項目 | `*.appspot.com` legacy buckets | `*.firebasestorage.app` and any additional buckets | 原文引用（S1） |
|---|---|---|---|
| Spark プランでの提供 | Not applicable | Not applicable | Spark列：Cloud Storage の全行が「Not applicable」 |
| 無料枠：保存容量（Blaze） | 5 GB、超過 $0.026/GB | 5 GB-months、超過は Cloud Storage pricing（単価はページ未記載） | 「GB（保存） No-cost up to 5 GB Then $0.026/GB」／「No-cost up to 5 GB-months Then Cloud Storage pricing」 |
| 無料枠：ダウンロード量（Blaze） | 1 GB/日、超過 $0.12/GB | 100 GB/月、超過は Cloud Storage pricing（単価未記載） | 「GB（ダウンロード） No-cost up to 1 GB/day Then $0.12/GB」／「No-cost up to 100 GB/month Then Cloud Storage pricing」 |
| 無料枠：アップロード操作 | 20K/日、超過 $0.05/10K | 5K/月、超過は Cloud Storage pricing | 「アップロード オペレーション No-cost up to 20K/day Then $0.05/10K」／「No-cost up to 5K/month Then Cloud Storage pricing」 |
| 無料枠：ダウンロード操作 | 50K/日、超過 $0.004/10K | 50K/月、超過は Cloud Storage pricing | 「ダウンロード オペレーション No-cost up to 50K/day Then $0.004/10K」／「No-cost up to 50K/month Then Cloud Storage pricing」 |
| 最大ファイルサイズ | ページに記載なし | ページに記載なし | `[未確認]`（料金ページには記載がない。Cloud Storage 側の上限は別ドキュメント要確認） |
| 無料枠の条件：リージョン | 記載なし | **us-central1, us-west1, us-east1 のみ** | 「Note: No-cost quotas are only available for buckets in the following regions: us-central1 , us-west1 , us-east1 .」 |
| 無料枠の条件：課金方式 | Blaze。App Engine 使用料として処理 | Blaze。Cloud Storage 使用料として処理 | 「On the Blaze plan, fees are based on usage volume: • For the default *.appspot.com bucket, fees are processed as Google App Engine usage fees . • For the default *.firebasestorage.app bucket and any additional buckets, fees are processed as Google Cloud Storage usage fees .」 |
| 無料枠のリセット | 日次 | 日次 | 「No-cost limits are enforced daily and refreshed at midnight.」／脚注「No-cost usage on Blaze plan is calculated daily.」 |
| 複数バケット | — | Blaze で可（Spark は Not applicable） | 「プロジェクトごとに複数のバケット Not applicable / check」 |
| カード登録要否 | Spark：「No payment method needed」 | Blaze：ページに明文なし | Spark列「No payment method needed」。Blaze 列に支払方法の記載はない（Blaze＝従量課金のため課金アカウントが必要と**推論**されるが、S1 に明文なし） |
| 非アクティブ時の停止 | 記載なし | 記載なし | Cloud Storage については記載なし（Cloud SQL 無料トライアルにのみ「archived / deleted」の記載あり） |

付随サービス（Spark・Blaze 共通の無料枠、S1）：
- Cloud Firestore Standard：保存 1 GiB、Network egress 10 GiB/月、書込 20K/日、読取 50K/日、削除 20K/日（メタデータ管理に利用可）
- Authentication（Identity Platform 除く）：「No-cost up to 50K MAUs」
- Cloud Functions：呼び出し 2百万/月、Outbound networking 5 GB/月（超過 $0.12/GB）
- Hosting：保存 10 GB、データ転送 360 MB/日（超過 $0.15/GB）
- Blaze：「If eligible, get $300 in free credit」（適用条件はページ未記載 `[未確認]`）
- 脚注：「No-cost usage quotas apply at the project-level, not at the app-level or for individual resources.」

#### 1-2. Supabase（S2）

| 項目 | Free | Pro（$25/月〜） | 原文引用（S2） |
|---|---|---|---|
| 月額 | $0 | $25/月（1プロジェクト込み、追加は $10/月〜） | 「Start for Free $ 0 / month」／「From $ 25 / month First project included. Additional projects from $10/mo.」 |
| ファイルストレージ | 1 GB | 100 GB、超過 $0.0213/GB | 「1 GB file storage」／「100 GB file storage then $0.0213 per GB」 |
| Egress（非キャッシュ） | 5 GB | 250 GB、超過 $0.09/GB | 「5 GB egress」／「250 GB egress then $0.09 per GB」 |
| Cached Egress（CDNキャッシュヒット分・Storageのみ） | 5 GB | 250 GB、超過 $0.03/GB | 「5 GB cached egress」／「250 GB cached egress then $0.03 per GB」 |
| 最大アップロードサイズ | **50 MB** | 500 GB | 「Max file upload size 50 MB / 500 GB / 500 GB / Custom」 |
| CDN | Basic CDN | Smart CDN | 「Content Delivery Network Basic CDN / Smart CDN」 |
| アップロード／ダウンロード操作回数の上限 | 記載なし（API requests は Unlimited） | 同左 | 「Unlimited API requests」。Storage 操作回数の課金項目はページに存在しない |
| データベース | 500 MB | 8 GB、超過 $0.125/GB | 「500 MB database size」／「8 GB disk size per project then $0.125 per GB」 |
| MAU | 50,000 | 100,000、超過 $0.00325/MAU | 「50,000 monthly active users」／「100,000 monthly active users then $0.00325 per MAU」 |
| Edge Functions | 500,000 呼び出し | 2 Million、超過 $2/1M | 「Invocations 500,000 included / 2 Million included then $2 per 1 Million」 |
| 無料枠の条件：一時停止 | **1週間非アクティブで一時停止**、アクティブ2プロジェクトまで | 「Never」 | 「Free projects are paused after 1 week of inactivity. Limit of 2 active projects.」／「Pausing After 1 week of inactivity / Never」 |
| 無料枠の条件：リージョン | 記載なし | 記載なし | リージョンによる無料枠制限の記載はない（`[未確認]`：東京リージョンの有無自体はページに記載なし） |
| カード登録要否 | 記載なし | 記載なし | 料金ページに支払方法の記載はない。Free は「$0」だが登録時のカード要否は `[未確認]` |
| 支出上限 | — | **Spend Cap がデフォルトON** | 「The Pro Plan has a spend cap enabled by default to keep costs under control. If you want to scale beyond the plan's included quota, simply switch off the spend cap to pay for additional resources.」 |
| バックアップ | なし | 日次・7日保持 | 「Automatic backups Not included in free / 7 days」 |
| 画像変換 | なし | 100 origin images 込み、超過 $5/1000 | 「Image Transformations Not included in free / 100 origin images included then $5 per 1000 origin images」（動画には非該当） |

### 2. 前回 hint との差分

| 前回 hint の記述 | 現ページとの照合結果 | 判定 |
|---|---|---|
| 「Firebase Spark無料枠(Storage5GB…)」 | S1 では Cloud Storage は Spark 列がすべて「Not applicable」。5 GB の無料枠は **Blaze 列**に記載（legacy：「5 GB」、新形式：「5 GB-months」）。 | **不一致**（数値は一致するが、プラン帰属が誤り。Storage 利用には Blaze が前提） |
| 「転送量約30GB相当」 | S1 に「30GB」の記載なし。legacy `*.appspot.com` の「No-cost up to 1 GB/day」を月換算（×30）した推定値と考えられる `[推測]`。新形式 `*.firebasestorage.app` は「No-cost up to 100 GB/month」。 | **根拠が現ページに直接なし**。新形式バケットでは 100 GB/月に更新が必要 |
| 「2026年2月以降バケット作成にカード登録必須」 | S1（料金ページ）に該当記述なし。S3（FAQ、検索要約のみ）では「2026-02-03 以降、`appspot.com` デフォルトバケットの利用継続に Blaze が必要」「未作成のデフォルトバケットは Blaze でないと作成不可（2024-10-30 以降）」との要約。「カード登録」の語は S1・S3 要約のいずれにもなく、Blaze＝課金アカウント必須からの推論。 | **現ページに記載なし・要追加確認**（S3 原文の直接取得が必要。日付・対象バケットの正確な文言は未確認） |
| 「Supabase Free無料枠(Storage1GB/Egress5GB)」 | S2 と一致。ただし **Cached Egress 5 GB が別枠**で存在し、**最大アップロード 50 MB**、**1週間非アクティブで一時停止**の制約が hint に含まれていない。 | **一致（補足事項あり）** |
| 「Storage容量はFirebaseが優位」 | 数値上は 5 GB vs 1 GB で Firebase 優位。ただし Firebase 側は Blaze 前提・US リージョン限定という条件付き。 | **条件付きで一致** |
| 「動画配信は転送量消費が早く早期有料化の可能性あり」 | 方向性は妥当。ただし新形式 Firebase バケットは 100 GB/月と余裕があり、Supabase Free は 5+5 GB で早期超過しやすい（試算は次節）。 | **一致（Firebase 側は緩和方向、Supabase 側は厳しめ）** |

なお S3 の検索要約には「新デフォルトバケット名は `PROJECT_ID.appspot.com`（旧 `firebasestorage.app`）」という記述が含まれていたが、S1 の料金ページが `*.appspot.com` を「legacy buckets」と明示しているため **矛盾**する。S1（直接取得した一次情報）を優先し、S3 要約側の記述は転記誤りの可能性が高いと判断するが、原文未確認のため矛盾として記録する。

---

## 推測・仮説

- `[推測]` 「約30GB相当」は legacy バケットの 1 GB/日 × 30 日の換算値。
- `[推測]` Firebase Blaze へのアップグレードには Google Cloud の課金アカウント（支払い方法の登録）が必要と考えられる。S1 には明文がなく、Google Cloud 側ドキュメントの確認が必要。
- `[推測]` 新規 Firebase プロジェクトでは legacy `*.appspot.com` バケットは作成できず、新形式 `*.firebasestorage.app` のみになると考えられる（S3 要約ベース）。したがって新規構築時に実際に効く無料枠は「5 GB-months／100 GB/月／US リージョン限定」の方。
- `[仮定]` 動画ストリーミングでは Range リクエスト等により 1 視聴が複数の「ダウンロード操作」としてカウントされる可能性がある。操作回数の計上ルールは S1 に記載がなく未確認。

---

## 分析

### 3. 動画配信での無料枠超過の目安（試算）

`[仮定]` 前提（すべて仮置き。『繋』の実際の動画本数・尺・視聴数は `[要ヒアリング]`）：
- 動画1本 = 50 MB
- 月間視聴 = 100 回（すべてフル視聴・キャッシュヒットなし＝最も厳しい条件）
- 月間アップロード = 10 本（累積で保存容量が増える）
- 1 GB = 1,000 MB として概算（GiB/GB の差は無視）

| 指標 | 月間消費（仮定） | Firebase 新形式バケット（Blaze・US リージョン） | Firebase legacy バケット（参考） | Supabase Free | Supabase Pro |
|---|---|---|---|---|---|
| 転送量 | 50 MB × 100 = **5 GB/月** | 無料枠 100 GB/月 → 約 **2,000 視聴/月**まで無料 | 1 GB/日 → 1日あたり **20 視聴**まで無料（日次リセット、集中視聴日に超過しやすい） | Egress 5 GB → **100 視聴でちょうど上限**。CDN キャッシュヒット分は Cached Egress 5 GB に計上されるため、キャッシュ率次第で最大約 200 視聴 | 250 GB + 250 GB → 約 5,000〜10,000 視聴 |
| 保存容量 | 50 MB × 10 本/月 = **0.5 GB/月 累積** | 5 GB-months → 約 **100 本（10か月）**で上限 | 5 GB → 同上 | 1 GB → **20 本（2か月）**で上限 | 100 GB → 約 2,000 本 |
| 最大ファイルサイズ | 50 MB/本 | ページに記載なし `[未確認]` | 同左 | **50 MB が上限**。50 MB を1バイトでも超える動画はアップロード不可 | 500 GB |
| 操作回数 | アップ 10 回、ダウンロード 100〜（Range で増加の可能性） | アップ 5K/月・DL 50K/月 → 余裕 | アップ 20K/日・DL 50K/日 → 余裕 | 上限記載なし（API requests Unlimited） | 同左 |
| 超過後の月額目安 | — | Cloud Storage pricing（単価は S1 に未記載 `[未確認]`） | 転送 $0.12/GB、保存 $0.026/GB | 超過分は課金されない設計（Free のまま超過した場合の挙動は S2 に明記なし `[未確認]`） | Spend Cap ON なら $25 固定。OFF なら Egress $0.09/GB・Cached $0.03/GB・保存 $0.0213/GB |

超過タイミングの目安（上記仮定下）：
- **Supabase Free**：保存容量は **2か月目**、転送量は **月100視聴の時点**で上限。加えて 50 MB 制限により、動画の尺・画質に強い制約。実質「UI 開発・小さなサンプル動画での PoC 専用」。
- **Firebase 新形式（Blaze）**：保存容量は **約10か月目**（100本蓄積時）、転送量は月 2,000 視聴まで無料。仮定の規模なら **月額 $0 で運用できる可能性が高い**が、Blaze なので上限超過時は自動的に従量課金される。
- **Supabase Pro**：仮定の規模では上限に到達しない。月 $25 固定（Spend Cap ON）。

視聴が10倍（月 1,000 視聴 = 50 GB）になった場合：Firebase 新形式は依然無料枠内、Supabase Free は不可、Supabase Pro は枠内。

### 4. 設計上の論点

- **リージョン／データ所在**：Firebase の無料枠は US 3 リージョン限定。日本国内向け動画配信で US バケットを使うと、(a) 配信遅延、(b) 顧客動画の海外保管に対する説明責任、が論点。東京リージョンにすると無料枠が一切なく全量課金（S1 の注記から導かれる帰結）。Supabase のリージョン別料金差は S2 に記載なし。
- **CDN**：Supabase は Free で Basic CDN、Pro で Smart CDN が料金表に明記。Firebase Cloud Storage 単体の CDN 有無は S1 に記載なし `[未確認]`（Hosting は別枠）。
- **費用の上限管理**：Supabase Pro は Spend Cap がデフォルト ON（S2 明記）。Firebase Blaze の支出上限機能は S1 に記載なし `[未確認]`（Google Cloud の予算アラート等は別途要確認）。
- **一時停止リスク**：Supabase Free は 1 週間非アクティブで停止。管理画面を毎日使わない場合、視聴者側でアクセス不能になるリスク。S4 の検索要約では「停止後 1 年以内は復元可能」とあるが原文未確認。
- **メタデータ・認証**：両者とも管理画面の規模（数十〜数百本、少人数の管理者）では DB・Auth の無料枠は十分。

---

## リスク・注意点

1. Firebase で Storage を使う時点で Blaze（従量課金）が必須。無料枠内なら請求 $0 だが、**上限超過時は自動課金**され、S1 には支出上限機能の記載がない。
2. Firebase 無料枠は US リージョン限定。東京リージョン選択時は無料枠なし。
3. Supabase Free の **50 MB 上限**は動画用途では致命的になりうる（圧縮運用で回避できるかは動画の性質次第）。
4. Supabase Free の 1 週間停止は、運用初期の「放置」で本番に影響する。
5. 料金・無料枠は改定される（S1 に「Starting August 1, 2025」「This pricing takes effect starting September 1, 2026」等の改定注記が複数ある）。契約前に再度公式ページを確認すること。
6. S3〜S5 は検索要約のみで原文未確認。特に「2026-02-03」「Blaze 必須」の文言は契約判断に影響するため、原文の直接確認を推奨。
7. 動画に顧客・第三者が映る場合、外部クラウド（特に海外リージョン）への保存は `.claude/rules/security-policy.md` および承認ポリシーの「個人情報の外部ツールへの入力」に該当しうる `[要確認]`。

---

## 推奨案

`[推奨対応]` 段階別に第一候補を分ける。

| 段階 | 第一候補 | 理由 | 条件 |
|---|---|---|---|
| フェーズ0：管理画面の UI・機能開発、小さなサンプル動画での PoC | **Supabase Free** | カード不要・$0。DB/Auth/Storage/Edge Functions が1プロジェクトで揃い、開発が速い | 50 MB 以下のサンプル動画に限定。週1回以上のアクセスで停止を回避 |
| フェーズ1：実動画での本運用（仮定規模：月100視聴・累積100本程度） | **Firebase（Blaze・`*.firebasestorage.app` バケット・us-central1 等）** | 無料枠が保存 5 GB／転送 100 GB/月と大きく、仮定規模では **月額 $0 の可能性が高い**。Supabase Pro の $25/月固定より安い | 社長がカード登録（Blaze）・従量課金・US リージョン保管を承認すること。予算アラートの設定方法を別途確認 |
| フェーズ1 の代替 | **Supabase Pro（$25/月）** | Spend Cap ON で費用が固定。CDN 込み。フェーズ0 からの移行が同一基盤で済む | 月 $25 の固定費を許容できること |

判断の分岐点：
- 「固定費ゼロを最優先し、カード登録と US 保管を許容できる」→ Firebase Blaze
- 「費用の上限を確実に固定したい／日本外保管を避けたい可能性がある／開発基盤を1つに統一したい」→ Supabase（Free → Pro）

## 代替案

- `[代替案]` 動画本体のみ別サービス（動画専用ホスティング・CDN）に置き、BaaS はメタデータと認証だけに使う構成。転送量課金を BaaS から切り離せる。候補サービスの料金は本調査の対象外 `[要追加調査]`。
- `[代替案]` 既存の YouTube 限定公開等を配信面に使い、管理画面は URL 管理のみとする構成。ストレージ・転送コストを回避できるが、アクセス制御・ブランド要件との整合は `[要ヒアリング]`。

---

## 人間の承認が必要な事項（契約・登録は行っていない）

`.claude/rules/approval-policy.md` に基づき、以下はすべて社長の判断・実行事項。本レポートではいずれも実施していない。

1. Firebase Blaze プランへのアップグレード（Google Cloud 課金アカウント作成・支払い方法登録を伴う）
2. Supabase アカウント／プロジェクト作成（Free 含む。登録時のカード要否は未確認）、および Pro プラン契約（$25/月）
3. 動画の保管リージョン（US か日本か）の決定 — 顧客・第三者が映る動画を海外リージョンへ保存する場合は、個人情報の外部サービス入力として承認対象
4. 上記いずれかを選んだ後の n8n 等からの本番接続（`n8n-automation/CLAUDE.md` の運用ルールに従う）

---

## 未確認事項

- `[未確認]` Firebase Blaze に必要な支払い方法の種類（クレジットカード以外の可否）。S1 に記載なし
- `[要追加確認]` S3（Firebase FAQ）の原文：2026-02-03 の期限の正確な文言、対象バケット、Spark で残る挙動（検索要約では「402/403 エラー」）
- `[未確認]` Firebase 新形式バケットの無料枠超過後の Cloud Storage 単価（S1 は「Cloud Storage pricing」へのリンクのみ）
- `[未確認]` Firebase Cloud Storage の最大ファイルサイズ・Range リクエスト時の操作回数の数え方
- `[未確認]` Firebase Blaze の支出上限（予算アラート・自動停止）の有無
- `[未確認]` Supabase Free 登録時のカード要否、東京リージョンの有無、無料枠超過時の挙動（停止か課金か）
- `[要ヒアリング]` 『繋』の動画仕様（本数・1本のサイズ・尺・月間視聴数・視聴者の所在・動画に映る人物の有無）

## 次に必要なアクション

1. 社長：『繋』の動画仕様（上記 `[要ヒアリング]` 項目）を確定する
2. メイ／リサ：S3（Firebase FAQ）・Google Cloud Storage 料金ページ・Supabase Docs（Pausing／Billing FAQ）の原文を直接取得し、本レポートの `[要追加確認]` を解消（v3）
3. アオイ：本レポートの監査（出典・数値・断定表現）
4. 社長：フェーズ0 を Supabase Free で始めるか、最初から Blaze／Pro に進むかを決定（承認事項 1〜3）
5. エイト：決定後、管理画面と n8n の連携設計（アップロード通知・メタデータ登録等）に着手
