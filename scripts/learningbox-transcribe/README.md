# learningBOX 受講動画の一括取得・文字起こしツール（T227）

ログイン → 講座ページの巡回 → 動画（音声）の保存 → 文字起こし を一括で行う。

- **対象は、オーナーから許可を得た講座だけ**。取得したデータは許可の範囲（社内の学習用など）で使い、他人に配らない。
- **社長のPCで実行する**。ID・パスワード・ログイン状態（`work/`）・取得データ（`output/`）はPCの中だけに残り、git にも入らない。
- DRM（強いコピーガード）を検知した動画は保存しない。その場合はオーナーに元動画の共有を依頼する。

## 1. 準備（初回だけ）

### Mac
```bash
# Homebrew が無ければ https://brew.sh/ja/ の手順で先に入れる
brew install python ffmpeg
cd kouki-ai-lab/scripts/learningbox-transcribe
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
playwright install chromium
```

### Windows（PowerShell）
```powershell
winget install Python.Python.3.12 Gyan.FFmpeg
# インストール後、PowerShell を開き直す
cd kouki-ai-lab\scripts\learningbox-transcribe
py -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
playwright install chromium
```

2回目以降は、フォルダに移動して `source .venv/bin/activate`（Windows は `.venv\Scripts\Activate.ps1`）だけでよい。

## 2. ログイン（ログイン状態を保存）

```bash
python lbt.py login
```

ブラウザが開くので、**自分でID・パスワードを入れてログイン**する。講座画面が出たら、ターミナルに戻って Enter を押す。
（自動入力したい場合だけ、`.env.example` を `.env` にコピーして ID・パスワードを書く。おすすめは手動ログイン）

## 3. 試運転（まず1講座だけ）

ブラウザで講座（コース）のページを開き、そのURLをコピーしておく。

```bash
python lbt.py crawl --start "講座ページのURL" --depth 1 --headed
```

- 画面に `🎬 タイトル → URL` が出れば、動画が見つかっている。
- 0件だった場合は、手動で記録する方法を試す（4章へ）。

続けて、保存と文字起こしを行う。

```bash
python lbt.py download
python lbt.py transcribe
```

`output/text/` に `.txt`（本文）と `.srt`（時刻つき字幕）ができる。

## 4. 動画が自動で見つからないとき（手動で記録）

```bash
python lbt.py capture
```

開いたブラウザで動画を1本ずつ開き、**数秒ずつ再生**する。全部回ったらターミナルで Ctrl+C を押す。その後は `download` → `transcribe` を実行する。

## 5. 本番（全講座を一気に）

```bash
python lbt.py all --start "講座一覧のURL"
```

| オプション | 意味 |
|---|---|
| `--depth 3` | 講座一覧から、リンクを何段たどるか |
| `--max-pages 150` | 巡回するページ数の上限 |
| `--include "course"` | URLにこの文字を含むページだけたどる |
| `--video` | 音声だけでなく動画ごと保存する |
| `--model medium` | 文字起こしを速くする（精度は少し下がる。既定は large-v3） |

- ログアウト・削除・回答送信などのリンクは、自動でたどらないようにしている。
- サーバーに負担をかけないよう、1ページ・1本ずつ間隔を空けて処理する。
- 途中で止めても、もう一度実行すれば、保存済み・文字起こし済みのものは飛ばして続きから再開する。

## 6. 困ったとき

| 症状 | 対処 |
|---|---|
| 「ログインが切れました」 | `python lbt.py login` をやり直す |
| download で 403 / expired | 動画URLの期限切れ。`all` で巡回と保存を続けて行う |
| 「DRMを検知」 | このツールでは保存できない。オーナーに元動画の共有を依頼する |
| 文字起こしが遅い | `--model medium` か `--model small` を使う。large-v3 はCPUだと動画の長さと同じくらい、またはそれ以上かかる |
| `metadata_errors` のエラー | `pip install "av<19"` を実行する（requirements.txt で固定済み） |

## 7. 文字起こしの後

`output/text/` の `.txt` をアイに渡せば（Google Drive に置く／チャットに貼るなど）、誤変換の修正・要約・ナレッジ化（Notionへの登録など）を行う。

## 動作確認の記録（2026-10-28）

- ログイン必須の擬似サイト（Cookie認証、HLS / iframe内MP4、ログアウトリンクあり）で、`login` → `crawl` → `download` → `transcribe` が通ることを確認した。
  - 動画2本とも検出・保存できた。ログアウトリンクは踏まなかった。保存済みのものは再実行で飛ばされた。
- **未確認**：実際の learningBOX の画面構成、DRMの有無、日本語音声の文字起こし精度、`capture` モード（対話操作のため）。最初は必ず 3章の試運転から行うこと。
