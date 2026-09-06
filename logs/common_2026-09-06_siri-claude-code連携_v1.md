# T224：iPhone Siri × Claude Code 連携（n8n経由）要件定義・設計

- 案件：T224「外出先からiPhoneのSiriに話しかけて、Claude Codeに指示を出したい」
- 担当：メイ（AI Automation & Operations Architect）
- 作成日：2026-09-06 / 版数：v1（初版・要件定義〜設計比較段階。実装未着手）
- 関連skill：`.claude/skills/n8n-automation-design/`（メイ担当分）
- 関連ルール：`.claude/rules/security-policy.md` `.claude/rules/approval-policy.md` `.claude/rules/evidence-policy.md`

---

## 結論

1. 「Siriに話しかけるだけでClaude Codeが動く」を**丸ごと一発で実現する公式機能は確認できなかった**。実現するには、①音声をテキストにしてどこかへ送る入口（iOS Shortcuts）と、②Claude Codeを実際に動かす経路、の2つを別々に設計する必要がある。
2. ②の経路には大きく2案ある。
   - **案A**：n8nのWebhook＋SSH/Execute Commandノードで、社長のPC上の`claude -p`（ヘッドレスモード）を遠隔実行する。
   - **案B**：Anthropic公式の「Remote Control」機能（2026-02-25公開、確認済み）を主軸にし、n8n/Siriは通知・トリガーの補助役に留める。
3. 現時点の確認済み事実だけで比較すると、**案Bを軸に検討することを推奨**する。案Aは社長個人のPCを外部から到達可能にする必要があり、セキュリティ上の攻撃対象面拡大・運用負荷（PCの常時起動・ネットワーク構成）が大きい。ただし案Bにも「本当にSiri（音声）から直接ではなく、iPhone上のClaudeアプリを開いて話す形になる可能性が高い」という制約があり、社長が期待する体験と一致するかは要確認。
4. **本タスクは、通常のコンテンツ下書き自動化とは性質が異なる**（Claude Code自体の操作権限・PCへの到達性・認証情報が絡む）。`.claude/rules/approval-policy.md`が現在自動化対象としているのは「n8nワークフロー自体の登録・更新・有効化」であり、「Claude Codeに社長のPC上でどこまでの操作権限を与えるか」「PCを外部から到達可能にするか」は**新しい種類の意思決定**であるため、独立して人間承認を求めるべき事項として本書で明示する（詳細は「リスク・注意点」）。
5. 実装フェーズに進める前に、下記「未確認事項」のヒアリングが必須。特に「社長が普段Claude Codeをどのマシンで動かしているか」「Anthropicの有償プラン契約状況」が固まらないと、案A・案Bどちらも設計の前提が崩れる。

---

## 確認済み事実

### Claude Code側

- Claude Codeには公式のヘッドレスモード（`-p` / `--print`）が存在する。非対話でプロンプトを渡し、標準出力に結果を返す。`--output-format`（text/json/stream-json）、`--resume`/`-r`（セッションIDで再開）、`--continue`/`-c`（直近の会話継続）、`--allowedTools`（許可ツールの明示）、`--permission-mode`（`acceptEdits`等）といったオプションが公式ドキュメントに記載されている。
  出典：Anthropic公式 `docs.anthropic.com/en/docs/claude-code/headless`（確認日2026-09-06）
- **`--cloud <session-id>`のような「クラウド上のセッションをIDで指定して実行する」オプションは、今回確認した公式ドキュメントには記載がなかった。[未確認]** 存在しないものとして設計を進める（ユーザー提示の懸念どおり、架空のオプションとして扱う）。
- Anthropic公式の**Remote Control機能**が存在する（2026-02-25公開）。ローカルPC上で起動・ログイン済みのClaude Codeセッションを、`claude.ai/code`のブラウザやClaude公式モバイルアプリ（iOS/Android）から継続操作できる。要点：
  - セッションの実体は**社長のPC上でローカルに動き続ける**（ファイル・サーバー・ツールへのアクセスも全部ローカル環境依存）。モバイル/ブラウザ側は「そのセッションの窓」に過ぎない。
  - 利用要件：Pro・Max・Team・Enterpriseプラン。**APIキーでは利用不可**。
  - 認証：`claude`起動後に`/login`で`claude.ai`アカウントにログインする方式。
  - Team/Enterpriseでは管理者が事前にRemote Controlのトグルを有効化する必要がある。
  出典：Anthropic公式 `docs.anthropic.com/en/docs/claude-code/remote-control`（確認日2026-09-06）
