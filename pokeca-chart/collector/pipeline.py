"""1日分の処理：照合 → カード台帳・日ごとの価格に記録 → 日次集計 → CSV 書き出し。

使い方: python3 -m collector.pipeline --db data/pokeca.db --out data/ [--day YYYY-MM-DD]

- カード番号（card.id）は日をまたいで変わらない。各店の商品（shop_item）がどのカードかを覚えておき、
  翌日以降は同じ商品を同じカードにひも付ける
- 記録は全カード分残す。100円以上で絞るのはスプレッドシート用の書き出しだけ（2026-10-10 社長決定）
- 100円の判定は中央値で行う
"""
import argparse
import csv
import os
import re
import sqlite3
import sys
import unicodedata
import urllib.parse

from .aggregate import aggregate_day
from .build import SHOPS, SHOP_JA, build
from .db import SCHEMA as DB_SCHEMA
from .collect import SCHEMA as RAW_SCHEMA

MIN_PRICE = 100
OFFICIAL_SEARCH = "https://www.pokemon-card.com/card-search/index.php?regulation_detail=all&pokemon="


def official_search_url(name):
    """暫定：公式カード検索をカード名で検索した結果ページ（テキストリンク用）。
    カードごとの詳細ページ（details.php/card/{番号}）は、番号の集め方の確認（リョウ）が終わるまで使わない"""
    base = re.sub(r"[\(（【\[][^\)）】\]]*[\)）】\]]", "", unicodedata.normalize("NFKC", name or "")).strip()
    return OFFICIAL_SEARCH + urllib.parse.quote(base) if base else ""


def shop_key(r):
    """店の中で商品を一意に表すキー。店のカードページURLがあればそれを使う"""
    return r["url"] or "|".join([r["set_code"] or "", r["number"] or "", r["name"] or "", r["rarity"] or ""])


def record(con, day):
    items = build(con, day)
    cur = con.cursor()
    new = merged = 0
    for status, shops, k in items:
        rows = [(s, v[0]) for s, v in shops.items()]
        ids = sorted({x[0] for s, r in rows for x in cur.execute(
            "SELECT card_id FROM shop_item WHERE shop_id=? AND shop_key=?", (s, shop_key(r)))})
        if ids:
            cid = ids[0]
            merged += len(ids) > 1  # 以前は別カードだったものが同じカードと判定された
        else:
            base = next(shops[s][0] for s in SHOPS if s in shops)
            cur.execute("INSERT INTO card(name, number, rarity, set_code, set_name, match_key, official_url, first_seen) "
                        "VALUES (?,?,?,?,?,?,?,?)",
                        (base["name"], base["number"], base["rarity"], base["set_code"], base["set_name"],
                         "/".join(x for x in k if x) if k else "", official_search_url(base["name"]), day))
            cid = cur.lastrowid
            new += 1
        for s, r in rows:
            cur.execute("INSERT OR IGNORE INTO shop(id) VALUES (?)", (s,))
            cur.execute("INSERT OR REPLACE INTO shop_item VALUES (?,?,?)", (s, shop_key(r), cid))
            cur.execute("INSERT OR REPLACE INTO price VALUES (?,?,?,?,?,?,?)",
                        (cid, s, day, r["price"], r["struck"], r["boosted"], r["soldout"]))
    con.commit()
    return len(items), new, merged


def export(con, day, out):
    """全件のCSV（社内用・店名あり）と、スプレッドシート用（中央値100円以上）を書き出す"""
    prices = {}
    for cid, shop, p, so, bo, st in con.execute(
            "SELECT card_id, shop_id, price, soldout, boosted, struck_price FROM price WHERE day=?", (day,)):
        prices.setdefault(cid, {})[shop] = (p, so, bo, st)
    rows = []
    for cid, name, num, rar, sname, scode, key, url, med, n, state, asof in con.execute(
            "SELECT c.id, c.name, c.number, c.rarity, c.set_name, c.set_code, c.match_key, c.official_url, "
            "d.median_price, d.shop_count, d.state, d.asof_day FROM card c JOIN daily d ON d.card_id=c.id AND d.day=?",
            (day,)):
        row = {"カード番号": cid, "カード名": name, "型番": num, "レアリティ": rar, "収録弾": sname, "弾コード": scode,
               "中央値": med if med is not None else "", "算出店数": n if state == "normal" else "",
               "状態": {"normal": "通常", "stale": f"更新待ち（{asof}時点）", "insufficient": "データ不足"}[state],
               "公式で確認（カード名検索・暫定）": url}
        for s in SHOPS:
            p = prices.get(cid, {}).get(s)
            row[SHOP_JA[s]] = p[0] if p else ""
            row[SHOP_JA[s] + "_備考"] = "" if not p else "・".join(
                x for x in ["SOLDOUT" if p[1] else "", "強化買取中" if p[2] else "", f"取消線{p[3]}" if p[3] else ""] if x)
        row["照合キー"] = key
        rows.append(row)
    rows.sort(key=lambda r: -(r["中央値"] or 0))
    os.makedirs(out, exist_ok=True)
    tag = day.replace("-", "")
    paths = []
    for fname, sel in [(f"cards_all_{tag}.csv", rows),
                       (f"spreadsheet_100yen_{tag}.csv", [r for r in rows if r["中央値"] != "" and r["中央値"] >= MIN_PRICE])]:
        path = os.path.join(out, fname)
        with open(path, "w", newline="", encoding="utf-8-sig") as f:
            w = csv.DictWriter(f, fieldnames=list(rows[0].keys()))
            w.writeheader()
            w.writerows(sel)
        paths.append((path, len(sel)))
    return paths


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--db", default="data/pokeca.db")
    ap.add_argument("--out", default="data/")
    ap.add_argument("--day")
    a = ap.parse_args()
    con = sqlite3.connect(a.db)
    con.executescript(RAW_SCHEMA + DB_SCHEMA)
    day = a.day or con.execute("SELECT max(day) FROM shop_day WHERE status='complete'").fetchone()[0]
    if not day:
        print("完了した取得日がありません")
        return 1
    n, new, merged = record(con, day)
    aggregate_day(con, day)
    for path, cnt in export(con, day, a.out):
        print(f"{path}: {cnt}行")
    print(f"{day}: {n}件を記録（新しいカード {new}件、統合 {merged}件）")
    return 0


if __name__ == "__main__":
    sys.exit(main())
