# コホマダ Slack業務管理自動化：他社事例調査 v1

- タスクID：T225（関連：T224 設計提案v5）
- 対象事業：株式会社コホマダ（AI・DX事業）
- 作成：リサ（Research & Evidence Analyst）。ファイル保存は秘書アイが代行（リサは読み取り専任で書き込み権限を持たないため。本文はリサの報告をそのまま転記）
- 日付／取得日：2026-09-26（本書の「取得日」はすべて2026-09-26）
- ステータス：Draft（アオイ監査前）
- 位置づけ：`logs/kohomada_2026-09-26_Slack業務管理自動化_設計提案_v5.md` のブラッシュアップ材料。成功要因の解釈・自社設計への翻訳はメイに委ねる。

## ① 調査の範囲と方法

- 手順：`.claude/skills/success-case-research/SKILL.md` の手順1〜3を「業務自動化」領域に当てはめて実施。情報源の優先順位は `.claude/rules/evidence-policy.md` に準拠（企業公式事例・プレスリリース → ツール提供元公式カスタマーストーリー → 業界メディア → その他）。
- 検索語（日英）：Slack customer story AI automation action items／n8n case study Slack AI／Anthropic customer story Slack／Fireflies・Otter・Zoom AI Companion case study／Slack 導入事例 AI 要約 中小企業／Slack リアクション Notion 自動登録 事例／n8n human in the loop Slack approval／Anthropic building effective agents human in the loop／Slack Workflow Builder AI steps 等、計19回のWebSearch。
- 一次確認：候補のうち22URLをWebFetchで直接読んだ。うち4件は取得不可（`docs.n8n.io/advanced-ai/human-in-the-loop-tools/`＝404→別URLで確認済、`isfnet-services.com/blog/40/slack-case-study`＝404、`isfnet.co.jp` 旧ブログ＝note公式へリダイレクトし該当記事なし、`zapier.com/customer-stories`＝404）。
- 確度ラベル：**一次**＝当事者またはツール提供元の公式ページを直接確認／**二次**＝業界メディア等／**検索経由**＝検索結果の要約のみで原文未確認／**伝聞**＝匿名・第三者ベンダー執筆等。
- 注意：ツール提供元の公式カスタマーストーリーは「一次情報」だが、掲載される数値は多くが顧客の自己申告・体感値・ベンダー内部分析であり、独立した検証はされていない。数値は出典の記載通りに引用し、条件（誰の・何に対する数値か）を併記した。

## ② 事例一覧

### テーマ1：Slackをハブにした「会話→タスク化・要約・次アクション抽出」

