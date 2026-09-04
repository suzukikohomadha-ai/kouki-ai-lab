# community-ops — 加入者特典Discord・告知配信LINE 技術基盤

「実務者のAIエージェント勉強会」（noteメンバーシップ）・「AIエージェントチーム・スターターキット」
（note有料記事）の加入者向けに、加入者特典Discordコミュニティと告知配信用の公式LINEを
Claude Codeから操作するための技術基盤です。

設計の経緯・確定事項は以下を参照してください。

- `../logs/kohomada_2026-08-24_新サービス構想_DiscordLINE連携技術設計_v1.md`（技術設計）
- `../logs/kohomada_2026-08-24_新サービス構想_Discord公式LINE提供内容検討_v1.md`（コピー文言・アオイ監査済み）

---

## このプロジェクトがやること／やらないこと

**やること**
- LINE：登録時オートリプライ（Webhook常時稼働）、配信テンプレートのdry-runプレビューと（承認後の）実配信
- LINE：友だち追加直後に「すでにご相談中の案件から／SNS・noteを見て」の2択クイックリプライを添え、
  population A/Bの自己申告を`scripts/invite-link-gate.gs`（招待リンク最小実装）に記録する（任意・`INVITE_GATE_URL`未設定時はスキップ）
- LINE：「スターターキット」モニター向け「はじめかたステップ配信」。あらかじめ用意した4ステップ
  （Claude Codeインストール→フォルダをターミナルで開く→`claude`起動・信頼確認→秘書アイとの初回会話）の
  案内を、クイックリプライ「できました」「わからない・詰まった」への**ボタン操作（postback）**、および
  合言葉「はじめる」への**完全一致のテキスト返信**にのみ反応して返信する（`line/lib/onboarding-content.mjs`
  の`START_KEYWORD`）。進捗は`scripts/onboarding-progress-gate.gs`（任意・`ONBOARDING_PROGRESS_URL`
  未設定時はスキップ）に記録する。配信の開始は、鈴木さんがモニターへ`line/templates/onboarding-start-invite.md`
  の文面を個別に手動送信し、モニターが「はじめる」と返信することで始まる（友だち追加時の全員自動開始でも、
  こちらからのプッシュ配信でもない。個別ユーザー宛てのpush送信機能は実装していないため）
- Discord：3チャンネル（`#お知らせ` `#質問-相談` `#やってみた-共有`）の作成・トピック設定・ウェルカムメッセージの固定投稿（A案）

**やらないこと**
- LINE/Discordのアカウント新規開設・本人確認（鈴木さんご自身が行います）
- Discord入室イベントの検知・常時稼働のGateway接続（B案は不採用。SERVER MEMBERS INTENTも使いません）
- 実際の配信・投稿の自動実行（`send-broadcast.mjs`は`--send`、`setup-server.mjs`は`--apply`を
  明示的に付けたときだけAPIを呼びます。それまでは何を送るかのプレビュー表示のみです）
- 個別の質問・相談への自動応答（Discordの`#質問-相談`は人（会員・鈴木さん）が対応する前提です）。
  「はじめかたステップ配信」で用意する応答も、**あらかじめ決められた選択式ボタンへの定型応答**が基本で、
  ユーザーの自由文入力を解析して自動応答する機能は追加していません。唯一の例外は、開始の合言葉
  「はじめる」への**完全一致**のみの反応で、それ以外のテキストメッセージには一切反応しません。
  「うまくいかない」を選んだ後の一部の案内は、公式LINEの個別チャットへそのまま返信するよう促しますが、
  その返信自体は鈴木さんがLINE公式アカウントマネージャーの画面から手動で確認・返信する運用です

既存 `server/`（秘書アイ用・社長個人向けLINE連携）とは、認証情報・Webhookエンドポイント・
デプロイ先をすべて分離しています。環境変数名も別（`LINE_COMMUNITY_*` / `DISCORD_*`）にしており、
混線しません。

---

## ディレクトリ構成

