# 領域C調査報告：海外シフト管理SaaS／OSS・自動作成の技術基盤／ノーコード自作の「新規開発しない選択肢」

- 事業タグ：common（社長の新規ツール構築案件。想定業態は買取査定のある店舗業＝KINOTO関連の可能性があるが、依頼文では「詳細は未確認」のため common 扱い）
- 調査担当：リサ（Research & Evidence Analyst）／保存：秘書アイ（タスク T225）
- 調査日／全出典の確認日：2026-09-15
- 状態：Draft（アオイ監査前）
- **環境上の制約（秘書アイ確認済み）**：本セッションの実行環境は社外サイトへの接続が遮断されているため（GitHubのみ取得可）、公式サイト本文の直接閲覧は未実施。

---

## 調査上の重要な前提（最初にお読みください）

1. **公式サイト本文の直接閲覧ができませんでした。** 本セッションのネットワークは egress プロキシにより、deputy.com／wheniwork.com／joinhomebase.com／7shifts.com／getsling.com／connecteam.com／planday.com／zoho.com／support.google.com／developers.google.com／about.appsheet.com／kintone.cybozu.co.jp／jp.cybozu.help／notion.com／learn.microsoft.com／timefold.ai／docs.timefold.ai への接続が遮断されました（github.com のみ取得可）。
2. そのため、SaaS・ノーコード系の事実は **「公式ドメインに限定した検索結果のスニペット（公式ページ由来の抜粋）」** を根拠としています。出典欄では「公式（スニペット経由）」と表記し、本文全体を読んだ場合と区別しています。公開日・更新日はスニペットからは判別できないものが多く「公開日不明」と記載しました。
3. 検索回数がセッション上限（200回）に達したため、Deputy／7shifts／Sling／Zoho Shifts の一部プラン価格、Zoho Shifts・Sling・Connecteam の日本語対応など、数点が[未確認]のまま残っています（「未確認事項」節に列挙）。
4. 本報告は事実整理であり、「新規開発すべきか否か」の結論は出していません（レン・ミナ・ジンに委ねます）。

---

## 結論

- [確認済み事実] 海外の主要な従業員スケジューリングSaaS（Deputy／When I Work／Homebase／Connecteam／Planday／Zoho Shifts／Microsoft Shifts）は、いずれも **「希望・可用性の収集 → 手動編成 → 確定閲覧 → 自動割当（オート・スケジューリング）」** を標準機能として持ち、ロール／ポジション／スキル（資格・研修）による制約付きの自動割当を公式に提供しています。
- [確認済み事実] しかし、社長要件の核心である **「会社アカウント・メールアドレス無しでスタッフが使える」** を満たすことが確認できたSaaSは、**メール不要だが携帯電話番号が必要**なもの（When I Work、Homebase）に留まり、**Deputyはメールアドレス無しではログイン不可**と公式ヘルプが明記しています。Microsoft Shifts は Teams ライセンス（＝Microsoft 365 アカウント）が必須です。
- [確認済み事実] **日本語UI**を公式に確認できたのは Deputy の iOS／Android／Kiosk アプリ（端末言語に追従）のみ。When I Work は英・西・仏・伊・独のみ（日本語なし）、7shifts は英・仏・西のみ、Homebase はアプリの正式提供地域が米・英・加のみ。他は[未確認]。
- [確認済み事実] 「自動作成」を新規開発する場合、**Apache-2.0 ライセンスで無償利用できる制約ソルバー**が2系統あります：**Google OR-Tools（CP-SAT）** と **Timefold Solver Community Edition**（OptaPlanner の後継。従業員シフト割当のクイックスタートが公式に用意され、可用性・スキル要件・「ペアリング」等の制約例を含む）。OptaPlanner 本体は Red Hat がEOLを告知済みで、新規採用の対象としては後退しています。
- [確認済み事実] ノーコード系では、**Googleフォーム／Notionフォーム**は「リンクを知っている人ならアカウント無しで回答可」が公式に確認できました。**kintone**は標準ではアカウントが必須で、アカウント無し入力にはトヨクモ FormBridge（月額7,000円〜、kintoneスタンダードコース以上が前提）等の外部サービスが必要。**AppSheet**はサインイン不要の「公開アプリ」が Publisher Pro（$50/月/アプリ）または Enterprise Plus で可能ですが、公式は「機密データを含むアプリには推奨しない」としています。いずれも **制約付き自動割当の機能は標準では無く**、自作（Apps Script／プラグイン／外部ソルバー連携）が必要です[推測を含む]。

---

## 確認済み事実

### 1. 海外の主要な従業員スケジューリングSaaS