| # | 会社名 | 業種／規模 | 施策内容 | 使用ツール | 成果 | 実施時期 | 情報源URL／発行主体／公開日 | 確度 |
|---|---|---|---|---|---|---|---|---|
| 1-1 | コクヨ株式会社（内製開発エンジニア） | 文具・オフィス家具／大企業（記事は内製開発チームの事例） | Slackスレッドに「notion」絵文字でリアクション → 受付Lambdaが即200 OK返却（Slackの3秒ルール対応）→ SQS経由で処理Lambdaがスレッド全文取得 → AIに「タスク名と内容をJSONで」指示して要約 → Notion DBに起票（リアクションしたユーザーのメールから担当者特定、現在のスプリントIDを付与）→ 元投稿に「タスク化しました」リアクション | Slack Events API、AWS Lambda／SQS／API Gateway、Amazon Bedrock（Claude Sonnet 4）、Notion API、Node.js | **定性的な成果のみ**（「Slackでの議論を流れるようにタスク化でき、生産性が若干上がった」）。今後の課題としてAIによるタスク自動分割・Notionブロック形式への出力最適化 | 2025年 | https://note.com/kokuyo_engineer/n/nff25f7ab945b ／コクヨ内製開発エンジニア（note）／2025-12-16 | 一次（当事者執筆） |
| 1-2 | Anthropic | AI開発／大企業 | Slack内にClaudeボットを統合。`#anthropic-times` チャンネルで複数チャンネルの会話をClaudeが自動要約し日次ブリーフィング化。チームは@メンションでスレッド要約・ブレスト等 | Slack、Claude（Slackボット）、Slack Connect、Huddle、Salesforceチャンネル | 年間450万ドル削減（ファイル共有・Slack Connect・Huddle・クリップ・タスク連携など**複数機能の時間削減から算出。AI要約単独の数値ではない**）、営業サイクル60%高速化（Salesforceチャンネル活用）、GTMチームが2年未満で3人→数百人 | 公開日不明 | https://slack.com/customer-stories/anthropic-story ／Slack（Salesforce）／公開日記載なし | 一次（Slack公式） |
| 1-3 | Notion | SaaS／大企業 | Slackチャンネルに Notion AI／Custom Agents を配置。社内問い合わせ対応エージェント「Smilers」、エンジニアリングではHoneycomb／Splunk連携エージェントでアラート分析 | Slack、Notion AI、Custom Agents | Smilers：2,500件超の社内リクエストを処理し週10〜20時間削減／エンジニアリング：1日2時間超節約／全社「少なくとも1日2〜3時間」削減（いずれも同社談） | 公開日不明 | https://slack.com/customer-stories/notion-story ／Slack／公開日記載なし | 一次（Slack公式） |
| 1-4 | Huel | 栄養食D2C／従業員350人（技術チーム約50人） | Slack内AIアシスタント（法務質問・請求書照会）、データパイプライン、財務タスク、カレンダー・受信箱管理等をn8nで自動化 | n8n、Slack、AI | 9か月で約1,000時間の手作業削減・£100,000超のソフトウェア費削減（SaaS廃止）、ライブワークフロー約200本、100人超が利用 | 公開日不明 | https://n8n.io/case-studies/huel/ ／n8n／公開日記載なし | 一次（n8n公式） |
| 1-5 | 株式会社ブレインパッド | データ分析／200名超 | Slack AI「まとめ」（チャンネル要約の毎朝ダイジェスト）・スレッド要約を活用。Slack AI日本語版のファーストカスタマー（2024年4月導入） | Slack AI | 重要度の低いチャンネルの概要把握：約3分→約20秒（**体感値**）／スレッド内容理解の時間：20〜50%短縮（**計測値**）／AI利用者の56%が「便利」（社内アンケート）。導入3か月時点の測定 | 2024年 | https://slack.com/intl/ja-jp/customer-stories/brainpad-story ／Slack Japan／公開日記載なし | 一次（Slack公式・日本語） |
| 1-6 | Slack AIパイロット顧客群（Wayfair、Beyond Better Foods、ProService Hawaii 等） | 各種 | Slack AIの検索・会話要約 | Slack AI | 「あらゆる規模の企業でユーザー1人あたり週平均97分の節約」（**Slackのパイロット顧客を対象とした社内分析**）／Beyond Better Foods：運営担当VPが1日最低30分短縮／ProService Hawaii：1日100件超のメッセージを要約でキャッチアップ | 2024年 | https://slack.com/blog/news/work-faster-and-smarter-with-slack-ai ／Slack／2024-04-18 | 一次（ベンダー自社分析） |
| 1-7 | Intuit QuickBooks、Ari Bikes、Ray White、信用組合（名称不明）等 | 各種 | Slack Workflow Builder・AI業務タスクによる手作業置換 | Slack、Workflow Builder | Intuit QuickBooks：ケース解決時間36%削減・年間9,000時間削減／Ari Bikes：従業員1人あたり1日2時間節約／信用組合：ワークフロー自動化で承認時間20%削減／Ray White：ボイスメール対応の約90%をリアルタイム処理 | 記事は2025年 | https://slack.com/blog/transformation/replace-manual-steps-and-improve-workflows-with-ai-business-tasks ／Slack／2025-03-10 | 一次（ベンダーブログ内の引用。個別事例ページは未確認） |
| 1-8 | ClickUp（テクニカルサポート） | SaaS／大企業 | サポートエンジニア1名がZapier MCPでZendeskのチケット文脈を取得し製品データと照合、回答候補をチャット画面に自動提示 | Zapier（MCP）、Zendesk | チケット1件の調査時間15分→4分、月5,000件超で約917時間/月削減 | 2025〜2026年 | https://zapier.com/customer-stories ／Zapier／公開日不明（**ページ本文は404で未読、検索結果の要約に基づく**） | 検索経由 |
| 1-9 | ネクストモード株式会社 | ITコンサル・Notion販売代理店／小規模 | Slackで特定絵文字にリアクション → Zapierが検知 → Notion DBに参加者として自動登録（懇親会等の参加者募集） | Slack、Zapier、Notion（AIなし） | **定性的な成果のみ**（数値なし） | 2024年 | https://info.nextmode.co.jp/blog/automate-slack-reaction-to-notion-with-zapier ／ネクストモード（自社ブログ）／2024-12-26 | 一次（小規模企業・当事者） |
| 1-10 | 匿名「6人のローカルマーケティング代理店」 | 代理店／6人 | Calendly→CRM→Trello→Slackのリード取得、オンボーディング、日次レポートをn8nで自動化 | n8n、Slack、Trello、Calendly | 週25時間の手作業→週20〜22時間削減と記載 | 2025年 | https://www.techbuddies.io/2025/12/27/case-study-how-n8n-automation-saved-a-small-business-20-hours-a-week/ ／techbuddies.io（実装支援ベンダー）／2025-12-27 | 伝聞（匿名・ベンダー執筆。**重要事項の根拠にしない**） |
| 1-11 | 株式会社アイエスエフネット | ITサービス／大企業 | Slack Workflow Builderで勤怠報告・各種申請を置換（AIなし） | Slack Workflow Builder | 「工数削減率約70%」「17部署244人が勤怠報告に利用、1人5分換算で月400時間超削減」と検索結果に記載 | 2021年頃 | https://www.isfnet-services.com/blog/40/slack-case-study ／アイエスエフネット／公開日不明（**原文404、旧ブログもnote公式へリダイレクトし該当記事なし。検索結果の要約に基づく**） | 検索経由（低確度） |

