"""代表値の方式の比較（読み取り専用）。2026-11-02 社長決定：14日分たまった時点で比較検証する。

使い方: python3 -I reports/compare_methods.py data/pokeca.db

比べる方式（カードごとの日々の値）
- 現行：その日の中央値（店の組み合わせが変わると跳ねる）
- 連鎖：前日と当日の両方に価格がある店だけで価格比をとり、その幾何平均を前日の値に掛けてつなぐ
  （マッチドモデル＋ジェヴォンズ型。CPIマニュアル2004年版 9.39〜9.43項、総務省 2020年基準CPI 解説 付3 の考え方）
評価の目安
- 店の組み合わせが変わった日の変化の大きさ（連鎖のほうが小さければ、店の出入りによる跳ねを抑えられている）
- 全体の日次変化のばらつき
"""
import math
import sqlite3
import statistics as st
import sys
from collections import defaultdict

sys.path.insert(0, ".")
from collector.aggregate import EXCLUDED_SHOPS, calc_price  # noqa: E402

c = sqlite3.connect(f"file:{sys.argv[1]}?mode=ro", uri=True)
days = [d for (d,) in c.execute("SELECT DISTINCT day FROM price ORDER BY day")]
print(f"データ日数: {len(days)}日")
if len(days) < 14:
    print("14日分たまってから比較します（現在は参考値）。")
P = defaultdict(lambda: defaultdict(dict))
for cid, s, d, p, stk, so in c.execute("SELECT card_id, shop_id, day, price, struck_price, soldout FROM price"):
    v = calc_price(p, stk)
    if s not in EXCLUDED_SHOPS and not so and v and v > 0:
        P[cid][d][s] = v
jump_med, jump_chain, all_med, all_chain = [], [], [], []
for cid, by_day in P.items():
    chain = None
    for d0, d1 in zip(days, days[1:]):
        a, b = by_day.get(d0, {}), by_day.get(d1, {})
        if len(a) < 2 or len(b) < 2:
            chain = None
            continue
        m0, m1 = st.median(a.values()), st.median(b.values())
        common = set(a) & set(b)
        if chain is None:
            chain = m0
        if common:
            g = math.exp(sum(math.log(b[s] / a[s]) for s in common) / len(common))
            new = chain * g
            r_med, r_chain = abs(math.log(m1 / m0)), abs(math.log(new / chain))
            all_med.append(r_med); all_chain.append(r_chain)
            if set(a) != set(b):
                jump_med.append(r_med); jump_chain.append(r_chain)
            chain = new
for label, xs, ys in [("店の組み合わせが変わった日", jump_med, jump_chain), ("すべての日", all_med, all_chain)]:
    if xs:
        print(f"{label}: n={len(xs)} 変化の中央値 現行{math.exp(st.median(xs))-1:.1%} / 連鎖{math.exp(st.median(ys))-1:.1%}")
    else:
        print(f"{label}: 比較できる日がまだありません")
