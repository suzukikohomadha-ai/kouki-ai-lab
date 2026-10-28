#!/usr/bin/env python3
"""learningBOX 受講動画の一括取得・文字起こしツール（T227）

オーナーの許可を得た講座だけを対象にする。社長のPC上で実行する前提で、
ID・パスワード・ログイン状態・取得データはすべて PC の中（.env / work/ / output/）に残す。

  python lbt.py login                 # ブラウザでログインし、ログイン状態を保存
  python lbt.py crawl  --start URL    # 講座ページを巡回して動画URLを収集（自動）
  python lbt.py capture               # 自分で動画を再生しながら動画URLを収集（手動）
  python lbt.py download              # 収集した動画を保存（既定は音声のみ）
  python lbt.py transcribe            # 保存した音声を文字起こし
  python lbt.py all --start URL       # crawl → download → transcribe を一気に
"""
from __future__ import annotations

import argparse
import json
import os
import re
import sys
import time
from collections import deque
from pathlib import Path
from urllib.parse import urldefrag, urljoin, urlparse

HERE = Path(__file__).resolve().parent
WORK = HERE / "work"
OUTPUT = HERE / "output"
AUTH_FILE = WORK / "auth.json"
COOKIES_FILE = WORK / "cookies.txt"
MEDIA_FILE = WORK / "media.jsonl"
AUDIO_DIR = OUTPUT / "audio"
TEXT_DIR = OUTPUT / "text"

DEFAULT_LOGIN_URL = "https://ai-skill.learningbox.online/index.php?action=login"
MEDIA_RE = re.compile(r"\.(m3u8|mpd|mp4|m4a|m4v|webm|mov|mp3)$", re.I)
# 巡回で絶対に踏まないリンク（ログアウト・削除・解答送信など）
DEFAULT_EXCLUDE = r"logout|signout|log_out|delete|remove|unregist|withdraw|submit|answer|mailto:|javascript:"
DOC_EXT_RE = re.compile(r"\.(pdf|zip|docx?|xlsx?|pptx?|png|jpe?g|gif|svg|css|js)(\?|$)", re.I)

# 暗号化DRM（EME）の使用を検知するためのフック。DRMの解除はしない。
DRM_HOOK = """
(() => {
  if (!navigator.requestMediaKeySystemAccess) return;
  const orig = navigator.requestMediaKeySystemAccess.bind(navigator);
  navigator.requestMediaKeySystemAccess = (...a) => { window.__lbtDrm = true; return orig(...a); };
})();
"""


def log(msg: str) -> None:
    print(msg, flush=True)


def load_env() -> None:
    try:
        from dotenv import load_dotenv
    except ImportError:
        return
    load_dotenv(HERE / ".env")


def safe_name(text: str, limit: int = 60) -> str:
    text = re.sub(r"[\\/:*?\"<>|\r\n\t]+", " ", text or "").strip()
    text = re.sub(r"\s+", "_", text)
    return (text[:limit] or "untitled").rstrip("._")


def require_auth() -> None:
    if not AUTH_FILE.exists():
        sys.exit("ログイン状態がありません。先に `python lbt.py login` を実行してください。")


def read_media() -> list[dict]:
    if not MEDIA_FILE.exists():
        return []
    with MEDIA_FILE.open(encoding="utf-8") as f:
        return [json.loads(line) for line in f if line.strip()]


def append_media(item: dict) -> None:
    WORK.mkdir(parents=True, exist_ok=True)
    with MEDIA_FILE.open("a", encoding="utf-8") as f:
        f.write(json.dumps(item, ensure_ascii=False) + "\n")


# ---------------------------------------------------------------- login

