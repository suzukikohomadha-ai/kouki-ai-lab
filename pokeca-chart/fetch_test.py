#!/usr/bin/env python3
"""ポケカ買取チャート: 取得テスト用プログラム（第1段階）

対象候補の店から買取ページを「1店につき1ページだけ」取得し、
サーバーからのアクセスが受け付けられるかを確かめます。
取得したページは out/ フォルダに保存されます。

- 追加のインストールは不要です（Python 3 の標準機能だけで動きます）
- 各店の robots.txt を先に読み、拒否されているページは取得しません
- 403 や 429 などで拒否された店は、再試行せずにそこで止めます
"""
import datetime
import os
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
import urllib.robotparser

# ▼▼▼ ここだけ書き換えてください（店側が連絡を取れるメールアドレス） ▼▼▼
CONTACT = "ここに連絡先メールアドレス"
# ▲▲▲ ここまで ▲▲▲

USER_AGENT = "pokeca-kaitori-chart-test/0.1 (contact: " + CONTACT + ")"
MIN_WAIT = 10   # 同じ店への連続アクセスの最小間隔（秒）
TIMEOUT = 30    # 1回の取得の待ち時間の上限（秒）
OUT_DIR = "out"

TARGETS = [
    ("yuyutei", "https://yuyu-tei.jp/buy/poc/s/m06a"),
    ("dorasuta", "https://buy.dorasuta.jp/pokemon-card/product-list?sid=14026"),
    ("goldenhobby", "https://buy-gh.tokyo/ポケモンカードシングル.html"),
    ("champion", "https://championtoreca.com/card-type/pokemon/"),
    ("surugaya", "https://www.suruga-ya.jp/kaitori/search_buy?category=5&search_word=ポケモンカード 旧裏"),
]


def ascii_url(url):
    """日本語を含むURLを、そのまま送れる形に変換する"""
    p = urllib.parse.urlsplit(url)
    path = urllib.parse.quote(p.path, safe="/%")
    query = urllib.parse.quote(p.query, safe="=&%+")
    return urllib.parse.urlunsplit((p.scheme, p.netloc, path, query, ""))


def fetch(url):
    """1回だけ取得する。戻り値は (ステータス, 本文のバイト列, エラー文)"""
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT, "Accept-Language": "ja"})
    try:
        with urllib.request.urlopen(req, timeout=TIMEOUT) as res:
            return res.status, res.read(), ""
    except urllib.error.HTTPError as e:
        return e.code, b"", str(e)
    except Exception as e:  # 接続できない、時間切れ など
        return 0, b"", repr(e)


def main():
    if "@" not in CONTACT:
        print("先に、プログラム上部の CONTACT を連絡先メールアドレスに書き換えてください。")
        sys.exit(1)

    os.makedirs(OUT_DIR, exist_ok=True)
    lines = ["取得テスト結果 " + datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"), "User-Agent: " + USER_AGENT, ""]

    for name, raw_url in TARGETS:
        url = ascii_url(raw_url)
        host = urllib.parse.urlsplit(url)
        robots_url = host.scheme + "://" + host.netloc + "/robots.txt"
        print("[" + name + "] robots.txt を確認中 ...")
        status, body, err = fetch(robots_url)

        wait = MIN_WAIT
        allowed = True
        robots_note = "robots.txt: HTTP " + str(status)
        if status == 200:
            with open(os.path.join(OUT_DIR, name + "_robots.txt"), "wb") as f:
                f.write(body)
            rp = urllib.robotparser.RobotFileParser()
            rp.parse(body.decode("utf-8", errors="replace").splitlines())
            allowed = rp.can_fetch(USER_AGENT, url)
            if not allowed:
                robots_note += " このページは robots.txt で拒否されています"
            delay = rp.crawl_delay(USER_AGENT)
            if delay:
                wait = max(wait, int(delay))
                robots_note += "（アクセス間隔の指定 " + str(delay) + " 秒）"
        elif status in (401, 403, 429) or status == 0:
            # robots.txt の時点で拒否・接続不可なら、その店は取得しない
            allowed = False
            robots_note += " 取得できないため、この店は中止 " + err

        if not allowed:
            msg = name + ": 取得しませんでした。" + robots_note
            print("  → " + msg)
            lines.append(msg)
            lines.append("")
            continue

        print("  " + str(wait) + " 秒待ってからページを取得します ...")
        time.sleep(wait)
        status, body, err = fetch(url)
        text = body.decode("utf-8", errors="replace")
        if body:
            with open(os.path.join(OUT_DIR, name + ".html"), "wb") as f:
                f.write(body)
        result = (
            name + ": HTTP " + str(status)
            + " / " + str(len(body)) + " バイト"
            + " / 「円」の数 " + str(text.count("円"))
            + " / 「¥」の数 " + str(text.count("¥") + text.count("￥"))
        )
        if err:
            result += " / エラー: " + err
        print("  → " + result)
        lines.append(result)
        lines.append("  " + robots_note)
        lines.append("  URL: " + raw_url)
        lines.append("")
        time.sleep(3)

    with open(os.path.join(OUT_DIR, "summary.txt"), "w", encoding="utf-8") as f:
        f.write("\n".join(lines))
    print("")
    print("完了しました。結果は " + OUT_DIR + "/summary.txt にあります。")


if __name__ == "__main__":
    main()
