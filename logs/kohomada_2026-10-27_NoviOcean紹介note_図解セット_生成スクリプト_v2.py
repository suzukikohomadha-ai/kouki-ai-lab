# NoviOcean紹介note記事（入稿用本文v7）用の図解・表の画像セット v2
# v1からの変更：スマホ表示で読めるよう文字を大きくし（本文30px前後）、図はすべて縦積みのレイアウトに変更
# 使い方: python3 -I このファイル <NotoSansJP.ttf> <出力ディレクトリ>
# 記載内容は記事v7の本文・出典の範囲のみ（確認日 2026年10月17日）
import sys, os, re
from PIL import Image, ImageDraw, ImageFont

FONT, OUT = sys.argv[1], sys.argv[2]
W = 1280; M = 64; CW = W - 2 * M
NAVY = (8, 30, 58); AQUA = (24, 128, 178); PALE = (232, 243, 249); GREY = (96, 108, 122)
LINE = (200, 212, 224); WHITE = (255, 255, 255); SAND = (250, 245, 232)
SRC = '出典：NoviOcean AB 公式サイト（確認日 2026年10月17日）をもとに株式会社コホマダ作成'

def F(size, weight='Regular'):
    f = ImageFont.truetype(FONT, size); f.set_variation_by_name(weight); return f

_m = ImageDraw.Draw(Image.new('RGB', (10, 10)))

def wrap(text, font, width):
    # 英数字の語（メールアドレス・社名など）は途中で折り返さない
    lines = []
    for para in text.split('\n'):
        cur = ''
        for tok in re.findall(r'[A-Za-z0-9@._,\-]+|.', para):
            if _m.textlength(cur + tok, font=font) > width and cur.strip() and tok not in '、。）」』，．,.':
                lines.append(cur.rstrip()); cur = tok.lstrip()
            else:
                cur += tok
        lines.append(cur)
    return lines

def th(text, font, width, gap=10):
    return len(wrap(text, font, width)) * (font.size + gap)

def tb(d, x, y, text, font, width, fill, gap=10):
    for ln in wrap(text, font, width):
        d.text((x, y), ln, font=font, fill=fill); y += font.size + gap
    return y

class Doc:
    """上から順に要素を積み、最後に高さを確定して描画する"""
    def __init__(self, title, sub):
        self.ops = []; self.h = 48
        self.add(th(title, F(52, 'Bold'), CW, 12), lambda d, y: tb(d, M, y, title, F(52, 'Bold'), CW, NAVY, 12))
        self.add(th(sub, F(28), CW) + 24, lambda d, y: tb(d, M, y, sub, F(28), CW, GREY))
    def add(self, h, fn):
        self.ops.append((self.h, fn)); self.h += h
    def gap(self, g): self.h += g
    def notes(self, notes):
        self.gap(20)
        for i, n in enumerate(notes):
            last = i == len(notes) - 1
            f = F(24, 'Light' if last else 'Regular')
            self.add(th(n, f, CW, 8) + 6, lambda d, y, n=n, f=f, last=last: tb(d, M, y, n, f, CW, GREY if last else NAVY, 8))
    def save(self, name):
        im = Image.new('RGB', (W, int(self.h + 48)), WHITE); d = ImageDraw.Draw(im)
        for y, fn in self.ops: fn(d, y)
        im.save(os.path.join(OUT, name), 'PNG', optimize=True)

def arrow_down(d, cx, y1, y2, col=AQUA):
    d.line([(cx, y1), (cx, y2 - 14)], fill=col, width=6)
    d.polygon([(cx - 14, y2 - 20), (cx + 14, y2 - 20), (cx, y2)], fill=col)

def card(doc, label, body, note=None, fill=PALE, outline=LINE, lab_col=AQUA, body_col=NAVY, lab_w=200):
    fb = F(30); fl = F(32, 'Bold'); fn = F(25)
    bw = CW - lab_w - 48
    h = th(body, fb, bw) + (th(note, fn, bw, 8) + 8 if note else 0) + 40
    h = max(h, 96, th(label, fl, lab_w - 28) + 40)
    def fn_(d, y):
        d.rounded_rectangle([M, y, M + CW, y + h], radius=16, fill=fill, outline=outline, width=2)
        tb(d, M + 28, y + 22, label, fl, lab_w - 28, lab_col)
        yy = tb(d, M + lab_w + 20, y + 22, body, fb, bw, body_col)
        if note: tb(d, M + lab_w + 20, yy + 8, note, fn, bw, GREY, 8)
    doc.add(h, fn_)

