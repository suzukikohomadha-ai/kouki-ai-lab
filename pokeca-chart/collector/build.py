"""店ごとの買取一覧（raw_price）を突き合わせて、カード単位の独自データベースを作る。

使い方: python3 -m collector.build --db data/pokeca.db [--day YYYY-MM-DD] --csv data/cards_YYYYMMDD.csv

照合の考え方（引き継ぎ資料 5.2）
- 現行シリーズは「収録弾コード＋型番の番号部分」で同じカードと判定する
  （例：遊々亭 m06a 134/103、ドラゴンスター【M6a】(134/103)、ゴールデンホビー M6a-134）
- プロモは型番そのもの（例 277/XY-P）で判定する
- 同じ店に同じキーが複数ある（レアリティ違い・仕様違い）場合は、誤って混ぜないよう照合せず、店ごとの単独行にする
- 型番のない商品、旧弾（買取チャンピオン）は照合せず単独行（人の確認が必要）
- SOLDOUT の価格は計算に入れない。代表値は中央値（2026-10-10 社長決定。平均から変更）で、2店以上そろったときだけ出す
"""
import argparse
import csv
import re
import sqlite3
import statistics
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
        m = re.match(r"^(\d+)/(\d+)$", num)
        if not m:
            return None
        return (code, str(int(m.group(1))), str(int(m.group(2)))) if code else None
    # ゴールデンホビーは分母がないので空にしておき、あとで分母つきのキーに寄せる
    return (code, str(int(head)), "") if code else None


def norm_name(n):
    n = unicodedata.normalize("NFKC", n or "")
    n = re.sub(r"\((?:\d+/[^)]*|[A-Za-z]+-P)\)", "", n)  # 型番の括弧（ドラゴンスター）
    return re.sub(r"\s+", "", n)


def set_title(n):
    n = unicodedata.normalize("NFKC", n or "")
    n = re.sub(r"^[\[【][^\]】]*[\]】]", "", n)
    n = re.sub(r"拡張パック|強化拡張パック|ハイクラスパック|コンセプトパック|[「」\s]", "", n)
    return n


def variant(row):
    """カード名から仕様違いを見分ける印を取り出す（ミラーの柄など）。戻り値は（基本名, 印の集合）"""
    t = unicodedata.normalize("NFKC", (row["name"] or "") + " " + (row["rarity"] or ""))
    tok = set()
    if "マスターボール" in t or "マスター柄" in t: tok.add("マスターボール")
    if "モンスターボール" in t or "モンスター柄" in t: tok.add("モンスターボール")
    if "エネルギーマーク" in t: tok.add("エネルギーマーク")
    if "ボール柄" in t and not tok & {"マスターボール", "モンスターボール"}: tok.add("ボール")
    if "ロケット団マーク" in t or "Rロゴ" in t: tok.add("ロケット団")
    if "エラー" in t: tok.add("エラー")
    # ミラー・キラ・ホイルは店ごとの呼び方の違い（光る加工の版）として同じ扱いにする
    if tok or "ミラー" in t or "キラ" in t or "ホイル" in t: tok.add("ミラー")
    base = re.sub(r"[\(（【\[][^\)）】\]]*[\)）】\]]", "", unicodedata.normalize("NFKC", row["name"] or ""))
    return re.sub(r"\s+", "", base), frozenset(tok)


def split_group(shops):
    """同じキーで店内に複数行あるグループを、基本名と仕様（ミラーの柄など）が一致するものどうしでまとめ直す。
    一致が1対1に決まらないものは要確認の単独行にする"""
    used, res = set(), []
    base = max(shops, key=lambda s: len(shops[s]))
    for r in shops[base]:
        grp = {base: [r]}
        for s, v in shops.items():
            if s == base:
                continue
            cand = [x for x in v if id(x) not in used and variant(x) == variant(r)]
            if len(cand) > 1:
                t = set_title(r["set_name"])
                cand = [x for x in cand if t and (t in set_title(x["set_name"]) or set_title(x["set_name"]) in t)]
            if len(cand) == 1:
                grp[s] = cand
                used.add(id(cand[0]))
        used.add(id(r))
        res.append(("照合済み（名前で判定）" if len(grp) > 1 else "1店のみ（仕様違いあり）", grp))
    for s, v in shops.items():
        for x in v:
            if id(x) not in used:
                res.append(("1店のみ（仕様違いあり）", {s: [x]}))
    return res


