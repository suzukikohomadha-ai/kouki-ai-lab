# -*- coding: utf-8 -*-
"""競合調査4文書（v2）から、視認性を優先した報告書v2を組版する（HTML→PDF、Chromium）。
本編＝縦A4・大きめの文字・要点のみ／付録＝横A4・記号ヒートマップ・出典。"""
import re, subprocess, os, html as H
import markdown

ROOT = '/home/user/kouki-ai-lab'
L = ROOT + '/logs/'
SCR = '/tmp/claude-0/-home-user-kouki-ai-lab/12e0c9e0-1489-5e6a-a806-706a28be0aa5/scratchpad/'
OUT_HTML = SCR + 'report_v2.html'
OUT_PDF = L + 'common_2026-09-19_シフト管理ツール_競合調査報告書_v2.pdf'

def rd(name):
    return open(L + name, encoding='utf-8').read()

A = rd('common_2026-09-15_シフト管理ツール_競合調査_領域A国内SaaS_v2.md')
B = rd('common_2026-09-15_シフト管理ツール_競合調査_領域B_LINE連携・勤怠一体型_v2.md')
C = rd('common_2026-09-15_シフト管理ツール_競合調査_領域C_海外SaaS・OSS・ノーコード_v2.md')
S = rd('common_2026-09-15_シフト管理ツール_競合調査_統合サマリー_v2.md')

def sec(text, start, end):
    i = text.index(start); j = text.index(end, i + len(start))
    return text[i:j]

def parse_table(md):
    """Markdown表 → (header, rows)。最初の表のみ。"""
    lines = [l for l in md.splitlines() if l.strip().startswith('|')]
    rows = []
    for l in lines:
        cells = [c.strip() for c in l.strip().strip('|').split('|')]
        if all(re.fullmatch(r':?-{2,}:?', c) for c in cells):
            continue
        rows.append(cells)
    return rows[0], rows[1:]

def md_inline(s):
    """太字・コードだけ処理した簡易インライン変換"""
    s = H.escape(s)
    s = re.sub(r'\*\*(.+?)\*\*', r'<b>\1</b>', s)
    s = re.sub(r'`(.+?)`', r'<code>\1</code>', s)
    return s

def sym_class(cell):
    c = cell.strip().strip('*').strip()
    if c.startswith('○') or c.startswith('可'): return 'ok'
    if c.startswith('△') or c.startswith('条件付き') or c.startswith('設計次第'): return 'part'
    if c.startswith('×') or c.startswith('不可') or c.startswith('標準では不可'): return 'ng'
    if c.startswith('未') or c.startswith('－') or c.startswith('？') or c.startswith('[未確認]') or c == '—' or c == '-': return 'na'
    if c.startswith('要開発') or c.startswith('自作') or c.startswith('手作業'): return 'dev'
    return ''

def sym_only(cell):
    c = cell.strip().strip('*').strip()
    m = re.match(r'^(○〜△|△〜○|×〜△|○|△|×|未|－|？|—|要開発|自作|手作業)', c)
    if m: return m.group(1)
    if c.startswith('[未確認]'): return '未'
    if c.startswith('可'): return '○'
    if c.startswith('条件付き'): return '△'
    if c.startswith('標準では不可'): return '×'
    if c.startswith('不可'): return '×'
    if c.startswith('設計次第'): return '△'
    return c[:6]

def heat_table(header, rows, sym_cols, label_col=1, keep_cols=None, note_col=None, fs=''):
    """記号列は色付きバッジ、それ以外は文字。keep_cols: 表示する列インデックス（Noneなら全部）"""
    idx = list(range(len(header))) if keep_cols is None else keep_cols
    out = [f'<table class="heat {fs}"><thead><tr>']
    for i in idx:
        out.append(f'<th>{md_inline(header[i]).replace("&lt;br&gt;", "<br>")}</th>')
    out.append('</tr></thead><tbody>')
    for r in rows:
        out.append('<tr>')
        for i in idx:
            cell = r[i] if i < len(r) else ''
            if i in sym_cols:
                cls = sym_class(cell); s = sym_only(cell)
                out.append(f'<td class="c"><span class="sym {cls}">{H.escape(s)}</span></td>')
            elif i == label_col:
                out.append(f'<td class="lbl">{md_inline(cell)}</td>')
            else:
                out.append(f'<td>{md_inline(cell)}</td>')
        out.append('</tr>')
    out.append('</tbody></table>')
    return ''.join(out)

def text_table(header, rows, keep_cols=None, fs='', bold_col=None):
    idx = list(range(len(header))) if keep_cols is None else keep_cols
    out = [f'<table class="txt {fs}"><thead><tr>']
    for i in idx: out.append(f'<th>{md_inline(header[i])}</th>')
    out.append('</tr></thead><tbody>')
    for r in rows:
        out.append('<tr>')
        for i in idx:
            cell = r[i] if i < len(r) else ''
            cls = ' class="lbl"' if i == bold_col else ''
            out.append(f'<td{cls}>{md_inline(cell)}</td>')
        out.append('</tr>')
    out.append('</tbody></table>')
    return ''.join(out)

def md2html(md):
    return markdown.markdown(md, extensions=['tables', 'sane_lists'])

LEGEND = ('<p class="legend"><span class="sym ok">○</span> 公式情報で確認　'
          '<span class="sym part">△</span> 条件付き・部分対応　'
          '<span class="sym ng">×</span> 非対応と確認　'
          '<span class="sym na">未</span> 未確認　'
          '<span class="sym dev">自作</span> 自作・要開発</p>')

parts = []
P = parts.append

# ======================= 表紙 =======================
P('''<section class="cover">
<p class="kicker">調査報告書</p>
<h1 class="cover-title">シフト管理ツール<br>競合・同種ツール調査</h1>
<p class="cover-sub">国内シフト管理SaaS／LINE連携・勤怠一体型／海外SaaS・オープンソース・ノーコード自作</p>
<table class="meta">
<tr><th>版</th><td>v2（視認性改善版）　2026年9月19日</td></tr>
<tr><th>調査基準日</th><td>2026年9月15日</td></tr>
<tr><th>作成</th><td>コウキAIラボ　秘書アイ（統合）／リサ（調査・3領域）／アオイ（独立監査）</td></tr>
<tr><th>宛先</th><td>こうき社長</td></tr>
<tr><th>区分</th><td>社内資料（Draft）。開発側・お客さまへの共有は、社長の承認と接続可能な環境での再監査を経てから</td></tr>
</table>
<div class="warn">
<p class="warn-title">読む前の注意</p>
<p>本調査は、公式サイトの本文を直接開けない実行環境（社外接続が遮断）で行われ、検索エンジン経由の公式ページの抜粋に基づいています。料金・提供会社・機能の○×は、判断前に公式URLを直接開いて再確認してください。「対人の組み合わせ制約が既存サービスにない」は「確認できなかった」の意味であり、断定ではありません。</p>
</div>
</section>
''')