# ---------- 図1 仕組み ----------
def fig_mechanism():
    doc = Doc('Medi Wave 850Hの仕組み（模式図）', '一つの浮体（海に浮かぶ台）の上に、波・風・太陽の3種類の発電設備を載せる設計です。以下は同社の説明に基づきます。')
    def band(d, y):
        d.rounded_rectangle([M, y, M + CW, y + 76], radius=14, fill=NAVY)
        t = '一つの浮体（プラットフォーム）'; f = F(34, 'Bold')
        d.text(((W - d.textlength(t, font=f)) / 2, y + 18), t, font=f, fill=WHITE)
    doc.add(76, band); doc.gap(12)
    doc.add(44, lambda d, y: d.text((M, y), 'この浮体の上に載せる、3種類の発電設備', font=F(28, 'Medium'), fill=GREY)); doc.gap(10)
    card(doc, '波', 'フロート（浮き）が波を受けて動く → 油圧シリンダーを駆動 → その圧力でペルトン水車と発電機を回す', '同社によると、水中に歯車箱（ギアボックス）や発電機を置かない設計です'); doc.gap(16)
    card(doc, '風', '浮体の上に、垂直軸型の風車（羽根が縦の軸で回るタイプ）を並べる', '同社によると、Wind Harvest社の技術を採用しています'); doc.gap(16)
    card(doc, '太陽', 'デッキに、軽くて曲げられるCIGS太陽電池（薄膜型の太陽電池の一種）を敷く', '同社によると、スウェーデンのMidsummer社の技術を採用しています'); doc.gap(24)
    card(doc, '規模', '1基あたりの定格出力：合計850kW（同社の推定値）\n年間発電量：約2,500MWh（同社の試算。特定の島の予測ではなく、実際は設置場所によって変わります）', fill=SAND, outline=SAND, lab_col=NAVY)
    doc.notes(['同社の説明に基づく模式図で、実際の設計・形状を示すものではありません。同社は、海上での統合と最終的な構成には今後の設計と検証が必要としています。', SRC])
    doc.save('図1_仕組み.png')

# ---------- 図2 インフラ一本化 ----------
def fig_infra():
    doc = Doc('海の上のインフラを一つにまとめる狙い', '波・風・太陽を別々に整備すれば3つのプロジェクトになるところを、一つにまとめることを同社は狙っています（同社の考え方）。')
    items = ['浮体', '係留', '送電ケーブル', '許認可', '設置']
    fc = F(26, 'Medium')
    def chips(d, x, y, col):
        for it in items:
            w = d.textlength(it, font=fc) + 30
            d.rounded_rectangle([x, y, x + w, y + 48], radius=8, fill=WHITE, outline=col, width=2)
            d.text((x + 15, y + 8), it, font=fc, fill=col); x += w + 12
    doc.add(56, lambda d, y: d.text((M, y), '別々に整備する場合', font=F(34, 'Bold'), fill=GREY))
    for src in ['波力', '風力', '太陽光']:
        def row(d, y, src=src):
            d.rounded_rectangle([M, y, M + CW, y + 84], radius=12, outline=LINE, width=2)
            d.text((M + 24, y + 22), src, font=F(30, 'Bold'), fill=NAVY)
            chips(d, M + 200, y + 18, GREY)
        doc.add(84, row); doc.gap(12)
    doc.gap(4); doc.add(60, lambda d, y: arrow_down(d, W / 2, y, y + 56)); doc.gap(12)
    doc.add(56, lambda d, y: d.text((M, y), 'Medi Wave 850Hの考え方', font=F(34, 'Bold'), fill=AQUA))
    def one(d, y):
        d.rounded_rectangle([M, y, M + CW, y + 180], radius=14, fill=PALE, outline=AQUA, width=3)
        d.text((M + 24, y + 22), '波・風・太陽を一つの浮体で', font=F(30, 'Bold'), fill=NAVY)
        chips(d, M + 24, y + 74, AQUA)
        d.text((M + 24, y + 136), '浮体も係留も送電ケーブルも許認可も設置も「一つ」にまとめることを狙う', font=F(24), fill=NAVY)
    doc.add(180, one)
    doc.notes(['同社の説明に基づく模式図です。日本での許認可・海域の占用・漁業関係者との調整等の扱いは、候補地ごとに個別の確認が必要です。', SRC])
    doc.save('図2_インフラ一本化.png')

# ---------- 表（縦積みカード型：スマホで読みやすい） ----------
def table_cards(name, title, sub, rows, notes, lab_w=260):
    doc = Doc(title, sub)
    for i, (lab, body, note) in enumerate(rows):
        card(doc, lab, body, note, fill=PALE if i % 2 == 0 else WHITE, lab_w=lab_w); doc.gap(14)
    doc.notes(notes); doc.save(name)

