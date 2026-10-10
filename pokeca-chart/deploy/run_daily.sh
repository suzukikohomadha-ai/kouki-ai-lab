#!/bin/bash
# 1日1回の処理：4店の取得 → 照合・記録・集計 → CSV書き出し
# VPS では systemd タイマー（pokeca-daily.timer）から深夜に呼ばれる
set -u
cd "$(dirname "$0")/.."
source deploy/env.sh   # POKECA_CONTACT（連絡先メールアドレス）を設定するファイル。git管理外
mkdir -p data
python3 -m collector.collect --db data/pokeca.db --raw data/raw >> data/collect.log 2>&1
status=$?
python3 -m collector.pipeline --db data/pokeca.db --out data/ >> data/collect.log 2>&1 || status=1
# 生のHTMLは30日分だけ残す
find data/raw -mindepth 1 -maxdepth 1 -type d -mtime +30 -exec rm -rf {} +
exit $status