# ======================= 目次 =======================
P('''<section class="page">
<h2><span class="num">目次</span></h2>
<div class="toc">
<div class="toc-group">本編（縦向き・要点）</div>
<ol>
<li>結論（1ページ）</li>
<li>調査の前提：要件・体制・方法・限界</li>
<li>主要ベンチマーク13件の比較</li>
<li>領域別の要点（A：国内SaaS／B：LINE連携・勤怠一体型／C：海外・OSS・ノーコード）</li>
<li>社長の決定と差別化の核</li>
<li>3報告間で食い違った点</li>
<li>独立監査の結果・次の一手・承認事項・未確認事項</li>
</ol>
<div class="toc-group">付録（横向き・詳細）</div>
<ol class="app">
<li>付録A：国内シフト管理SaaS 24件（要件対応ヒートマップ・料金）</li>
<li>付録B：LINE連携・勤怠一体型・低価格帯 18件（機能・要件3点）</li>
<li>付録C：海外SaaS・オープンソース・ノーコード（要件マトリクス）</li>
<li>付録D：出典一覧</li>
</ol>
</div>
<p class="note">各表の「○△×」の詳細（条件・注記）と、サービスごとの確認済み事実・未確認事項は、元報告（logs/ の領域A・B・C v2）に残しています。本報告書は判断に必要な要点に絞っています。</p>
</section>
''')

# ======================= 1. 結論 =======================
P('''<section class="page">
<h2><span class="num">1</span>結論</h2>
<div class="keybox">
<p class="keybox-title">一言でいうと</p>
<p class="big">要件をすべて満たす既存サービスは、調べた範囲では見つかりませんでした。<br>
「アカウント不要」「自動作成」「対人の組み合わせ制約」を<b>同時に</b>満たすものが無く、ここが本ツールの差別化の核になります。</p>
</div>

<div class="three">
<div class="req"><div class="req-n">①</div><div class="req-t">アカウント不要</div><div class="req-d">会社アカウント・メール・LINEのいずれも不要。個別URLだけで希望提出・確定閲覧（9/18決定）</div><div class="req-s"><span class="sym part">△</span> URL方式は小規模向け3件のみ</div></div>
<div class="req"><div class="req-n">②</div><div class="req-t">自動作成</div><div class="req-d">希望・必要人数・スキルから自動でシフト案を作る</div><div class="req-s"><span class="sym ok">○</span> 国内15前後・海外主要SaaSが対応</div></div>
<div class="req"><div class="req-n">③</div><div class="req-t">対人の組み合わせ制約</div><div class="req-d">「この人とこの人は別エリア」を自動作成の必須条件に（9/18決定）</div><div class="req-s"><span class="sym na">未</span> 国内42件・海外9件で確認できず</div></div>
</div>

<h3>結論の内訳</h3>
<table class="txt concl">
<tr><th>1</th><td><b>すべて満たす既存サービスは確認できず</b>（国内42件・海外9件・OSS10件・ノーコード5件）。「無い」ではなく「確認できなかった」。</td></tr>
<tr><th>2</th><td><b>機能があること自体は差別化にならない。</b>希望提出・手動作成・確定閲覧・スキル制約・必要人数・複数店舗は多数が対応。自動作成だけでも国内15前後。</td></tr>
<tr><th>3</th><td><b>要件①に近い実装は2系統。</b>LINE友だち追加方式（らくしふ・KAKERU）と、個別URL方式（シフぽち・シフトリ・シフト屋さん）。海外SaaSはメールか携帯番号が前提。</td></tr>
<tr><th>4</th><td><b>要件③は全サービスで公式に確認できず。</b>近いのはシフぽちの「役職ペア制約」のみ（個人単位と同等かは未確認）。</td></tr>
<tr><th>5</th><td><b>自動作成の技術基盤は無償で入手可。</b>Google OR-Tools／Timefold Solver CE（Apache-2.0）。Timefoldは「pairing employees」を制約例に明記。③は自前開発なら実装可能な範囲と推測。</td></tr>
<tr><th>6</th><td><b>差別化＝①×②×③×エリア別必要人数×買取店のスキル制約の同時実現。</b>①〜③のどれか1つを妥協すると、既存サービスで代替できる可能性が高い。</td></tr>
</table>
</section>
''')

