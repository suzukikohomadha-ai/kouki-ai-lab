import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from collector.db import connect
from collector.aggregate import aggregate_day

con = connect(":memory:")
con.execute("INSERT INTO box VALUES ('m6a','30th CELEBRATION',NULL,NULL)")
con.execute("INSERT INTO card(id,box_code,number,name,rarity) VALUES (1,'m6a','134/103','ミュウツーex','FUR')")
for s in ("a", "b", "c"):
    con.execute("INSERT INTO shop(id) VALUES (?)", (s,))
def put(shop, day, p, sold=0):
    con.execute("INSERT INTO price(card_id,shop_id,day,price,soldout) VALUES (1,?,?,?,?)", (shop, day, p, sold))

# 付録A: ミュウツーex 134/103 FUR は 4800・3500・5000 → 中央値 4,800円
for s, p in (("a", 4800), ("b", 3500), ("c", 5000)): put(s, "2026-10-08", p)
aggregate_day(con, "2026-10-08")
assert con.execute("SELECT avg_price,shop_count,state FROM daily WHERE day='2026-10-08'").fetchone() == (4800, 3, "normal")

# 1店だけ → 更新待ち（前回の平均を日付つきで保持）
put("a", "2026-10-09", 4900)
aggregate_day(con, "2026-10-09")
assert con.execute("SELECT avg_price,state,asof_day FROM daily WHERE day='2026-10-09'").fetchone() == (4800, "stale", "2026-10-08")

# SOLDOUT は平均に入れない → 1店扱い
put("a", "2026-10-10", 4900); put("b", "2026-10-10", 9999, sold=1)
aggregate_day(con, "2026-10-10")
assert con.execute("SELECT state FROM daily WHERE day='2026-10-10'").fetchone()[0] == "stale"
print("OK")