def cmd_login(args) -> None:
    from playwright.sync_api import sync_playwright

    load_env()
    login_url = os.getenv("LB_LOGIN_URL") or DEFAULT_LOGIN_URL
    login_id = os.getenv("LB_LOGIN_ID", "")
    password = os.getenv("LB_PASSWORD", "")
    WORK.mkdir(parents=True, exist_ok=True)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False, executable_path=os.getenv("LBT_CHROMIUM_PATH") or None)
        context = browser.new_context()
        page = context.new_page()
        page.goto(login_url)

        if login_id and password:
            try:
                pw = page.locator("input[type=password]").first
                user = page.locator(
                    "input[type=text], input[type=email], input:not([type])"
                ).first
                user.fill(login_id)
                pw.fill(password)
                pw.press("Enter")
                log("ID・パスワードを自動入力しました。")
            except Exception as e:  # 画面構成が想定と違う場合は手動に切り替える
                log(f"自動入力できませんでした（{e.__class__.__name__}）。ブラウザで手動ログインしてください。")
        else:
            log("開いたブラウザでログインしてください。")

        input("ログインが終わり、講座の画面が表示されたら Enter を押してください…")
        context.storage_state(path=str(AUTH_FILE))
        browser.close()
    log(f"ログイン状態を保存しました → {AUTH_FILE}")


# ---------------------------------------------------------------- 収集の共通処理

class Collector:
    """ページ上で流れた動画URLを拾い、media.jsonl に記録する。"""

    def __init__(self):
        known = read_media()
        self.seen_media = {m["media_url"] for m in known}
        # HLS はページごとに最初の .m3u8（＝マスター）だけで足りる。以降の画質別リストは拾わない。
        self.hls_pages = {m["page_url"] for m in known if urlparse(m["media_url"]).path.lower().endswith(".m3u8")}
        self.pending: list[tuple[str, object]] = []

    def on_request(self, request) -> None:
        if MEDIA_RE.search(urlparse(request.url).path):
            try:
                owner = request.frame.page
            except Exception:
                owner = None
            self.pending.append((request.url, owner))

    def flush(self, page, page_url: str) -> int:
        """拾った動画URLを、そのページのタイトルと紐づけて記録する。"""
        found = [u for u, owner in self.pending if owner is page or owner is None]
        self.pending = [(u, o) for u, o in self.pending if not (o is page or o is None)]
        drm = False
        for frame in page.frames:
            try:
                srcs = frame.evaluate(
                    """() => [...document.querySelectorAll('video, video source, audio, audio source')]
                         .map(e => e.currentSrc || e.src).filter(s => s && !s.startsWith('blob:'))"""
                )
                found += srcs
                drm = drm or bool(frame.evaluate("() => !!window.__lbtDrm"))
            except Exception:
                pass

        picked = []
        for url in found:
            if urlparse(url).path.lower().endswith(".m3u8"):
                if page_url in self.hls_pages:
                    continue
                self.hls_pages.add(page_url)
            picked.append(url)

        title = page_title(page)
        added = 0
        for url in picked:
            key = urldefrag(url)[0]
            if key in self.seen_media:
                continue
            self.seen_media.add(key)
            append_media({
                "page_url": page_url,
                "title": title,
                "media_url": key,
                "drm": drm,
                "found_at": time.strftime("%Y-%m-%d %H:%M:%S"),
            })
            added += 1
            log(f"  🎬 {title} → {key[:100]}{' [DRM検知]' if drm else ''}")
        return added


def page_title(page) -> str:
    for frame in page.frames:
        try:
            t = frame.evaluate(
                """() => { const h = document.querySelector('h1, h2, .title, .content-title');
                          return h ? h.innerText.trim() : ''; }"""
            )
            if t:
                return t.splitlines()[0][:80]
        except Exception:
            pass
    try:
        return page.title() or "untitled"
    except Exception:
        return "untitled"


def try_play(page, wait_sec: float) -> None:
    """ページ内（iframe含む）の動画を、ミュートで再生して通信を発生させる。"""
    for frame in page.frames:
        try:
            frame.evaluate(
                """() => document.querySelectorAll('video, audio').forEach(v => {
                     v.muted = true; const r = v.play(); if (r && r.catch) r.catch(() => {}); })"""
            )
        except Exception:
            pass
    page.wait_for_timeout(int(wait_sec * 1000))


