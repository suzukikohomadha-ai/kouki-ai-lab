// KIVO TALK 紹介記事用 図解（9点）を HTML → PNG で書き出す
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const path = require('path');
const OUT = process.argv[2];

const SRC = '出典：KIVO TALK 公式サイト・App Store（2026年10月14日時点の公開情報）／作図：株式会社コホマダ';

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700;900&display=swap');
:root{--navy:#1B2B48;--teal:#0F7C80;--teal-l:#E4F2F2;--amber:#B97F00;--amber-l:#FFF4DA;--gray:#5B6475;--line:#DCE1E8;--bg:#F6F7F9;--warn:#A4471A;--warn-l:#FDF0E7}
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Noto Sans JP','IPAGothic',sans-serif;color:var(--navy);background:#fff}
.canvas{width:1280px;padding:56px 64px 40px;background:#fff}
h1{font-size:40px;font-weight:900;letter-spacing:.02em;line-height:1.35}
.kicker{font-size:20px;font-weight:700;color:var(--teal);letter-spacing:.08em;margin-bottom:10px}
.lead{font-size:21px;color:var(--gray);margin-top:12px;line-height:1.6}
.src{margin-top:32px;padding-top:16px;border-top:1px solid var(--line);font-size:15px;color:#8A93A3}
.grid{display:grid;gap:20px}
.card{border:2px solid var(--line);border-radius:16px;padding:26px 28px;background:#fff}
.card h3{font-size:25px;font-weight:900;margin-bottom:12px}
.card p,.card li{font-size:20px;line-height:1.65}
ul{list-style:none}
li{position:relative;padding-left:26px}
li:before{content:'';position:absolute;left:4px;top:.62em;width:9px;height:9px;border-radius:50%;background:var(--teal)}
.tag{display:inline-block;font-size:16px;font-weight:700;padding:4px 12px;border-radius:999px;background:var(--teal-l);color:var(--teal)}
.note{font-size:18px;color:var(--gray);line-height:1.6}
table{border-collapse:separate;border-spacing:0;width:100%;font-size:20px}
th,td{padding:16px 20px;border-bottom:1px solid var(--line);text-align:left;vertical-align:middle;line-height:1.5}
thead th{background:var(--navy);color:#fff;font-weight:700}
thead th:first-child{border-top-left-radius:12px}
thead th:last-child{border-top-right-radius:12px}
tbody th{background:var(--bg);font-weight:700;width:250px}
.ok{color:var(--teal);font-weight:900}
.ng{color:#9AA3B2;font-weight:700}
.warnbox{background:var(--warn-l);border:2px solid #F2C6A8;border-radius:16px;padding:22px 26px}
.warnbox h3{color:var(--warn);font-size:23px;font-weight:900;margin-bottom:8px}
.warnbox li{font-size:20px;line-height:1.7}
.warnbox li:before{background:var(--warn)}
.arrow{font-size:40px;color:var(--teal);font-weight:900;display:flex;align-items:center;justify-content:center}
`;

const page = (inner) => `<!doctype html><html lang="ja"><head><meta charset="utf-8"><style>${CSS}</style></head><body><div class="canvas">${inner}<div class="src">${SRC}</div></div></body></html>`;

const figs = [];

// 01 アイキャッチ（1280×670 固定）
figs.push(['01_アイキャッチ', `<!doctype html><html lang="ja"><head><meta charset="utf-8"><style>${CSS}
.eye{width:1280px;height:670px;background:var(--navy);color:#fff;padding:72px 80px;position:relative;overflow:hidden}
.eye .k{font-size:24px;font-weight:700;color:#7FD3D3;letter-spacing:.1em}
.eye h1{font-size:62px;line-height:1.3;margin-top:22px;color:#fff}
.eye .q{margin-top:34px;font-size:27px;color:#D5DCE8;border-left:6px solid #7FD3D3;padding-left:20px;line-height:1.6}
.eye .by{position:absolute;left:80px;bottom:56px;font-size:22px;color:#AEB9CC}
.eye .flow{position:absolute;right:80px;bottom:52px;display:flex;gap:12px;align-items:center;font-size:24px;font-weight:900}
.eye .flow span.b{padding:10px 22px;border-radius:999px;background:#fff;color:var(--navy)}
.eye .flow span.a{color:#7FD3D3}
.eye .ring{position:absolute;right:-220px;top:-260px;width:520px;height:520px;border-radius:50%;border:70px solid rgba(127,211,211,.12)}
</style></head><body><div class="eye"><div class="ring"></div>
<div class="k">事業開発・マーケティングの実務目線で読む</div>
<h1>クリエイター向けアプリ<br>「KIVO TALK」の設計を読み解く</h1>
<div class="q">コンテンツを守るから、価値が生まれる。<br>価値があるから、対価が生まれる。<span style="font-size:19px;color:#AEB9CC">（公式のお知らせより）</span></div>
<div class="by">株式会社コホマダ</div>
<div class="flow"><span class="b">守る</span><span class="a">→</span><span class="b">価値</span><span class="a">→</span><span class="b">対価</span></div>
</div></body></html>`, { w: 1280, h: 670 }]);

// 02 コンセプト図
figs.push(['02_設計思想の全体像', page(`
<div class="kicker">FIG.1　設計思想の全体像</div>
<h1>「守る → 価値 → 対価」の順に、仕組みが並んでいる</h1>
<p class="lead">公式のコンセプト文を、アプリの主な仕組みに当てはめて整理しました（当社による整理です）。</p>
<div class="grid" style="grid-template-columns:1fr 60px 1fr 60px 1fr;margin-top:30px;align-items:stretch">
 <div class="card" style="border-color:var(--teal)"><span class="tag">STEP 1</span><h3 style="margin-top:12px">守る</h3><ul>
  <li>スクリーンショット・画面録画を制限</li><li>販売物はダウンロード・転送不可</li><li>招待制＋パスキー認証で入口を設計</li></ul></div>
 <div class="arrow">→</div>
 <div class="card" style="border-color:var(--teal)"><span class="tag">STEP 2</span><h3 style="margin-top:12px">価値が生まれる</h3><ul>
  <li>「ドロップ」で単品販売</li><li>「チャンネル」で継続的に届ける</li><li>「チャット」でファンとやり取り</li></ul></div>
 <div class="arrow">→</div>
 <div class="card" style="border-color:var(--teal)"><span class="tag">STEP 3</span><h3 style="margin-top:12px">対価が生まれる</h3><ul>
  <li>販売に応じて「Gem」を獲得</li><li>Gemの量で「ランク」が上がり、露出が広がる</li><li>Gemは銀行口座への振込を申請できる</li></ul></div>
</div>`)]);

// 03 基本情報と4つの機能
figs.push(['03_基本情報と4つの機能', page(`
<div class="kicker">FIG.2　KIVO TALKの基本情報</div>
<h1>招待制のクリエイターコンテンツプラットフォーム</h1>
<div class="grid" style="grid-template-columns:1.05fr 1fr;margin-top:28px">
 <table><tbody>
  <tr><th>運営会社</th><td>株式会社KIVO（東京都新宿区）</td></tr>
  <tr><th>設立</th><td>2026年3月</td></tr>
  <tr><th>iOS版</th><td>2026年6月 配信開始<br><span class="note">iPhoneのみ・iOS 15.5以降</span></td></tr>
  <tr><th>Android版</th><td>2026年8月10日 配信開始</td></tr>
  <tr><th>対応言語</th><td>日本語・繁体字中国語・英語</td></tr>
  <tr><th>利用条件</th><td><b>18歳以上の方のみ</b></td></tr>
  <tr><th>決済</th><td>Apple・Googleのアプリ内課金のみ</td></tr>
 </tbody></table>
 <div class="grid" style="grid-template-columns:1fr 1fr;align-content:start">
  <div class="card"><span class="tag">探す</span><h3 style="margin-top:10px">ディスカバー</h3><p>コンテンツを見つける</p></div>
  <div class="card"><span class="tag">単品で売る</span><h3 style="margin-top:10px">ドロップ</h3><p>1つずつ販売する</p></div>
  <div class="card"><span class="tag">続けて届ける</span><h3 style="margin-top:10px">チャンネル</h3><p>30日間のアクセス権で届ける</p></div>
  <div class="card"><span class="tag">話す</span><h3 style="margin-top:10px">チャット</h3><p>DM・グループでやり取り</p></div>
  <p class="note" style="grid-column:1/3">扱える形式の例：写真、漫画、レシピのPDF、歌の練習音声、短い動画など</p>
 </div>
</div>`)]);

// 04 保護の範囲と限界
figs.push(['04_コンテンツ保護の範囲と限界', page(`
<div class="kicker">FIG.3　「守る」の範囲と限界</div>
<h1>アプリ内の操作は制限。ただし過信は禁物</h1>
<div class="grid" style="grid-template-columns:1fr 1fr;margin-top:30px">
 <div class="card" style="border-color:var(--teal);background:var(--teal-l)">
  <h3>会社の説明で、制限されるとされているもの</h3>
  <table style="background:#fff;border-radius:12px;overflow:hidden"><tbody>
   <tr><th style="width:auto">スクリーンショット</th><td class="ok">制限</td></tr>
   <tr><th style="width:auto">画面録画</th><td class="ok">制限</td></tr>
   <tr><th style="width:auto">販売物のダウンロード</th><td class="ok">不可</td></tr>
   <tr><th style="width:auto">販売物の転送</th><td class="ok">不可</td></tr>
  </tbody></table>
 </div>
 <div class="warnbox">
  <h3>公開情報では確認できなかったこと</h3>
  <ul><li>別の端末で画面を撮影する、といった行為への対応</li><li>保護機能の限界についての公式の説明</li></ul>
  <p class="note" style="margin-top:18px;color:var(--warn)">アプリ内の操作を対象にした制限と考えられます（当社の理解であり、公式の説明ではありません）。</p>
 </div>
</div>
<div class="card" style="margin-top:22px;text-align:center"><p style="font-size:22px;font-weight:700">「流出のリスクを下げる工夫」と受け止め、過信しないのがおすすめです</p></div>`)]);

// 05 ゲストモードと招待登録
figs.push(['05_ゲストモードと招待登録の違い', page(`
<div class="kicker">FIG.4　入口の設計</div>
<h1>まずは「見るだけ」。使うには招待リンクから登録</h1>
<table style="margin-top:30px"><thead><tr><th>できること</th><th style="text-align:center">ゲストモード<br><span style="font-weight:400;font-size:16px">招待リンクなし</span></th><th style="text-align:center">招待リンクから登録</th></tr></thead><tbody>
 <tr><th>ディスカバーを見る</th><td style="text-align:center" class="ok">○</td><td style="text-align:center" class="ok">○</td></tr>
 <tr><th>コンテンツの購入</th><td style="text-align:center" class="ng">×</td><td style="text-align:center" class="ok">○</td></tr>
 <tr><th>投稿（販売）</th><td style="text-align:center" class="ng">×</td><td style="text-align:center" class="ok">○</td></tr>
 <tr><th>チャット</th><td style="text-align:center" class="ng">×</td><td style="text-align:center" class="ok">○</td></tr>
</tbody></table>
<div class="grid" style="grid-template-columns:1fr 1fr;margin-top:22px">
 <div class="card"><h3>パスキー認証</h3><p>電話番号・メールアドレスを登録せずに利用できます。</p></div>
 <div class="card"><h3>招待制のトレードオフ（当社の見方）</h3><p>コミュニティの空気感を保ちやすい一方、利用者が増えるスピードは緩やかになりやすいと考えられます。</p></div>
</div>
<p class="note" style="margin-top:16px">※登録・利用は18歳以上の方のみ</p>`)]);

// 06 ドロップとチャンネル
figs.push(['06_ドロップとチャンネルの違い', page(`
<div class="kicker">FIG.5　2つの売り方</div>
<h1>単品の「ドロップ」と、継続型の「チャンネル」</h1>
<table style="margin-top:30px"><thead><tr><th></th><th>ドロップ（単品販売）</th><th>チャンネル（継続型）</th></tr></thead><tbody>
 <tr><th>売り方</th><td>コンテンツを1つずつ販売</td><td>利用者がポイントで<b>30日間のアクセス権</b>を購入</td></tr>
 <tr><th>形式・内容</th><td>画像・動画・音声・PDF<br><span class="note">v1.3.0からEPUBにも対応</span></td><td>オーナー・管理者による投稿</td></tr>
 <tr><th>価格</th><td>自由に設定（0円も可）</td><td>ポイントで購入（自動更新なし）</td></tr>
 <tr><th>注意点</th><td>公開後、価格は<b>値上げのみ</b>可能。公開範囲・販売数は変更不可</td><td>開設には<b>サブスクリプションへの加入</b>が必要</td></tr>
</tbody></table>
<div class="card" style="margin-top:22px;display:flex;align-items:center;gap:22px;border-color:var(--teal)">
 <span class="tag" style="white-space:nowrap">当社の見方</span>
 <p style="font-size:21px"><b>まずは単品で反応を見る</b>　→　<b>手応えがあれば継続型へ</b>。小さく試す（スモールスタート）と相性の良い設計。ただし公開後は値下げできないため、最初の価格設定は慎重に。</p>
</div>`)]);

// 07 Gemとランク
figs.push(['07_Gemとランクと出金', page(`
<div class="kicker">FIG.6　Gemとランクの仕組み</div>
<h1>販売するとGemが貯まり、ランクと露出が上がる</h1>
<div class="grid" style="grid-template-columns:1.15fr 1fr;margin-top:30px;align-items:end">
 <div style="display:flex;gap:14px;align-items:flex-end;height:330px">
  ${[['Standard','0〜',90,'#C9D3DF'],['Bronze','10,000〜',160,'#C58B5A'],['Silver','100,000〜',235,'#9AA7B6'],['Gold','1,000,000〜',310,'#C9A227']].map(([n,v,h,c])=>`
  <div style="flex:1;text-align:center"><div style="font-size:21px;font-weight:900;margin-bottom:8px">${n}</div>
  <div style="height:${h}px;background:${c};border-radius:12px 12px 0 0;display:flex;align-items:flex-end;justify-content:center;padding-bottom:14px;color:#fff;font-weight:900;font-size:19px;text-shadow:0 1px 2px rgba(0,0,0,.35)">${v}</div></div>`).join('')}
 </div>
 <div class="card"><h3>出金（銀行振込）の条件</h3><ul>
  <li>保有Gemの<b>全額</b>を申請（一部のみは不可）</li><li>見込額<b>2,000円未満</b>は申請不可</li><li>原則、本人名義の国内口座<br><span class="note">事務所（代理店）所属の場合を除く</span></li><li>本人確認書類を求められる場合あり</li><li>通常3営業日以内に振込</li></ul></div>
</div>
<p class="note" style="margin-top:8px">ランクの基準はGem数。上位ランクほど露出が広がるとされています。</p>
<div class="warnbox" style="margin-top:20px"><h3>公開されていない情報（2026年10月14日時点）</h3>
 <ul style="display:flex;gap:40px"><li>売上に対する手数料率</li><li>Gemから円への換算率</li><li>振込手数料の金額</li></ul></div>`)]);

// 08 料金とプラン
figs.push(['08_料金とプランの違い', page(`
<div class="kicker">FIG.7　料金とプラン</div>
<h1>アプリは無料。必要に応じてポイントとサブスク</h1>
<div class="grid" style="grid-template-columns:1fr 1fr 1fr;margin-top:30px">
 <div class="card" style="text-align:center"><span class="tag">アプリ</span><p style="font-size:44px;font-weight:900;margin:14px 0 4px">無料</p><p class="note">ダウンロード・ゲストモード</p></div>
 <div class="card" style="text-align:center"><span class="tag">ポイント</span><p style="font-size:30px;font-weight:900;margin:16px 0 4px">50pt＝50円〜<br>15,000pt＝15,000円</p><p class="note">1pt＝1円相当</p></div>
 <div class="card" style="text-align:center;border-color:var(--teal)"><span class="tag">サブスクリプション</span><p style="font-size:30px;font-weight:900;margin:16px 0 4px">月額500円<br>年額5,000円</p><p class="note">税込・自動更新・日割り返金なし</p></div>
</div>
<table style="margin-top:26px"><thead><tr><th>プランによる違い</th><th style="text-align:center">ベーシック</th><th style="text-align:center">サブスクリプション</th></tr></thead><tbody>
 <tr><th>チャンネルの作成</th><td style="text-align:center" class="ng">×</td><td style="text-align:center" class="ok">○</td></tr>
 <tr><th>自分の招待リンク</th><td style="text-align:center">1回のみ</td><td style="text-align:center" class="ok">何人でも・何回でも</td></tr>
 <tr><th>ドロップ等のリンクを<br>招待リンクとして使う</th><td style="text-align:center" class="ng">×</td><td style="text-align:center" class="ok">○</td></tr>
</tbody></table>
<p class="note" style="margin-top:14px">※購入確定後のキャンセル・ポイントの返還はできません。</p>`)]);

// 09 始め方3ステップ
figs.push(['09_始め方3ステップ', page(`
<div class="kicker">FIG.8　始め方の目安</div>
<h1>「見るだけ」から、無理なく3ステップ</h1>
<div class="grid" style="grid-template-columns:1fr 50px 1fr 50px 1fr;margin-top:32px;align-items:stretch">
 ${[['1','見てみる','アプリをインストールし、ゲストモードでディスカバーを眺めて雰囲気を確かめる'],['2','登録する','合いそうだと感じたら、招待リンクから登録（パスキー認証のため電話番号・メール不要）'],['3','小さく試す','0円や少額のドロップで、反応を見てみる']].map(([n,t,d],i)=>`
 ${i?'<div class="arrow">→</div>':''}<div class="card" style="border-color:var(--teal)"><div style="width:56px;height:56px;border-radius:50%;background:var(--teal);color:#fff;font-size:28px;font-weight:900;display:flex;align-items:center;justify-content:center">${n}</div><h3 style="margin-top:16px">${t}</h3><p>${d}</p></div>`).join('')}
</div>
<div class="card" style="margin-top:22px;background:var(--bg);border-color:var(--bg)"><p style="font-size:20px">継続的にファンと関係を築きたくなったら、チャンネルを開設できるサブスクリプションを検討する、という順番が無理のない進め方です（当社の見方）。</p></div>
<p class="note" style="margin-top:14px">※KIVO TALKは18歳以上の方のみご利用いただけます。</p>`)]);

(async () => {
  const browser = await chromium.launch();
  for (const [name, html, size] of figs) {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: size ? size.h : 800 }, deviceScaleFactor: 2 });
    const p = await ctx.newPage();
    await p.setContent(html, { waitUntil: 'networkidle' });
    await p.evaluate(() => document.fonts.ready);
    const el = await p.$(size ? '.eye' : '.canvas');
    await el.screenshot({ path: path.join(OUT, `${name}.png`) });
    await ctx.close();
    console.log('ok', name);
  }
  await browser.close();
})();