```
community-ops/
  .env.example          必要な環境変数の一覧（値は空。community-ops/.env にコピーして使う）
  line/
    lib/line-client.mjs      LINE Messaging APIクライアント（broadcast / reply / 署名検証）
    lib/onboarding-content.mjs  「スターターキット」はじめかたステップ配信の本文・クイックリプライ文言データ
                                 （カエデのメッセージ文言案が正、ロジックとは分離して保持）
    webhook-server.mjs       常時稼働：Webhook受信→登録時オートリプライ、はじめかたステップ配信のpostback応答
    send-broadcast.mjs       CLI：配信テンプレートのプレビュー・実送信
    templates/                配信テンプレート・オートリプライ本文（.md）
  discord/
    lib/discord-client.mjs   Discord REST APIクライアント（チャンネル作成・投稿等）
    setup-server.mjs         CLI：3チャンネル作成・トピック設定・ウェルカムメッセージ投稿
    verify-bot.mjs           CLI：Botトークンの疎通確認
    content/                  チャンネルトピック・ウェルカムメッセージ本文（.md）
```

外部npmパッケージは使っていません（LINE/DiscordともfetchベースでNode.js標準機能のみ）。
`npm install`は不要で、Node.js（v18以上）があればそのまま`node ...`で動きます。

---

## 鈴木さんが行う手順

### ① LINE Developersでのチャネル作成〜トークン発行

1. https://developers.line.biz/ を開き、LINEアカウントでログインする
2. 「プロバイダー」を作成する（既存の秘書アイ用プロバイダーと同じでも別でも構いません）
3. 「新規チャネル作成」→ **Messaging API** を選択し、チャネル名（例：実務者のAIエージェント勉強会）
   などの必要事項を入力して作成する。**既存の秘書アイ用チャネルとは必ず別チャネルにする**
4. 作成したチャネルの「Messaging API設定」タブで、**チャネルアクセストークン（長期）**を発行しコピーする
5. 「チャネル基本設定」タブで、**チャネルシークレット**をコピーする
6. `community-ops/.env`（無ければ`.env.example`をコピーして作成）の
   `LINE_COMMUNITY_CHANNEL_ACCESS_TOKEN` / `LINE_COMMUNITY_CHANNEL_SECRET` に貼り付ける
7. Webhookサーバーをデプロイしたら（下記「デプロイ」参照）、LINE Developersの
   「Messaging API設定」→ **Webhook URL** に `<デプロイ先URL>/webhook` を設定し、
   「Webhookの利用」をオンにする
8. 応答メッセージ・あいさつメッセージ等のLINE公式アカウント標準機能は、必要に応じてLINE公式アカウント
   管理画面（Messaging API設定とは別画面）でオフにしておく（オートリプライと二重に返信されるのを防ぐため）

料金の留意点：フリープランは月1,000通まで無料です。加入者数×配信回数によっては有料プランへの
移行が必要になる場合があります。最新の料金体系は実装直前に公式ページで再確認してください。

### ② Discord Developer Portalでのアプリ・Bot作成〜サーバー招待〜トークン発行

1. https://discord.com/developers/applications を開き、Discordアカウントでログインする
2. 「New Application」で新規アプリを作成する（名前は例：実務者のAIエージェント勉強会 運営Bot）
3. 左メニュー「Bot」→「Reset Token」でBotトークンを発行し、コピーする
   （**特権インテント（Presence Intent / Server Members Intent / Message Content Intent）は
   いずれもオンにする必要はありません**。A案は入室イベントを検知しないため不要です）
4. 左メニュー「OAuth2」→「URL Generator」で、SCOPESに`bot`を、BOT PERMISSIONSに
   `View Channels` `Manage Channels` `Send Messages` `Embed Links` `Read Message History`
   にチェックを入れ、生成されたURLをブラウザで開いてBotを対象のDiscordサーバーへ招待する
5. Discordアプリでサーバー設定→「ウィジェット」またはサーバーを右クリック→「サーバーIDをコピー」
   （表示されない場合は、ユーザー設定→詳細設定→「開発者モード」をオンにしてから再度試す）でサーバーIDを取得する
6. `community-ops/.env`の`DISCORD_BOT_TOKEN` / `DISCORD_GUILD_ID`に貼り付ける

---

## 使い方

### 環境変数の設定

```
cp community-ops/.env.example community-ops/.env
```

`.env`を開き、上記①②で取得した値を貼り付けてください。`.env`はGitにコミットされません
（`community-ops/.gitignore`で除外済み）。認証情報はこのディレクトリの`.env`にのみ保存します。

### Discord：疎通確認