# ======================= 2. 前提 =======================
P('''<section class="page">
<h2><span class="num">2</span>調査の前提：要件・体制・方法・限界</h2>
<h3>2.1 背景</h3>
<p>2026年9月15日、開発側から社長宛に18項目の確認事項が届きました。社長は開発側とお客さま（買取査定のある店舗事業者）の間に立つ窓口です。開発側の当初案は「希望収集→手動作成→確定閲覧」で自動作成は対象外でしたが、社長は「自動作成も入れたい」と判断し、あわせて競合になり得るツールの徹底調査を指示しました。</p>
<h3>2.2 比較の軸とした要件</h3>
<table class="txt req-table">
<thead><tr><th>#</th><th>要件</th><th>出典</th></tr></thead>
<tbody>
<tr><td class="lbl">①</td><td>スタッフがスマホから希望提出。会社アカウント・メール・LINEのいずれも不要（個別URL方式）</td><td>Q1・Q8、9/18決定</td></tr>
<tr><td class="lbl">②</td><td>自動でシフトを組む</td><td>社長回答 9/15</td></tr>
<tr><td class="lbl">③</td><td>「この人とこの人は別エリア」の対人組み合わせ制約（自動作成の必須条件）</td><td>Q18、9/18決定</td></tr>
<tr><td class="lbl">④</td><td>管理者が希望を見ながら手動でシフトを組む</td><td>Q1</td></tr>
<tr><td class="lbl">⑤</td><td>確定シフトをスタッフがスマホで閲覧</td><td>Q1</td></tr>
<tr><td class="lbl">⑥</td><td>店舗内エリア区分・時間帯ごとの必要人数</td><td>Q15</td></tr>
<tr><td class="lbl">⑦</td><td>買取査定・レジ・開閉店など「できる人が限られる業務」のスキル制約</td><td>Q16</td></tr>
<tr><td class="lbl">⑧</td><td>確定後の欠勤・交代の差し替え</td><td>Q14</td></tr>
<tr><td class="lbl">⑨</td><td>複数店舗対応</td><td>Q12</td></tr>
<tr><td class="lbl">⑩</td><td>既存の社員番号の流用</td><td>Q17</td></tr>
</tbody></table>
<h3>2.3 体制と方法</h3>
<ul>
<li><b>リサ×3</b>が3領域を並列調査（A：国内SaaS／B：LINE連携・勤怠一体型・低価格帯／C：海外SaaS・OSS・ノーコード）。<b>秘書アイ</b>が統合、<b>アオイ</b>が独立監査。</li>
<li>公式サイト・公式ヘルプ・公式プレスを第一優先。比較サイト等の二次情報は補助のみ（「二次情報」と明記）。</li>
<li>出典はURL・発行主体・公開日・確認日（2026-09-15）を記録。事実／推測／未確認をラベルで分離。</li>
</ul>
</section>

<section class="page">
<h3>2.4 限界（重要）</h3>
<div class="warn">
<p class="warn-title">公式サイトの本文は直接確認できていません</p>
<ul>
<li>実行環境（Claude Code on the web）は社外サイトへの接続がネットワークポリシーで遮断されており（プロキシがCONNECTに403を返すことを確認。GitHubのみ到達可）、リサ3名とも公式ページの<b>検索エンジン経由の抜粋</b>に基づいて調査しました。アオイの監査も出典URLとの照合は行えていません。</li>
<li>料金・機能は「公式由来」ですが「公式本文を読んだ」確認ではありません。<b>判断前に公式URLの再確認が必要</b>です。</li>
<li>監査で「他の情報と食い違う」と指摘された料金：Notion Plus、Microsoft 365 F1、Homebase、FormBridge。スマレジ・タイムカードの無料枠は報告間でも食い違い（6章）。</li>
<li>検索回数の上限（各200回）に達したため、未確認のまま残った項目があります（元報告の「未確認事項」参照）。</li>
</ul>
<p><b>対処：</b>社長の決定（9/18）により、実行環境のネットワーク制限を緩めたうえで、アイが主要URLを直接開いて再確認し、本報告書をv3に更新します。</p>
</div>
</section>
''')

# ======================= 3. ベンチマーク =======================
hdr, rows = parse_table(sec(S, '## 2. 最も近い', '---\n\n## 3. 3報告間'))
# 列: 0区分 1サービス 2① 3② 4③ 5料金 6注意点
P('<section class="page wide">')
P('<h2><span class="num">3</span>主要ベンチマーク13件の比較</h2>')
P(LEGEND)
P('<p class="note">税込／税抜の表記は各報告参照（未確認のものあり）。海外はUSD／GBP。「①」列の△〜○はLINE友だち追加が必要な方式（9/18決定の個別URL方式とは異なる）。</p>')
P(heat_table(hdr, rows, sym_cols={2, 3, 4}, label_col=1, fs='bench'))
P('</section>')

# ======================= 4. 領域別の要点 =======================
P('''<section class="page">
<h2><span class="num">4</span>領域別の要点</h2>

<h3>A　国内シフト管理SaaS（24件）</h3>
<ul>
<li><b>要件をすべて満たすものは確認できず。</b>特に「①アカウント無し × ②自動作成 × ③組み合わせ制約」の同時充足は無し。③は24件すべてで未確認。</li>
<li><b>最も近い4件：</b>らくしふ（LINE友だち追加のみ・AI自動作成・料金非公開）／シフぽち（完全無料・登録不要・自動作成・運営者未確認）／Shiftmation（社員番号ログイン・AI自動作成・買取業のコメ兵に導入実績・要見積）／勤務シフト作成お助けマン（自動作成込み月額15,000円・1拠点50名まで）。</li>
<li><b>価格帯：</b>小規模向けは無料〜15,000円/月、1人あたり100〜330円/人が主流。中堅以上は初期15〜50万円・月額数万〜10万円超（アールシフト・ShiftMAX・SHIFTEE）。</li>
<li><b>要注意：</b>Airシフトは2026-04-01から有料登録必須（330円/人・税込）。LINE WORKSが2026年6月に無料のシフト管理アプリβ版を提供開始（大手参入）。</li>
</ul>

<h3>B　LINE連携・勤怠一体型・低価格帯（18件）</h3>
<ul>
<li><b>LINE／URLで「登録不要」は既に標準化しつつある</b>（らくしふ・シフトリ・シフぽち・KAKERU・LINE WORKS β・Airシフト）。ただし自動作成・スキル制約まで揃うのは、らくしふ（料金非公開）とシフぽち（運営者未確認）のみ。</li>
<li><b>勤怠一体型（KING OF TIME・freee勤怠管理Plus・ジョブカン・HRMOS・スマレジ等）はID／パスワードのログインが前提</b>で、要件①と相性が悪い。自動作成も「業務習熟度×時間帯別必要人数」のルールベース補助。マネーフォワードクラウド勤怠はシフト提出機能なし（公式FAQ）。</li>
<li><b>③に近い記載はシフぽちの「役職ペア制約」のみ。</b>他は未確認。</li>
<li><b>oplus</b>は100名まで無料・自動作成は有料オプション・SMS／リンク／QR招待。提供会社と自動作成料金の表記に矛盾あり（6章）。</li>
</ul>

<h3>C　海外SaaS・オープンソース・ノーコード</h3>
<ul>
<li><b>海外の主要SaaS（Deputy・When I Work・Homebase・Connecteam・Planday・Zoho Shifts・Microsoft Shifts）は自動割当を提供</b>（プラン条件付きを含む）。しかし<b>メールか携帯番号のアカウントが前提</b>（Deputyはメール必須、When I Work・Homebaseは携帯番号で可）で、①を満たさない。日本語UIを確認できたのはDeputyのiOS／Kioskアプリのみ。</li>
<li><b>自動作成の技術基盤：</b>Google OR-Tools（CP-SAT）とTimefold Solver Community Editionが<b>Apache-2.0で無償</b>。公式のシフト割当サンプルあり。OptaPlannerはRed Hat build 8がEOLで新規採用は後退。GPL／AGPLの自前ホスト型OSSは改変時のソース公開義務に注意。</li>
<li><b>ノーコード：</b>Googleフォーム／Notionフォームはアカウント無しで回答可。kintoneは標準では不可（トヨクモFormBridge等が必要）。AppSheetの公開アプリは「機密データ非推奨」。いずれも自動作成・本人確認・個人別閲覧は自作が必要で、「つなぎ運用」向き。</li>
</ul>
</section>
''')

