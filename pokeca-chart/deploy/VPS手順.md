# VPSで毎日の自動収集を始める手順

対象：さくらのVPS 1G（Ubuntu 24.04）。🙋＝社長の作業、🤖＝Claudeが代行（コマンドを貼って実行）。

## 1. 契約と接続（🙋）
1. さくらのVPSに申し込む（1Gプラン・石狩または東京・OSは Ubuntu 24.04・クレジットカード払い）。
2. 申込み画面に出る **管理ユーザー名**（`ubuntu` かどうか）、**パスワード**、**IPアドレス** を控える。
3. 自分のPCのターミナル（Macは「ターミナル」、Windowsは「PowerShell」）で次を実行して接続する。
   ```
   ssh ubuntu@IPアドレス
   ```
4. 接続できたら、次を貼って実行する（最新の状態にする）。
   ```
   sudo apt update && sudo apt upgrade -y
   ```
5. ここまでできたらClaudeに連絡する。

## 2. プログラムを置く（🤖が案内、🙋が貼り付け）
```
sudo apt install -y git python3
git clone https://github.com/suzukikohomadha-ai/kouki-ai-lab.git
cp -r kouki-ai-lab/pokeca-chart ~/pokeca-chart
cd ~/pokeca-chart
cp deploy/env.example.sh deploy/env.sh
nano deploy/env.sh      # 連絡先メールアドレスを書き換えて保存（Ctrl+O → Enter → Ctrl+X）
```
※ リポジトリが非公開の場合、GitHubへのログイン手順を別途案内する。

## 3. 1回だけ手で動かして確認（🙋）
```
cd ~/pokeca-chart && ./deploy/run_daily.sh; echo 終了コード=$?
tail -20 data/collect.log
```
終了コード 0 で、最後に「spreadsheet_100yen_YYYYMMDD.csv: N行」が出ればOK（約70分かかる）。

## 4. 毎日自動で動かす（🙋）
```
sudo cp ~/pokeca-chart/deploy/pokeca-daily.service ~/pokeca-chart/deploy/pokeca-daily.timer /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now pokeca-daily.timer
systemctl list-timers | grep pokeca
```
毎日 03:00（日本時間）に動く。管理ユーザー名が `ubuntu` でない場合は、service ファイルの `User=` と パスを書き換える。

## 5. 安全設定（🤖が案内）
パスワードログインの停止（鍵ログインへ切り替え）、ファイアウォール（ufw）の設定。収集を動かす前後どちらでもよいが、公開前には必ず行う。

## 注意
- 収集データ（`data/`）には店名と店ごとの価格が入る。社内用として扱い、公開しない。
- 拒否（403・429）が出た店はその日は止まる。回避はしない。
