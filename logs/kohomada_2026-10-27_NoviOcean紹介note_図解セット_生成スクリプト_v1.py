# NoviOcean紹介note記事（入稿用本文v7）用の図解・表の画像セット
# 使い方: python3 -I このファイル <NotoSansJP.ttf> <出力ディレクトリ>
# 記載内容は記事v7の本文・出典の範囲のみ（確認日 2026年10月17日）
import sys, os
from PIL import Image, ImageDraw, ImageFont

FONT, OUT = sys.argv[1], sys.argv[2]
W = 1280
NAVY = (8, 30, 58); AQUA = (30, 140, 190); PALE = (232, 243, 249); GREY = (110, 122, 135)
LINE = (205, 216, 226); WHITE = (255, 255, 255); SAND = (250, 246, 236); AMBER = (190, 120, 20)
SRC = '出典：NoviOcean AB 公式サイト（確認日 2026年10月17日）をもとに株式会社コホマダ作成'

def F(size, weight='Regular'):
    f = ImageFont.truetype(FONT, size); f.set_variation_by_name(weight); return f

import re as _re
def wrap(d, text, font, width):
    # 英数字の語（メールアドレス・社名など）は途中で折り返さない
    lines = []
    for para in text.split('\n'):
        cur = ''
        for tok in _re.findall(r'[A-Za-z0-9@._,\-]+|.', para):
            if d.textlength(cur + tok, font=font) > width and cur.strip():
                lines.append(cur.rstrip()); cur = tok.lstrip()
            else:
                cur += tok
        lines.append(cur)
    return lines

def text_block(d, xy, text, font, width, fill, gap=8):
    x, y = xy
    for ln in wrap(d, text, font, width):
        d.text((x, y), ln, font=font, fill=fill)
        y += font.size + gap
    return y

def block_h(d, text, font, width, gap=8):
    return len(wrap(d, text, font, width)) * (font.size + gap)

def canvas(h):
    im = Image.new('RGB', (W, h), WHITE); return im, ImageDraw.Draw(im)

def header(d, title, sub):
    d.text((60, 40), title, font=F(38, 'Bold'), fill=NAVY)
    return text_block(d, (60, 96), sub, F(19), W - 120, GREY) + 10

def footer_h(notes):
    tmp = ImageDraw.Draw(Image.new('RGB', (W, 10)))
    return sum(block_h(tmp, t, F(17), W - 120, 10) for t in notes)

def footer(d, h, notes):
    y = h - 36 - footer_h(notes)
    for i, t in enumerate(notes):
        last = i == len(notes) - 1
        y = text_block(d, (60, y), t, F(17, 'Light' if last else 'Regular'), W - 120, GREY if last else NAVY, 10)

def arrow_down(d, cx, y1, y2, col=AQUA):
    d.line([(cx, y1), (cx, y2 - 10)], fill=col, width=4)
    d.polygon([(cx - 9, y2 - 14), (cx + 9, y2 - 14), (cx, y2)], fill=col)

def arrow_right(d, x1, x2, cy, col=AQUA):
    d.line([(x1, cy), (x2 - 12, cy)], fill=col, width=5)
    d.polygon([(x2 - 16, cy - 11), (x2 - 16, cy + 11), (x2, cy)], fill=col)

def save(im, name):
    im.save(os.path.join(OUT, name), 'PNG', optimize=True)