# ======================= 5. 社長決定 =======================
P('''<section class="page">
<h2><span class="num">5</span>社長の決定と差別化の核（2026年9月18日）</h2>
<h3>5.1 社長の決定</h3>
<table class="txt dec">
<thead><tr><th>#</th><th>論点</th><th>決定</th><th>意味</th></tr></thead>
<tbody>
<tr><td class="lbl">1</td><td>要件①の厳密さ</td><td class="strong">方式B：LINEも会社アカウントも不要、個別URLだけ</td><td>管理者が発行する個別URL＋本人確認（社員番号＋暗証番号等）で提出・閲覧。URLの配布手段としてLINEを使うのは可</td></tr>
<tr><td class="lbl">2</td><td>要件③の位置づけ</td><td class="strong">自動作成の必須条件にする</td><td>対人の組み合わせ制約をハード制約に。既存サービスで確認できなかった点＝差別化の核</td></tr>
<tr><td class="lbl">3</td><td>資料請求・デモ依頼</td><td class="strong">行わない</td><td>競合比較は公開情報の範囲で完結</td></tr>
<tr><td class="lbl">4</td><td>公式サイトの再確認</td><td class="strong">環境の制限を緩め、アイが再確認</td><td>制限変更後に主要URLを直接確認し、本報告書をv3に更新</td></tr>
</tbody></table>

<h3>5.2 差別化の核</h3>
<table class="txt diff">
<thead><tr><th>要素</th><th>既存サービスの状況</th><th>本ツール</th></tr></thead>
<tbody>
<tr><td class="lbl">個別URL方式（LINE・会社アカウント不要）</td><td>シフぽち・シフトリ・シフト屋さんが採用。いずれも小規模向け</td><td>採用。本人確認方式は開発側に提案を依頼</td></tr>
<tr><td class="lbl">自動作成</td><td>国内で15前後、海外の主要SaaSも提供</td><td>採用</td></tr>
<tr><td class="lbl">対人の組み合わせ制約</td><td>国内42件・海外9件で公式に確認できず</td><td><b>必須条件</b></td></tr>
<tr><td class="lbl">エリア×時間帯の必要人数</td><td>らくしふ・Shiftmation・KING OF TIME等が対応</td><td>必須条件</td></tr>
<tr><td class="lbl">買取店のスキル制約（査定・レジ・開閉店）</td><td>スキル・ポジション制約として多数が対応</td><td>必須条件</td></tr>
<tr><td class="lbl">上記の同時実現</td><td><b>確認できず</b></td><td><b>差別化の核</b></td></tr>
</tbody></table>
<p class="note"><b>技術的な裏付け（推測）：</b>Apache-2.0の制約ソルバー（OR-Tools、Timefold CE）に公式のシフト割当サンプルがあり、Timefoldは「pairing employees」を制約例に明記。③は自前開発なら実装可能な範囲と考えられます（工数は未検証）。</p>

<h3>5.3 方式Bを選んだことで生じる設計上の論点</h3>
<ul>
<li><b>通知の手段：</b>LINEに頼らない場合、希望提出のリマインドや確定連絡をどう届けるか（URLの配布手段と催促の手段を、お客さまの運用に合わせて決める。開発側Q13と一緒に整理）。</li>
<li><b>本人確認：</b>URLを知っているだけで他人のシフトを見られない仕組み（社員番号＋暗証番号、店舗発行コード等）。</li>
<li><b>組み合わせ制約の記録範囲：</b>理由は記録せず制約だけを残す。閲覧は管理者のみ（開発側Q18と連動）。</li>
</ul>
</section>
''')

# ======================= 6. 食い違い =======================
hdr, rows = parse_table(sec(S, '## 3. 3報告間', '---\n\n## 4. 社長に'))
P('<section class="page">')
P('<h2><span class="num">6</span>3報告間で食い違った点</h2>')
P('<p>統合時に見つかった食い違いと、監査で追加されたもの。<b>太字は未解決</b>（公式で要再確認）。</p>')
P(text_table(hdr, rows, fs='mid', bold_col=0))
P('</section>')

