"""精度分析の計測（読み取り専用）。使い方: python3 -I reports/accuracy_metrics.py data/pokeca.db 2026-10-10"""
import sqlite3, statistics as st, sys
from collections import Counter, defaultdict
db, D = sys.argv[1], sys.argv[2]
c = sqlite3.connect(f"file:{db}?mode=ro", uri=True)
P = defaultdict(dict)
for cid, s, p, so, bo, stk in c.execute("SELECT card_id, shop_id, price, soldout, boosted, struck_price FROM price WHERE day=?", (D,)):
    P[cid][s] = (p, so, bo, stk)
key = dict(c.execute("SELECT id, match_key FROM card"))
state = dict(c.execute("SELECT card_id, state FROM daily WHERE day=?", (D,)))
nc = {cid: {s: x for s, x in v.items() if s != "champion"} for cid, v in P.items()}
valid = {cid: [x[0] for x in v.values() if not x[1] and x[0] > 0] for cid, v in nc.items()}

print("M1 価格帯別（チャンピオン以外の店の最高価格で区分）：枚数／2店以上の有効価格がある割合")
for lo, hi in [(0, 100), (100, 500), (500, 1000), (1000, 5000), (5000, 30000), (30000, 10**9)]:
    sel = [cid for cid, v in nc.items() if v and lo <= max(x[0] for x in v.values()) < hi]
    k = sum(len(valid[cid]) >= 2 for cid in sel)
    print(f"  {lo}〜{hi}円: {len(sel)}枚 / {k}枚 ({100*k/len(sel):.0f}%)")

print("M2 3万円以上で中央値が出ない理由（チャンピオンのみのカードは除く）")
r = Counter()
for cid, v in nc.items():
    if not v or max(x[0] for x in v.values()) < 30000 or len(valid[cid]) >= 2:
        continue
    if len(v) >= 2:
        r["他店の価格がSOLDOUT"] += 1
    else:
        k = key.get(cid) or ""
        r["1店のみ・" + ("プロモ" if k.startswith("promo") else "照合キーなし" if not k else "他店に該当なし")] += 1
print("  ", r.most_common())

d = [x for v in P.values() for s, x in v.items() if s == "dorasuta"]
print(f"M3 ドラゴンスターのSOLDOUT率 全体{sum(x[1] for x in d)/len(d):.0%}、1万円以上{sum(x[1] for x in d if x[0]>=10000)/sum(1 for x in d if x[0]>=10000):.0%}")
y = [x for v in P.values() for s, x in v.items() if s == "yuyutei"]
print(f"M4 遊々亭の強化買取（取り消し線あり）の割合 {sum(x[2] for x in y)/len(y):.0%}")

def summ(rs):
    rs = sorted(rs); q = lambda p: rs[int(p*(len(rs)-1))]
    return f"n={len(rs)} 中央値{q(.5):.2f} 四分位{q(.25):.2f}〜{q(.75):.2f} 2倍以上の差{sum(x>=2 or x<=.5 for x in rs)} 5倍以上{sum(x>=5 or x<=.2 for x in rs)}"
def ratios(a, b, f=lambda v: True, ia=0):
    return [v[a][ia]/v[b][0] for v in nc.values() if a in v and b in v and not v[a][1] and not v[b][1] and v[a][ia] and v[b][0] > 0 and f(v)]
print("M5 店どうしの価格比（両方SOLDOUTでない同一カード）")
for a, b in [("yuyutei", "dorasuta"), ("yuyutei", "goldenhobby"), ("dorasuta", "goldenhobby")]:
    print(f"  {a}/{b}: {summ(ratios(a, b))}")
print(f"  遊々亭が強化中/ドラゴンスター: {summ(ratios('yuyutei','dorasuta',lambda v: v['yuyutei'][2]))}")
print(f"  遊々亭が強化なし/ドラゴンスター: {summ(ratios('yuyutei','dorasuta',lambda v: not v['yuyutei'][2]))}")
print(f"  遊々亭の取り消し線価格/ドラゴンスター: {summ(ratios('yuyutei','dorasuta',lambda v: v['yuyutei'][3],ia=3))}")

ch = []
for cid, v in nc.items():
    val = {s: x[0] for s, x in v.items() if not x[1] and x[0] > 0}
    if len(val) == 3:
        m = st.median(val.values())
        ch += [abs(st.median([p for t, p in val.items() if t != s])/m - 1) for s in val]
ch.sort(); q = lambda p: ch[int(p*(len(ch)-1))]
print(f"M6 3店そろいから1店が抜けたときの中央値の変化: n={len(ch)} 中央値{q(.5):.0%} 90%点{q(.9):.0%} 10%以上{sum(x>=.1 for x in ch)/len(ch):.0%} 30%以上{sum(x>=.3 for x in ch)/len(ch):.0%}")
print("M7 状態の内訳", Counter(state.values()))
print("M8 ゴールデンホビーの非カード行（『その他』のルール行）", c.execute("SELECT count(*) FROM raw_price WHERE shop='goldenhobby' AND day=? AND name LIKE 'その他%'", (D,)).fetchone()[0])