def new_context(p, headed: bool):
    browser = p.chromium.launch(headless=not headed, executable_path=os.getenv("LBT_CHROMIUM_PATH") or None)
    context = browser.new_context(storage_state=str(AUTH_FILE))
    context.add_init_script(DRM_HOOK)
    return browser, context


def still_logged_in(page) -> bool:
    return "action=login" not in page.url


# ---------------------------------------------------------------- crawl（自動巡回）

def cmd_crawl(args) -> None:
    from playwright.sync_api import sync_playwright

    require_auth()
    start = args.start
    host = urlparse(start).netloc
    exclude = re.compile(args.exclude, re.I)
    include = re.compile(args.include, re.I) if args.include else None

    queue = deque([(start, 0)])
    visited: set[str] = set()
    total = 0
    with sync_playwright() as p:
        browser, context = new_context(p, args.headed)
        collector = Collector()
        context.on("request", collector.on_request)
        page = context.new_page()

        while queue and len(visited) < args.max_pages:
            url, depth = queue.popleft()
            url = urldefrag(url)[0]
            if url in visited:
                continue
            visited.add(url)
            log(f"[{len(visited)}/{args.max_pages}] {url}")
            try:
                page.goto(url, wait_until="networkidle", timeout=45000)
            except Exception as e:
                log(f"  ⚠ 開けませんでした（{e.__class__.__name__}）")
                continue
            if not still_logged_in(page):
                log("ログインが切れました。`python lbt.py login` をやり直してから再実行してください。")
                break

            try_play(page, args.wait)
            total += collector.flush(page, url)

            if depth < args.depth:
                hrefs = []
                for frame in page.frames:
                    try:
                        hrefs += frame.evaluate("() => [...document.querySelectorAll('a[href]')].map(a => a.href)")
                    except Exception:
                        pass
                for h in hrefs:
                    h = urldefrag(urljoin(url, h))[0]
                    if (urlparse(h).netloc != host or h in visited or exclude.search(h)
                            or DOC_EXT_RE.search(h) or (include and not include.search(h))):
                        continue
                    queue.append((h, depth + 1))
            time.sleep(args.delay)

        context.storage_state(path=str(AUTH_FILE))
        browser.close()
    log(f"巡回完了：{len(visited)}ページを確認、動画URLを新たに{total}件記録 → {MEDIA_FILE}")
    if total == 0:
        log("見つからない場合は `python lbt.py capture`（自分で再生して記録）を試してください。")


# ---------------------------------------------------------------- capture（手動）

def cmd_capture(args) -> None:
    from playwright.sync_api import sync_playwright

    require_auth()
    with sync_playwright() as p:
        browser, context = new_context(p, headed=True)
        collector = Collector()
        context.on("request", collector.on_request)
        page = context.new_page()
        page.goto(args.start or DEFAULT_LOGIN_URL.split("?")[0])
        log("ブラウザで動画を1本ずつ開いて、数秒再生してください。記録した動画はここに表示されます。")
        log("終わったら、このウィンドウで Ctrl+C を押してください。")
        total = 0
        try:
            while True:
                page.wait_for_timeout(2000)
                for pg in context.pages:
                    if any(o is pg for _, o in collector.pending):
                        total += collector.flush(pg, pg.url)
        except KeyboardInterrupt:
            pass
        try:
            context.storage_state(path=str(AUTH_FILE))
            browser.close()
        except Exception:
            pass
    log(f"記録完了：動画URLを新たに{total}件 → {MEDIA_FILE}")


# ---------------------------------------------------------------- download

def export_cookies() -> Path:
    """Playwright のログイン状態を yt-dlp が読める cookies.txt（Netscape形式）に変換する。"""
    state = json.loads(AUTH_FILE.read_text(encoding="utf-8"))
    lines = ["# Netscape HTTP Cookie File"]
    for c in state.get("cookies", []):
        domain = c["domain"]
        lines.append("\t".join([
            domain,
            "TRUE" if domain.startswith(".") else "FALSE",
            c.get("path", "/"),
            "TRUE" if c.get("secure") else "FALSE",
            str(int(c["expires"])) if c.get("expires", -1) > 0 else "0",
            c["name"],
            c["value"],
        ]))
    COOKIES_FILE.write_text("\n".join(lines) + "\n", encoding="utf-8")
    return COOKIES_FILE