| サービス | 提供会社（所在） | 公式URL | 日本語対応 | 自動作成の仕組み（公式記載） | スキル／ロール制約 | アカウント要件（メール無し可否） | 料金（公式明記のみ・通貨） | 複数拠点 |
|---|---|---|---|---|---|---|---|---|
| **Deputy** | Deputy（豪州発、米・英等で展開）[所在は本調査で未確認] | https://www.deputy.com/ | **iOS：日本語を含む13言語**、Android：12言語、iPad Kiosk：日本語を含む9言語（端末のシステム言語に追従。アプリ単体での言語切替は不可） | 「Auto-scheduling」：AI（公式表現）で需要予測（売上・来客数等）に基づきシフト案を生成。「Auto-fill」時は研修要件を満たす従業員をマッチし、賃金情報があれば低コストを優先 | **Training Modules／Training Records**をエリアに紐付け。要件未達の従業員は当該エリアに推薦されない（管理者が手動で上書き可、警告表示） | **メールアドレス無しではアカウント作成不可＝Web・アプリともログイン不可**（公式ヘルプ明記）。招待リンク方式でも本人がメールを入力する必要あり | 新プラン **Lite／Core／Pro**（2025-10-01〜。旧 Premium／Scheduling／Time & Attendance は廃止進行中）。**月額プランの最低請求額 USD $30／月**（2025-09-01〜）。**各プランのユーザー単価は公式スニペットから取得できず[未確認]**（二次情報：Lite $5／Core $6.50／Pro $9 ユーザー/月 — Capterra 等、要公式確認） | Core は「1拠点または複数拠点」向けと公式記載 |
| **When I Work** | When I Work（米） | https://wheniwork.com/ | **日本語なし**。Web：英語のみ／iOS・Android：英・西・仏・伊・独 | 「Auto-Assign」：未公開のOpenShiftを、ポジション・可用性・休暇・週最大40時間（プロフィールの上限）を基に自動割当 | **Positions**（従業員にタグ付けした担当可能ポジション）を考慮 | 従業員追加時は **メール／携帯番号のいずれか（または両方）**。SMSで招待可。インポートは「メール・電話番号・従業員IDのいずれか」が必須 → **既存社員番号のインポート項目あり** | Essentials **$2.50**／Pro **$5.00**／Premium **$8.00**（ユーザー/月、USD）。Time & Attendance 追加で Essentials $5／Pro $7／Premium $10 | [未確認]（二次情報では複数拠点はProプラン） |
| **Homebase** | Homebase（米） | https://www.joinhomebase.com/ | **[未確認]**。アプリ・タイムクロックの正式提供は **米・英・加のみ**、Webは「どこからでも利用可だが制限あり」。加ではSMS通知非対応 | 「Auto-schedule」：ポイント制。①休暇・可用性 → ②希望最大時間・勤続・ロール → ③割当時間が少ない人を優先。直近60日のロール実績から自動でロールを事前入力。「AI-assisted scheduling」は Plus 以上 | **Departments／Roles**を設定し、ロール単位で自動割当 | 従業員は **電話番号またはメールでログイン可**（公式サポート記載）。招待はメール＋SMS | **拠点単位の定額**：Basic **$0**（1拠点・10人まで）／Essentials **$30**／Plus **$70**／All-in-One **$120**（月額・拠点あたり、USD）。年払い：$24／$56／$96。給与アドオン $39＋$6/人 | 拠点単位課金（多拠点はその分加算） |
| **7shifts** | 7shifts（加） | https://www.7shifts.com/ | **日本語なし**（英・仏・西の3言語） | 「Auto-Scheduler」：公式KBでは **Beta**、旧 Gourmet プランで無償提供、有効化はサポート依頼。新プラン体系（2025-07-02〜：Comp／Essentials／Pro／Premium）での扱いは[未確認] | ロール／部門ベース（飲食特化） | [未確認] | 拠点単位。**各プラン金額は公式スニペットから取得できず[未確認]**（公式比較ページに「$39.99/月/拠点〜」の記載があるがプラン名は特定できず） | 多拠点ブランド向け Premium あり |
| **Sling** | Sling（Toast 傘下）[所在・親会社は本調査で未確認] | https://getsling.com/ | **[未確認]** | 「Automated scheduling」を公式ページで説明（詳細アルゴリズムは[未確認]） | ポジション設定あり[詳細未確認] | [未確認] | **無料プランは30ユーザーまで**（業種により50）。Premium／Business は有料（**ユーザー単価は公式スニペットから特定できず[未確認]**。「$4.00/ユーザー/月（割引時$3.40）」の断片あり、プラン帰属は不明）。年払いで15%割引 | 多拠点対応ページあり |
| **Connecteam** | Connecteam（イスラエル／米）[所在は本調査で未確認] | https://connecteam.com/ | 英・西・アラビア・仏「ほか」（公式ヘルプ）。**日本語は確認できず[未確認]**。アプリ言語は端末設定に追従 | 「Auto-scheduling」：可用性・希望・**資格（qualifications）**・シフト要件・重複・承認済み休暇を考慮し、未割当シフトを一括自動割当 | **Qualifications**（ジョブ／シフトに必要資格を設定。有資格者のみ割当） | [未確認] | **Small Business Plan：10ユーザーまで無料（全機能）**。Basic **$29/月**（30ユーザーまで）／Advanced **$49**／Expert **$99**／Enterprise 要問合せ。31人目以降：Advanced $1.8（年払い$1.5）、Expert $3.6（年払い$3）/ユーザー/月（USD）。14日無料トライアル | [未確認] |
| **Planday** | Planday（デンマーク／Xero グループ）[親会社は本調査で未確認] | https://www.planday.com/ | **[未確認]** | 「Auto-schedule」：**Proプランのみ**。従業員グループ・**スキル**・契約時間・可用性・欠勤・労働時間ルールを考慮してオープンシフトを一括割当。優先度の詳細設定あり | **Skills** と従業員グループ | [未確認] | **£2.99/ユーザー〜**（GBP）。最低契約人数：Starter 5人／Plus 10人／Pro 50人 | エンタープライズ向けページあり |
| **Zoho Shifts** | Zoho Corporation（印／米） | https://www.zoho.com/shifts/ | **[未確認]**（Zoho People には日本語ページがあるが、Zoho Shifts の日本語ページは検索で確認できず） | 「Auto schedule」：未公開オープンシフトを、**ロール・可用性・最適化優先度（公平性 or 労務コスト）**に基づき自動割当 | **Positions**。オープンシフトは同一スケジュール・同一ポジションの従業員にのみ通知。制約チェック有効化で上限超過者の取得を制限 | [未確認] | Basic **$1/ユーザー/月**（USD）。Standard／Professional の金額は[未確認]。30日無料トライアル、契約縛りなし | [未確認] |
| **Microsoft Shifts（Teams）** | Microsoft（米） | https://learn.microsoft.com/en-us/microsoft-365/frontline/shifts-for-teams-landing-page | [本調査では未確認]（Teams 自体の日本語提供は一般に知られるが、本セッションで公式確認せず） | 「Auto-assign open shifts」：**パブリックプレビュー**。過去パターン・可用性・ルール（週／日の最大時間、連続勤務日数、最低休息）に基づき割当。埋まらないシフトはオープンのまま残る | スケジュールグループ単位。スキル制約の有無は[未確認] | **Teams ライセンス必須＝Microsoft 365 アカウント必須**（アカウント無し利用は不可） | Microsoft 365 **F1：$4/ユーザー/月**（USD、公式ページ由来だが掲載時期不明）。F3 は[未確認] | Teams のチーム単位 |

補足（確認済み事実）：
- When I Work の Auto-Assign は「週40時間上限」がデフォルトで、従業員プロフィールの最大時間設定を参照します（公式ヘルプ）。
- Deputy の自動割当は「研修要件（Training）」を**エリア**に設定する設計で、社長要件の「担当エリア区分」「できる人が限られる業務」に概念的に近い構造です。
- **「この人とこの人は別エリア（組み合わせ制約）」に相当する機能は、上記SaaSのいずれについても公式で確認できていません[未確認]**。

