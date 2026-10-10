"""アクセスの作法（引き継ぎ資料 2.2 / 2.3）を1か所に固定した取得部品。

- robots.txt で拒否されたページは取得しない。Crawl-delay に従う
- 間隔は5秒以上。同時接続1本
- 401/403/429 や接続不可が返った店は、その日は止める（回避しない）
- User-Agent で目的と連絡先を名乗る（環境変数 POKECA_CONTACT）
"""
import os
import time
import urllib.error
import urllib.parse
import urllib.request
import urllib.robotparser

MIN_WAIT = 5
BLOCK_CODES = (401, 403, 429)


class ShopBlocked(Exception):
    """この店へのアクセスをその日は止める"""


class PoliteFetcher:
    def __init__(self, contact=None, timeout=30, sleep=time.sleep):
        contact = contact or os.environ.get("POKECA_CONTACT", "")
        if "@" not in contact:
            raise RuntimeError("環境変数 POKECA_CONTACT に連絡先メールアドレスを設定してください")
        self.ua = "pokeca-kaitori-chart/0.1 (contact: " + contact + ")"
        self.timeout, self.sleep = timeout, sleep
        self._robots, self._last, self._blocked = {}, {}, set()

    def _get(self, url):
        req = urllib.request.Request(url, headers={"User-Agent": self.ua, "Accept-Language": "ja"})
        try:
            with urllib.request.urlopen(req, timeout=self.timeout) as r:
                return r.status, r.read()
        except urllib.error.HTTPError as e:
            return e.code, b""
        except Exception:
            return 0, b""

    def _wait(self, host, delay):
        gap = max(MIN_WAIT, delay)
        left = self._last.get(host, 0) + gap - time.time()
        if left > 0:
            self.sleep(left)
        self._last[host] = time.time()

    def _rules(self, host, scheme):
        if host not in self._robots:
            self._wait(host, MIN_WAIT)
            status, body = self._get(f"{scheme}://{host}/robots.txt")
            if status in BLOCK_CODES or status == 0:
                self._blocked.add(host)
                raise ShopBlocked(f"{host}: robots.txt が HTTP {status}")
            rp = urllib.robotparser.RobotFileParser()
            if status == 200:
                rp.parse(body.decode("utf-8", errors="replace").splitlines())
            else:  # 404 などは制限なしとして扱う
                rp.parse([])
            self._robots[host] = rp
        return self._robots[host]

    def fetch(self, url):
        """取得して本文を返す。拒否・禁止なら ShopBlocked を出す（再試行しない）"""
        p = urllib.parse.urlsplit(url)
        # 日本語を含むURLは送れる形に変換する
        url = urllib.parse.urlunsplit((p.scheme, p.netloc, urllib.parse.quote(p.path, safe="/%"),
                                       urllib.parse.quote(p.query, safe="=&%+"), ""))
        if p.netloc in self._blocked:
            raise ShopBlocked(p.netloc + ": 本日は停止中")
        rp = self._rules(p.netloc, p.scheme)
        if not rp.can_fetch(self.ua, url):
            raise ShopBlocked(url + ": robots.txt で拒否")
        self._wait(p.netloc, int(rp.crawl_delay(self.ua) or 0))
        status, body = self._get(url)
        if status in BLOCK_CODES or status == 0:
            self._blocked.add(p.netloc)
            raise ShopBlocked(f"{url}: HTTP {status}")
        if status != 200:
            raise RuntimeError(f"{url}: HTTP {status}")
        return body