def cmd_download(args) -> None:
    import yt_dlp

    require_auth()
    items = read_media()
    if not items:
        sys.exit("動画URLがまだありません。先に crawl か capture を実行してください。")
    cookies = export_cookies()
    AUDIO_DIR.mkdir(parents=True, exist_ok=True)

    ok, skipped, failed = 0, 0, []
    done_pages: set[str] = set()
    order: dict[str, int] = {}
    for item in items:
        order.setdefault(item["page_url"], len(order) + 1)
    for item in items:
        stem = f"{order[item['page_url']]:03d}_{safe_name(item['title'])}"
        if item["page_url"] in done_pages:
            continue  # 同じページの2本目以降（同じ動画の別画質など）は飛ばす
        if item.get("drm"):
            log(f"⏭ {stem}：DRM（コピーガード）を検知したため保存しません。オーナーさんに元動画の共有を依頼してください。")
            skipped += 1
            continue
        if list(AUDIO_DIR.glob(stem + ".*")):
            log(f"⏭ {stem}：保存済み")
            done_pages.add(item["page_url"])
            continue

        opts = {
            "cookiefile": str(cookies),
            "http_headers": {"Referer": item["page_url"]},
            "outtmpl": str(AUDIO_DIR / (stem + ".%(ext)s")),
            "quiet": True,
            "no_warnings": True,
            "noprogress": True,
            "retries": 3,
        }
        if args.video:
            opts["format"] = "bestvideo*+bestaudio/best"
        else:
            opts["format"] = "bestaudio/best"
            opts["postprocessors"] = [{"key": "FFmpegExtractAudio", "preferredcodec": "m4a"}]

        log(f"⬇ {stem}")
        try:
            with yt_dlp.YoutubeDL(opts) as ydl:
                ydl.download([item["media_url"]])
            ok += 1
            done_pages.add(item["page_url"])
        except Exception as e:
            msg = str(e).splitlines()[0][:160]
            log(f"  ⚠ 失敗：{msg}")
            if "403" in msg or "expired" in msg.lower():
                log("  → URLの有効期限切れの可能性。`python lbt.py all --start ...` で巡回直後に保存してください。")
            if "DRM" in msg:
                log("  → DRM保護のため保存できません（解除はしません）。")
            failed.append(stem)
        time.sleep(args.delay)

    log(f"保存完了：成功{ok}件／スキップ{skipped}件／失敗{len(failed)}件 → {AUDIO_DIR}")
    if failed:
        log("失敗：" + ", ".join(failed))


# ---------------------------------------------------------------- transcribe

def fmt_ts(sec: float) -> str:
    ms = int(round(sec * 1000))
    h, ms = divmod(ms, 3600000)
    m, ms = divmod(ms, 60000)
    s, ms = divmod(ms, 1000)
    return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"


def cmd_transcribe(args) -> None:
    from faster_whisper import WhisperModel

    files = sorted(f for f in AUDIO_DIR.glob("*") if f.suffix.lower() in
                   {".m4a", ".mp3", ".mp4", ".webm", ".wav", ".mkv", ".mov", ".aac", ".opus"})
    if args.input:
        files = sorted(Path(x) for x in args.input)
    if not files:
        sys.exit(f"音声ファイルがありません（{AUDIO_DIR}）。先に download を実行してください。")
    TEXT_DIR.mkdir(parents=True, exist_ok=True)

    log(f"文字起こしモデル {args.model} を読み込み中…（初回はダウンロードに時間がかかります）")
    model = WhisperModel(args.model, device=args.device, compute_type=args.compute_type)
    for f in files:
        txt_path = TEXT_DIR / (f.stem + ".txt")
        if txt_path.exists():
            log(f"⏭ {f.name}：文字起こし済み")
            continue
        log(f"📝 {f.name}")
        t0 = time.time()
        segments, info = model.transcribe(str(f), language=args.language, vad_filter=True, beam_size=5)
        texts, srt = [], []
        for n, seg in enumerate(segments, 1):
            line = seg.text.strip()
            texts.append(line)
            srt += [str(n), f"{fmt_ts(seg.start)} --> {fmt_ts(seg.end)}", line, ""]
        (TEXT_DIR / (f.stem + ".srt")).write_text("\n".join(srt), encoding="utf-8")
        txt_path.write_text("\n".join(texts) + "\n", encoding="utf-8")
        log(f"  ✅ {len(texts)}行・音声{info.duration/60:.1f}分・処理{(time.time()-t0)/60:.1f}分")
    log(f"文字起こし完了 → {TEXT_DIR}")