- Anthropicは「Claude Agent SDK」を公式提供しており、Claude Codeを動かすエージェントループを自前のPython/TypeScriptプログラムに組み込み、自前のHTTPサーバー等として稼働させることができる（CLI以外の形での headless 運用手段）。
  出典：Anthropic公式 `code.claude.com/docs/en/agent-sdk/overview`、`platform.claude.com/docs/en/agent-sdk/overview`（確認日2026-09-06）

### n8n・iOS Shortcuts側

- n8nには公式コアノードとして「SSH」ノード（リモートホストへの接続・コマンド実行）と「Execute Command」ノード（**n8n自身が動いているマシン上**でコマンドを実行）が存在する。両者は役割が異なり、社長個人のPC上で`claude`を動かしたい場合は原則SSHノード（n8nサーバーから社長PCへ接続する構成）が対象になる。Execute Commandは「n8nサーバー自体」でコマンドが実行されるため、n8nがクラウド/別ホストで動いている限りClaude Codeの対象環境にはならない。
  出典：n8n公式 `docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.ssh`、`docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.executecommand`（確認日2026-09-06）
- iOS Shortcutsの「音声で入力を受け取る（Ask for Input／ディクテーション）」＋「Get Contents of URL（POST）」を組み合わせて、Siriから起動したショートカットでn8n Webhookにテキストを送る構成は、n8n公式のワークフローテンプレートにも実例がある一般的なパターンである。
  出典：n8n.io公式ワークフローテンプレート「Siri AI agent: Apple Shortcuts powered voice template」等（確認日2026-09-06）

### 本プロジェクトの既存環境（社内の別案件からの確認済み事実）

- 自社のn8n環境は`https://kohomadha-n8n.top`（セルフホスト、コミュニティ版相当と推定、`communityNodesEnabled: true`）で稼働しており、`.env`のAPIキーでの接続・読み取り専用監査が完了している（2026-08-09）。SSH/Execute Commandノードの実使用例は既存7ワークフロー中には無かったが、n8nのコアノードである以上、原則としてこのインスタンスでも利用可能と考えられる（ただし実際に有効か・バージョン互換かは`[要インスタンス確認]`）。
  出典：`logs/common_2026-08-09_n8n実環境監査_v1.md`
- 既存ワークフロー一覧の中に「Claude Code API Test」（非稼働・2ノード・2026-08-07作成）という名称のワークフローが存在することが確認されている。**中身が実際にClaude Code CLIを叩くものなのか、単にAnthropic Messages APIを試したものなのかは、今回参照した監査記録の範囲では未確認。** T224着手時は、まずこのワークフローの中身を読み取り専用で確認することを推奨する（ゼロから作るより先に既存資産を確認すべき）。
- 既存のAUTO-COM-001（共通Claude API呼び出しサブワークフロー）はHTTP RequestノードでAnthropic **Messages API**（モデルにテキストを生成させるAPI）を呼んでいる。これは「Claude（モデル）に文章を書かせる」用途であり、**「Claude Code（ファイル操作・コマンド実行ができるコーディングエージェント）を動かす」用途とは別物**である点に注意。本タスクが求めているのは後者。
  出典：`n8n-automation/docs/cases/AUTO-COM-001/workflow-design.md`
- `n8n-automation/CLAUDE.md`の「現在確認できている環境」節（社長PC側：Windows 11 Pro、PowerShell、Node.js v24.18.0、**Git未インストール**、Docker未検出）は、上記2026-08-09監査より前の記載のまま更新されていない。この情報が「今回Siriから操作したいと考えているPC」と同一マシンかどうかは未確認。
- コウキAIラボのCLAUDE.mdが言及する「LINE→Render上でClaude Agent SDKを動かすフル機能モード」（`server/SETUP.md`記載想定）について、**本リポジトリには現時点で`server/`フォルダ自体が存在しない**ことを確認した（2026-09-06、Globで検索し0件）。したがって「既存の類似実装がある」という前提には立てない。あくまでCLAUDE.md上の設計思想（LINE等の外部トリガー→クラウド上でClaude Agent SDKを常駐させる）を参考パターンとして引用するに留める。