### テーマ2：会議の文字起こし→アクションアイテム抽出→タスク管理へ

| # | 会社名 | 業種／規模 | 施策内容 | 使用ツール | 成果 | 実施時期 | 情報源URL／発行主体／公開日 | 確度 |
|---|---|---|---|---|---|---|---|---|
| 2-1 | Gainsight | テクノロジー／50〜999人 | 未審査のサードパーティAIツール乱立への対策として Zoom AI Companion に標準化。会議要約を自動生成し、**社員が共有前にレビュー・編集**。要約生成の有無はホストが制御 | Zoom AI Companion | CIO：週1.5時間創出、会議時間の17%が有益な議論に転換（本人の見積り）／サードパーティAI購読（約$30/ユーザー）廃止で年間「数万ドル」節約 | 公開日不明 | https://www.zoom.com/en/customer-stories/gainsight/ ／Zoom／公開日記載なし | 一次（Zoom公式） |
| 2-2 | Aiden Technologies, Inc. | ITサイバーセキュリティ／規模不明 | Zoom営業商談を自動録音・文字起こし、メモの検索・タグ付け・共有、CRMノート記録、リーダーによるコーチング | Otter.ai、Zoom、CRM | 営業チームの生産性33%向上（VP of Sales談。手動メモ・録画見返しの削減分） | 公開日不明 | https://otter.ai/case-study/aiden-technologies ／Otter.ai／公開日記載なし | 一次（Otter公式） |
| 2-3 | Moonfrog Labs | ゲーム開発／インド | Google Meet連携で自動記録・文字起こし、AIフィルターでアクションアイテム・質問・日時等を抽出、会議後に要約を全員へ自動送信 | Fireflies.ai、Google Meet | **定性的な成果のみ**（専任ノートテーカー不要化、アクションアイテムの追跡と期限管理の効率化） | 2021年 | https://fireflies.ai/blog/moonfrog-labs-case-study/ ／Fireflies.ai／2021-03-25 | 一次（古い） |
| 2-4 | 八千代エンジニヤリング株式会社 | 建設コンサル／1,000〜1,500人 | Web会議への自動参加・話者識別、付箋機能でタスク管理、キーワード検索 | Notta | **定性的な成果のみ**（議事録作成時間「大幅に短縮」、データ保存作業「ゼロに」） | 公開日不明 | https://www.notta.ai/cases/yachiyo ／Notta／公開日記載なし | 一次（Notta公式） |
| 2-5 | （機能情報）Google Meet「Take notes for me」 | ― | 会議を文字起こしし、アクションアイテムを含む要約をGoogle DriveのDocsに自動保存、メールで配信。対象：Google AI Pro／Ultra加入者、対象Workspace有料顧客 | Gemini、Google Meet | 企業事例・数値なし（検索結果にTrellix・Pepperdineの引用と「利用13倍」の記載があったが、確認したページには載っておらず**未確認**） | 2026年 | https://blog.google/products-and-platforms/products/workspace/take-notes-for-me/ ／Google／2026-06-29 | 一次（機能のみ） |
| 2-6 | （機能情報）Slack Huddle AIノート | ― | 音声とスレッドから要点を記録しcanvasに自動作成 | Slack AI | 企業事例なし。同記事に「ユーザーが6億件超のメッセージを要約、110万時間節約（2024-02-14〜08-20の社内分析）」 | 2024年 | https://slack.com/blog/news/ai-innovations-in-slack ／Slack／2024-09-30 | 一次（機能のみ） |