# ======================= 7. 監査・次の一手 =======================
P('''<section class="page">
<h2><span class="num">7</span>独立監査の結果・次の一手・承認事項・未確認事項</h2>
<h3>7.1 独立監査（アオイ）</h3>
<table class="txt audit">
<thead><tr><th>対象</th><th>判定（v1に対して）</th><th>対応</th></tr></thead>
<tbody>
<tr><td class="lbl">統合サマリー</td><td><span class="badge rev">REVISE</span></td><td>指摘8点を反映してv2を作成（本報告書はv2に基づく）</td></tr>
<tr><td class="lbl">領域A報告</td><td><span class="badge cond">PASS WITH CONDITIONS</span></td><td>根拠のない改定履歴の削除、シフぽちの方式統一、個人ハンドル名の伏せ字化 等を反映しv2</td></tr>
<tr><td class="lbl">領域B報告</td><td><span class="badge cond">PASS WITH CONDITIONS</span></td><td>ジョブカン自動作成を「未確認」に訂正、oplusの発行主体・評価表現の修正 等を反映しv2</td></tr>
<tr><td class="lbl">領域C報告</td><td><span class="badge cond">PASS WITH CONDITIONS</span></td><td>結論の過剰一般化の修正、OptaPlanner EOLの限定、Deputy Androidの日本語対応を未確認に 等を反映しv2</td></tr>
</tbody></table>
<p class="note">確認できたこと：架空の法令・制度・API・料金・統計の混入なし。個人情報・認証情報の混入なし。事業間の情報混在なし。承認が必要な事項は明示。監査の限界：出典URLの中身との照合は未実施（環境制約）。</p>

<h3>7.2 次の一手</h3>
<ol>
<li><b>開発側への返信（T224 v4）</b>：Q1に自動作成の必須条件（対人組み合わせ制約・スキル制約・エリア×時間帯必要人数・希望の尊重）と、個別URL方式＋本人確認の要望を添えて、社長が送信。</li>
<li><b>公式URLの再確認</b>：環境のネットワーク制限を変更後、新しいセッションで主要URL（らくしふ・Shiftmation・お助けマン・oplus・LINE WORKSシフト管理β・Airシフト・Notion・Homebase・Microsoft 365 F1・FormBridge）を直接確認し、本報告書をv3へ。</li>
<li><b>ミナ</b>：価格レンジを入力に、作る場合と買う場合の収支試算。</li>
<li><b>リョウ</b>：個別URL方式の本人確認・従業員情報のクラウド保存に関する個人情報上の論点整理（必要になった段階で）。</li>
<li><b>お客さまへの確認16項目</b>（開発側Q2〜6・8・10〜18）を社長経由で確認。</li>
</ol>

</section>
<section class="page">
<h3>7.3 人間の承認が必要な事項</h3>
<ul>
<li>開発側への返信文の送信（対外送付）</li>
<li>本報告書の内容を開発側・お客さまに共有すること（対外送付。接続可能な環境での再監査後）</li>
<li>実行環境のネットワークポリシーの変更</li>
</ul>

<h3>7.4 未確認事項</h3>
<ul>
<li>お客さまの社名・事業・店舗数・スタッフ数・ITサービス・社内規定（規模による適合性評価は暫定）</li>
<li>6章の未解決項目（oplusの提供会社・自動作成料金、Shiftmationの提供会社、スマレジの無料枠、AirシフトFAQのURL）</li>
<li>各報告の「未確認事項」に列挙した料金・提供会社・機能の詳細（元報告v2を参照）</li>
<li>対象外とした海外サービス（Skello・Shiftboard・Humanity・Workforce.com・HotSchedules・ZoomShift・Buddy Punch）</li>
</ul>
</section>
''')

# ======================= 付録A =======================
hdrA, rowsA = parse_table(sec(A, '## 比較表A', '## 比較表B'))
# 列: 0# 1サービス 2希望提出 3アカウント無し 4手動 5確定閲覧 6自動 7エリア 8スキル 9組合せ 10欠勤 11複数店舗 12社員番号
P('<section class="page wide">')
P('<h2><span class="num">付録A</span>国内シフト管理SaaS 24件：要件対応ヒートマップ</h2>')
P(LEGEND)
short_hdr = ['#', 'サービス', '希望提出<br>(スマホ)', '①アカウント<br>無し提出', '手動作成', '確定閲覧', '②自動作成', 'エリア・<br>時間帯別人数', 'スキル制約', '③組み合わせ<br>制約', '欠勤・交代', '複数店舗', '社員番号<br>流用']
P('<p class="note">記号のみを表示しています。各記号の条件（例：「△：アプリ登録要」「○：LINE友だち追加」）は元報告 領域A v2 の比較表Aを参照。</p>')
P(heat_table(short_hdr, rowsA, sym_cols=set(range(2, 13)), label_col=1, fs='heat24'))
P('</section>')

hdrB2, rowsB2 = parse_table(sec(A, '## 比較表B', '---\n\n## 推測・仮説'))
P('<section class="page wide">')
P('<h2><span class="num">付録A</span>国内シフト管理SaaS 24件：料金・規模・連携</h2>')
P(text_table(hdrB2, rowsB2, fs='small', bold_col=1))
P('<p class="note">「二次」＝比較サイト等の二次情報。税込／税抜の表記が無いものは未確認。料金は改定が頻繁なため、判断前に公式で再確認。</p>')
P('</section>')

# ======================= 付録B =======================
hdrB, rowsB = parse_table(sec(B, '### 表1', '### 表2'))
# 列: 0サービス 1提供元 2入口 3スタッフ側に必要 4希望収集 5確定配信 6自動作成 7時間帯別 8スキル 9組合せ 10欠勤 11複数店舗 12料金 13確認日
P('<section class="page wide">')
P('<h2><span class="num">付録B</span>LINE連携・勤怠一体型・低価格帯 18件：機能比較</h2>')
P(LEGEND)
hB = ['サービス', '提供元', '入口', 'スタッフ側に必要なもの', '希望収集', '確定配信', '②自動作成', '時間帯別<br>必要人数', 'スキル／<br>ポジション', '③組み合わせ<br>制約', '欠勤・交代', '複数店舗', '料金（公式明記のみ）']
P(heat_table(hB, rowsB, sym_cols={4, 5, 6, 7, 8, 9, 10, 11}, label_col=0, keep_cols=list(range(13)), fs='heat18'))
P('</section>')

hdrB3, rowsB3 = parse_table(sec(B, '### 表2', '---\n\n## 推測・仮説'))
P('<section class="page">')
P('<h2><span class="num">付録B</span>要件3点（アカウント無し／自動作成／スキル・エリア制約）の充足状況</h2>')
P('<p class="note">この表の「3点目」は<b>スキル・エリア制約</b>であり、本編の③「対人の組み合わせ制約」とは別の定義です。</p>')
P(LEGEND)
P(heat_table(hdrB3, rowsB3, sym_cols={1, 2, 3, 4}, label_col=0, fs='mid'))
P('</section>')