---

## 推測・仮説（現在の仮定）

- 社長がすでに何らかのAnthropic有償プラン（Pro/Max等）でClaude Codeを利用していると仮定しているが、**未確認**。API従量課金のみの契約であれば、Remote Control機能自体が利用不可（案Bの前提が崩れる）。
- 「外出先から」という言葉から、社長のPC（Claude Codeが動くマシン）は自宅または固定の作業場所に置いてあり、外出中は電源が入ったままである、と仮定している。**PCがスリープ・シャットダウンしていれば案A・案Bともに機能しない**（Remote Controlもローカルセッション前提のため）。
- Siriへの発話は「短い指示・確認」中心（例：「T5の進捗どう？」「note下書きの候補出しておいて」）であり、長文の複雑な指示や、ファイルを見ながらの込み入った作業は想定していない、と仮定している。音声認識の精度・誤変換リスクを踏まえると、この仮定が崩れる場合は設計を見直す必要がある。

---

## 分析（業務分析・要件定義）

### 実現したいことの整理（ユーザーストーリー）

> 社長として、外出先でiPhoneのSiriに話しかけるだけで、会社（Claude Code）に簡単な指示・確認ができるようにしたい。PCの前に戻らなくても、進捗確認や軽い作業依頼ができる状態にしたい。

### 機能要件（案）

| ID | 要件 | 優先度 | 備考 |
|---|---|---|---|
| FR-1 | Siri（音声）からテキスト化した指示を送信できる | 必須 | iOS Shortcuts経由が現実的な唯一の入口。Siri単体で直接Claude Codeへ話しかける公式連携は未確認 |
| FR-2 | 送信した指示がClaude Code（社長のPC上の実行環境）に届き、実行される | 必須 | 案A/案Bで経路が異なる |
| FR-3 | 実行結果・回答が社長のiPhoneに返る（プッシュ通知/LINE/Claudeアプリ内表示等） | 必須 | 経路によって手段が異なる |
| FR-4 | 破壊的操作（ファイル削除・Git push・外部送信等）は、音声指示だけでは実行されず、必ず人間の最終確認を挟む | 必須（承認方針上） | `.claude/rules/approval-policy.md`と連動 |
| FR-5 | Siriの音声認識ミスや誤操作による意図しないコマンド実行を防ぐ仕組み | 推奨 | 実行前確認・許可コマンドのホワイトリスト化等 |
| FR-6 | 実行ログが残り、後から何を指示して何が起きたか追跡できる | 推奨 | n8n実行ログ or Claude Codeセッションログ |

### 非機能要件（案）

- **セキュリティ**：外部から社長のPC・Claude Codeセッションに到達できる経路を新設する以上、認証（Webhookの署名/シークレット、SSHの鍵認証等）・到達範囲の最小化（VPN/ゼロトラストネットワーク等でSSHをインターネットに直接公開しない）が必須。
- **例外処理**：PCがオフライン、n8nが応答しない、Claude Codeがタイムアウトした場合に、社長へその旨が分かる形でフィードバックされること（無応答のまま放置しない）。
- **承認フロー**：本文書「リスク・注意点」に記載の事項は、n8nワークフロー自体の自動化対象化（2026-08-15方針）とは別に、個別の人間承認を要する。
- **監視**：異常な頻度でのリクエスト（乗っ取り・誤爆の兆候）を検知できること。
- **運用**：PCの再起動・アップデート時にClaude Code常駐/Remote Controlログイン状態が切れた場合の復旧手順を用意する。

### ヒアリング事項（実装着手前に社長に確認すべきこと）

1. 普段Claude Codeをどのマシンで、どう起動して使っているか（このリポジトリ作業も含め、Windows PCか、それ以外か。常時電源が入っているか）
2. Anthropicの契約プラン（Pro/Max/Team/Enterprise/APIキーのみ、のいずれか）→ Remote Control機能が使えるかを左右する
3. n8n（`kohomadha-n8n.top`）に、SSHノードで社長PCへ接続できるようにする気があるか（PCの外部到達性を作ること自体への同意）
4. 「Siriに話しかける」体験について、「Siriが直接反応する」のと「iPhoneでアプリ（ClaudeアプリやShortcuts）を一度開く」のとでは、どこまで妥協できるか
5. 想定する用途の範囲（進捗確認だけでよいか／ファイル編集や調査指示まで求めるか／絶対にやらせたくない操作は何か）
6. 既存の「Claude Code API Test」ワークフロー（`kohomadha-n8n.top`、非稼働、2026-08-07作成）が何のために作られたものか、心当たりがあるか