補足：「文字起こし→アクションアイテム→タスク管理ツールへ自動登録」を**運用し効果数値まで公表している企業事例**は、今回の検索範囲では確認できなかった（Fireflies×Asana等は機能ドキュメント・ヘルプ記事のみ）。

### テーマ3：人間の承認ポイント（human-in-the-loop）を組み込んだ運用事例

| # | 主体 | 内容（どこまで自動・どこで人が確認するか） | 情報源URL／発行主体／公開日 | 確度 |
|---|---|---|---|---|
| 3-1 | Anthropic（社内事例） | エンジニアリングリーダーがバックログ整理を人間＋エージェント混成で実施。エージェント群が未担当項目を読んで複雑度スコア付与、別のエージェント群がコード変更を作成。**当初は人間が全決定をレビュー** → 「難しいトレードオフを含む判断は必ず人に上げる」よう教える → 週次「lessons & missteps」報告 → 実証された信頼性に比例して自律性を拡大。人間はSlack等の同じスレッドで働きつつ「人間にしかできない役割（戦略・トレードオフ判断・品質基準）」を保持。エージェントには連絡をまとめて出す（人の注意を有限資源として守る）よう指導 | https://claude.com/blog/building-effective-human-agent-teams ／Anthropic（Claude blog）／2026-06-24 | 一次 |
| 3-2 | Gainsight | AI要約は共有前に人がレビュー・編集。要約生成の有無をホストが制御（2-1参照） | 2-1と同じ | 一次 |
| 3-3 | Slack（公式ワークショップ） | 顧客メール→AIが返信ドラフト→**Slack内で人が編集・確定してから顧客へ送信**。「thinking」メッセージで処理中を通知 | https://slack.dev/workshop/design-slack-workflows-with-ai-integrations/ ／Slack／公開日記載なし | 一次（ガイド） |
| 3-4 | n8n（公式ドキュメント） | AI Agentのツール呼び出しに「Human review」を設定：AIが対象ツールを使おうとするとワークフローが停止し、Slack等へ承認要求（ツール名・パラメータを `$tool` で提示）→ Approve で実行／Deny でキャンセルしAIに拒否を通知。**推奨用途：データ削除・対外コミュニケーション送信・購入などの不可逆操作、コンプライアンス要件、影響の大きい判断、AIへの信頼構築段階**。システムプロンプトに「どのツールが承認必須か・拒否時の対応」を書くことが必須 | https://docs.n8n.io/build/integrate-ai/ai-examples/human-in-the-loop-for-tools ／n8n／公開日記載なし | 一次（ガイド） |
| 3-5 | コクヨ | 起票自体は人の確認なしで自動だが、**「どの会話をタスク化するか」は人がリアクションで選ぶ**（入口側の人的トリガー）。完了はリアクションで通知（1-1参照） | 1-1と同じ | 一次 |