# ---------- 図A 仕組み ----------
def fig_mechanism():
    h = 920; im, d = canvas(h)
    y = header(d, 'Medi Wave 850Hの仕組み（模式図）', '一つの浮体（海に浮かぶ台）の上に、波・風・太陽の3種類の発電設備を載せる設計です。以下は同社の説明に基づきます。')
    # platform band
    py = y + 10
    d.rounded_rectangle([60, py, W - 60, py + 54], radius=10, fill=NAVY)
    t = '一つの浮体（プラットフォーム）'; f = F(24, 'Bold')
    d.text(((W - d.textlength(t, font=f)) / 2, py + 12), t, font=f, fill=WHITE)
    cy = py + 80; cw = (W - 120 - 40) / 3; ch = 440
    cols = [
        ('波', ['浮体の側面にある独立したフロート（浮き）が、波を受けて動く', '油圧シリンダーを駆動する', 'その圧力でペルトン水車と発電機を回す'],
         '同社によると、水中に歯車箱（ギアボックス）や発電機を置かない設計です'),
        ('風', ['浮体の上に、垂直軸型の風車（羽根が縦の軸で回るタイプ）を並べる'], '同社によると、Wind Harvest社の技術を採用しています'),
        ('太陽', ['デッキに、軽くて曲げられるCIGS太陽電池（薄膜型の太陽電池の一種）を敷く'], '同社によると、スウェーデンのMidsummer社の技術を採用しています'),
    ]
    for i, (lab, steps, note) in enumerate(cols):
        x = 60 + i * (cw + 20)
        d.rounded_rectangle([x, cy, x + cw, cy + ch], radius=12, fill=PALE, outline=LINE, width=2)
        fl = F(30, 'Bold'); d.text((x + 24, cy + 18), lab, font=fl, fill=AQUA)
        sy = cy + 72; bw = cw - 48
        for k, s in enumerate(steps):
            bh = block_h(d, s, F(19), bw - 28) + 18
            d.rounded_rectangle([x + 24, sy, x + 24 + bw, sy + bh], radius=8, fill=WHITE, outline=LINE)
            text_block(d, (x + 38, sy + 10), s, F(19), bw - 28, NAVY)
            sy += bh
            if k < len(steps) - 1:
                arrow_down(d, x + 24 + bw / 2, sy + 4, sy + 30); sy += 34
        text_block(d, (x + 24, cy + ch - block_h(d, note, F(17), bw) - 16), note, F(17), bw, GREY)
    # bottom numbers
    by = cy + ch + 24
    d.rounded_rectangle([60, by, W - 60, by + 70], radius=10, fill=SAND)
    text_block(d, (84, by + 10), '1基あたりの定格出力：合計850kW（同社の推定値）　／　年間発電量：約2,500MWh（同社の試算。代表的な試算値で、実際は設置場所によって変わります）', F(19, 'Medium'), W - 168, NAVY)
    footer(d, h, ['同社の説明に基づく模式図で、実際の設計・形状を示すものではありません。同社は、海上での統合と最終的な構成には今後の設計と検証が必要としています。', SRC])
    save(im, '図1_仕組み.png')

# ---------- 図B インフラ一本化 ----------
def fig_infra():
    h = 700; im, d = canvas(h)
    y = header(d, '海の上のインフラを一つにまとめる狙い（同社の考え方）', '波・風・太陽を別々に整備すれば3つのプロジェクトになるところを、一つにまとめることを同社は狙っています。')
    items = ['浮体', '係留', '送電ケーブル', '許認可', '設置']
    lx, rx = 60, 700; top = y + 20
    d.text((lx, top), '別々に整備する場合', font=F(24, 'Bold'), fill=GREY)
    d.text((rx, top), 'Medi Wave 850Hの考え方', font=F(24, 'Bold'), fill=AQUA)
    fc = F(17, 'Medium')
    def chips(x, yy, col, bg):
        cx = x
        for it in items:
            w = d.textlength(it, font=fc) + 22
            d.rounded_rectangle([cx, yy, cx + w, yy + 34], radius=6, fill=bg, outline=col)
            d.text((cx + 11, yy + 6), it, font=fc, fill=col); cx += w + 8
        return cx
    yy = top + 50
    for src in ['波力', '風力', '太陽光']:
        d.rounded_rectangle([lx, yy, lx + 540, yy + 104], radius=10, outline=LINE, width=2)
        d.text((lx + 16, yy + 12), src + 'のプロジェクト', font=F(20, 'Bold'), fill=NAVY)
        chips(lx + 16, yy + 54, GREY, WHITE); yy += 118
    ry = top + 50 + 118
    d.rounded_rectangle([rx, ry - 60, W - 60, ry + 164], radius=12, fill=PALE, outline=AQUA, width=3)
    d.text((rx + 20, ry - 46), '波・風・太陽を一つの浮体で', font=F(22, 'Bold'), fill=NAVY)
    chips(rx + 20, ry + 4, AQUA, WHITE)
    text_block(d, (rx + 20, ry + 60), '浮体も係留も送電ケーブルも許認可も設置も「一つ」にまとめることを狙う（同社の説明）', F(18), W - 60 - rx - 40, NAVY)
    arrow_right(d, lx + 560, rx - 20, ry + 52)
    footer(d, h, ['同社の説明に基づく模式図です。日本での許認可・海域の占用・漁業関係者との調整等の扱いは、候補地ごとに個別の確認が必要です。', SRC])
    save(im, '図2_インフラ一本化.png')