# ---------------------------------------------------------------- main

def main() -> None:
    ap = argparse.ArgumentParser(description="learningBOX 受講動画の一括取得・文字起こし")
    sub = ap.add_subparsers(dest="cmd", required=True)

    sub.add_parser("login", help="ブラウザでログインし、ログイン状態を保存")

    def crawl_opts(sp):
        sp.add_argument("--start", required=True, help="巡回を始めるURL（講座一覧やコースのページ）")
        sp.add_argument("--depth", type=int, default=3, help="リンクをたどる深さ（既定3）")
        sp.add_argument("--max-pages", type=int, default=150, help="巡回する最大ページ数（既定150）")
        sp.add_argument("--wait", type=float, default=6, help="各ページで動画の通信を待つ秒数（既定6）")
        sp.add_argument("--include", help="このパターンを含むURLだけたどる（正規表現・任意）")
        sp.add_argument("--exclude", default=DEFAULT_EXCLUDE, help="たどらないURLのパターン（正規表現）")
        sp.add_argument("--headed", action="store_true", help="巡回の様子をブラウザで表示する")

    def dl_opts(sp):
        sp.add_argument("--video", action="store_true", help="音声だけでなく動画ごと保存する")

    def tr_opts(sp):
        sp.add_argument("--model", default="large-v3", help="Whisperモデル（large-v3 / medium / small）")
        sp.add_argument("--language", default="ja")
        sp.add_argument("--device", default="auto", help="auto / cpu / cuda")
        sp.add_argument("--compute-type", default="int8", help="int8（CPU向け）/ float16（GPU向け）")

    sp = sub.add_parser("crawl", help="講座ページを自動巡回して動画URLを収集")
    crawl_opts(sp)
    sp.add_argument("--delay", type=float, default=1.5, help="ページ間の待ち秒数（サーバー負荷対策）")

    sp = sub.add_parser("capture", help="自分で再生しながら動画URLを収集")
    sp.add_argument("--start", help="最初に開くURL")

    sp = sub.add_parser("download", help="収集した動画を保存")
    dl_opts(sp)
    sp.add_argument("--delay", type=float, default=3, help="1本ごとの待ち秒数（サーバー負荷対策）")

    sp = sub.add_parser("transcribe", help="保存した音声を文字起こし")
    tr_opts(sp)
    sp.add_argument("input", nargs="*", help="対象ファイル（省略時は output/audio の全ファイル）")

    sp = sub.add_parser("all", help="crawl → download → transcribe を連続実行")
    crawl_opts(sp)
    dl_opts(sp)
    tr_opts(sp)
    sp.add_argument("--delay", type=float, default=2, help="待ち秒数（サーバー負荷対策）")

    args = ap.parse_args()
    if args.cmd == "login":
        cmd_login(args)
    elif args.cmd == "crawl":
        cmd_crawl(args)
    elif args.cmd == "capture":
        cmd_capture(args)
    elif args.cmd == "download":
        cmd_download(args)
    elif args.cmd == "transcribe":
        cmd_transcribe(args)
    elif args.cmd == "all":
        args.input = []
        cmd_crawl(args)
        cmd_download(args)
        cmd_transcribe(args)


if __name__ == "__main__":
    main()
