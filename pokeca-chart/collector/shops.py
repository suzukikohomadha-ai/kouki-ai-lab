"""店ごとの一覧の取り方と読み取り（2026-10-10 に各店の実際のHTMLを見て作成）。

各 parse_* は、1ページ分のHTMLから次の形の dict のリストを返す。
  set_code   収録弾コード（店の表記のまま。例 M6a、m06a）。不明なら ""
  set_name   収録弾名（店の表記のまま）
  number     型番（例 134/103、M6a-134 の 134 部分は number_head に入れる）
  name       カード名（店の表記のまま）
  rarity     レアリティ（店の表記のまま）
  price      買取価格（円・整数）
  struck     取り消し線の価格（遊々亭のみ。なければ None）
  boosted    強化買取の印（遊々亭の priceup）
  soldout    SOLDOUT の印（ドラゴンスター）
  url        カードのページ（あれば）
  note       その他（買取チャンピオンの年月表示など）
"""
import html as _html
import re

UA_PAGE_WAIT = 5  # 参考：同じ店への最小間隔（実際の待ちは polite.py が管理）


def _txt(s):
    s = re.sub(r"<[^>]+>", " ", s)
    return re.sub(r"\s+", " ", _html.unescape(s)).strip()


def _yen(s):
    m = re.search(r"([0-9][0-9,]*)", _html.unescape(s))
    return int(m.group(1).replace(",", "")) if m else None


# ---------------- 遊々亭 ----------------
YUYU_BASE = "https://yuyu-tei.jp/buy/poc/s/"


def yuyutei_series(html):
    """どのページにもある絞り込み欄（vers[]）から、収録弾コードと名前の一覧を得る"""
    out = {}
    for code, label in re.findall(r'name="vers\[\]" value="([^"]+)" id="[^"]*VersPhone"[^>]*>\s*<label[^>]*>([^<]*)</label>', html):
        out.setdefault(code, _html.unescape(label).strip())
    return out


def parse_yuyutei(html, code=""):
    set_name = ""
    m = re.search(r'<div\s+class="power[^"]*"[^>]*><h3[^>]*>\s*<span[^>]*></span>\s*([^<]+)</h3>', html)
    if m:
        set_name = _html.unescape(m.group(1)).strip()
    bracket = re.match(r"\[([^\]]+)\]", set_name)
    rows = []
    # レアリティ見出しごとに区切る
    parts = re.split(r'<h3 class="text-primary[^"]*">\s*<span[^>]*>([^<]*)</span>\s*Card List</h3>', html)
    for i in range(1, len(parts), 2):
        rarity, body = parts[i].strip(), parts[i + 1]
        for blk in re.split(r'<div\s+class="card-product ', body)[1:]:
            cls = blk[:blk.find('"')]
            num = re.search(r'<span\s+class="d-block border[^"]*">([^<]*)</span>', blk)
            name = re.search(r"<h4[^>]*>(.*?)</h4>", blk, re.S)
            price = re.search(r"<strong[^>]*>(.*?)</strong>", blk, re.S)
            struck = re.search(r"<del>(.*?)</del>", blk, re.S)
            url = re.search(r'href="(https://yuyu-tei\.jp/buy/poc/card/[^"]+)"', blk)
            if not (name and price):
                continue
            rows.append(dict(set_code=bracket.group(1) if bracket else code, set_name=set_name,
                             number=_txt(num.group(1)) if num else "", name=_txt(name.group(1)), rarity=rarity,
                             price=_yen(price.group(1)), struck=_yen(struck.group(1)) if struck else None,
                             boosted="priceup" in cls, soldout=False, url=url.group(1) if url else "", note=""))
    return rows


# ---------------- ドラゴンスター ----------------
DORA_LIST = "https://buy.dorasuta.jp/pokemon-card/series-list"
DORA_BASE = "https://buy.dorasuta.jp/pokemon-card/product-list?sid="


def dorasuta_series(html):
    out = {}
    for sid, label in re.findall(r'href="/pokemon-card/product-list\?sid=(\d+)"[^>]*>(.*?)</a>', html, re.S):
        t = _txt(label)
        if t:
            out.setdefault(sid, t)
    return out