### テーマ4：ツール提供元の公式設計ガイド・ベストプラクティス

| # | 資料 | 要点（設計に関わる事実） | URL／発行主体／公開日 | 確度 |
|---|---|---|---|---|
| 4-1 | n8n「Human-in-the-loop for tools」 | 3-4参照。承認チャネル：Chat／Slack／Discord／Telegram／Microsoft Teams／Gmail／WhatsApp／Google Chat／Outlook。Subagentでも機能 | https://docs.n8n.io/build/integrate-ai/ai-examples/human-in-the-loop-for-tools ／n8n／記載なし | 一次 |
| 4-2 | n8n Slackノード「Approvals」 | 「Message > Send and Wait for Response」でSlack内承認。設定：Capture Who Responded（応答者記録）、**Restrict Who Can Approve（承認者をユーザーIDで限定）**、Unauthorized Reply、After Decision（結果表示＋ボタン削除がデフォルト）。要件：**HTTPSで公開到達可能なn8n、Slack認証情報にSigning Secret、`users:read`・`users:read.email`スコープ** | https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-base.slack/approvals ／n8n／記載なし | 一次（設計v5で「検索経由」だった点を本文確認済み） |
| 4-3 | Anthropic「Building Effective Agents」 | 「ワークフロー（事前定義のコードパスでLLMとツールを制御）」と「エージェント（LLMが動的に工程とツール使用を決める）」を区別。パターン：prompt chaining／routing／parallelization／orchestrator-workers／evaluator-optimizer。エージェントは「チェックポイントで人のフィードバックのため一時停止、または障害時に人へ確認」。原則：シンプルさ・透明性・ツールの文書化とテスト | https://www.anthropic.com/engineering/building-effective-agents ／Anthropic／2024-12-19 | 一次 |
| 4-4 | Anthropic「Building effective human-agent teams」 | 3-1参照。枠組み：共有チャンネルで透明に働く／担当（roster）を明確に／実証された信頼性に比例して自律性を付与／north star goalを置く／自律拡大前に検証機構を作る | https://claude.com/blog/building-effective-human-agent-teams ／Anthropic／2026-06-24 | 一次 |
| 4-5 | Anthropic「Introducing Claude Tag」 | Slackで@Claudeをタグしてタスク委譲。同一チャンネルで複数人が同じClaudeと協働、チャンネル内情報から文脈を学習、Ambientモードで必要そうな情報を自発的にフラグ、非同期・スケジュール実行。**対象：Claude Enterprise／Teamのベータ**。社内実績「製品チームのコードの65%が社内版Claude Tagで作成」。**人間の確認・承認プロセスについての明記はなし** | https://www.anthropic.com/news/introducing-claude-tag ／Anthropic／2026-06-23 | 一次（設計v5で「検索経由」だった点を本文確認済み。料金・対応言語は未記載） |
| 4-6 | Slack「Generate AI Response Step（Workflow Builder）」 | AIステップで要約・翻訳・下書き・テキスト分類・データ変換。管理者によるアクセス制御。**対象プラン・実顧客事例の記載なし**（仮想例のみ） | https://slack.com/blog/news/generate-ai-steps-workflow-builder ／Slack／2026-05-21 | 一次 |
| 4-7 | Slack開発者ワークショップ「Design Slack workflows with AI integrations」 | 3-3参照 | https://slack.dev/workshop/design-slack-workflows-with-ai-integrations/ ／Slack／記載なし | 一次 |
| 4-8 | Slack「Announcing agents and AI innovations in Slack」 | Agentforce in Slack、サードパーティAIエージェント（Anthropic Claude等）のMarketplace提供、AI検索、Huddle AIノート、自然言語からのワークフロー生成 | https://slack.com/blog/news/ai-innovations-in-slack ／Slack／2024-09-30 | 一次 |
| 4-9 | Google「Take notes for me」 | 2-5参照 | https://blog.google/products-and-platforms/products/workspace/take-notes-for-me/ ／Google／2026-06-29 | 一次 |