# ---------- 表C 主な数値の性格 ----------
def tbl_numbers():
    rows = [('定格出力（1基あたり）', '合計850kW', '同社の推定値'),
            ('年間発電量（1基あたり）', '約2,500MWh', '同社の試算（代表的な試算値で、特定の島の予測ではない）'),
            ('同じ広さの海域から得られるエネルギー', '洋上風力のおよそ2倍', '同社の試算（モデル計算。前提条件は公開情報で確認できていない）'),
            ('通常運転を想定する波高', '0.5〜5m', '同社の設計目標値'),
            ('設置水深', '20〜200m', '同社シミュレーターページの記載')]
    return table('記事に出てくる主な数値と、その性格', 'いずれもNoviOceanの公表値で、実測値ではありません。実際の値は設置場所によって変わります。',
                 ['項目', '数値', '数値の性格'], [330, 260, 570], rows, '表_主な数値.png',
                 ['候補地ごとの評価には、波・水深などのデータによる個別の検討が必要です。', SRC])

# ---------- 表D 用途 ----------
def tbl_uses():
    rows = [('離島・沿岸の地域', '燃料そのものの代金に加え、運搬・取り扱い・貯蔵などの費用もかかる', '離島の自治体、地域新電力、島の電力供給に関わる事業者'),
            ('養殖', '電力網がない、または弱い場所が多く、ディーゼル燃料に頼りがち', '水産・養殖事業者'),
            ('沿岸データセンター', '電力需要の伸びに、陸上の送電網への接続整備が追いついていない', 'データセンターを運営・計画する事業者'),
            ('海水淡水化', '「真水は、何よりもまずエネルギーの産物」。電気として使うか造水に使うかは二者択一', '淡水化設備を運営・計画する事業者')]
    return table('同社が優先する4つの用途', '各用途の課題は、同社の説明に基づきます。右列は、日本でご相談をいただきたい方の例です。',
                 ['用途', '同社が挙げる課題', 'ご相談をいただきたい方（例）'], [250, 560, 350], rows, '表_優先4用途.png',
                 ['同社は優先4用途を含め全体で約12の用途を挙げており、ほかに港湾、洋上風力との併設、水素製造などが含まれます。導入パートナー（商社・エンジニアリング会社・建設会社など）からのご相談も歓迎します。', SRC])

# ---------- 表E 確認ポイント ----------
def tbl_checks():
    rows = [('海域の条件', '同社は通常運転を波高0.5〜5mで想定（設計目標値）、設置水深は20〜200m（シミュレーターページの記載）。候補地ごとに波や水深などのデータで個別に評価する必要があります'),
            ('制度', '再エネ海域利用法（現題名「海洋再生可能エネルギー発電設備の整備に関する法律」）は、対象エネルギー源を施行令で「海域における風力」と定めています。波力・太陽光は含まれず、一体型設備の扱いは確認できていません'),
            ('その他の手続き', '日本の海域に設置する場合の占用の手続き、漁業関係者との調整、電気事業法等の扱いも、候補地ごとに確認が必要です'),
            ('費用', '本体価格・導入費用は公表されていません。設置条件等により異なるため、個別のご相談となります')]
    return table('日本で検討する際に、確認が必要なこと', '導入できるかどうかも含め、候補地の評価や制度上の扱いの確認によって変わります。',
                 ['項目', '現時点で分かっていること・確認が必要なこと'], [250, 910], rows, '表_確認ポイント.png',
                 ['制度の記載は e-Gov法令検索（確認日 2026年10月17日）による。法的な結論を示すものではありません。', SRC])