def shop_key(r):
    """店の中で商品を一意に表すキー。店のカードページURLがあればそれを使う"""
    return r["url"] or "|".join([r["set_code"] or "", r["number"] or "", r["name"] or "", r["rarity"] or ""])


def build(con, day):
    # 全ページ取得できた店（shop_day が complete）のデータだけを使う。途中で止まった店は混ぜない
    rows = [dict(zip([d[0] for d in cur.description], v)) for cur in [con.execute(
        "SELECT * FROM raw_price WHERE day=? AND shop IN (SELECT shop FROM shop_day WHERE day=? AND status='complete')",
        (day, day))] for v in cur.fetchall()]
    # 同じ商品が店の一覧に2回載っていることがある（ドラゴンスターで同じ商品が2つのシリーズページに出る、
    # 買取チャンピオンで同じカードが2回載る等）。同じ店の同じ商品は1件にまとめる
    seen, uniq = set(), []
    for x in rows:
        k = (x["shop"], shop_key(x))
        if k not in seen:
            seen.add(k)
            uniq.append(x)
    rows = uniq
    # 同じ商品なのに店ごとに弾コードが違うもの（例：THE BEST OF XY は遊々亭 [HP]、ドラゴンスター【XY】）を
    # 収録弾名の一致で遊々亭のコードにそろえる
    titles = defaultdict(set)
    for x in rows:
        if x["shop"] == "yuyutei" and x["set_code"]:
            titles[set_title(x["set_name"])].add(x["set_code"])
    for x in rows:
        if x["shop"] in ("dorasuta", "goldenhobby"):
            c = titles.get(set_title(x["set_name"]))
            if c and len(c) == 1 and norm_code(next(iter(c))) != norm_code(x["set_code"]):
                x["set_code"] = next(iter(c))
                if x["shop"] == "goldenhobby":  # ゴールデンホビーは型番側にもコードがある（例 M6a-134）
                    x["number"] = re.sub(r"^[A-Za-z0-9]+(?:-[A-Za-z])?-", x["set_code"] + "-", x["number"])
    by_key = defaultdict(lambda: defaultdict(list))
    singles = []
    for r in rows:
        k = key_of(r)
        if k is None:
            singles.append((None, {r["shop"]: [r]}))
        else:
            by_key[k][r["shop"]].append(r)
    # 分母のないキー（ゴールデンホビー）を、同じ弾・番号で分母つきのキーが1つだけならそこへ寄せる
    for k in [k for k in by_key if len(k) == 3 and k[2] == ""]:
        fam = [k2 for k2 in by_key if k2[:2] == k[:2] and k2[2] != ""]
        if len(fam) == 1:
            for shop, v in by_key.pop(k).items():
                by_key[fam[0]][shop].extend(v)
        elif len(fam) > 1:
            for shop, v in by_key.pop(k).items():
                for x in v:
                    singles.append(("同じ型番が複数あり要確認", {shop: [x]}))
    out = []
    for k, shops in by_key.items():
        mixed = len(shops) > 1 and len({variant(v[0])[1] for v in shops.values()}) > 1
        if any(len(v) > 1 for v in shops.values()) or mixed:
            # 同じ店に同じキーが複数、または店によって仕様（ミラーの柄など）が違う → 名前と仕様で見分ける
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
        med = round(statistics.median(valid)) if len(valid) >= 2 else None
        # 2店だけで5倍以上離れているものは、どちらかの読み違い・別物の可能性があるので代表値を出さず保留（3.6）
        if med is not None and len(valid) == 2 and max(valid) >= 5 * min(valid):
            med, status = None, status + "・価格差大で保留"
        row = {"カード名": base["name"], "型番": base["number"], "レアリティ": base["rarity"],
               "収録弾": base["set_name"], "弾コード": base["set_code"]}
        for s in SHOPS:
            r = prices.get(s)
            row[SHOP_JA[s]] = r["price"] if r else ""
            row[SHOP_JA[s] + "_備考"] = "" if not r else "・".join(x for x in [
                "SOLDOUT" if r["soldout"] else "", "強化買取中" if r["boosted"] else "",
                f"取消線{r['struck']}" if r["struck"] else "", r["note"] if s == "champion" else ""] if x)
        row.update({"価格のある店数": len(valid), "中央値（2店以上）": med if med is not None else "",
                    "照合状況": status, "照合キー": "/".join(x for x in k if x) if k else ""})
        res.append(row)
    res.sort(key=lambda r: (-(r["中央値（2店以上）"] or 0), -max([r[SHOP_JA[s]] or 0 for s in SHOPS])))
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