def tbl_numbers():
    table_cards('表1_主な数値.png', '記事に出てくる主な数値と、その性格',
        'いずれもNoviOceanの公表値で、実測値ではありません。実際の値は設置場所によって変わります。',
        [('定格出力', '1基あたり合計850kW', '同社の推定値'),
         ('年間発電量', '1基あたり約2,500MWh', '同社の試算（代表的な試算値で、特定の島の予測ではない）'),
         ('海域あたりの\nエネルギー', '同じ広さの海域で、洋上風力のおよそ2倍', '同社の試算（モデル計算。前提条件は公開情報で確認できていない）'),
         ('運転波高', '通常運転を波高0.5〜5mで想定', '同社の設計目標値'),
         ('設置水深', '20〜200m', '同社シミュレーターページの記載')],
        ['候補地ごとの評価には、波・水深などのデータによる個別の検討が必要です。', SRC])

def tbl_uses():
    table_cards('表2_優先4用途.png', '同社が優先する4つの用途',
        '課題は同社の説明に基づきます。「ご相談先の例」は、日本でご相談をいただきたい方の例です。',
        [('離島・\n沿岸の地域', '燃料そのものの代金に加え、運搬・取り扱い・貯蔵などの費用もかかる', 'ご相談先の例：離島の自治体、地域新電力、島の電力供給に関わる事業者'),
         ('養殖', '電力網がない、または弱い場所が多く、ディーゼル燃料に頼りがち', 'ご相談先の例：水産・養殖事業者'),
         ('沿岸データ\nセンター', '電力需要の伸びに、陸上の送電網への接続整備が追いついていない', 'ご相談先の例：データセンターを運営・計画する事業者'),
         ('海水淡水化', '「真水は、何よりもまずエネルギーの産物」。電気として使うか造水に使うかは二者択一', 'ご相談先の例：淡水化設備を運営・計画する事業者')],
        ['同社は優先4用途を含め全体で約12の用途を挙げており、ほかに港湾、洋上風力との併設、水素製造などが含まれます。導入パートナー（商社・エンジニアリング会社・建設会社など）からのご相談も歓迎します。', SRC])

def tbl_checks():
    table_cards('表3_確認ポイント.png', '日本で検討する際に、確認が必要なこと',
        '導入できるかどうかも含め、候補地の評価や制度上の扱いの確認によって変わります。',
        [('海域の条件', '同社は通常運転を波高0.5〜5mで想定（設計目標値）。設置水深は20〜200m（シミュレーターページの記載）', '候補地ごとに、波や水深などのデータで個別に評価する必要があります'),
         ('制度', '再エネ海域利用法（現題名「海洋再生可能エネルギー発電設備の整備に関する法律」）は、対象エネルギー源を施行令で「海域における風力」と定めています', '波力・太陽光は含まれず、風・波・太陽を一体にした設備の扱いは確認できていません'),
         ('その他の\n手続き', '海域の占用の手続き、漁業関係者との調整、電気事業法等の扱い', '候補地ごとに確認が必要です'),
         ('費用', '本体価格・導入費用は公表されていません', '設置条件等により異なるため、個別のご相談となります')],
        ['制度の記載は e-Gov法令検索（確認日 2026年10月17日）による。法的な結論を示すものではありません。', SRC])

# ---------- 図3 ご相談の流れ ----------
def fig_flow():
    doc = Doc('ご相談の流れ', '「まだ情報収集の段階」でも構いません。流れはご相談の内容により異なります。')
    steps = [('ご相談', 'メールでご連絡ください\n宛先：kohomadha.keiri@gmail.com', True),
             ('STEP 1', '公開情報の範囲で情報をお伝えし、あわせて確認したい点をお尋ねします', False),
             ('STEP 2', '必要に応じて、オンラインで情報交換をします', False),
             ('STEP 3', 'NoviOceanへの照会が必要な場合は、ご了承をいただいた範囲で同社に照会します', False)]
    for i, (lab, body, first) in enumerate(steps):
        card(doc, lab, body, fill=AQUA if first else PALE, outline=AQUA, lab_col=WHITE if first else AQUA, body_col=WHITE if first else NAVY, lab_w=230)
        if i < len(steps) - 1:
            doc.gap(8); doc.add(50, lambda d, y: arrow_down(d, W / 2, y, y + 46)); doc.gap(8)
    doc.notes(['いただいた情報は、本件のご相談への対応とご連絡のためにのみ利用します。投資・出資に関するお問い合わせの取り次ぎは行っておりません。', '株式会社コホマダ作成'])
    doc.save('図3_ご相談の流れ.png')

os.makedirs(OUT, exist_ok=True)
fig_mechanism(); fig_infra(); tbl_numbers(); tbl_uses(); tbl_checks(); fig_flow()
print('ok')
