"""全店の買取一覧を1回分まとめて集める。

使い方: POKECA_CONTACT=メール python3 -m collector.collect --db pokeca.db --raw raw/ [--shops yuyutei,dorasuta,goldenhobby,champion] [--limit N]

- アクセスの作法は polite.py（robots.txt・間隔5秒以上・拒否されたらその店はその日停止）
- 店は1店ずつ順番に回る（同時接続1本）
- 取得したHTMLは raw/<日付>/<店>/ に gzip で保存（読み取りを直したとき再解析できる）
"""
import argparse
import datetime
import gzip
import os
import sqlite3
import sys
import time

from . import shops as S
from .polite import PoliteFetcher, ShopBlocked

SCHEMA = """
CREATE TABLE IF NOT EXISTS raw_price (
  shop TEXT, day TEXT, set_code TEXT, set_name TEXT, number TEXT, name TEXT, rarity TEXT,
  price INTEGER, struck INTEGER, boosted INTEGER, soldout INTEGER, url TEXT, note TEXT
);
CREATE INDEX IF NOT EXISTS raw_price_day ON raw_price(day, shop);
CREATE TABLE IF NOT EXISTS fetch_log (shop TEXT, day TEXT, url TEXT, status TEXT, rows INTEGER, at TEXT);
"""


class Run:
    def __init__(self, db, raw, day, limit):
        self.con = sqlite3.connect(db)
        self.con.executescript(SCHEMA)
        self.raw, self.day, self.limit = raw, day, limit
        self.f = PoliteFetcher()

    def get(self, shop, url, key):
        body = self.f.fetch(url)
        d = os.path.join(self.raw, self.day, shop)
        os.makedirs(d, exist_ok=True)
        with gzip.open(os.path.join(d, key + ".html.gz"), "wb") as fp:
            fp.write(body)
        return body.decode("utf-8", errors="replace")

    def save(self, shop, url, rows):
        self.con.executemany("INSERT INTO raw_price VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)",
            [(shop, self.day, r["set_code"], r["set_name"], r["number"], r["name"], r["rarity"], r["price"],
              r["struck"], int(r["boosted"]), int(r["soldout"]), r["url"], r["note"]) for r in rows])
        self.log(shop, url, "ok", len(rows))

    def log(self, shop, url, status, n=0):
        self.con.execute("INSERT INTO fetch_log VALUES (?,?,?,?,?,?)",
                         (shop, self.day, url, status, n, datetime.datetime.now().isoformat(timespec="seconds")))
        self.con.commit()
        print(f"[{shop}] {status} {n}件 {url}", flush=True)

    def clear(self, shop):
        self.con.execute("DELETE FROM raw_price WHERE shop=? AND day=?", (shop, self.day))
        self.con.commit()

    # ---- 各店 ----
    def yuyutei(self):
        first = self.get("yuyutei", S.YUYU_BASE + "m06a", "m06a")
        series = list(S.yuyutei_series(first).items())[: self.limit or None]
        for code, _ in series:
            url = S.YUYU_BASE + code
            html = first if code == "m06a" else self.get("yuyutei", url, code)
            self.save("yuyutei", url, S.parse_yuyutei(html, code))

    def dorasuta(self):
        series = list(S.dorasuta_series(self.get("dorasuta", S.DORA_LIST, "series-list")).items())[: self.limit or None]
        for sid, name in series:
            page, pmax = 1, 1
            while page <= pmax:
                url = S.dorasuta_page_url(sid, page)
                html = self.get("dorasuta", url, f"{sid}-{page}")
                pmax = S.dorasuta_page_max(html)
                self.save("dorasuta", url, S.parse_dorasuta(html, name))
                page += 1

    def goldenhobby(self):
        html = self.get("goldenhobby", S.GH_URL, "single")
        self.save("goldenhobby", S.GH_URL, S.parse_goldenhobby(html))

    def champion(self):
        page, pmax = 1, 1
        while page <= pmax and (not self.limit or page <= self.limit):
            url = S.champion_page_url(page)
            html = self.get("champion", url, f"p{page}")
            pmax = max(pmax, S.champion_page_max(html))
            self.save("champion", url, S.parse_champion(html))
            page += 1


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--db", default="pokeca.db")
    ap.add_argument("--raw", default="raw")
    ap.add_argument("--shops", default="yuyutei,dorasuta,goldenhobby,champion")
    ap.add_argument("--limit", type=int, default=0, help="試し用：各店の収録弾（ページ）数の上限")
    a = ap.parse_args()
    run = Run(a.db, a.raw, datetime.date.today().isoformat(), a.limit)
    for shop in a.shops.split(","):
        run.clear(shop)
        t = time.time()
        try:
            getattr(run, shop)()
        except ShopBlocked as e:
            run.log(shop, str(e), "blocked")  # 拒否された店はその日はここで止める（回避しない）
        except Exception as e:  # 読み取り失敗などはその店だけ止め、ほかの店は続ける
            run.log(shop, repr(e), "error")
        print(f"[{shop}] 終了 {time.time() - t:.0f}秒", flush=True)


if __name__ == "__main__":
    sys.exit(main())