### 2. OSS／自動作成の技術基盤（ソルバー・エンジン・自前ホスト型アプリ）

| 名称 | 種別 | ライセンス | 言語／環境 | 従業員シフト割当への適用（公式記載） | 自前ホストの要否・備考 | 最新版（確認時点） |
|---|---|---|---|---|---|---|
| **Google OR-Tools（CP-SAT）** | 制約ソルバー・ライブラリ | **Apache License 2.0** | コアC++、ラッパー：Python／C#／Java | 公式ドキュメントに「Employee Scheduling」章があり、CP-SAT による**ナース・スケジューリング例**（4名×3日×3シフト、希望シフトの充足数最大化）を掲載。Python／C++／Java／C# のコード例 | ライブラリのため、**自前のバックエンドに組み込んで運用**（ホスト先はクラウド／オンプレいずれも可）。UI・DB・希望収集画面は別途開発が必要 | **v9.15（2026-01-12）**（GitHub Releases） |
| **Timefold Solver Community Edition** | 制約ソルバー・フレームワーク（OptaPlanner の後継フォーク、2023-04-20 フォーク） | **Apache-2.0**（Community Edition）。Plus／Enterprise は非OSS・商用ライセンス（マルチスレッド解法、Nearby Selection、Node Sharing、Score Analysis 等が有償側） | **Java／Kotlin**（GitHub README）。Python 版リポジトリ（timefold-solver-python）は **2025-10-06 にアーカイブ**（現在の Python 提供形態は[要追加調査]。PyPI に timefold-solver は存在） | 公式クイックスタート（timefold-quickstarts、Apache-2.0）に **Employee Scheduling**（「従業員の可用性とシフトのスキル要件を考慮してシフトを割当」）を収録。README は「off-the-shelf モデルは **skills、pairing employees、fairness** 等の追加制約に対応」と記載 | ライブラリとして自前ホスト。別途 **Timefold Platform**（マネージドREST API。「Employee Shift Scheduling」モデルを提供。クラウド／オンプレ選択可。**料金は[未確認]**） | Timefold Solver **2.6.0（2026-09-01）**（GitHub Releases） |
| **OptaPlanner** | 制約ソルバー（旧 Red Hat／KIE） | Apache-2.0 | Java | 従業員ロスタリングは代表的用途 | **Red Hat build of OptaPlanner 8 は 2024-05-30 に EOL**（Timefold 社ブログの記載。Red Hat 一次資料は本調査で未確認）。GitHub の kiegroup／apache incubator-kie-optaplanner リポジトリはアーカイブされ、ソースは apache/incubator-kie-drools に統合。Timefold 社は「KIE の 10.x リリースはツールチェーン更新のみで機能追加なし」と説明（当事者発信のため注意） | — |
| **j3soon/nurse-scheduling** | 自前ホスト型Webアプリ（OR-Tools 利用） | **AGPL-3.0** | TypeScript（Next.js）＋Python、Docker | 「柔軟なナース・スケジューリング」。**OR-Tools CP-SAT をデフォルトソルバー**として使用。ホスト版（nursescheduling.org）と Docker 自前ホストの両方を案内。個人IDを匿名化してから最適化する機能 | 14 stars、更新 2026-09-13。医療向け設計のため店舗用途への転用は要検証 | — |
| **SirChri/employee-shift-scheduler** | 自前ホスト型Webアプリ | **GPL-3.0** | React（react-admin）＋Java Spring Boot＋PostgreSQL、docker-compose | ユーザー／従業員／顧客／イベント（繰返し可）管理・レポート。**希望提出・交代・自動割当の記載なし**。全リクエスト認証必須 | 77 stars、更新 2026-02-14 | — |
| **oasido/shift-scheduler** | 自前ホスト型Webアプリ | MIT | React＋MongoDB、Docker | シフトのランダム生成、欠勤申請と承認、ドラッグ&ドロップ | **2025-10-14 にアーカイブ（読み取り専用）**。35 stars | — |
| **averude/Scheduler** | 自前ホスト型Webアプリ | [未確認]（README にライセンス記載なし） | Angular＋Spring Boot＋PostgreSQL、Docker | 「事前定義パターンによる自動スケジュール生成」、企業／部門／シフト単位の管理、Excel出力 | 更新日[未確認] | — |
| **Staffjoy v2** | 自前ホスト型（Go／Kubernetes） | MIT | Go、gRPC、Kubernetes | 中小向け労務スケジューリング | **2019-09 に deprecated**（フォーク LandRover/StaffjoyV2 が案内されている） | — |
| **Frappe HR（frappe/hrms）** | OSS人事システム（シフト管理機能あり） | **GPL-3.0** | Python／JS（Frappe Framework、ERPNext 前提） | shift-management トピック、roster フォルダあり。**自動割当の記載なし** | Frappe Framework＋ERPNext のセットアップが必要（自前ホストまたは Frappe Cloud） | — |
| **Odoo Planning** | ERP（Odoo）のスケジューリングアプリ | Odoo Community は OSS（LGPL v3）／**Planning アプリは Enterprise 版のアプリ**（公式フォーラム回答・エディション比較ページ由来） | Python | ロール定義、オープンシフトの従業員自己割当、ロール一致シフトのみ表示。自動割当は[未確認] | Community 版向けの代替モジュールが Odoo Apps Store に存在（有償含む） | — |
| **TimeTrex Community Edition** | OSS勤怠・給与・スケジューリング | [未確認]（GitHub に LICENSE 取得不可） | Web（Linux 自前ホスト） | 「従業員スケジューリング」を含むと記載。自動割当の詳細[未確認] | — | — |

参考：GitHub の shift-scheduling／employee-scheduling トピックには上記以外に 60〜130 件程度のリポジトリがありますが、スター数 100 未満・個人開発・更新停止のものが大半でした（OpenSkedge は 2019-12 で更新停止）。

### 3. ノーコード・既存ツールでの自作

