"""日次集計（引き継ぎ資料 3.2）。

通常: 2店以上 → 単純平均と店数 / 更新待ち: 1店のみ → 最後に2店以上そろった日の平均
データ不足: 2店以上そろった日が一度もない。SOLDOUT の価格は平均に入れない。
"""


def aggregate_day(con, day):
    cur = con.cursor()
    cards = [r[0] for r in cur.execute("SELECT DISTINCT card_id FROM price WHERE day=?", (day,))]
    for cid in cards:
        prices = [r[0] for r in cur.execute(
            "SELECT price FROM price WHERE card_id=? AND day=? AND soldout=0", (cid, day))]
        if len(prices) >= 2:
            row = (cid, day, round(sum(prices) / len(prices)), len(prices), "normal", day)
        else:
            last = cur.execute(
                "SELECT day, avg_price, shop_count FROM daily WHERE card_id=? AND day<? "
                "AND state='normal' ORDER BY day DESC LIMIT 1", (cid, day)).fetchone()
            row = ((cid, day, last[1], last[2], "stale", last[0]) if last
                   else (cid, day, None, len(prices), "insufficient", None))
        cur.execute("INSERT OR REPLACE INTO daily VALUES (?,?,?,?,?,?)", row)
    con.commit()