---

## リスク・注意点

### セキュリティリスク（案A中心）

- 社長個人のPCを外部（インターネット）から到達可能にすること自体が、最大の攻撃対象面拡大になる。SSHポートの直接公開は原則避け、VPN／ゼロトラストネットワーク型の仕組み（具体的な製品名・料金・仕様は本タスクでは未調査のため名指しでの断定は避ける）を挟む設計が望ましい。
- n8nのWebhook URLが漏洩・推測された場合、認証（シークレットヘッダー・署名検証・送信元制限）が無いと第三者が任意のコマンドをClaude Code経由で実行できてしまう。
- Siriの音声認識誤り（同音異義語・雑音による誤変換）が、`--allowedTools`の設定次第ではファイル削除やGit push等の破壊的操作につながりうる。「音声で指示→即実行」ではなく、「音声で指示→下書き・確認→実行」の二段階に必ずすること（`.claude/rules/approval-policy.md`の精神と一致）。
- Apple/Siriの音声認識処理はApple側のサーバーを経由する場合がある。社長の発話内容に事業の機密情報・個人情報が含まれる可能性があり、`.claude/rules/security-policy.md`の「外部AI・外部ツールへの個人情報入力」の考え方に照らして、どこまでの内容をSiri経由で話してよいか整理が要る。

### 人間承認が必須と考えられる事項（新規リスクカテゴリとして明示）

`.claude/rules/approval-policy.md`は2026-08-15の方針変更で「n8nワークフロー自体の本番接続・登録・更新・有効化」を自動化対象としたが、これは**n8nワークフローという枠内**の話である。本タスクは「Claude Code自体を外部から操作可能にする」という、それとは別種の判断を含むため、以下は独立して社長の明示的な承認を求めるべきと考える。

- 社長PCを外部ネットワークから到達可能にする設定変更（ポート開放・VPN導入・SSH有効化そのもの）
- Remote Control機能の有効化、および有効化に伴う有償プラン契約（費用が発生する意思決定）
- Claude Codeに与える操作権限の範囲確定（`--allowedTools`/`--permission-mode`の具体的な設定。特に`bypassPermissions`相当の設定は`n8n-automation/.claude/rules/security.md`の原則禁止事項に該当するため、本タスクでも導入しない）
- Siri経由で実行してよい操作の最終的な線引き（読み取り・確認のみか、ファイル編集も許すか、削除・送信・公開系操作は対象外とすることの確認）

これらが未承認のまま「実装完了」「接続済み」と報告することはない。

---

## 推奨案

### 案B（推奨）：Claude Code公式Remote Controlを軸に、n8nは補助役

**構成**：社長PCで`claude`を起動し`/login`でRemote Controlを有効化 → 外出先ではiPhoneのClaude公式アプリ（またはブラウザ`claude.ai/code`）から同じセッションに音声入力（iOS標準ディクテーション機能）で指示 → n8nは「セッションが長時間無応答」等の監視・通知や、「Shortcuts経由でClaudeアプリを開く」程度の補助役に限定。

| 観点 | 内容 |
|---|---|
| 開発工数 | 低（Anthropic公式機能をそのまま使う。n8n側はごく簡易な通知ワークフローのみ） |
| 月額費用 | Pro（月額。金額は`platform.claude.com`等の最新価格を都度要確認）〜Max等の有償プラン契約が前提。社長が未契約なら新規費用が発生 |
| 保守性 | 高（Anthropicが機能を維持・更新する） |
| 拡張性 | 中（Anthropic側の機能追加に依存。n8nと組み合わせた独自拡張の余地は限定的） |
| 安定性 | 公式機能として提供されているが、本タスクでは実機検証していないため`[実行環境なしのため未テスト]` |
| セキュリティ | 高い（SSH公開等の自前実装が不要。認証はAnthropicアカウントログインに一本化） |
| ベンダーロックイン | 高い（Anthropicの提供する範囲に完全に依存） |
| 障害時の影響 | Anthropic側の障害に左右される。代替運用として「PCの前に戻って直接操作」に切り替え可能 |
| 必要スキル | 低い（社長・秘書アイどちらもセットアップが容易） |
| 前提条件 | Pro以上のプラン契約／社長PCの起動・ネットワーク接続／iPhoneへのClaudeアプリ導入・同一アカウントログイン |