| ツール | アカウント無しでのスマホ入力（希望提出） | アカウント無しでの確定シフト閲覧 | 自動作成 | 料金（公式明記のみ） | 主な制約・備考 |
|---|---|---|---|---|---|
| **Googleフォーム＋スプレッドシート** | **可**（公式：回答者がサインインを強制されるのは、①テストモード、②ファイルアップロード質問、③「メールアドレスを収集：確認済み」、④組織内ユーザーに限定、⑤回答を1回に制限、の設定時） | **可**（スプレッドシートを「ウェブに公開」または「リンクを知っている全員：閲覧者」で共有。公開版は編集不可・数式非表示。Workspace 管理者が公開を無効化している場合あり） | **標準機能なし**。[推測] Apps Script 等で自作するか、外部ソルバー（OR-Tools 等）を呼ぶ構成が必要 | Google アカウント（無料）で作成可（Workspace 利用時は組織設定に依存） | 本人特定は「社員番号を入力させる」等の運用に依存（なりすまし・誤入力の抑止は自作）。個人別の非公開閲覧は標準では困難（公開URLは全員に同内容が見える） |
| **Notion（フォーム＋公開ページ）** | **可**（公式：「Anyone on the web with link」に設定したフォームは、Notion を使っていない人でも回答可。回答は自動的に匿名） | **可**（「Anyone on the web with link」／Notion Sites で公開。Notion アカウント不要） | **標準機能なし**[推測：自動化はAPI経由の自作が必要] | Plus **$4/メンバー/月（年払い）／$5（月払い）**（USD）。Free プランあり。条件分岐は Business／Enterprise のみ。有料プランで Notion ブランディング非表示可 | 公開ページは全員に同内容。匿名回答のため本人特定は入力項目に依存 |
| **kintone（サイボウズ）** | **標準では不可**（利用者はユーザー／ゲストユーザーのライセンスが必要）。アカウント無し入力は **トヨクモ FormBridge** 等の外部フォーム連携で可（「kintone アカウントがない人でも kintone に直接保存」と公式連携ページに記載） | **標準では不可**。アカウント無し閲覧は **トヨクモ kViewer**（「ライセンス不要で外部に公開」）等で可 | **標準機能なし**[推測：プラグイン／JSカスタマイズ／外部連携で自作] | ライト **1,000円**／スタンダード **1,800円**／ワイド **3,000円**（1ユーザー/月・税抜。2024-11 改定後）。最低契約：ライト・スタンダード 10 ユーザー、ワイド 1,000 ユーザー。**ゲストユーザーはコース・契約区分を本体と同一にする必要があり、最低契約数なし**。FormBridge：ライト **7,000円/月（税抜）〜**、5コース、**kintone スタンダードコース以上が前提**。kViewer：コース価格[未確認]、kintone スタンダード以上が前提。FormBridge／kViewer の「ユーザーライセンス」追加は **15,000円/人/月**（最低1人・3か月〜） | 連携サービス分の固定費が上乗せ。外部サービス側のID/パスワード認証・メール認証はオプション |
| **AppSheet（Google）** | **条件付きで可**：サインイン不要の「公開アプリ」は **Publisher Pro（$50/月/アプリ、ユーザー数無制限）** または **Enterprise Plus** で作成可。ただし公式は「**機密データを含まない**アプリ向け」「組織内利用・機密データにはサインイン必須の Starter／Core／Enterprise を推奨」と明記 | 同上 | **標準機能なし**[推測：自動割当は Automation／外部API で自作] | Starter **$5/ユーザー/月**、Core **$10/ユーザー/月**、Enterprise Plus 要問合せ、Publisher Pro **$50/月/アプリ**（USD） | サインイン方式にすると各スタッフに Google 等の ID が必要 → 社長要件と衝突。公開アプリ方式は個人名・勤務情報が「機密データ」に該当しうる点が公式推奨に反する |
| **Microsoft Shifts（Teams）** | **不可**（Teams ライセンス＝Microsoft 365 アカウント必須） | 不可（同上） | あり（プレビュー。前掲） | F1 $4/ユーザー/月（USD、掲載時期不明） | Microsoft 365 導入済み企業向け |

---

## 推測・仮説

- [推測] 海外SaaSの「電話番号でのログイン可」は、SMS 認証を前提としている可能性が高く、日本の携帯番号で SMS 受信できるかは各社の対応国に依存する（Homebase はカナダで SMS 非対応と公式記載があり、日本での SMS 到達性は[未確認]）。
- [推測] 各SaaSの自動割当は「ロール／スキル」「可用性」「労働時間ルール」「公平性／コスト」を主な制約としており、社長要件の**「時間帯×エリアごとの必要人数」は概ね対応可能だが、「この人とこの人は別エリア」のような対人組み合わせ制約は標準機能にない可能性が高い**（Timefold のクイックスタートは「pairing employees」を制約例として挙げており、自前開発なら実装可能な範囲）。
- [推測] ノーコード自作で「アカウント無し提出」を満たす最短経路は Googleフォーム／Notionフォームだが、本人性の担保（社員番号の入力ミス・なりすまし）と、個人別の非公開閲覧（他人のシフトを見せたくない場合）は標準機能では実現しづらく、運用ルールで補う設計になる。
- [仮説] 新規開発の技術的優位性は、(a) メール・アカウント不要のログイン方式（例：社員番号＋店舗発行コード等）を自由に設計できること、(b) Apache-2.0 のソルバーで組み合わせ制約・エリア別必要人数などの独自制約を実装できること、(c) 日本語UIを最初から前提にできること、の3点に集約される可能性がある。不利は、UI・DB・通知・運用保守を全て自前で負うこと。
- [仮説] Deputy は日本語アプリ・研修要件（エリア別）・自動割当の3点で要件に最も近いが、メール必須という一点で社長の最重要要件と衝突する。

---

## 分析（要件別の対応状況マトリクス）

凡例：○＝公式で確認、△＝条件付き／部分的、×＝公式で不可と確認、？＝[未確認]