# ======================= 付録C =======================
P('''<section class="page wide">
<h2><span class="num">付録C</span>海外SaaS：要点比較</h2>
''')
P(LEGEND)
P('''<table class="heat mid">
<thead><tr><th>サービス</th><th>日本語UI</th><th>②自動作成</th><th>スキル／ロール制約</th><th>①メール無しで利用</th><th>料金（公式明記のみ）</th><th>備考</th></tr></thead>
<tbody>
<tr><td class="lbl">Deputy</td><td class="c"><span class="sym part">△</span></td><td class="c"><span class="sym ok">○</span></td><td class="c"><span class="sym ok">○</span></td><td class="c"><span class="sym ng">×</span></td><td>最低請求額 $30/月（単価は未確認。二次：$5〜$9/ユーザー）</td><td>iOS／iPad Kioskアプリが日本語対応。エリア別の研修要件は要件に近い。メール必須</td></tr>
<tr><td class="lbl">When I Work</td><td class="c"><span class="sym ng">×</span></td><td class="c"><span class="sym ok">○</span></td><td class="c"><span class="sym ok">○</span></td><td class="c"><span class="sym part">△</span></td><td>$2.50／$5／$8 per ユーザー/月</td><td>携帯番号で招待可。従業員IDのインポート項目あり。日本語なし</td></tr>
<tr><td class="lbl">Homebase</td><td class="c"><span class="sym na">未</span></td><td class="c"><span class="sym ok">○</span></td><td class="c"><span class="sym part">△</span></td><td class="c"><span class="sym part">△</span></td><td>$0（1拠点10人）／$30／$70／$120 per 拠点/月</td><td>正式提供は米・英・加のみ。料金は監査で要再確認</td></tr>
<tr><td class="lbl">7shifts</td><td class="c"><span class="sym ng">×</span></td><td class="c"><span class="sym part">△</span></td><td class="c"><span class="sym part">△</span></td><td class="c"><span class="sym na">未</span></td><td>未確認（$39.99/月/拠点〜の記載あり）</td><td>飲食特化。Auto-SchedulerはBeta</td></tr>
<tr><td class="lbl">Sling</td><td class="c"><span class="sym na">未</span></td><td class="c"><span class="sym ok">○</span></td><td class="c"><span class="sym part">△</span></td><td class="c"><span class="sym na">未</span></td><td>無料30ユーザーまで。有料単価は未確認</td><td></td></tr>
<tr><td class="lbl">Connecteam</td><td class="c"><span class="sym na">未</span></td><td class="c"><span class="sym ok">○</span></td><td class="c"><span class="sym ok">○</span></td><td class="c"><span class="sym na">未</span></td><td>10ユーザーまで無料。$29／$49／$99 per 月（30ユーザーまで）</td><td>資格（Qualifications）ベースの自動割当</td></tr>
<tr><td class="lbl">Planday</td><td class="c"><span class="sym na">未</span></td><td class="c"><span class="sym part">△</span></td><td class="c"><span class="sym ok">○</span></td><td class="c"><span class="sym na">未</span></td><td>£2.99/ユーザー〜。最低契約人数あり（Proは50人）</td><td>自動作成はProのみ</td></tr>
<tr><td class="lbl">Zoho Shifts</td><td class="c"><span class="sym na">未</span></td><td class="c"><span class="sym ok">○</span></td><td class="c"><span class="sym ok">○</span></td><td class="c"><span class="sym na">未</span></td><td>Basic $1/ユーザー/月。上位は未確認</td><td>公平性／労務コストの最適化優先度</td></tr>
<tr><td class="lbl">Microsoft Shifts</td><td class="c"><span class="sym na">未</span></td><td class="c"><span class="sym part">△</span></td><td class="c"><span class="sym na">未</span></td><td class="c"><span class="sym ng">×</span></td><td>Microsoft 365 F1 $4/ユーザー/月（監査で要再確認）</td><td>Teamsライセンス必須。自動割当はパブリックプレビュー</td></tr>
</tbody></table>
<p class="note">「対人の組み合わせ制約」はいずれのSaaSでも公式に確認できていません。海外SaaS利用時の個人情報の保管国・準拠法は本調査の範囲外（リョウの確認事項）。</p>
</section>

<section class="page wide">
<h2><span class="num">付録C</span>自動作成の技術基盤（オープンソース・制約ソルバー）</h2>
<table class="txt mid">
<thead><tr><th>名称</th><th>種別</th><th>ライセンス</th><th>言語</th><th>シフト割当への適用（公式記載）</th><th>備考</th></tr></thead>
<tbody>
<tr><td class="lbl">Google OR-Tools（CP-SAT）</td><td>制約ソルバー</td><td><b>Apache-2.0</b></td><td>C++／Python／Java／C#</td><td>公式ドキュメントに「Employee Scheduling」章とナース・スケジューリング例</td><td>v9.15（2026-01-12）。UI・DBは別途開発</td></tr>
<tr><td class="lbl">Timefold Solver Community Edition</td><td>制約ソルバー（OptaPlannerの後継）</td><td><b>Apache-2.0</b>（Plus／Enterpriseは商用）</td><td>Java／Kotlin（Python版リポジトリは2025-10アーカイブ）</td><td>公式クイックスタートにEmployee Scheduling。<b>skills・pairing employees・fairness</b>を制約例に明記</td><td>2.6.0（2026-09-01）。Timefold Platform（マネージドAPI）は料金未確認</td></tr>
<tr><td class="lbl">OptaPlanner</td><td>制約ソルバー</td><td>Apache-2.0</td><td>Java</td><td>従業員ロスタリングは代表的用途</td><td>Red Hat build 8はEOL（一次資料未確認）。OSS本体はApache KIEへ。新規採用は後退</td></tr>
<tr><td class="lbl">自前ホスト型OSSアプリ<br>（nurse-scheduling／employee-shift-scheduler／Frappe HR 等）</td><td>Webアプリ</td><td>AGPL-3.0／GPL-3.0 等</td><td>各種</td><td>小規模・個人開発・更新停止が多い。希望提出や自動割当が無いものもある</td><td>改変して提供する場合はソース公開義務（特にAGPL）に注意</td></tr>
</tbody></table>

</section>
<section class="page wide">
<h2><span class="num">付録C</span>ノーコード・既存ツールでの自作</h2>
''')
P(LEGEND)
P('''<table class="heat mid">
<thead><tr><th>ツール</th><th>①アカウント無しで希望提出</th><th>アカウント無しで確定閲覧</th><th>②自動作成</th><th>料金（公式明記のみ）</th><th>主な制約</th></tr></thead>
<tbody>
<tr><td class="lbl">Googleフォーム＋スプレッドシート</td><td class="c"><span class="sym ok">○</span></td><td class="c"><span class="sym ok">○</span></td><td class="c"><span class="sym dev">自作</span></td><td>無料（Googleアカウントで作成）</td><td>本人特定は入力項目頼み。公開URLは全員に同内容</td></tr>
<tr><td class="lbl">Notion（フォーム＋公開ページ）</td><td class="c"><span class="sym ok">○</span></td><td class="c"><span class="sym ok">○</span></td><td class="c"><span class="sym dev">自作</span></td><td>Free／Plus（料金は監査で要再確認）</td><td>匿名回答のため本人特定は入力項目頼み</td></tr>
<tr><td class="lbl">kintone＋トヨクモ（FormBridge／kViewer）</td><td class="c"><span class="sym part">△</span></td><td class="c"><span class="sym part">△</span></td><td class="c"><span class="sym dev">自作</span></td><td>kintone 1,000〜3,000円/ユーザー（最低10）＋FormBridge 7,000円/月〜（要再確認）</td><td>標準ではアカウント必須。外部サービスの固定費が上乗せ</td></tr>
<tr><td class="lbl">AppSheet（公開アプリ）</td><td class="c"><span class="sym part">△</span></td><td class="c"><span class="sym part">△</span></td><td class="c"><span class="sym dev">自作</span></td><td>Publisher Pro $50/月/アプリ</td><td>公式は「機密データ非推奨」。サインイン方式にすると各スタッフにIDが必要</td></tr>
<tr><td class="lbl">Microsoft Shifts（Teams）</td><td class="c"><span class="sym ng">×</span></td><td class="c"><span class="sym ng">×</span></td><td class="c"><span class="sym part">△</span></td><td>F1 $4/ユーザー/月（要再確認）</td><td>Microsoft 365アカウント必須</td></tr>
</tbody></table>
<p class="note">ノーコードは「提出→手動作成→閲覧」までは低コストで実現できるが、「自動作成」「本人性担保」「個人別閲覧制御」は標準外。つなぎ運用（PoC）向き。</p>
</section>
''')

