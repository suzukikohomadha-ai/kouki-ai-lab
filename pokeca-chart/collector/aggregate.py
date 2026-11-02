"""日次集計（引き継ぎ資料 3.2）。

- 代表値：2店以上の価格の中央値（2026-10-10 社長決定で平均から変更）
- 計算に使う価格：強化買取中のカードは、取り消し線の「通常価格」を使う（2026-11-02 社長決定）。
  表示価格（強化価格）も price 表に残している
- SOLDOUT の価格と、買取チャンピオン（他店と照合できない）は計算に入れない
- 外れ値は自動で捨てず、印を付けて review 表に残す（2026-11-02 社長決定。CPIマニュアル2004年版 9.153〜9.171項の考え方）
  - 判定：店ペアごとに、その日の全カードの「価格比（対数）」の分布をとり、Tukeyの外側フェンス
    （Q1−3×IQR、Q3＋3×IQR。NIST e-Handbook 7.1.6）の外に出た組み合わせに印を付ける。
    ペアの件数が少ない（MIN_PAIRS 未満）ときは、従来どおり「5倍以上の差」で印を付ける
  - 2店だけで印が付いた日は代表値を採用せず「保留」（hold）にし、最後に採用された値を日付つきで表示する
  - 3店以上なら中央値は外れ値に強いので採用するが、確認用に review 表に残す
- 状態：normal（通常）/ hold（外れ値で保留）/ stale（更新待ち）/ insufficient（データ不足）
"""
import math
import statistics
from collections import defaultdict
from itertools import combinations

# 代表値に使わない店（買取チャンピオンは旧弾のみで他店と照合できないため。2026-10-10 社長決定）
EXCLUDED_SHOPS = ("champion",)
MIN_PAIRS = 30       # 店ペアの分布から閾値を出すのに必要な最少件数
FALLBACK_RATIO = 5   # 件数が足りないときの目安（従来の基準）


def calc_price(price, struck):
    """計算に使う価格。強化買取中（取り消し線あり）は通常価格（取り消し線の価格）を使う"""
    return struck if struck else price


def _fences(con, day):
    """店ペアごとの、価格比（対数）の外側フェンス"""
    by_card = defaultdict(dict)
    q = "SELECT card_id, shop_id, price, struck_price FROM price WHERE day=? AND soldout=0 AND shop_id NOT IN (%s)" % ",".join("?" * len(EXCLUDED_SHOPS))
    for cid, shop, p, st in con.execute(q, (day, *EXCLUDED_SHOPS)):
        v = calc_price(p, st)
        if v and v > 0:
            by_card[cid][shop] = v
    logs = defaultdict(list)
    for prices in by_card.values():
        for a, b in combinations(sorted(prices), 2):
            logs[(a, b)].append(math.log(prices[a] / prices[b]))
    fences = {}
    for pair, xs in logs.items():
        if len(xs) >= MIN_PAIRS:
            xs.sort()
            q1, q3 = xs[len(xs) // 4], xs[(3 * len(xs)) // 4]
            iqr = q3 - q1
            fences[pair] = (q1 - 3 * iqr, q3 + 3 * iqr)
    return by_card, fences


def _flags(prices, fences):
    """外れた店ペアの説明のリスト"""
    out = []
    for a, b in combinations(sorted(prices), 2):
        r = math.log(prices[a] / prices[b])
        lo, hi = fences.get((a, b), (-math.log(FALLBACK_RATIO), math.log(FALLBACK_RATIO)))
        if (a, b) not in fences and abs(r) >= math.log(FALLBACK_RATIO) or (a, b) in fences and not lo <= r <= hi:
            out.append(f"{a}={prices[a]} / {b}={prices[b]}（比 {math.exp(r):.2f}）")
    return out


def aggregate_day(con, day):
    cur = con.cursor()
    by_card, fences = _fences(con, day)
    cur.execute("DELETE FROM review WHERE day=?", (day,))
    # 一度でも価格が記録されたカードはすべて対象にする（その日に価格がなくても「更新待ち」の行を作る）
    cards = [r[0] for r in cur.execute("SELECT DISTINCT card_id FROM price WHERE day<=?", (day,))]
    for cid in cards:
        prices = by_card.get(cid, {})
        flags = _flags(prices, fences) if len(prices) >= 2 else []
        if flags:
            cur.execute("INSERT INTO review VALUES (?,?,?,?)", (cid, day, len(prices), " ／ ".join(flags)))
        if len(prices) >= 3 or (len(prices) == 2 and not flags):
            row = (cid, day, round(statistics.median(prices.values())), len(prices), "normal", day)
        else:
            last = cur.execute(
                "SELECT day, median_price, shop_count FROM daily WHERE card_id=? AND day<? "
                "AND state='normal' ORDER BY day DESC LIMIT 1", (cid, day)).fetchone()
            state = "hold" if flags else "stale"
            row = ((cid, day, last[1], last[2], state, last[0]) if last
                   else (cid, day, None, len(prices), "hold" if flags else "insufficient", None))
        cur.execute("INSERT OR REPLACE INTO daily VALUES (?,?,?,?,?,?)", row)
    con.commit()