| 要件 | Deputy | When I Work | Homebase | Connecteam | Planday | Zoho Shifts | MS Shifts | 自前開発＋OR-Tools/Timefold | Googleフォーム＋シート | Notion | kintone＋トヨクモ | AppSheet |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| スマホから希望提出 | ○ | ○ | ○ | ○ | ○ | ○ | ○ | 要開発 | ○ | ○ | △（外部フォーム） | ○ |
| **会社アカウント・メール無しで利用** | **×**（メール必須） | △（携帯番号で可） | △（携帯番号で可） | ？ | ？ | ？ | × | 設計次第で○ | ○ | ○ | △（外部サービス経由） | △（公開アプリ。機密データ非推奨） |
| 管理者の手動編成 | ○ | ○ | ○ | ○ | ○ | ○ | ○ | 要開発 | △（手作業） | △ | ○ | ○ |
| 確定シフトのスマホ閲覧 | ○ | ○ | ○ | ○ | ○ | ○ | ○ | 要開発 | △（公開URL） | △（公開ページ） | △（kViewer） | ○ |
| **自動作成** | ○ | ○ | ○（Plus〜） | ○ | ○（Pro のみ） | ○ | △（プレビュー） | ○（ソルバー無償、実装要） | ×（自作） | ×（自作） | ×（自作） | ×（自作） |
| エリア区分・時間帯別必要人数 | ○（エリア＋研修要件） | △（ポジション別OpenShift） | △（部門・ロール） | △（ジョブ・資格） | △（従業員グループ・スキル） | △（ポジション＋人数） | △ | ○（実装要） | 自作 | 自作 | 自作 | 自作 |
| スキル制約（査定・レジ・開閉店） | ○（Training） | ○（Positions） | △（Roles） | ○（Qualifications） | ○（Skills） | ○（Positions） | ？ | ○（実装要） | 自作 | 自作 | 自作 | 自作 |
| 対人の組み合わせ制約 | ？ | ？ | ？ | ？ | ？ | ？ | ？ | ○（Timefold は pairing を制約例に明記） | 自作 | 自作 | 自作 | 自作 |
| 欠勤・交代の差し替え | ？ | △（二次情報でシフト交換あり） | ○（オープンシフト取得） | ？ | ？ | ○（Shift swaps ヘルプあり） | ○（交換・オファー） | 要開発 | 手作業 | 手作業 | 手作業 | 自作 |
| 複数店舗 | ○ | ？ | ○（拠点課金） | ？ | ○ | ？ | △ | 要開発 | 手作業 | 手作業 | ○ | ○ |
| 既存社員番号の流用 | ？ | ○（インポート項目に従業員ID） | ？ | ？ | ？ | ？ | ？ | ○ | ○（入力項目） | ○ | ○ | ○ |
| 日本語UI | ○（モバイルのみ、端末言語追従） | × | ？（提供地域外） | ？ | ？ | ？ | ？ | ○ | ○ | ○ | ○ | ○ |

「新規開発する場合の優位性・不利」を判断するための事実（結論は出しません）：
1. [確認済み事実] 主要SaaSはメールまたは携帯番号による本人アカウントを前提としており、「アカウント・メール無し」を完全に満たすものは確認できなかった。
2. [確認済み事実] 自動割当ソルバー自体は Apache-2.0 で無償入手でき、公式のシフト割当サンプル（OR-Tools のナース例、Timefold の Employee Scheduling クイックスタート）が存在する。したがって「自動作成」の開発コストは主にモデリング（制約定義）と UI／運用系に集中する。
3. [確認済み事実] SaaS の料金はユーザー課金（$1〜$9/ユーザー/月、通貨USD／GBP）または拠点課金（$30〜$120/拠点/月）。日本円建て・日本語サポートの有無は[未確認]。
4. [確認済み事実] ノーコード自作は「提出・閲覧」までは低コストで実現できるが、「自動作成」「本人性担保」「個人別閲覧制御」は標準外。

---

## リスク・注意点

- 料金・プラン構成は 2025 年に複数社（Deputy 2025-10-01、7shifts 2025-07-02、Deputy 最低請求額 2025-09-01）で改定されており、**再改定の可能性がある**。導入判断時に公式ページで再確認が必要。
- 海外SaaSの**個人情報の保管国・準拠法**（スタッフ氏名・電話番号・勤務情報の国外移転）は本調査の範囲外。リョウ（法務）による個人情報保護法上の確認を要する[要弁護士確認の可能性]。
- GPL-3.0／AGPL-3.0 の自前ホスト型 OSS（employee-shift-scheduler、nurse-scheduling、Frappe HR）を改変して提供する場合、ライセンス上のソース公開義務（特に AGPL はネットワーク提供時にも発生）に注意。Apache-2.0（OR-Tools／Timefold CE）にはこの義務がない。
- OptaPlanner はメンテナンスのみと見られるため、新規採用は避ける材料がある（ただし EOL 情報の一次資料＝Red Hat 公式は本調査で未確認）。
- Timefold の Python 版リポジトリはアーカイブ済みで、Python で使う場合の現行の提供形態が不明。Python 前提で設計する場合は OR-Tools（Python ラッパーあり、v9.15）が確実。
- AppSheet 公開アプリは公式が「機密データ非推奨」としており、スタッフ名・勤務情報を扱う本件で採用する場合はセキュリティ設計の説明責任が生じる。
- Googleフォーム／Notion の「匿名回答」は、なりすましや誤入力の抑止が運用依存になる。

---

## 推奨案（調査担当としての事実ベースの提案。最終判断はジン・レン・ミナへ）

1. 比較対象の「代表SaaS」を **Deputy（日本語モバイル・エリア別研修要件・自動割当）**、**When I Work（携帯番号のみで招待可・従業員ID インポート・低単価）**、**Connecteam（10人まで無料・資格ベース自動割当）** の3つに絞り、社長の実店舗で 14〜30 日の無料トライアルを行い「アカウント要件」と「日本語」の実感を確認する。
2. 「自動作成」を新規開発する場合の技術基盤は **OR-Tools（Python）または Timefold Solver CE（Java/Kotlin）** の2択で見積もりを取る（いずれも Apache-2.0）。開発側に「対人組み合わせ制約」「エリア×時間帯の必要人数」「スキル制約」をハード／ソフト制約として定義できるかを確認事項に含める。
3. ノーコード自作は「提出→手動作成→閲覧」の**暫定運用（つなぎ）**として Googleフォーム＋スプレッドシート（または Notion）を候補にし、自動作成は対象外と割り切る。

## 代替案

- Microsoft 365（F1 $4/ユーザー/月）を全スタッフに配布して Shifts を使う：アカウント配布が前提になるため社長要件と逆行するが、「会社が ID を配る」方針に転換する場合の最安クラスの選択肢。
- kintone を既に契約している場合に限り、FormBridge＋kViewer で「アカウント無し提出・閲覧」を構成（固定費：kintone スタンダード 1,800円×10人〜＋FormBridge 7,000円/月〜＋kViewer[未確認]）。
- Timefold Platform（マネージド API の Employee Shift Scheduling モデル）を「自動作成エンジンだけ外部利用」する構成（料金[未確認]、日本での提供条件[未確認]）。

---

## 出典

