import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from collector.db import connect
from collector.aggregate import aggregate_day

con = connect(":memory:")
con.execute("INSERT INTO box VALUES ('m6a','30th CELEBRATION',NULL,NULL)")
con.execute("INSERT INTO card(id,set_code,number,name,rarity) VALUES (1,'M6a','134/103','ミュウツーex','FUR')")
for s in ("a", "b", "c"):
    con.execute("INSERT INTO shop(id) VALUES (?)", (s,))
def put(shop, day, p, sold=0):
    con.execute("INSERT INTO price(card_id,shop_id,day,price,soldout) VALUES (1,?,?,?,?)", (shop, day, p, sold))

# 付録A: ミュウツーex 134/103 FUR は 4800・3500・5000 → 中央値 4,800円
for s, p in (("a", 4800), ("b", 3500), ("c", 5000)): put(s, "2026-10-08", p)
aggregate_day(con, "2026-10-08")
assert con.execute("SELECT median_price,shop_count,state FROM daily WHERE day='2026-10-08'").fetchone() == (4800, 3, "normal")

# 1店だけ → 更新待ち（前回の中央値を日付つきで保持）
put("a", "2026-10-09", 4900)
aggregate_day(con, "2026-10-09")
assert con.execute("SELECT median_price,state,asof_day FROM daily WHERE day='2026-10-09'").fetchone() == (4800, "stale", "2026-10-08")

# SOLDOUT は中央値に入れない → 1店扱い
put("a", "2026-10-10", 4900); put("b", "2026-10-10", 9999, sold=1)
aggregate_day(con, "2026-10-10")
assert con.execute("SELECT state FROM daily WHERE day='2026-10-10'").fetchone()[0] == "stale"
# 2店だけで5倍以上の差 → 採用せず更新待ち
put("a", "2026-10-11", 100); put("b", "2026-10-11", 900)
aggregate_day(con, "2026-10-11")
assert con.execute("SELECT state FROM daily WHERE day='2026-10-11'").fetchone()[0] == "stale"

# その日に1件も価格がなくても行を作る（チャートの抜けにしない）
aggregate_day(con, "2026-10-12")
assert con.execute("SELECT state,asof_day FROM daily WHERE day='2026-10-12'").fetchone() == ("stale", "2026-10-08")

# 買取チャンピオンは代表値に使わない
con.execute("INSERT INTO shop(id) VALUES ('champion')")
put("a", "2026-10-13", 1000); con.execute("INSERT INTO price(card_id,shop_id,day,price,soldout) VALUES (1,'champion','2026-10-13',1100,0)")
aggregate_day(con, "2026-10-13")
assert con.execute("SELECT state FROM daily WHERE day='2026-10-13'").fetchone()[0] == "stale"
print("OK")
