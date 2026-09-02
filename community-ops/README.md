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
- LINE：個別の質問・相談メッセージが届いたら、AIが返信の**下書き**を作成し`/inbox`画面に貯める
  （2026-09-02〜。下記「個別メッセージの返信下書き」参照。自動送信は一切しません）
- Discord：3チャンネル（`#お知らせ` `#質問-相談` `#やってみた-共有`）の作成・トピック設定・ウェルカムメッセージの固定投稿（A案）

**やらないこと**
- LINE/Discordのアカウント新規開設・本人確認（鈴木さんご自身が行います）
- Discord入室イベントの検知・常時稼働のGateway接続（B案は不採用。SERVER MEMBERS INTENTも使いません）
- 実際の配信・投稿の自動実行（`send-broadcast.mjs`は`--send`、`setup-server.mjs`は`--apply`を
  明示的に付けたときだけAPIを呼びます。それまでは何を送るかのプレビュー表示のみです）
- 個別の質問・相談への**自動送信**（下書きは作りますが、実際の送信は`/inbox`画面で内容を確認した
  鈴木さんが、LINEアプリ／LINE公式アカウント管理画面から手動で行います）
- LINEのチャット画面そのものに下書きを差し込む機能（LINE Messaging APIにその機能自体が無いため。
  下書きは別画面`/inbox`に表示し、コピー→LINE側に手動貼り付けという運用にしています）

### 経緯（2026-09-02、方針変更）

当初はDiscordの`#質問-相談`へ誘導する設計（個別メッセージには反応しない）でしたが、鈴木さんの依頼により、
個別メッセージが届いたらAIが返信下書きを作成し人間の確認・送信を待つ運用に変更しました。
Discordへの誘導が必要と判断される内容であれば、AIが作る下書き文面の中でその旨を案内することもあります
（下書きなので最終的な言い回しは鈴木さんが調整できます）。

既存 `server/`（秘書アイ用・社長個人向けLINE連携）とは、認証情報・Webhookエンドポイント・
デプロイ先をすべて分離しています。環境変数名も別（`LINE_COMMUNITY_*` / `DISCORD_*`）にしており、
混線しません。

---

## ディレクトリ構成

```
community-ops/
  .env.example          必要な環境変数の一覧（値は空。community-ops/.env にコピーして使う）
  line/
    lib/line-client.mjs      LINE Messaging APIクライアント（broadcast / reply / プロフィール取得 / 署名検証）
    lib/ai-draft.mjs         個別メッセージへの返信下書きをAnthropic APIで生成する薄いクライアント
    lib/inbox-store.mjs      返信下書きの保存先（JSONファイル。line/data/inbox.json、Git管理外）
    webhook-server.mjs       常時稼働：Webhook受信→登録時オートリプライ／個別メッセージの下書き作成／`/inbox`画面
    send-broadcast.mjs       CLI：配信テンプレートのプレビュー・実送信
    templates/                配信テンプレート・オートリプライ本文（.md）
    data/                      返信下書きの保存先（自動生成・Git管理外）
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

### ③ 個別メッセージの返信下書き機能を使う場合（任意）

1. https://console.anthropic.com/ でAPIキーを発行し、`community-ops/.env`の`ANTHROPIC_API_KEY`に貼り付ける
   （課金は発行したAPIキーの利用量に応じてAnthropic側で発生します。料金は
   https://platform.claude.com/docs/en/pricing で最新情報を確認してください）
2. `INBOX_ACCESS_TOKEN`に、自分だけが知っている合言葉（好きな文字列）を決めて設定する
   （下書き一覧画面`/inbox`は、この合言葉をURLに付けないと開けないようにしています）
3. 上記2つを設定しなくても他の機能（登録時オートリプライ・配信テンプレート・Discord連携）は動きます。
   未設定の場合、個別メッセージが届いても下書きは作られず「下書き未生成」と記録されるだけです

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

### LINE：Webhookサーバー（登録時オートリプライ）

ローカルでの動作確認：

```
node community-ops/line/webhook-server.mjs
```

`http://localhost:8090/webhook`（ポートは`.env`の`LINE_WEBHOOK_PORT`で変更可）でLINEからの
Webhookを待ち受けます。友だち追加時は、`line/templates/welcome-reply.md`の内容を自動返信します。
個人からの通常のテキストメッセージは自動返信せず、`ANTHROPIC_API_KEY`が設定されていればAIが
返信下書きを作成して貯めます（未設定なら「下書き未生成」として貯めるだけ）。

### LINE：返信下書きの確認・送信（`/inbox`）

ブラウザで `http://localhost:8090/inbox?token=<INBOX_ACCESS_TOKENの値>` を開くと、
届いた個別メッセージとAIの下書きが新しい順に並びます。

1. 「下書きをコピー」ボタンで下書き文面をコピーする
2. 内容を確認し、必要なら書き換える（開講日程・価格など、下書きが断定を避けている箇所は
   鈴木さんご自身の判断で埋めてください）
3. LINEアプリまたはLINE公式アカウント管理画面の1:1チャットから、その相手に手動で貼り付けて送信する
4. `/inbox`画面に戻り「対応済みにする」を押すと一覧から外れる（メッセージ自体は保持されます）

下書きが「未生成」と表示されている場合は、`ANTHROPIC_API_KEY`が未設定か、Anthropic API呼び出しが
失敗しています。その場合も送信者・受信メッセージ自体は記録されているので、手動で返信してください。

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
  `process.env.LINE_WEBHOOK_PORT`をRenderの`PORT`に合わせて調整してください。
  個別メッセージの返信下書き機能を使うなら`ANTHROPIC_API_KEY`・`INBOX_ACCESS_TOKEN`も忘れず登録してください）

Discord側（`setup-server.mjs` / `verify-bot.mjs`）は常時稼働不要で、必要なときに手元のPCから
都度実行するだけで足ります。

---

## 承認フロー（社内ルールに従う・必ず守ってください）

- `send-broadcast.mjs`は既定でdry-run（プレビューのみ）。`--send`を付けたときだけ実際に配信します
- `setup-server.mjs`は既定でdry-run（プレビューのみ）。`--apply`を付けたときだけ実際にAPIを呼びます
- 実配信・実投稿の前には、必ずプレビュー内容を鈴木さんが確認・承認してから`--send` / `--apply`を
  実行してください（社内の承認ポリシーに従い、AI側が単独で実配信・実投稿を判断することはありません）
- 個別メッセージの返信下書きも同様です。`webhook-server.mjs`はLINEへの返信送信を一切行わず、
  `/inbox`画面に下書きを表示するだけです。実際の送信は鈴木さんがLINEアプリ／LINE公式アカウント
  管理画面から手動で行ってください

---

## 将来のn8n移行との接続点

設計書に記載の通り、LINE配信は`n8n-nodes-base.line`、Discordは`n8n-nodes-base.discord`で
将来的に代替可能です。テンプレート本文・チャンネル構成情報はコード中にハードコードせず
`templates/` `content/`配下のMarkdownに外出ししているため、移行時はこれらのファイルを
そのままn8n側の設定に流用できます。
