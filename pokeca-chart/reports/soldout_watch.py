"""ドラゴンスターの SOLDOUT の意味を観察で判断するための集計（読み取り専用）。2026-11-02 社長決定：問い合わせずに2〜4週間観察する。

使い方: python3 -I reports/soldout_watch.py data/pokeca.db

見ること（仮説ごとの判断材料）
- 仮説A「在庫が上限に達して一時的に買取を止めている」→ SOLDOUT は数日〜数週間で解除され、解除の前後で価格はあまり変わらない
- 仮説B「買取を止めていて、価格は更新されていない（古い値）」→ SOLDOUT 中は価格がほぼ変わらず、他店の動きと連動しない
- 仮説C「価格は生きている（表示だけ）」→ SOLDOUT 中でも他店と同じように価格が動く
"""
import sqlite3
import sys
from collections import Counter, defaultdict

c = sqlite3.connect(f"file:{sys.argv[1]}?mode=ro", uri=True)
days = [d for (d,) in c.execute("SELECT DISTINCT day FROM price WHERE shop_id='dorasuta' ORDER BY day")]
print(f"観察日数: {len(days)}日（{days[0] if days else '-'} 〜 {days[-1] if days else '-'}）")
if len(days) < 2:
    print("2日分以上たまってから判断できます。")
    sys.exit(0)
hist = defaultdict(list)
for cid, d, p, so in c.execute("SELECT card_id, day, price, soldout FROM price WHERE shop_id='dorasuta' ORDER BY day"):
    hist[cid].append((d, p, so))
spans, released, price_move_in, price_move_out = [], 0, Counter(), Counter()
for cid, h in hist.items():
    for (d0, p0, s0), (d1, p1, s1) in zip(h, h[1:]):
        if s0 and s1:
            price_move_in["変化あり" if p0 != p1 else "変化なし"] += 1
        if not s0 and not s1:
            price_move_out["変化あり" if p0 != p1 else "変化なし"] += 1
        if s0 and not s1:
            released += 1
print(f"SOLDOUT が解除された回数: {released}")
print(f"SOLDOUT 中の前日比（価格が変わった割合）: {dict(price_move_in)}")
print(f"通常時の前日比（比較用）: {dict(price_move_out)}")
print("判断の目安：SOLDOUT 中の変化の割合が通常時と同程度なら仮説C、ほぼゼロなら仮説B。解除が多ければ仮説A。")