すべて確認日 2026-09-15。「公式（スニペット経由）」＝公式ドメイン限定検索で得た公式ページの抜粋（本文全体は egress 遮断のため未閲覧）。「一次（直接取得）」＝GitHub から本文を直接取得。

### 海外SaaS
1. Deputy Pricing — https://www.deputy.com/pricing ／Deputy／公開日不明／公式（スニペット経由）
2. Deputy Help「Pricing plans」— https://help.deputy.com/hc/en-au/articles/4755605465743-Pricing-plans ／Deputy／公開日不明／公式（スニペット経由）：Lite／Core／Pro、最低請求額 USD $30（2025-09-01〜）
3. Deputy Help「Pricing plans (Discontinuing)」— https://help.deputy.com/hc/en-au/articles/13295493266447-Pricing-plans-Discontinuing ／Deputy／公開日不明／公式（スニペット経由）：新プラン 2025-10-01 導入
4. Deputy Help「Using Auto-scheduling」— https://help.deputy.com/hc/en-au/articles/4688892429839-Using-Auto-scheduling ／Deputy／公開日不明／公式（スニペット経由）
5. Deputy Help「Managing training requirements」— https://help.deputy.com/hc/en-au/articles/4657753960463-Managing-training-requirements ／Deputy／公開日不明／公式（スニペット経由）
6. Deputy Help「What if I want to add someone to Deputy who does not have an email address or phone number?」— https://help.deputy.com/hc/en-au/articles/4621942902287 ／Deputy／公開日不明／公式（スニペット経由）：メール無しではログイン不可
7. Deputy Help「Add your team by sharing a link」— https://help.deputy.com/hc/en-au/articles/4657777625871-Add-your-team-by-sharing-a-link ／Deputy／公開日不明／公式（スニペット経由）
8. Deputy Help「How to change the language on the Deputy iOS app」— https://help.deputy.com/hc/en-au/articles/4753094339215 ／Deputy／公開日不明／公式（スニペット経由）：日本語を含む13言語
9. Deputy Help「How to change the language on the Deputy Kiosk for iPad」— https://help.deputy.com/hc/en-au/articles/4754068903183 ／Deputy／公開日不明／公式（スニペット経由）
10. When I Work Pricing — https://wheniwork.com/pricing ／When I Work／公開日不明／公式（スニペット経由）：$2.50／$5／$8
11. When I Work Help「Auto-Assign Shifts」— https://help.wheniwork.com/articles/auto-assign-shifts/ ／When I Work／公開日不明／公式（スニペット経由）
12. When I Work Help「Add and Edit Users」— https://help.wheniwork.com/articles/adding-and-editing-employees ／When I Work／公開日不明／公式（スニペット経由）：メールまたは携帯番号
13. When I Work Help「Importing Users」— https://help.wheniwork.com/articles/importing-users/ ／When I Work／公開日不明／公式（スニペット経由）：メール・電話番号・従業員IDのいずれか必須
14. When I Work Help「Downloading the When I Work App」ほか — https://help.wheniwork.com/articles/downloading-the-when-i-work-app-ios-android/ ／When I Work／公開日不明／公式（スニペット経由）：対応言語（日本語なし）
15. Homebase Pricing — https://www.joinhomebase.com/pricing ／Homebase／公開日不明／公式（スニペット経由）：$0／$30／$70／$120（拠点/月）
16. Homebase Support「Auto-schedule」— https://support.joinhomebase.com/hc/en-us/articles/115006805248-Auto-Scheduling ／Homebase／公開日不明／公式（スニペット経由）
17. Homebase Support「Add employees to Homebase」— https://support.joinhomebase.com/hc/en-us/articles/360012671551-Add-employees-to-Homebase ／Homebase／公開日不明／公式（スニペット経由）：電話番号またはメールでログイン
18. Homebase Support「Countries supported on Homebase」— https://support.joinhomebase.com/hc/en-us/articles/235021388-Countries-supported-on-Homebase ／Homebase／公開日不明／公式（スニペット経由）
19. Homebase Support「Departments and roles」— https://support.joinhomebase.com/hc/en-us/articles/360031840092-Departments-and-roles ／Homebase／公開日不明／公式（スニペット経由）
20. 7shifts Developers「Changes to 7shifts Pricing Plans」— https://developers.7shifts.com/changelog/changes-to-7shifts-pricing-plans ／7shifts／公開日不明（2025-07-02 の変更を記載）／公式（スニペット経由）
21. 7shifts KB「Auto-Scheduler (Beta)」— https://kb.7shifts.com/hc/en-us/articles/4417505384979-Auto-Scheduler-Beta ／7shifts／公開日不明／公式（スニペット経由）
22. 7shifts KB「Language Support」— https://kb.7shifts.com/hc/en-us/articles/4417519528211-Language-Support ／7shifts／公開日不明／公式（スニペット経由）：英・仏・西
23. Sling Pricing — https://getsling.com/pricing/ ／Sling／公開日不明／公式（スニペット経由）
24. Sling Help「Free Sling Accounts Limited to 30 users」— https://support.getsling.com/en/articles/9504022-free-sling-accounts-limited-to-30-users ／Sling／公開日不明／公式（スニペット経由）
25. Sling Help「Billing: Annual or Monthly Option」— https://support.getsling.com/en/articles/5949289-billing-annual-or-monthly-option ／Sling／公開日不明／公式（スニペット経由）：年払い15%割引
26. Connecteam Pricing — https://connecteam.com/pricing/ ／Connecteam／公開日不明／公式（スニペット経由）：$29／$49／$99、追加ユーザー単価
27. Connecteam Help「The Small Business Plan」— https://help.connecteam.com/en/articles/6410944-the-small-business-plan ／Connecteam／公開日不明／公式（スニペット経由）：10ユーザーまで無料
28. Connecteam Help「Automatically Assign Shifts In Connecteam」— https://help.connecteam.com/en/articles/8886939-automatically-assign-shifts-in-connecteam ／Connecteam／公開日不明／公式（スニペット経由）
29. Connecteam Help「Job Schedule Qualifying Users to Shifts」— https://help.connecteam.com/en/articles/8693629-job-schedule-qualifying-users-to-shifts ／Connecteam／公開日不明／公式（スニペット経由）
30. Connecteam Help「Configure Your Preferred Language」— https://help.connecteam.com/en/articles/5365277-configure-your-preferred-language ／Connecteam／公開日不明／公式（スニペット経由）
31. Planday Pricing — https://www.planday.com/pricing ／Planday／公開日不明／公式（スニペット経由）：£2.99〜、最低人数
32. Planday Help「How to use the Auto-schedule tool (Pro Plan only)」— https://help.planday.com/en/articles/30439-how-to-use-the-auto-schedule-tool ／Planday／公開日不明／公式（スニペット経由）
33. Planday Help「Auto-schedule - Advanced settings」— https://help.planday.com/en/articles/30448-auto-schedule-advanced-settings ／Planday／公開日不明／公式（スニペット経由）
34. Zoho Shifts Pricing — https://www.zoho.com/shifts/pricing.html ／Zoho／公開日不明／公式（スニペット経由）：Basic $1
35. Zoho Shifts Help「Open Shifts」— https://help.zoho.com/portal/en/kb/shifts/scheduling/schedule-editor/articles/open-shifts ／Zoho／公開日不明／公式（スニペット経由）：Auto schedule（ロール・可用性・公平性/コスト）
36. Zoho Shifts Help「Shift swaps」— https://help.zoho.com/portal/en/kb/shifts/scheduling/shift-request/articles/shift-swaps ／Zoho／公開日不明／公式（スニペット経由）
37. Microsoft Learn「Manage the Shifts app for your organization」— https://learn.microsoft.com/en-us/microsoftteams/expand-teams-across-your-org/shifts/manage-the-shifts-app-for-your-organization-in-teams ／Microsoft／公開日不明／公式（スニペット経由）：Teams ライセンス必須
38. Microsoft Learn「Auto-assign open shifts」— https://learn.microsoft.com/en-us/microsoft-365/frontline/shifts-auto-assign-open-shifts ／Microsoft／公開日不明／公式（スニペット経由）：パブリックプレビュー
39. Microsoft 365 F1 — https://www.microsoft.com/en-us/microsoft-365/enterprise/f1 ／Microsoft／公開日不明／公式（スニペット経由）：$4/ユーザー/月
40. （二次情報）Capterra「Deputy Pricing 2026」— https://www.capterra.com/p/167811/Deputy/pricing/ ／Capterra／公開日不明：Lite $5／Core $6.50／Pro $9 の記載。**公式未確認のため参考値**

