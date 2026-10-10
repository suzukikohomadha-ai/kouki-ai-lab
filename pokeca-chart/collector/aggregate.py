"""日次集計（引き継ぎ資料 3.2）。

通常: 2店以上 → 中央値と店数（2026-10-10 社長決定で平均から変更） / 更新待ち: 1店のみ → 最後に2店以上そろった日の値
データ不足: 2店以上そろった日が一度もない。SOLDOUT の価格は計算に入れない。
"""
import statistics


# 代表値に使わない店（買取チャンピオンは旧弾のみで他店と照合できないため。2026-10-10 社長決定）
EXCLUDED_SHOPS = ("champion",)


def aggregate_day(con, day):
    cur = con.cursor()
    # 一度でも価格が記録されたカードはすべて対象にする（その日に価格がなくても「更新待ち」の行を作る）
    cards = [r[0] for r in cur.execute("SELECT DISTINCT card_id FROM price WHERE day<=?", (day,))]
    q = "SELECT price FROM price WHERE card_id=? AND day=? AND soldout=0 AND shop_id NOT IN (%s)" % ",".join("?" * len(EXCLUDED_SHOPS))
    for cid in cards:
        prices = [r[0] for r in cur.execute(q, (cid, day, *EXCLUDED_SHOPS)) if r[0]]
        # 2店だけで5倍以上離れている日は、読み違い・別物の可能性があるので採用しない（3.6 異常値の保留）
        ok = len(prices) >= 3 or (len(prices) == 2 and max(prices) < 5 * min(prices))
        if ok:
            row = (cid, day, round(statistics.median(prices)), len(prices), "normal", day)
        else:
            last = cur.execute(
                "SELECT day, median_price, shop_count FROM daily WHERE card_id=? AND day<? "
                "AND state='normal' ORDER BY day DESC LIMIT 1", (cid, day)).fetchone()
            row = ((cid, day, last[1], last[2], "stale", last[0]) if last
                   else (cid, day, None, len(prices), "insufficient", None))
        cur.execute("INSERT OR REPLACE INTO daily VALUES (?,?,?,?,?,?)", row)
    con.commit()