# 付録C マトリクス
hdrM, rowsM = parse_table(sec(C, '## 分析（要件別', '「新規開発する場合の優位性'))
P('<section class="page wide">')
P('<h2><span class="num">付録C</span>要件別の対応状況マトリクス（海外SaaS・自前開発・ノーコード）</h2>')
P(LEGEND)
P('<p class="note">記号のみを表示。条件の詳細は元報告 領域C v2 の「分析」節を参照。</p>')
P(heat_table(hdrM, rowsM, sym_cols=set(range(1, len(hdrM))), label_col=0, fs='heat24'))
P('</section>')

# ======================= 付録D 出典 =======================
def src_block(text, start, end):
    md = sec(text, start, end).split('\n', 1)[1]
    md = re.sub(r'^---\s*$', '', md, flags=re.M)
    md = re.sub(r'^#+ ', '#### ', md, flags=re.M)
    md = re.sub(r'(?m)^(?!- )(\S.*)\n(- )', r'\1\n\n\2', md)
    return md2html(md)

P('<section class="page wide src">')
P('<h2><span class="num">付録D</span>出典一覧</h2>')
P('<p class="note">すべて確認日 2026-09-15。「スニペット経由」「公式ドメイン検索要約」＝公式ドメイン配下ページの検索エンジン抜粋（本文は未閲覧）。「一次（直接取得）」＝GitHubから本文を直接取得。</p>')
P('<h3>D-1　領域A：国内シフト管理SaaS</h3>')
P(src_block(A, '## 出典', '## 未確認事項'))
P('<h3>D-2　領域B：LINE連携・勤怠一体型・低価格帯</h3>')
P(src_block(B, '## 出典', '---\n\n## 未確認事項'))
P('<h3>D-3　領域C：海外SaaS・オープンソース・ノーコード</h3>')
P(src_block(C, '## 出典', '---\n\n## 未確認事項'))
P('<p class="colophon">コウキAIラボ ― 本報告書はAIエージェント（リサ・アオイ・秘書アイ）が作成した社内向けDraftです。事実と推測はラベルで区別しています。最終判断・対外共有は社長が行います。</p>')
P('</section>')

body_html = ''.join(parts)