### OSS／ソルバー
41. google/or-tools（GitHub README）— https://github.com/google/or-tools ／Google／一次（直接取得）：Apache 2.0、Python/C#/Java ラッパー
42. google/or-tools Releases — https://github.com/google/or-tools/releases ／Google／一次（直接取得）：v9.15（2026-01-12）
43. OR-Tools「Employee Scheduling」— https://developers.google.com/optimization/scheduling/employee_scheduling ／Google／公開日不明／公式（スニペット経由）
44. TimefoldAI/timefold-solver（GitHub README）— https://github.com/TimefoldAI/timefold-solver ／Timefold／一次（直接取得）：Apache-2.0（CE）、Enterprise は商用
45. TimefoldAI/timefold-solver Releases — https://github.com/TimefoldAI/timefold-solver/releases ／Timefold／一次（直接取得）：2.6.0（2026-09-01）
46. TimefoldAI/timefold-quickstarts — https://github.com/TimefoldAI/timefold-quickstarts ／Timefold／一次（直接取得）：Employee Scheduling クイックスタート、Apache-2.0、skills／pairing／fairness
47. TimefoldAI/timefold-solver-python — https://github.com/TimefoldAI/timefold-solver-python ／Timefold／一次（直接取得）：2025-10-06 アーカイブ、Python 3.10〜3.12＋JDK17
48. Timefold Docs「Plus/Enterprise Editions」— https://docs.timefold.ai/timefold-solver/latest/commercial-editions/commercial-editions ／Timefold／公開日不明／公式（スニペット経由）
49. Timefold Blog「Red Hat: OptaPlanner End Of Life Notice」— https://timefold.ai/blog/red-hat-optaplanner-end-of-life-notice ／Timefold（フォーク元の当事者）／公開日不明／二次的（Red Hat 一次資料は未確認）
50. Timefold「Employee Shift Scheduling」（Platform モデル）— https://timefold.ai/products/employee-shift-scheduling ／Timefold／公開日不明／公式（スニペット経由）
51. apache/incubator-kie-optaplanner — https://github.com/apache/incubator-kie-optaplanner ／Apache／一次（直接取得）：アーカイブ、drools リポジトリへ統合
52. j3soon/nurse-scheduling — https://github.com/j3soon/nurse-scheduling ／個人／一次（直接取得）：AGPL-3.0、OR-Tools CP-SAT
53. SirChri/employee-shift-scheduler — https://github.com/SirChri/employee-shift-scheduler ／個人／一次（直接取得）：GPL-3.0
54. oasido/shift-scheduler — https://github.com/oasido/shift-scheduler ／個人／一次（直接取得）：MIT、2025-10-14 アーカイブ
55. averude/Scheduler — https://github.com/averude/Scheduler ／個人／一次（直接取得）
56. Staffjoy/v2 — https://github.com/Staffjoy/v2 ／Staffjoy／一次（直接取得）：MIT、2019-09 deprecated
57. frappe/hrms — https://github.com/frappe/hrms ／Frappe／一次（直接取得）：GPL-3.0
58. Odoo「Planning — Odoo 19.0 documentation」— https://www.odoo.com/documentation/19.0/applications/services/planning.html ／Odoo／公開日不明／公式（スニペット経由）
59. Odoo「Odoo Enterprise vs Community」— https://www.odoo.com/page/editions ／Odoo／公開日不明／公式（スニペット経由）：Planning は Enterprise アプリ
60. GitHub Topics「shift-scheduling」「employee-scheduling」— https://github.com/topics/shift-scheduling ／ https://github.com/topics/employee-scheduling ／GitHub／一次（直接取得）