## ③ 事例から見える共通パターン（事実として観察できる範囲）

解釈・成功要因の分析はメイに委ねる。以下は複数事例に共通して**記載されていた事実**。

1. **「人が選んだ会話だけ」を入口にする方式が、確認できた実装事例に共通**：コクヨ（絵文字リアクション）、ネクストモード（絵文字リアクション）の2件の導入事例に加え、製品機能としてのClaude Tag（@タグ）も同じ方式。全メッセージ常時監視型の企業事例は今回の範囲では確認できなかった（Slack AIの「まとめ」は要約であり起票ではない）。
2. **書き込み先は既存ツール、Slack側には完了サインを返す**：コクヨはNotion起票後に「タスク化しました」リアクション（設計v5の✅と同じ形）。Otter（CRMノートへ記録）・Fireflies（要約を参加者へ自動送信）も、結果を既存のツール・連絡経路へ戻す形。
3. **人の確認位置は3種類に分かれる**：(a) 対外送信の直前（Slackワークショップ、n8n推奨用途）、(b) 要約・記録の共有前（Gainsight）、(c) 判断が難しいものだけ人に上げる（Anthropic社内事例）。Anthropicは「最初は全件人間レビュー→段階的に自律拡大」を明記。
4. **承認は「誰が押せるか」と「誰が押したか」を記録する設計が公式に用意されている**：n8n Slack承認の Restrict Who Can Approve／Capture Who Responded。
5. **公表されている数値の多くは「1人あたり週○分／日○時間」の自己申告・社内分析**：Slack 97分/週（パイロット社内分析）、ブレインパッド（体感値と計測値を区別して公表）、Gainsight（CIOの見積り）、Aiden（33%・VP談）。独立した第三者検証つきの数値は今回の範囲では見当たらなかった。
6. **技術面の共通課題**：Slackイベントは3秒以内の応答が必要で、コクヨは受付と処理を分離（SQS）。n8n Slack承認はHTTPS公開URLとSigning Secretが前提。設計v5の9章「未確認事項」（外部公開URL・署名検証）と一致する論点。
7. **少人数事例は少ない**：一次情報で確認できた事例は中〜大企業（Huel 350人、Gainsight 50〜999人、ブレインパッド200名超、コクヨ、Notion、Anthropic）が中心。小規模はネクストモード（AIなし・定性のみ）と匿名6人代理店（低確度）のみ。

## ④ 見つからなかったこと・確度の低い情報