**判断理由**：Anthropic公式ドキュメントで存在・要件が確認できており、社長PCを外部公開する必要がなく、セキュリティ設計の大半をAnthropicに委ねられる。一方で「Siriに直接話しかける」という当初イメージとは一致度がやや低い（実際は「Claudeアプリを開いて話す」形になる可能性が高い）ため、ヒアリング事項4の回答次第では案Aとの併用・再検討が必要。

---

## 代替案

### 案A：n8n Webhook＋SSHノードで社長PC上の`claude -p`を遠隔実行

**構成**：iPhone Shortcuts（Siriから起動、音声→テキスト化）→「Get Contents of URL」でn8n WebhookへPOST → n8n WebhookノードでBasic認証/シークレット検証 → SSHノードで社長PCへ接続し`claude -p "<指示>" --allowedTools <ホワイトリスト>`を実行 → 結果を整形してLINE通知等で社長へ返す。

| 観点 | 内容 |
|---|---|
| 開発工数 | 中〜高（Webhook認証設計、SSH接続設定、社長PC側のSSHサーバー導入・鍵管理、結果整形・通知経路の実装） |
| 月額費用 | 既存n8n（自社インスタンス）を使う前提なら追加のn8n費用は原則不要。VPN/ゼロトラスト系の仕組みを別途導入する場合はその費用が別途発生（具体名・金額は本タスクでは未調査） |
| 保守性 | 中（社長PCのOS更新・IPアドレス変化・スリープ設定等、環境依存の保守が発生し続ける） |
| 拡張性 | 高（n8n側で前処理・後処理・他システム連携を自由に組める） |
| 安定性 | 社長PCが常時起動・ネットワーク接続されている前提が崩れると即座に機能しない |
| セキュリティ | 低〜中（PCの外部到達性を新設するため、対策を怠ると攻撃対象面が大きく広がる。VPN等の追加対策が事実上必須） |
| ベンダーロックイン | 低い（n8n・SSHとも汎用技術） |
| 障害時の影響 | PC側・n8n側どちらの障害でも機能しない。代替運用として「PCの前に戻って直接操作」は同様に可能 |
| 必要スキル | 高い（SSH・ネットワーク・n8nノード設計・セキュリティ設計） |
| 前提条件 | 社長PCへのSSHサーバー導入、鍵認証設定、VPN等によるネットワーク保護、n8n側でのCredential・Webhook認証設計、`claude`コマンドがPCのPATH上で実行可能であること |

**判断理由（不採用寄りとする理由）**：既存のn8n投資・スキルを活かせる点は魅力だが、「社長個人のPCをインターネットから触れるようにする」というリスクの重さに対して、得られる体験（Siriから直接、というより結局Shortcutsアプリを開いて話す点は案Bと大差ない）の差が小さい。案Bで代替できないニーズ（例：ファイル編集を伴う複雑な指示をn8n側で前処理したい等）が明確にある場合のみ再検討する。

### 案C（参考・要ヒアリング後に判断）：自前サーバー（Claude Agent SDK）をトリガー役に

CLAUDE.md記載の「LINE→Render上でClaude Agent SDKを常駐させるフル機能モード」と同じ発想で、n8n Webhook（Siri経由）→自前のクラウドサーバー（Claude Agent SDKで実装）→そのサーバー内でエージェントを動かす、という構成。社長PC自体を外部公開せずに済む点はメリットだが、**本リポジトリには現時点で`server/`フォルダが存在せず、ゼロから開発・運用（デプロイ、認証情報管理、コスト管理）が必要**であり、実装コストは3案中もっとも大きい。ヒアリングの結果、案A・案Bのどちらも社長のニーズ（特にファイル・ローカル環境へのアクセスを伴わない軽い確認作業が中心）に合わない場合の選択肢として記録に残す。

---

## 出典