def table(title, sub, heads, widths, rows, name, notes):
    tmp = Image.new('RGB', (W, 10)); td = ImageDraw.Draw(tmp)
    fb = F(19); fh = F(19, 'Bold'); pad = 16
    rh = [max(block_h(td, c, fh if j == 0 else fb, widths[j] - 2 * pad) for j, c in enumerate(r)) + 2 * pad - 8 for r in rows]
    sub_h = block_h(td, sub, F(19), W - 120)
    nh = sum(block_h(td, n, F(17), W - 120, 13) for n in notes)
    h = 96 + sub_h + 30 + 52 + sum(rh) + 40 + nh + 40
    im, d = canvas(int(h))
    y = header(d, title, sub) + 10
    x0 = 60
    d.rectangle([x0, y, x0 + sum(widths), y + 52], fill=NAVY)
    x = x0
    for j, hd in enumerate(heads):
        d.text((x + pad, y + 13), hd, font=F(20, 'Bold'), fill=WHITE); x += widths[j]
    y += 52
    for i, r in enumerate(rows):
        d.rectangle([x0, y, x0 + sum(widths), y + rh[i]], fill=PALE if i % 2 == 0 else WHITE)
        x = x0
        for j, c in enumerate(r):
            text_block(d, (x + pad, y + pad - 2), c, fh if j == 0 else fb, widths[j] - 2 * pad, NAVY)
            x += widths[j]
        d.line([(x0, y + rh[i]), (x0 + sum(widths), y + rh[i])], fill=LINE, width=1)
        y += rh[i]
    y += 30
    for k, n in enumerate(notes):
        last = k == len(notes) - 1
        y = text_block(d, (60, y), n, F(17, 'Light' if last else 'Regular'), W - 120, GREY if last else NAVY, 13)
    save(im, name)

# ---------- 図F ご相談の流れ ----------
def fig_flow():
    h = 560; im, d = canvas(h)
    y = header(d, 'ご相談の流れ', '「まだ情報収集の段階」でも構いません。流れはご相談の内容により異なります。')
    steps = [('ご相談', 'メールでご連絡ください\n\n宛先：\nkohomadha.keiri\n@gmail.com'),
             ('STEP 1', '公開情報の範囲で情報をお伝えし、あわせて確認したい点をお尋ねします'),
             ('STEP 2', '必要に応じて、オンラインで情報交換をします'),
             ('STEP 3', 'NoviOceanへの照会が必要な場合は、ご了承をいただいた範囲で同社に照会します')]
    n = len(steps); gap = 46; bw = (W - 120 - gap * (n - 1)) / n; top = y + 30; bh = 230
    for i, (lab, txt) in enumerate(steps):
        x = 60 + i * (bw + gap)
        first = i == 0
        d.rounded_rectangle([x, top, x + bw, top + bh], radius=12, fill=AQUA if first else PALE, outline=AQUA, width=2)
        d.text((x + 20, top + 18), lab, font=F(24, 'Bold'), fill=WHITE if first else AQUA)
        text_block(d, (x + 20, top + 66), txt, F(18, 'Medium' if first else 'Regular'), bw - 40, WHITE if first else NAVY)
        if i < n - 1:
            arrow_right(d, x + bw + 6, x + bw + gap - 6, top + bh / 2)
    footer(d, h, ['いただいた情報は、本件のご相談への対応とご連絡のためにのみ利用します。投資・出資に関するお問い合わせの取り次ぎは行っておりません。', '株式会社コホマダ作成'])
    save(im, '図3_ご相談の流れ.png')

os.makedirs(OUT, exist_ok=True)
fig_mechanism(); fig_infra(); tbl_numbers(); tbl_uses(); tbl_checks(); fig_flow()
print('ok')