- **見つからなかったこと**（今回の検索範囲では確認できなかった）
  - 「Slack＋n8n（またはZapier/Make）＋Claude/ChatGPTで会話→タスク化」を**少人数・小規模事業者が導入し、数値効果を公表している一次情報**。
  - 「会議文字起こし→アクションアイテム抽出→タスク管理ツールへ自動登録」を運用し**効果数値まで公表している企業事例**（機能ドキュメントは多数あるが、企業事例は要約・記録までの成果が中心）。
  - Slack Huddle AIノートの企業導入事例。
  - Claude Tagの顧客導入事例（発表が2026-06-23と新しく、Anthropic社内実績のみ）。
  - Anthropic公式のカスタマーストーリーで、Slack自動化を主題にした小規模企業の事例（`claude.com/customers/slack` はSlack社自身が顧客の事例＝Slack AIの裏側にClaudeが使われており、「平均ユーザーで週97分節約」と記載）。
- **確度の低い情報（重要事項の根拠にしないこと）**
  - 1-8 ClickUp（Zapier）：一次ページ404、検索要約のみ。
  - 1-10 匿名6人代理店：ベンダー執筆・匿名。
  - 1-11 アイエスエフネット「70%」「月400時間超」：原文が404で未確認。
  - 検索結果に出た「n8n Slackセキュリティボットで年3,600時間・調査97%削減」「Delivery Hero 200時間/月」「Musixmatch 47日」：n8n事例一覧ページの見出しでは Delivery Hero・Musixmatch の数値は確認できたが、Slack・AIタスク化とは直接関係が薄いため事例表には含めていない。3,600時間の事例は会社名・原文を特定できず未採用。
  - 検索結果の「Slack AI要約で情報収集時間を最大80%削減」（第三者メディア）、「Zoom AI Companionで週6時間節約」（Perplexity掲載の事例、原文未読）、「Fireflies で週5〜10時間」（同社ブログの一般論）：一次確認していないため未採用。
  - Google「Take notes for me」のTrellix引用・「利用13倍」：確認したGoogle公式ページには記載がなく未確認。

## ⑤ 出典一覧（取得日：すべて2026-09-26）

本文直接確認済み（WebFetchで本文を読んだもの。②表の「確度」欄の「一次／伝聞」とは別の区分で、24番のように伝聞扱いでも本文自体は読んだものを含む）
1. コクヨ内製開発エンジニア（note）「Slackのリアクション一つで、スレッドをAI要約してNotionにタスク起票するボットを作った話」 https://note.com/kokuyo_engineer/n/nff25f7ab945b （2025-12-16）
2. Slack「Scaling Smarter: Anthropic Saves Millions and Moves Faster with Slack」 https://slack.com/customer-stories/anthropic-story （公開日記載なし）
3. Slack「Notion が Slack で実現する AI インターフェースとは」 https://slack.com/customer-stories/notion-story （公開日記載なし）
4. n8n「Case study Huel」 https://n8n.io/case-studies/huel/ （公開日記載なし）
5. n8n「Case studies」一覧 https://n8n.io/case-studies/
6. Slack Japan「Slack AI がチャンネルの概要把握のコストを9分の1に削減し…」（ブレインパッド） https://slack.com/intl/ja-jp/customer-stories/brainpad-story （公開日記載なし）
7. Slack「Businesses of all sizes are working smarter and faster with Slack AI」 https://slack.com/blog/news/work-faster-and-smarter-with-slack-ai （2024-04-18）
8. Slack「Replace Manual Steps and Improve Workflows with AI Business Tasks」 https://slack.com/blog/transformation/replace-manual-steps-and-improve-workflows-with-ai-business-tasks （2025-03-10）
9. Slack「Announcing agents and AI innovations in Slack」 https://slack.com/blog/news/ai-innovations-in-slack （2024-09-30）
10. Slack「Smarter Workflows, No Code Required: Introducing New AI Steps in Workflow Builder」 https://slack.com/blog/news/generate-ai-steps-workflow-builder （2026-05-21）
11. Slack開発者ワークショップ「Design Slack workflows with AI integrations」 https://slack.dev/workshop/design-slack-workflows-with-ai-integrations/ （公開日記載なし）
12. Anthropic（Claude）「Customer story | Slack」 https://claude.com/customers/slack （公開日記載なし）
13. Anthropic「Building Effective AI Agents」 https://www.anthropic.com/engineering/building-effective-agents （2024-12-19）
14. Anthropic「Lessons from Anthropic on building effective human-agent teams」 https://claude.com/blog/building-effective-human-agent-teams （2026-06-24）
15. Anthropic「Introducing Claude Tag」 https://www.anthropic.com/news/introducing-claude-tag （2026-06-23）
16. n8n Docs「Human-in-the-loop for tools」 https://docs.n8n.io/build/integrate-ai/ai-examples/human-in-the-loop-for-tools （公開日記載なし）
17. n8n Docs「Slack node approvals」 https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-base.slack/approvals （公開日記載なし）
18. Zoom「Customer Story: Gainsight」 https://www.zoom.com/en/customer-stories/gainsight/ （公開日記載なし）
19. Otter.ai「Aiden Technologies Case Study」 https://otter.ai/case-study/aiden-technologies （公開日記載なし）
20. Fireflies.ai「How Fireflies.ai Helps Moonfrog Labs…」 https://fireflies.ai/blog/moonfrog-labs-case-study/ （2021-03-25）
21. Notta「社内議事録作成の負担を軽減｜八千代エンジニヤリング」 https://www.notta.ai/cases/yachiyo （公開日記載なし）
22. Google「Gemini can now take notes in Google Meet…」 https://blog.google/products-and-platforms/products/workspace/take-notes-for-me/ （2026-06-29）
23. ネクストモード「SlackでリアクションしたメンバーをNotionデータベースに登録してみた」 https://info.nextmode.co.jp/blog/automate-slack-reaction-to-notion-with-zapier （2024-12-26）
24. techbuddies.io「Case Study: How n8n Automation Saved a Small Business 20+ Hours a Week」 https://www.techbuddies.io/2025/12/27/case-study-how-n8n-automation-saved-a-small-business-20-hours-a-week/ （2025-12-27・匿名事例）