- Anthropic公式ドキュメント「Headless mode」 https://docs.anthropic.com/en/docs/claude-code/headless （確認日2026-09-06）
- Anthropic公式ドキュメント「Remote Control」 https://docs.anthropic.com/en/docs/claude-code/remote-control （確認日2026-09-06）
- Anthropic公式ドキュメント「Agent SDK overview」 https://code.claude.com/docs/en/agent-sdk/overview 、 https://platform.claude.com/docs/en/agent-sdk/overview （確認日2026-09-06）
- n8n公式ドキュメント「SSH」ノード https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.ssh （確認日2026-09-06）
- n8n公式ドキュメント「Execute Command」ノード https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.executecommand （確認日2026-09-06）
- n8n.io公式ワークフローテンプレート（Siri/Apple Shortcuts連携の実例、検索結果として確認。個別テンプレートの詳細仕様までは未検証）（確認日2026-09-06）
- 社内既存資料：`logs/common_2026-08-09_n8n実環境監査_v1.md`（自社n8n環境の読み取り専用監査）
- 社内既存資料：`n8n-automation/docs/cases/AUTO-COM-001/workflow-design.md`（既存のClaude API呼び出しパターン）
- 社内既存資料：`n8n-automation/CLAUDE.md`（環境確認記録、`.claude/rules/approval-policy.md`の2026-08-15追記部分）

---

## 未確認事項

- `[未確認]` Claude Codeに「クラウド上のセッションをID指定で実行する」ヘッドレスオプション（例：`--cloud <session-id>`）の存在
- `[未確認]` Siriから直接（Shortcutsアプリを開かず）Claude公式アプリ・Claude Codeセッションへ音声指示を送る公式連携の有無
- `[要ヒアリング]` 社長が普段Claude Codeを動かしているマシン（本リポジトリ作業用マシンと同一か、常時起動しているか）
- `[要ヒアリング]` Anthropicの契約プラン（Pro/Max/Team/Enterprise/APIキーのみ）
- `[要ヒアリング]` 社長PCを外部到達可能にすること自体への同意（案Aを選ぶ場合の大前提）
- `[要インスタンス確認]` `kohomadha-n8n.top`でSSH/Execute Commandノードが実際に利用可能か（バージョン・設定含む）
- `[未確認]` 既存の非稼働ワークフロー「Claude Code API Test」（2026-08-07作成）の実際の中身・作成意図
- `[未確認]` Remote Control機能の具体的な通信経路・暗号化方式など、内部セキュリティ実装の詳細（公式ドキュメントの表面的な要件確認に留まり、深掘りはしていない）
- `[未確認]` iOS ShortcutsでのSiriディクテーションの日本語認識精度・実運用での誤変換頻度

---

## 次に必要なアクション

1. **社長へのヒアリング**（本書「未確認事項」のうち`[要ヒアリング]`の4件）。回答が揃うまで、案A・案Bの最終選定は保留する。
2. ヒアリングと並行し、`n8n-schema-researcher`相当の読み取り専用調査として、`kohomadha-n8n.top`上の既存ワークフロー「Claude Code API Test」の中身確認（新規作成せず、まず既存資産を見る）。
3. 社長の回答が「案Bで体験的に妥協できる」であれば、**n8nを介さない最小構成**（Remote Control単体）でのお試し運用を先に提案する（追加実装コストがほぼゼロで検証できるため）。
4. 案A（n8n実装）に進む場合は、`n8n-automation/`フォルダの標準フロー（`n8n-automation-lead`→`n8n-intake`→`n8n-design`→`n8n-build`）へ正式にIntakeする。管理IDは既存の`AUTO-COM-001`（Claude API呼び出し）・`AUTO-COM-002`（エラーハンドラー）に続く**`AUTO-COM-003`（案）**を提案する（複数事業を横断する社長個人向け業務ツールのため「共通基盤」区分）。エイトへの依頼内容の想定：
   - Webhook認証方式（シークレットヘッダー／署名検証）の設計・実装
   - SSHノードの正式仕様（`type`/`typeVersion`/パラメータ）の公式確認
   - `claude -p`実行時の`--allowedTools`ホワイトリストの具体案作成（読み取り専用コマンドに限定する等の叩き台）
   - 実行結果の通知経路（LINE等）の設計
   - `validate-workflow.mjs`/`check-secrets.mjs`による静的検証の実施
5. いずれの案でも、実装完了後は`aoi-quality-auditor`による監査、および本書「リスク・注意点」の各項目についての社長の個別承認を経てから本番接続する。
