"""店ごとの買取一覧（raw_price）を突き合わせて、カード単位の独自データベースを作る。

使い方: python3 -m collector.build --db data/pokeca.db [--day YYYY-MM-DD] --csv data/cards_YYYYMMDD.csv

照合の考え方（引き継ぎ資料 5.2）
- 現行シリーズは「収録弾コード＋型番の番号部分」で同じカードと判定する
  （例：遊々亭 m06a 134/103、ドラゴンスター【M6a】(134/103)、ゴールデンホビー M6a-134）
- プロモは型番そのもの（例 277/XY-P）で判定する
- 同じ店に同じキーが複数ある（レアリティ違い・仕様違い）場合は、誤って混ぜないよう照合せず、店ごとの単独行にする
- 型番のない商品、旧弾（買取チャンピオン）は照合せず単独行（人の確認が必要）
- SOLDOUT の価格は平均に入れない。平均は2店以上そろったときだけ出す（3.2）
"""
import argparse
import csv
import re
import sqlite3
import unicodedata
from collections import defaultdict

SHOPS = ["yuyutei", "dorasuta", "goldenhobby", "champion"]
SHOP_JA = {"yuyutei": "遊々亭", "dorasuta": "ドラゴンスター", "goldenhobby": "ゴールデンホビー", "champion": "買取チャンピオン"}


def norm_code(c):
    c = (c or "").strip().lower().replace(" ", "")
    return re.sub(r"(?<=[a-z])0+(?=\d)", "", c)


def key_of(r):
    """照合キーを返す。照合しない行は None"""
    shop, code, num = r["shop"], norm_code(r["set_code"]), (r["number"] or "").strip()
    if shop == "champion" or not num:
        return None
    m = re.match(r"^(\d+)/([A-Za-z]+-P)$", num)  # プロモ
    if m:
        return ("promo", f"{int(m.group(1))}/{m.group(2).upper()}")
    if shop == "goldenhobby":
        m = re.match(r"^([A-Za-z0-9]+(?:-[A-Za-z])?)-(\d+)\b", num)
        if not m:
            return None
        code, head = norm_code(m.group(1)), m.group(2)
    else:
        m = re.match(r"^(\d+)/\d+$", num)
        if not m:
            return None
        head = m.group(1)
    return (code, str(int(head))) if code else None


def norm_name(n):
    n = unicodedata.normalize("NFKC", n or "")
    n = re.sub(r"\((?:\d+/[^)]*|[A-Za-z]+-P)\)", "", n)  # 型番の括弧（ドラゴンスター）
    return re.sub(r"\s+", "", n)


def set_title(n):
    n = unicodedata.normalize("NFKC", n or "")
    n = re.sub(r"^[\[【][^\]】]*[\]】]", "", n)
    n = re.sub(r"拡張パック|強化拡張パック|ハイクラスパック|コンセプトパック|[「」\s]", "", n)
    return n


def split_group(shops):
    """同じキーで店内に複数行あるグループを、名前（＋収録弾名）が一致するものどうしでまとめ直す。
    一致が1対1に決まらないものは要確認の単独行にする"""
    used, res = set(), []
    base = max(shops, key=lambda s: len(shops[s]))
    for r in shops[base]:
        grp = {base: [r]}
        for s, v in shops.items():
            if s == base:
                continue
            cand = [x for x in v if id(x) not in used and norm_name(x["name"]) == norm_name(r["name"])]
            if len(cand) > 1:
                t = set_title(r["set_name"])
                cand = [x for x in cand if t and (t in set_title(x["set_name"]) or set_title(x["set_name"]) in t)]
            if len(cand) == 1:
                grp[s] = cand
                used.add(id(cand[0]))
        used.add(id(r))
        res.append(("照合済み（名前で判定）" if len(grp) > 1 else "同じ型番が複数あり要確認", grp))
    for s, v in shops.items():
        for x in v:
            if id(x) not in used:
                res.append(("同じ型番が複数あり要確認", {s: [x]}))
    return res


def build(con, day):
    rows = [dict(zip([d[0] for d in cur.description], v)) for cur in [con.execute(
        "SELECT * FROM raw_price WHERE day=?", (day,))] for v in cur.fetchall()]
    by_key = defaultdict(lambda: defaultdict(list))
    singles = []
    for r in rows:
        k = key_of(r)
        if k is None:
            singles.append((None, {r["shop"]: [r]}))
        else:
            by_key[k][r["shop"]].append(r)
    out = []
    for k, shops in by_key.items():
        if any(len(v) > 1 for v in shops.values()):
            # 同じ店に同じキーが複数（2商品で同じ弾コード、ミラー違いなど）→ カード名と収録弾名で見分ける
            for status, grp in split_group(shops):
                out.append((status, grp, k))
            continue
        out.append(("照合済み" if len(shops) > 1 else "1店のみ", shops, k))
    for status, shops in singles:
        out.append((status or "照合対象外", shops, None))
    return out


def to_rows(items):
    res = []
    for status, shops, k in items:
        base = next(shops[s][0] for s in SHOPS if s in shops)
        prices = {s: shops[s][0] for s in shops}
        valid = [r["price"] for r in prices.values() if r["price"] and not r["soldout"]]
        avg = round(sum(valid) / len(valid)) if len(valid) >= 2 else None
        row = {"カード名": base["name"], "型番": base["number"], "レアリティ": base["rarity"],
               "収録弾": base["set_name"], "弾コード": base["set_code"]}
        for s in SHOPS:
            r = prices.get(s)
            row[SHOP_JA[s]] = r["price"] if r else ""
            row[SHOP_JA[s] + "_備考"] = "" if not r else "・".join(x for x in [
                "SOLDOUT" if r["soldout"] else "", "強化買取中" if r["boosted"] else "",
                f"取消線{r['struck']}" if r["struck"] else "", r["note"] if s == "champion" else ""] if x)
        row.update({"価格のある店数": len(valid), "平均（2店以上）": avg if avg is not None else "",
                    "照合状況": status, "照合キー": "/".join(k) if k else ""})
        res.append(row)
    res.sort(key=lambda r: (-(r["平均（2店以上）"] or 0), -max([r[SHOP_JA[s]] or 0 for s in SHOPS])))
    return res


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--db", default="data/pokeca.db")
    ap.add_argument("--day")
    ap.add_argument("--csv", required=True)
    a = ap.parse_args()
    con = sqlite3.connect(a.db)
    day = a.day or con.execute("SELECT max(day) FROM raw_price").fetchone()[0]
    rows = to_rows(build(con, day))
    with open(a.csv, "w", newline="", encoding="utf-8-sig") as f:
        w = csv.DictWriter(f, fieldnames=list(rows[0].keys()))
        w.writeheader()
        w.writerows(rows)
    from collections import Counter
    print(day, len(rows), "行", Counter(r["照合状況"] for r in rows), Counter(r["価格のある店数"] for r in rows))


if __name__ == "__main__":
    main()