検索経由（原文未確認）
25. Zapier「Customer Stories」（ClickUp・Corey Smith事例） https://zapier.com/customer-stories （404で本文未読）
26. アイエスエフネット「【活用事例】Slackワークフローで1ヶ月の工数削減率70%の秘訣とは？」 https://www.isfnet-services.com/blog/40/slack-case-study （404で本文未読）

社内参照
- `logs/kohomada_2026-09-26_Slack業務管理自動化_設計提案_v5.md`、`.claude/skills/success-case-research/SKILL.md`、`.claude/skills/market-research-protocol/protocol.md`、`.claude/rules/evidence-policy.md`

## ⑥ 未確認事項

- Slack公式顧客事例（Anthropic・Notion・ブレインパッド）、n8n Huel、Zoom Gainsight、Otter Aiden、Notta八千代の**公開日**はページに記載がなく不明。
- 事例1-8・1-11は原文未読（上記④）。
- Claude Tagの料金・対応言語・Team/Enterprise以外への提供予定は公式ページに記載なし（設計v5の9章の未確認点は引き続き未解消）。
- 各事例の数値はいずれも顧客自己申告・ベンダー内部分析であり、独立検証の有無は不明。

## ⑦ 次に必要なアクション（リサからの申し送り）

1. メイ：③の共通パターンを設計v5に照らして解釈し、特に (a) コクヨ事例の「受付と処理の分離（3秒ルール）」、(b) n8n Slack承認の「承認者限定・応答者記録・HTTPS/Signing Secret要件」、(c) Anthropic事例の「全件レビュー→段階的に自律拡大」を、フェーズ1／1.5／2の設計に反映するかを検討。
2. アオイ：本調査の出典URLと本文記載の一致を監査（特に数値の条件表記）。
3. 社長へのヒアリング事項（設計v5の7章と重複）：現状の手作業時間。他社事例の数値は自社効果の見積りには直接使えないため、自社の実測が必要。