```
node community-ops/discord/verify-bot.mjs
```

### Discord：サーバー初期セットアップ

```
node community-ops/discord/setup-server.mjs            # プレビューのみ（dry-run、既定）
node community-ops/discord/setup-server.mjs --apply    # 実際にチャンネル作成・投稿を実行
```

同名チャンネルが既に存在する場合は作成をスキップします（冪等）。何度実行しても二重に
チャンネルが増えることはありません。

### LINE：配信テンプレートの送信

```
node community-ops/line/send-broadcast.mjs --template=new-course-announce            # プレビューのみ
node community-ops/line/send-broadcast.mjs --template=new-course-announce --send     # 実際に配信
```

利用可能なテンプレート：`new-course-announce`（新規開講・回の公開告知）、
`starter-kit-guide`（スターターキット案内）、`trial-end-reminder`（無料期間終了前リマインド・解約導線あり）。

テンプレート本文中の `[〇〇]` `[URL]` 等のプレースホルダーは、実送信前に必ず埋めてください
（埋め忘れがあると警告が表示されます）。

### LINE：Webhookサーバー（登録時オートリプライ・はじめかたステップ配信のpostback応答）

ローカルでの動作確認：

```
node community-ops/line/webhook-server.mjs
```

`http://localhost:8090/webhook`（ポートは`.env`の`LINE_WEBHOOK_PORT`で変更可）でLINEからの
Webhookを待ち受けます。友だち追加時は`line/templates/welcome-reply.md`の内容を自動返信します。
また、「スターターキット」モニター向けはじめかたステップ配信のボタン（`onb=`で始まるpostback data）
にも反応し、`line/lib/onboarding-content.mjs`の文言に沿って次のステップ案内・つまずきカテゴリ選択・
カテゴリ回答を返信します。進捗は`scripts/onboarding-progress-gate.gs`（`ONBOARDING_PROGRESS_URL`）に
fire-and-forgetで記録します（未設定時は記録のみスキップ、案内自体は動作します）。
通常のテキストメッセージには引き続き反応しません（告知配信専用アカウントのため）。

---

## デプロイ（Webhookサーバーの常時稼働）

`webhook-server.mjs`はLINEの友だち追加を検知するため常時稼働させる必要があります。
既存`server/`と同じRenderに、**別サービスとして新規作成**することを想定しています
（既存サービスに相乗りさせない。デプロイ先を分離することで、片方の障害・再デプロイが
もう片方に影響しないようにするため）。

Renderでの設定例：
- Root Directory：`community-ops`
- Build Command：`echo no build needed`（npmパッケージが無いためビルド不要）
- Start Command：`node line/webhook-server.mjs`
- Environment：`.env`の中身を1つずつ環境変数として登録する
  （`LINE_COMMUNITY_CHANNEL_ACCESS_TOKEN` / `LINE_COMMUNITY_CHANNEL_SECRET` / `LINE_WEBHOOK_PORT`は
  Renderが自動的に`PORT`を割り当てる場合があるため、その場合は`webhook-server.mjs`側の
  `process.env.LINE_WEBHOOK_PORT`をRenderの`PORT`に合わせて調整してください）

Discord側（`setup-server.mjs` / `verify-bot.mjs`）は常時稼働不要で、必要なときに手元のPCから
都度実行するだけで足ります。

---

## 承認フロー（社内ルールに従う・必ず守ってください）

- `send-broadcast.mjs`は既定でdry-run（プレビューのみ）。`--send`を付けたときだけ実際に配信します
- `setup-server.mjs`は既定でdry-run（プレビューのみ）。`--apply`を付けたときだけ実際にAPIを呼びます
- 実配信・実投稿の前には、必ずプレビュー内容を鈴木さんが確認・承認してから`--send` / `--apply`を
  実行してください（社内の承認ポリシーに従い、AI側が単独で実配信・実投稿を判断することはありません）

---

## 将来のn8n移行との接続点

設計書に記載の通り、LINE配信は`n8n-nodes-base.line`、Discordは`n8n-nodes-base.discord`で
将来的に代替可能です。テンプレート本文・チャンネル構成情報はコード中にハードコードせず
`templates/` `content/`配下のMarkdownに外出ししているため、移行時はこれらのファイルを
そのままn8n側の設定に流用できます。