def dorasuta_page_url(sid, page):
    if page == 1:
        return DORA_BASE + sid
    # サイトのJS（$.formSubmit）が組み立てるGETと同じ形
    return ("https://buy.dorasuta.jp/pokemon-card/product-list?form400200_mode=search"
            f"&form400200_params%5B0%5D=pager&form400200_params%5B1%5D={page}&form400200_params%5B2%5D="
            f"&sid={sid}")


def dorasuta_page_max(html):
    m = re.search(r'id="page_max" name="page_max" value="(\d+)"', html)
    return int(m.group(1)) if m else 1


def parse_dorasuta(html, set_name=""):
    bracket = re.search(r"【([^】]+)】", set_name)
    rows = []
    for blk in re.split(r'<div class="element">', html)[1:]:
        name = re.search(r'<li class="change_hight">\s*<a[^>]*>(.*?)</a>\s*<p>(.*?)</p>', blk, re.S)
        price = re.search(r"<div>([0-9][0-9,]*)円</div>", blk)
        url = re.search(r'href="(/pokemon-card/product\?pid=\d+)"', blk)
        if not (name and price):
            continue
        nm = _txt(name.group(1))
        num = re.search(r"\(([0-9A-Za-z\-]+/[0-9A-Za-z\-]+)\)", nm)
        rows.append(dict(set_code=bracket.group(1) if bracket else "", set_name=set_name,
                         number=num.group(1) if num else "", name=nm, rarity=_txt(name.group(2)),
                         price=_yen(price.group(1)), struck=None, boosted=False,
                         soldout='class="condition soldout"' in blk,
                         url="https://buy.dorasuta.jp" + url.group(1) if url else "", note=""))
    return rows


# ---------------- ゴールデンホビー ----------------
GH_URL = "https://buy-gh.tokyo/ポケモンカードシングル.html"


def parse_goldenhobby(html):
    rows = []
    period = re.search(r"(\d+月\d+日[^<]{0,40}到着[^<]{0,30}価格)", _txt(html))
    note = period.group(1) if period else ""
    for part in re.split(r"<h3>", html)[1:]:
        head = _txt(part[:part.find("</h3>")])
        bracket = re.match(r"\[([^\]]+)\]", head)
        for sec in re.findall(r'<section class="list">(.*?)</section>', part, re.S):
            ps = re.findall(r"<p[^>]*>(.*?)</p>", sec, re.S)
            name = re.search(r"<h4>(.*?)</h4>", sec, re.S)
            price = re.search(r"買取価格：([0-9,]+)円", sec)
            if not (name and price and len(ps) >= 2):
                continue
            code = _txt(ps[1])
            rows.append(dict(set_code=bracket.group(1) if bracket else "", set_name=head,
                             number=code, name=_txt(name.group(1)), rarity=_txt(ps[0]),
                             price=_yen(price.group(1)), struck=None, boosted=False, soldout=False,
                             url="", note=note))
    return rows


# ---------------- 買取チャンピオン ----------------
CHAMP_BASE = "https://championtoreca.com/card-type/pokemon/"


def champion_page_url(page):
    return CHAMP_BASE if page == 1 else f"{CHAMP_BASE}page/{page}/"


def champion_page_max(html):
    ns = [int(n) for n in re.findall(r"/card-type/pokemon/page/(\d+)/", html)]
    return max(ns) if ns else 1


def parse_champion(html):
    rows = []
    for blk in re.split(r'(?=<li data-card-id=")', html)[1:]:
        m = re.match(r'<li data-card-id="\d+" data-card-title="([^"]*)" data-card-price="(\d+)">', blk)
        if not m:
            continue
        title, price, body = m.group(1), m.group(2), blk
        t = re.sub(r"\s+", " ", _html.unescape(title)).strip()
        num = re.search(r"(\d{3}/\d{3}|No\.\d+)", t)
        date = re.search(r'<div class="cardlist-date"><p>([^<]*)</p>', body)
        rows.append(dict(set_code="", set_name=t, number=num.group(1) if num else "", name=t, rarity="",
                         price=int(price), struck=None, boosted=False, soldout=False, url="",
                         note=date.group(1) if date else ""))
    return rows