css = '''
@page { size: A4 portrait; margin: 16mm 16mm 18mm 16mm;
  @top-right { content: "シフト管理ツール 競合・同種ツール調査報告書 v2"; font-family: "IPAPGothic"; font-size: 8pt; color: #7a8794; }
  @bottom-center { content: counter(page); font-family: "IPAPGothic"; font-size: 9pt; color: #55606b; } }
@page wide { size: A4 landscape; margin: 14mm 14mm 16mm 14mm; }
@page cover { margin: 0; @top-right { content: none; } @bottom-center { content: none; } }
* { box-sizing: border-box; }
body { font-family: "IPAPGothic", "IPAGothic", sans-serif; font-size: 10.5pt; line-height: 1.7; color: #1c2430; margin: 0; }
section.page { page-break-before: always; }
section.wide { page: wide; }
section.cover { page: cover; height: 297mm; padding: 34mm 26mm; background: linear-gradient(160deg, #eef3f9 0%, #ffffff 45%); display: flex; flex-direction: column; justify-content: center; }
.kicker { color: #1f4e79; letter-spacing: .35em; font-size: 12pt; margin: 0 0 10px; }
.cover-title { font-size: 34pt; line-height: 1.25; color: #1f4e79; margin: 0 0 12px; border: none; }
.cover-sub { font-size: 12.5pt; color: #4a5561; margin: 0 0 30px; }
.meta { border-collapse: collapse; width: 100%; font-size: 10.5pt; margin-bottom: 26px; }
.meta th { width: 24%; text-align: left; background: #e6eef7; color: #1f4e79; padding: 6px 10px; border: 1px solid #c9d6e4; }
.meta td { padding: 6px 10px; border: 1px solid #c9d6e4; }
.warn { border: 2px solid #c0392b; background: #fff5f3; border-radius: 6px; padding: 10px 16px; }
.warn-title { color: #c0392b; font-weight: bold; font-size: 11.5pt; margin: 0 0 4px; }
.warn p, .warn ul { margin: 4px 0; }
h2 { font-size: 17pt; color: #1f4e79; margin: 0 0 12px; padding-bottom: 6px; border-bottom: 2.5px solid #1f4e79; display: flex; align-items: center; gap: 10px; page-break-after: avoid; }
h2 .num { display: inline-block; background: #1f4e79; color: #fff; border-radius: 4px; padding: 1px 10px; font-size: 12pt; letter-spacing: .05em; }
h3 { font-size: 12.5pt; color: #1f4e79; margin: 16px 0 6px; padding-left: 8px; border-left: 5px solid #5b8fc7; page-break-after: avoid; }
h4 { font-size: 10.5pt; margin: 10px 0 4px; color: #2e4a66; page-break-after: avoid; }
p { margin: 4px 0 8px; }
ul, ol { margin: 4px 0 8px; padding-left: 1.5em; }
li { margin: 2px 0 5px; }
b { color: #0f1a26; }
code { font-family: "IPAGothic", monospace; font-size: 9pt; background: #f1f3f5; padding: 0 3px; }
.note { font-size: 9pt; color: #55606b; background: #f5f7fa; border-left: 4px solid #b9c6d4; padding: 6px 10px; margin: 8px 0; }
.legend { font-size: 9pt; color: #55606b; margin: 0 0 8px; }
.keybox { background: #eaf2fb; border: 1.5px solid #9dbde0; border-radius: 8px; padding: 12px 18px; margin: 4px 0 14px; }
.keybox-title { color: #1f4e79; font-weight: bold; margin: 0 0 4px; font-size: 11pt; }
.big { font-size: 13.5pt; line-height: 1.6; margin: 0; }
.three { display: flex; gap: 10px; margin: 6px 0 14px; }
.req { flex: 1; border: 1.5px solid #c9d6e4; border-radius: 8px; padding: 10px 12px; background: #fff; }
.req-n { font-size: 20pt; color: #1f4e79; font-weight: bold; line-height: 1; }
.req-t { font-size: 12pt; font-weight: bold; margin: 4px 0 4px; }
.req-d { font-size: 9pt; color: #4a5561; min-height: 4.2em; }
.req-s { font-size: 9pt; margin-top: 6px; padding-top: 6px; border-top: 1px dashed #c9d6e4; }
.toc ol { font-size: 12pt; line-height: 1.9; }
.toc-group { font-weight: bold; color: #1f4e79; margin: 10px 0 2px; font-size: 11pt; }
.toc ol.app { list-style: none; padding-left: .5em; }
table { border-collapse: collapse; width: 100%; margin: 6px 0 10px; }
th, td { border: 1px solid #c9d6e4; padding: 5px 7px; vertical-align: top; text-align: left; }
th { background: #e6eef7; color: #1f4e79; font-weight: bold; }
tbody tr:nth-child(even) td { background: #f8fafc; }
tr { page-break-inside: avoid; }
thead { display: table-header-group; }
td.lbl { font-weight: bold; white-space: nowrap; }
td.strong { font-weight: bold; color: #1f4e79; }
td.c { text-align: center; white-space: nowrap; }
table.txt { font-size: 9.5pt; line-height: 1.5; }
table.concl th { width: 2.2em; text-align: center; background: #1f4e79; color: #fff; font-size: 11pt; }
table.concl td { font-size: 10.5pt; line-height: 1.6; }
table.req-table td:first-child { text-align: center; }
table.dec td, table.diff td, table.audit td { font-size: 9.8pt; }
table.mid { font-size: 8.8pt; line-height: 1.45; }
table.mid td, table.mid th { padding: 4px 6px; }
table.small { font-size: 8.2pt; line-height: 1.4; }
table.small td, table.small th { padding: 3px 5px; }
table.bench { font-size: 8.8pt; line-height: 1.45; }
table.bench td, table.bench th { padding: 4px 6px; }
table.heat24 { font-size: 8.2pt; line-height: 1.2; }
table.heat24 td, table.heat24 th { padding: 1px 4px; text-align: center; }
table.heat24 .sym { font-size: 8.4pt; line-height: 1.35; }
table.heat24 td.lbl { text-align: left; }
table.heat24 th { font-size: 8pt; line-height: 1.25; }
table.heat18 { font-size: 8.2pt; line-height: 1.4; }
table.heat18 td, table.heat18 th { padding: 3px 4px; }
table.heat18 th { font-size: 7.8pt; line-height: 1.25; }
.sym { display: inline-block; min-width: 1.9em; padding: 0 .35em; border-radius: 4px; font-weight: bold; text-align: center; line-height: 1.45; font-size: 9.2pt; }
.sym.ok { background: #d9f0e2; color: #1e6b3a; }
.sym.part { background: #fdefc8; color: #8a5a00; }
.sym.ng { background: #fadbd8; color: #a93226; }
.sym.na { background: #e9ecef; color: #6c757d; }
.sym.dev { background: #e3e7f7; color: #3b4a9c; }
.badge { display: inline-block; padding: 1px 8px; border-radius: 4px; font-weight: bold; font-size: 9pt; }
.badge.rev { background: #fadbd8; color: #a93226; }
.badge.cond { background: #fdefc8; color: #8a5a00; }
.badge.pass { background: #d9f0e2; color: #1e6b3a; }
section.src { font-size: 8.4pt; line-height: 1.45; }
section.src ul, section.src ol { padding-left: 1.4em; }
section.src li { margin: 1px 0; }
section.src table { font-size: 7.8pt; }
section.src td, section.src th { padding: 2px 4px; }
section.src h4 { font-size: 9.5pt; }
.colophon { font-size: 8pt; color: #6c757d; margin-top: 18px; }
'''
doc = f'''<!doctype html><html lang="ja"><head><meta charset="utf-8">
<title>シフト管理ツール 競合・同種ツール調査報告書 v2</title><style>{css}</style></head>
<body>{body_html}</body></html>'''
open(OUT_HTML, 'w', encoding='utf-8').write(doc)

chrome = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'
cmd = [chrome, '--headless=new', '--disable-gpu', '--no-sandbox', '--no-pdf-header-footer',
       '--run-all-compositor-stages-before-draw', '--virtual-time-budget=5000',
       f'--print-to-pdf={OUT_PDF}', 'file://' + OUT_HTML]
r = subprocess.run(cmd, capture_output=True, text=True, timeout=180)
print('chrome rc', r.returncode)
print('PDF bytes', os.path.getsize(OUT_PDF))
