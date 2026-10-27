// Birdly紹介note記事 図解の生成スクリプト
// 実行: NODE_PATH=$(npm root -g) node figures.mjs <出力ディレクトリ>
import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const out = process.argv[2] || '.';

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700;900&display=swap');
:root{
  --bg:#F4F7FB; --surface:#FFFFFF; --ink:#1B2533; --ink2:#4A5566; --muted:#7A8596;
  --line:#D9E1EC; --sky:#1F6FB2; --sky-soft:#E3EFFA; --sky-deep:#0F4C81;
  --sun:#E58A2E; --sun-soft:#FCEFE1; --gray-soft:#ECEFF3;
}
*{box-sizing:border-box;margin:0;padding:0}
body{background:var(--bg);font-family:'Noto Sans JP','IPAPGothic',sans-serif;color:var(--ink);width:1280px}
#c{width:1280px;padding:56px 64px 44px;background:var(--bg)}
.kicker{font-size:20px;font-weight:700;color:var(--sky);letter-spacing:.08em;margin-bottom:10px}
h1{font-size:40px;font-weight:900;line-height:1.35;margin-bottom:8px}
.lead{font-size:22px;color:var(--ink2);line-height:1.6;margin-bottom:32px}
.src{margin-top:28px;font-size:16px;color:var(--muted);line-height:1.6;border-top:1px solid var(--line);padding-top:14px}
.card{background:var(--surface);border:1px solid var(--line);border-radius:18px;padding:26px 28px}
.row{display:flex;gap:20px}
.tag{display:inline-block;white-space:nowrap;font-size:16px;font-weight:700;padding:4px 12px;border-radius:999px;background:var(--sky-soft);color:var(--sky-deep)}
.arrow{display:flex;align-items:center;justify-content:center;color:var(--sky);font-size:40px;font-weight:900;flex:0 0 44px}
.brand{position:absolute;right:64px;bottom:18px;font-size:14px;color:var(--muted)}
`;

const page = (body) => `<!doctype html><html lang="ja"><head><meta charset="utf-8"><style>${CSS}</style></head><body><div id="c" style="position:relative">${body}<div class="brand">株式会社コホマダ</div></div></body></html>`;

const figs = {};

/* 00 見出し画像 1280x670 */
figs['00_見出し画像'] = `<!doctype html><html lang="ja"><head><meta charset="utf-8"><style>${CSS}
#c{width:1280px;height:670px;padding:0;position:relative;overflow:hidden;background:linear-gradient(160deg,#0F4C81 0%,#1F6FB2 55%,#5FA3D9 100%)}
.t{position:absolute;left:80px;top:150px;color:#fff}
.t .k{font-size:26px;font-weight:700;letter-spacing:.12em;opacity:.9;margin-bottom:22px}
.t h1{font-size:62px;line-height:1.3;font-weight:900;color:#fff;margin-bottom:28px}
.t p{font-size:28px;font-weight:500;opacity:.95}
.bird{position:absolute;right:70px;top:80px;opacity:.95}
.foot{position:absolute;left:80px;bottom:52px;color:#fff;font-size:22px;opacity:.85}
</style></head><body><div id="c">
<svg class="bird" width="460" height="300" viewBox="0 0 460 300" fill="none">
  <path d="M20 170 C120 90 190 90 230 150 C270 90 340 90 440 170 C350 140 290 150 230 195 C170 150 110 140 20 170Z" fill="#fff" opacity=".92"/>
  <path d="M60 250 C140 225 320 225 400 250" stroke="#fff" stroke-width="3" stroke-dasharray="2 12" stroke-linecap="round" opacity=".7"/>
  <path d="M90 280 C170 262 290 262 370 280" stroke="#fff" stroke-width="3" stroke-dasharray="2 12" stroke-linecap="round" opacity=".5"/>
</svg>
<div class="t"><div class="k">スイス発 全身で飛ぶVR体験</div>
<h1>鳥になって、<br>自分の街の上を飛ぶ。</h1>
<p>「Birdly」開発元に聞いた、成功する施設の条件</p></div>
<div class="foot">株式会社コホマダ</div>
</div></body></html>`;

/* 01 体験のしくみ */
figs['01_体験のしくみ'] = page(`
<div class="kicker">Birdlyとは</div>
<h1>体の動きが、そのまま飛行になる</h1>
<p class="lead">コントローラーは持たず、全身で操作します。腕・機体・映像・風が連動します。</p>
<div class="row" style="align-items:stretch">
  ${[
    ['1','うつ伏せになる','機体の上に<br>うつ伏せになり、<br><b>両腕が翼</b>になります'],
    ['2','腕を動かす','腕の動きで<br><b>旋回・上昇</b><br>します'],
    ['3','映像と連動する','機体が動きに<br>合わせて傾き、<br><b>映像と同期</b>します'],
    ['4','風を感じる','飛ぶ速さに<br>合わせて<br><b>顔に風</b>が当たります'],
  ].map(([n,t,d],i)=>`
  ${i?'<div class="arrow">＋</div>':''}
  <div class="card" style="flex:1;text-align:center;padding:30px 18px">
    <div style="width:56px;height:56px;border-radius:50%;background:var(--sky);color:#fff;font-size:28px;font-weight:900;display:flex;align-items:center;justify-content:center;margin:0 auto 16px">${n}</div>
    <div style="font-size:25px;font-weight:900;margin-bottom:12px;white-space:nowrap">${t}</div>
    <div style="font-size:19px;line-height:1.65;color:var(--ink2)">${d}</div>
  </div>`).join('')}
</div>
<div class="card" style="margin-top:22px;background:var(--sky-soft);border-color:#C5DCF2;display:flex;align-items:center;gap:22px;padding:22px 28px">
  <div class="tag" style="background:#fff">同社の説明</div>
  <div style="font-size:22px;line-height:1.6"><b>体の感覚と映像が一致する</b>ため、数秒で技術の存在を忘れ、飛ぶことに没入するといいます。</div>
</div>
<div class="src">※乗り物酔いの感じ方には個人差があります。利用条件（姿勢・身長・体重など）は導入検討時に開発元へご確認ください。</div>
`);

/* 02 沿革 */
const tl = [
  ['研究','チューリッヒ芸術大学<br>（ZHdK）の研究<br>プロジェクトから誕生'],
  ['2014','SIGGRAPH<br>（バンクーバー）で<br>Laval Virtual賞を受賞'],
  ['2015','サンダンス映画祭<br>「New Frontier」<br>で展示'],
  ['2015','SOMNIACS社として<br>大学から<br>スピンオフ'],
  ['公式サイト掲載','17か国に<br>60台以上と紹介<br>（時期の記載なし）'],
];
figs['02_沿革'] = page(`
<div class="kicker">誕生の経緯</div>
<h1>大学の研究から、世界の施設へ</h1>
<p class="lead">アートと技術の研究から生まれ、国際的な場で評価されてきました。</p>
<div style="position:relative;padding-top:10px">
  <div style="position:absolute;left:60px;right:60px;top:67px;height:4px;background:var(--sky);border-radius:2px"></div>
  <div class="row" style="gap:16px">
  ${tl.map(([y,d])=>`
    <div style="flex:1;text-align:center;position:relative">
      <div style="font-size:24px;font-weight:900;color:var(--sky-deep);margin-bottom:12px">${y}</div>
      <div style="width:22px;height:22px;border-radius:50%;background:#fff;border:5px solid var(--sky);margin:0 auto 18px"></div>
      <div class="card" style="padding:20px 14px;font-size:18px;line-height:1.6;min-height:140px">${d}</div>
    </div>`).join('')}
  </div>
</div>
<div class="src">出典：birdly.com、ACM SIGGRAPH公式ブログ（2014年8月14日）、Sundance Institute アーカイブ、ZHdK。設置台数は公式サイトの掲載で、掲載時期は<br>明記されておらず、最新の台数とは異なる可能性があります。</div>
`);

/* 03 成功と失敗 */
const sf = [
  ['位置づけ','施設の<b>「目玉」</b>として扱う','たくさんある機械の一つとして<b>隅に置く</b>'],
  ['人','<b>案内役</b>が一人ひとりを出迎え、体験を説明する','<b>案内役がいない</b>'],
  ['周辺の設計','置き場所・見せ方・予約・持ち帰るものまで<br><b>体験の流れを設計し、宣伝する</b>','コンテンツが<b>更新されない</b>'],
  ['物語','施設の物語と<b>結びつけて</b>見せる<span style="font-size:15px;color:var(--muted)">（当社の整理）</span>','施設自身の物語と<b>結びつけられていない</b>'],
];
figs['03_成功と失敗の違い'] = page(`
<div class="kicker">成功する施設と「静かに失敗する」施設</div>
<h1>差は、機械ではなく「扱い方」にある</h1>
<p class="lead">ハードウェアは同じように動き続けます。違いは、意味を持たせているかどうかです。</p>
<div style="display:grid;grid-template-columns:170px 1fr 1fr;gap:12px 16px;align-items:stretch">
  <div></div>
  <div style="background:var(--sky);color:#fff;border-radius:14px;padding:16px 22px;font-size:24px;font-weight:900">◎ うまくいく施設</div>
  <div style="background:#8A94A3;color:#fff;border-radius:14px;padding:16px 22px;font-size:24px;font-weight:900">△ 静かに失敗する施設</div>
  ${sf.map(([k,a,b])=>`
  <div style="display:flex;align-items:center;font-size:21px;font-weight:700;color:var(--ink2)">${k}</div>
  <div class="card" style="padding:18px 22px;font-size:20px;line-height:1.6;border-left:6px solid var(--sky)">${a}</div>
  <div class="card" style="padding:18px 22px;font-size:20px;line-height:1.6;background:var(--gray-soft);border-left:6px solid #8A94A3;color:var(--ink2)">${b}</div>`).join('')}
  <div></div>
  <div style="padding:14px 22px;font-size:20px;font-weight:700;color:var(--sky-deep)">→ 高い満足度と、見通しの立つチケット収入</div>
  <div style="padding:14px 22px;font-size:20px;font-weight:700;color:var(--ink2)">→ 機械は動くが、「意味」を持たない</div>
</div>
<div class="src">出典：開発元SOMNIACS社 Panteli氏の回答（当社訳・要約）。項目ごとの対比と、「物語」の行の左側は当社による整理です。</div>
`);

/* 04 メルボルン事例 */
const kpi = [
  ['売上','30万','米ドル超',''],
  ['ダ・ヴィンチのエリアの<br>滞在時間','+15','%',''],
  ['来場者満足度','4.8','／5',''],
  ['SNSでのシェア','500+','増加','資料の表記（単位・比較対象の記載なし）'],
];
const ops = [['料金','1回13米ドル'],['体験時間','3分'],['オペレーター','1シフト1名'],['設置','約2時間'],['処理能力','約160回／日'],['停止時間','1%未満']];
figs['04_メルボルン事例'] = page(`
<div class="kicker">事例：THE LUME（オーストラリア・メルボルン）</div>
<h1>展覧会の物語に組み込んだ、3分間のフライト</h1>
<p class="lead">Grande Experiences社「Leonardo da Vinci — 500 Years of Genius」展（資料の対象期間：2024年3月〜12月）</p>
<div class="card" style="display:flex;align-items:center;gap:20px;margin-bottom:22px;padding:20px 26px">
  <div class="tag">つくったもの</div>
  <div style="font-size:21px;line-height:1.6">レオナルドゆかりの街、<b>現代のフィレンツェ上空</b>を飛び、<br><b>レオナルドの飛行機械</b>に出会うオリジナル体験</div>
</div>
<div style="font-size:20px;font-weight:700;color:var(--ink2);margin-bottom:12px">資料に記載された成果</div>
<div class="row" style="gap:16px;margin-bottom:22px">
  ${kpi.map(([l,v,u,n])=>`
  <div class="card" style="flex:1;padding:22px 22px">
    <div style="font-size:17px;color:var(--ink2);line-height:1.4;min-height:48px">${l}</div>
    <div style="display:flex;align-items:baseline;gap:6px;margin-top:6px"><span style="font-size:56px;font-weight:900;color:var(--ink);letter-spacing:-.01em">${v}</span><span style="font-size:22px;font-weight:700;color:var(--ink2)">${u}</span></div>
    ${n?`<div style="font-size:14px;color:var(--muted);margin-top:4px">${n}</div>`:''}
  </div>`).join('')}
</div>
<div style="font-size:20px;font-weight:700;color:var(--ink2);margin-bottom:12px">運営の実際</div>
<div style="display:grid;grid-template-columns:repeat(6,1fr);gap:0;background:var(--surface);border:1px solid var(--line);border-radius:18px;overflow:hidden">
  ${ops.map(([k,v],i)=>`<div style="padding:18px 14px;text-align:center;${i?'border-left:1px solid var(--line);':''}"><div style="font-size:16px;color:var(--muted);margin-bottom:6px">${k}</div><div style="font-size:21px;font-weight:700;white-space:nowrap">${v}</div></div>`).join('')}
</div>
<div class="src">出典：SOMNIACS社提供の事例資料「Case Study: Grande Experiences」（同社の許諾を得て掲載）。開発元作成の資料の記載であり、当社は独自に検証していません。売上の定義や満足度の測定方法は資料に記載がありません。</div>
`);

/* 05 Birdly World */
figs['05_BirdlyWorldのしくみ'] = page(`
<div class="kicker">Birdly World</div>
<h1>映像を撮らずに、「自分の地域の空」をつくる</h1>
<p class="lead">Google Earthの3Dデータを使うため、新たな撮影・映像制作がいらないとされています。</p>
<div class="row" style="align-items:stretch">
  <div class="card" style="flex:1">
    <div class="tag">1　素材</div>
    <div style="font-size:26px;font-weight:900;margin:16px 0 10px">Google Earthの<br>3Dデータ</div>
    <div style="font-size:19px;line-height:1.65;color:var(--ink2)">世界の街の立体データをもとに飛行空間をつくる</div>
  </div>
  <div class="arrow">›</div>
  <div class="card" style="flex:1.35">
    <div class="tag">2　エディターで編集</div>
    <div style="font-size:26px;font-weight:900;margin:16px 0 14px">施設側で中身を加える</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
      ${['ランドマーク','ロゴ','マーカー','ポータル（別の場所への入口）','宝探しゲーム','内容は何度でも変更'].map(x=>`<div style="background:var(--sky-soft);border-radius:10px;padding:10px 12px;font-size:18px;font-weight:700;color:var(--sky-deep)">${x}</div>`).join('')}
    </div>
  </div>
  <div class="arrow">›</div>
  <div class="card" style="flex:1;background:var(--sky);border-color:var(--sky);color:#fff">
    <div class="tag" style="background:#fff">3　体験</div>
    <div style="font-size:26px;font-weight:900;margin:16px 0 10px">来場者が<br>地元の上空を飛ぶ</div>
    <div style="font-size:19px;line-height:1.65;opacity:.95">名所めぐり・周遊のきっかけづくりなど（活用イメージ）</div>
  </div>
</div>
<div class="row" style="margin-top:20px;gap:16px">
  <div class="card" style="flex:1;padding:18px 24px;font-size:19px;line-height:1.6"><b>取り組み中：</b>実在の場所を高精細に再現する「3D Gaussian Splatting（3DGS）」の導入を進めているそうです</div>
  <div class="card" style="flex:1;padding:18px 24px;font-size:19px;line-height:1.6"><b>オリジナル制作：</b>完全オリジナルのコンテンツを制作することも可能です</div>
</div>
<div class="src">出典：開発元の回答、blooloop（2024年2月29日）、The VR Collective（2026年1月4日）。対象地域や再現の細かさは、事前に開発元へご確認ください。</div>
`);

/* 06 施設タイプ別 */
const ft = [
  ['自治体・観光施設<br>展望台・空港','Birdly World','地元の名所の上空を飛ぶ。宝探しで周遊のきっかけをつくる'],
  ['水族館・動物園','Paradise Lost','ウミガメになって海を泳ぐ'],
  ['博物館・科学館','Jurassic Flight／Insects ほか','翼竜になって太古の世界を飛ぶ、蝶になって飛ぶ、渡り鳥の旅を体験する（同社によれば）'],
  ['ホテル・商業施設<br>エンタメ施設','Wingsuit Racer','タイムを競うゲーム型の体験'],
];
figs['06_施設タイプ別の活用'] = page(`
<div class="kicker">活用イメージ</div>
<h1>施設のタイプごとに、合う体験がある</h1>
<p class="lead">都市の上空を飛ぶだけでなく、海・太古の世界・ゲームなど、コンテンツは多様です。</p>
<div style="display:grid;grid-template-columns:1fr 1fr;gap:18px">
  ${ft.map(([f,c,d])=>`
  <div class="card" style="display:flex;gap:20px;align-items:flex-start">
    <div style="flex:0 0 200px;font-size:22px;font-weight:900;line-height:1.45;color:var(--sky-deep)">${f}</div>
    <div style="flex:1"><div class="tag" style="margin-bottom:10px">${c}</div><div style="font-size:19px;line-height:1.6;color:var(--ink2)">${d}</div></div>
  </div>`).join('')}
</div>
<div class="src">当社による活用イメージです。コンテンツ名は birdly.com・support.birdly.com の掲載にもとづきます。</div>
`);

/* 07 設置と運営 */
figs['07_導入前のチェック'] = page(`
<div class="kicker">導入前に知っておきたいこと</div>
<h1>見落としがちなのは「運営そのもの」</h1>
<p class="lead">機械を置くだけでなく、スペース・人・手順をセットで考える必要があります。</p>
<div class="row" style="align-items:stretch;gap:24px">
  <div class="card" style="flex:1.05;padding:24px">
    <div style="font-size:21px;font-weight:900;margin-bottom:14px">スペースの考え方（平面イメージ）</div>
    <svg width="100%" viewBox="0 0 520 380">
      <rect x="6" y="6" width="508" height="368" rx="16" fill="#ECEFF3" stroke="#C3CBD6" stroke-dasharray="8 6" stroke-width="2"/>
      <text x="24" y="40" font-size="18" fill="#4A5566" font-weight="700">待機列・見学スペース（別途必要）</text>
      <rect x="140" y="80" width="240" height="240" rx="12" fill="#E3EFFA" stroke="#1F6FB2" stroke-width="3"/>
      <text x="260" y="112" text-anchor="middle" font-size="18" fill="#0F4C81" font-weight="700">ユニット 約3m×3m</text>
      <rect x="195" y="138" width="130" height="147" rx="10" fill="#1F6FB2"/>
      <text x="260" y="206" text-anchor="middle" font-size="16" fill="#fff" font-weight="700">本体</text>
      <text x="260" y="228" text-anchor="middle" font-size="14" fill="#fff">約2.1m×1.4m</text>
      <text x="40" y="355" font-size="15" fill="#7A8596">※図は位置関係のイメージで、縮尺は正確ではありません</text>
    </svg>
  </div>
  <div style="flex:1;display:flex;flex-direction:column;gap:14px">
    ${[
      ['案内役','フライトごとに体験者に付き添う案内役が必要<br>（公式サイトには1名で最大4台まで担当可との記載）'],
      ['ルーティン','体験者ごとの説明と清掃の手順を決めておく'],
      ['見せ方・宣伝','目立つ場所に置き、宣伝する。録画機能「Birdly Moments」の映像が次の来場者を呼ぶことも'],
      ['設置条件','具体的な設置条件は、導入検討時に開発元へ確認'],
    ].map(([k,v])=>`
    <div class="card" style="padding:16px 22px;display:flex;gap:16px;align-items:center;flex:1">
      <div style="flex:0 0 30px;height:30px;border-radius:8px;border:3px solid var(--sky);display:flex;align-items:center;justify-content:center;color:var(--sky);font-weight:900">✓</div>
      <div><div style="font-size:20px;font-weight:900;margin-bottom:4px">${k}</div><div style="font-size:17px;line-height:1.55;color:var(--ink2)">${v}</div></div>
    </div>`).join('')}
  </div>
</div>
<div class="src">出典：開発元の回答（約3m×3m・運営面）、birdly.com（本体寸法 L2100×W1400mm）。</div>
`);

/* 08 ご相談の流れ */
figs['08_ご相談の流れ'] = page(`
<div class="kicker">導入のご相談</div>
<h1>日本語で相談し、開発元へつなぐ</h1>
<p class="lead">情報収集の段階でもご相談いただけます。</p>
<div class="row" style="align-items:stretch">
  <div class="card" style="flex:1;text-align:center">
    <div style="font-size:18px;color:var(--muted);margin-bottom:8px">ご相談者</div>
    <div style="font-size:28px;font-weight:900;margin-bottom:14px">施設・自治体の<br>ご担当者</div>
    <div style="font-size:18px;line-height:1.65;color:var(--ink2)">施設の種類・地域・<br>検討時期などを<br>お知らせください</div>
  </div>
  <div class="arrow">›</div>
  <div class="card" style="flex:1.1;text-align:center;background:var(--sky);border-color:var(--sky);color:#fff">
    <div style="font-size:18px;opacity:.9;margin-bottom:8px">紹介者</div>
    <div style="font-size:28px;font-weight:900;margin-bottom:14px">株式会社コホマダ</div>
    <div style="font-size:18px;line-height:1.65;opacity:.95">日本語での事前のご相談<br>開発元へのお取り次ぎ</div>
  </div>
  <div class="arrow">›</div>
  <div class="card" style="flex:1;text-align:center">
    <div style="font-size:18px;color:var(--muted);margin-bottom:8px">開発元（スイス）</div>
    <div style="font-size:28px;font-weight:900;margin-bottom:14px">SOMNIACS社</div>
    <div style="font-size:18px;line-height:1.65;color:var(--ink2)">製品の仕様・価格・契約<br>のご案内</div>
  </div>
</div>
<div class="card" style="margin-top:22px;padding:18px 26px;font-size:19px;line-height:1.6;background:var(--sun-soft);border-color:#F3D3AE">
  コホマダはBirdlyの<b>販売代理店ではありません</b>。お問い合わせは記事末尾のフォームから（「お問い合わせ内容」に「Birdly」とご記入ください）。
</div>
`);

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 2 });
const p = await ctx.newPage();
for (const [name, html] of Object.entries(figs)) {
  await p.setContent(html, { waitUntil: 'networkidle' });
  await p.evaluate(() => document.fonts.ready);
  const el = await p.$('#c');
  const file = path.join(out, `${name}.png`);
  await el.screenshot({ path: file });
  fs.writeFileSync(path.join(out, 'src', `${name}.html`), html);
  console.log('wrote', file);
}
await browser.close();