### ノーコード
61. Google Docs Editors Community Guide「Google Forms: Why Your Respondents are Being Forced to Login」— https://support.google.com/docs/community-guide/395355672 ／Google（公式コミュニティガイド）／2025-12（検索結果の記載）／公式（スニペット経由）
62. Google Docs Editors Help「Get permission to open a Google Form」— https://support.google.com/docs/answer/160166 ／Google／公開日不明／公式（スニペット経由）
63. Google Docs Editors Help「Make Google Docs, Sheets, Slides & Forms public」— https://support.google.com/docs/answer/183965 ／Google／公開日不明／公式（スニペット経由）
64. AppSheet Pricing — https://about.appsheet.com/pricing/ ／Google／公開日不明／公式（スニペット経由）：$5／$10／Publisher Pro $50/月/アプリ
65. AppSheet Help「Require sign-in: The Essentials」— https://support.google.com/appsheet/answer/10104975 ／Google／公開日不明／公式（スニペット経由）
66. AppSheet Help「How to choose a subscription」— https://support.google.com/appsheet/answer/10105400 ／Google／公開日不明／公式（スニペット経由）
67. kintone 料金 — https://kintone.cybozu.co.jp/price/ ／サイボウズ／公開日不明／公式（スニペット経由）
68. サイボウズ「クラウドサービスの価格体系改定および…ワイドコース開始のお知らせ」— https://topics.cybozu.co.jp/news/2024/05/30-18782.html ／サイボウズ／2024-05-30／公式（スニペット経由）：1,000円／1,800円／3,000円
69. kintone「ゲストユーザー・スペースについて」— https://kintone.cybozu.co.jp/price/guestprice.html ／サイボウズ／公開日不明／公式（スニペット経由）
70. kintone ヘルプ「ゲストユーザーのライセンスを購入する」— https://jp.cybozu.help/k/ja/trouble_shooting/guest/purchase_guest_license.html ／サイボウズ／公開日不明／公式（スニペット経由）
71. FormBridge 料金 — https://www.kintoneapp.com/form-bridge/pricing ／トヨクモ／公開日不明／公式（スニペット経由）：ライト 7,000円/月〜
72. トヨクモ「FormBridge・kViewerで『ユーザーライセンス』の追加機能を…」— https://www.toyokumo.co.jp/en/2025/03/03/userlicense-FormBridge-kViewer ／トヨクモ／2025-03-03／公式（スニペット経由）：15,000円/人/月
73. kintone 連携サービス「kViewer」紹介 — https://kintone-sol.cybozu.co.jp/integrate/toyokumo003.html ／サイボウズ／公開日不明／公式（スニペット経由）
74. Notion Help「Build forms in Notion」— https://www.notion.com/help/forms ／Notion／公開日不明／公式（スニペット経由）
75. Notion Help「Publish a website with Notion Sites」— https://www.notion.com/help/public-pages-and-web-publishing ／Notion／公開日不明／公式（スニペット経由）
76. Notion Pricing — https://www.notion.com/pricing ／Notion／公開日不明／公式（スニペット経由）：Plus $4／$5

---

## 未確認事項

1. Deputy の Lite／Core／Pro のユーザー単価（公式）。二次情報（$5／$6.50／$9）のみ。
2. 7shifts の Comp／Essentials／Pro／Premium 各プランの金額、および新プラン体系下での Auto-Scheduler の提供条件。
3. Sling の Premium／Business のユーザー単価（公式）と日本語対応。
4. Zoho Shifts の Standard／Professional の金額、日本語対応、アカウント要件。
5. Connecteam／Planday／Zoho Shifts／7shifts／Sling の「メール無しでの利用可否」。
6. Connecteam・Planday・Homebase・Microsoft Shifts の日本語UIの有無。
7. 各SaaSの「対人組み合わせ制約（この人とこの人は別エリア）」の有無。
8. 各SaaSの欠勤・交代差し替え機能の詳細（Deputy／Connecteam／Planday）。
9. Timefold Solver の Python 版の現行提供形態（本体リポジトリへの統合有無）、Timefold Platform の料金。
10. Red Hat による OptaPlanner EOL の一次資料。
11. kViewer の各コース料金、TimeTrex Community Edition のライセンス、averude/Scheduler のライセンス。
12. 海外SaaSの日本の携帯番号への SMS 到達性、データ保管国。
13. 各社の企業所在地・親会社（Sling＝Toast、Planday＝Xero 等は本調査で未確認のため表中で注記）。
14. 本調査で対象外とした主要サービス：Skello、Shiftboard、Humanity（TCP）、Workforce.com、HotSchedules（Fourth）、ZoomShift、Buddy Punch —[未調査]。

## 次に必要なアクション

1. **社長へのヒアリング（ジン経由）**：「メール無し」の許容範囲（携帯番号SMSなら可か／会社発行のコード方式か）、日本語UIの必須度、想定スタッフ数・店舗数（SaaS のユーザー課金 vs 拠点課金の試算に必要）、スタッフの個人情報を海外SaaSに置くことの可否。
2. **未確認価格の再確認**：プロキシ制限のない環境（社長のPC等）で Deputy／7shifts／Sling／Zoho Shifts の公式料金ページを直接閲覧し、上記[未確認]を埋める（ミナの収支試算の前提）。
3. **ミナ**：ユーザー数・店舗数の前提を置いた3年コスト比較（SaaS 各社 vs 新規開発の保守費 vs ノーコード固定費）。
4. **リョウ**：海外SaaS利用時の個人情報の越境移転・利用規約、GPL/AGPL 系 OSS を改変利用する場合のライセンス義務の確認。
5. **メイ／エイト（開発側と協働する場合）**：OR-Tools または Timefold CE を用いた「エリア×時間帯必要人数＋スキル＋対人組み合わせ制約」の小規模プロトタイプ（公式クイックスタートをベースに 1〜2 週間で検証可能かの見積り）。
6. **アオイ**：本報告の監査（特に価格・ライセンス・EOL の記載が出典と一致しているか、公式スニペット経由の限界が明示されているか）。
7. 領域A・B（国内SaaS・LINE連携・勤怠一体型）の担当リサの結果と統合し、ジンが総合比較表を作成。

## 調査上の限界

- 検索語：英語（サービス名＋pricing／auto scheduling／qualifications／languages／invite phone number 等）、日本語（kintone 料金・ゲストユーザー・外部公開フォーム、FormBridge／kViewer 料金、Zoho Shifts 日本語）。
- 公式ドメイン限定の検索スニペットに依存したため、ページ内の表組み（プラン別料金表）が取得できないケースが多数あった。
- GitHub 以外の公式サイト本文は未閲覧。公開日・更新日は原則不明。
- 検索回数上限により、最終盤の再確認（Deputy／Sling／kViewer 価格、Zoho Shifts 日本語、Deputy の交代機能）は実行できなかった。
- 本報告は法的・金融的判断を含まない。海外SaaS利用の適法性・コスト最終判断はリョウ・ミナ・レン・ジンおよび社長の確認を要する。
