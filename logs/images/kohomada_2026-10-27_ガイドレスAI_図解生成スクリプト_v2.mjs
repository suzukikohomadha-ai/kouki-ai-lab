import { createRequire } from 'module'; const { chromium } = createRequire('/opt/node22/lib/node_modules/')('playwright');
const OUT = '/home/user/kouki-ai-lab/logs/images';
const P = 'kohomada_2026-10-27_ガイドレスAI_';
const css = `
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'IPAPGothic','IPAGothic',sans-serif;background:#fff;color:#1d2433;width:1200px}
.wrap{padding:44px 48px 0}
h1{font-size:40px;color:#1f5fae;letter-spacing:.02em}
.sub{font-size:21px;color:#5a6577;margin:10px 0 26px}
table{width:100%;border-collapse:separate;border-spacing:0;font-size:21px;border:2px solid #c9d6ea;border-radius:14px;overflow:hidden}
th,td{padding:15px 18px;border-bottom:1px solid #dfe6f1;vertical-align:middle;line-height:1.5}
tr:last-child td{border-bottom:none}
th{background:#1f5fae;color:#fff;font-size:22px;text-align:left}
td.k{background:#f2f6fc;font-weight:bold;color:#1f5fae;width:26%}
.c{text-align:center}
.yes{color:#1f5fae;font-weight:bold}.no{color:#9aa3b2}
.tag{display:inline-block;background:#fdeee3;color:#c85d16;border-radius:6px;padding:1px 8px;font-size:17px;margin-left:6px;font-weight:bold}
.note{font-size:17px;color:#5a6577;margin-top:14px;line-height:1.7}
.src{font-size:16px;color:#5a6577;padding:20px 48px 0}.foot{margin-top:10px;background:#1f5fae;color:#fff;font-size:21px;font-weight:bold;padding:16px 48px;line-height:1.5}
.cols{display:flex;gap:24px}
.col{flex:1;border-radius:14px;padding:22px 24px;border:2px solid}
.col h2{font-size:25px;margin-bottom:14px}
.col li{list-style:none;font-size:20px;line-height:1.6;padding:9px 0 9px 36px;position:relative;border-bottom:1px dashed #d5dbe5}
.col li:last-child{border-bottom:none}
.col li:before{position:absolute;left:0;top:9px;font-weight:bold;font-size:22px}
.good{border-color:#1f5fae;background:#f4f8fd}.good h2{color:#1f5fae}.good li:before{content:'✓';color:#1f5fae}
.chk{border-color:#ee7a2f;background:#fff8f3}.chk h2{color:#c85d16}.chk li:before{content:'!';color:#ee7a2f;left:8px}
.col li small{display:block;font-size:16px;color:#5a6577}
`;
const foot = `<div class="src">※Guideless公式サイト等で確認した内容です（2026年10月時点）</div><div class="foot">【広告】株式会社コホマダ（Guideless 日本市場 独占販売代理店）作成｜2026年10月時点</div>`;
const page = (body) => `<!doctype html><html lang="ja"><head><meta charset="utf-8"><style>${css}</style></head><body><div class="wrap">${body}</div>${foot}</body></html>`;

const fig1 = page(`
<h1>Guidelessの主な機能</h1>
<p class="sub">公式サイトに記載されている機能を、目的別に整理しました</p>
<table>
<tr><th style="width:26%">目的</th><th style="width:27%">機能</th><th>できること</th></tr>
<tr><td class="k" rowspan="2">作る</td><td>操作の記録</td><td>Chrome拡張機能で、いつも通りのブラウザ操作を記録。話す必要はない</td></tr>
<tr><td>AIによる生成</td><td>各ステップの説明文・音声ナレーション・字幕をAIが作成。ロゴなどのブランド設定も適用</td></tr>
<tr><td class="k" rowspan="3">直す・整える</td><td>AIエディタ</td><td>画面が変わったとき、変更があったステップだけを作り直せる</td></tr>
<tr><td>注釈</td><td>スクリーンショットに注釈を入れられる</td></tr>
<tr><td>機密情報のぼかし</td><td>見せたくない情報をぼかす。同じ情報は他のステップにも自動で反映</td></tr>
<tr><td class="k" rowspan="3">届ける</td><td>共有・書き出し</td><td>リンク共有、Webサイトやヘルプセンターへの埋め込み、PDF・Markdown・MP4で書き出し<span class="tag">MP4は有料</span></td></tr>
<tr><td>翻訳・多言語ナレーション</td><td>翻訳に対応。AIナレーションは42以上の言語に対応（公式サイト。報道では40以上）</td></tr>
<tr><td>閲覧分析</td><td>視聴数・完了率・離脱箇所などを確認<span class="tag">有料</span></td></tr>
<tr><td class="k">チームで使う</td><td>チーム共有・外部連携</td><td>チームの共有ワークスペース。Slack・Notion・Confluenceと連携</td></tr>
</table>
<p class="note">※AIナレーションに日本語が含まれるか、管理画面の日本語対応は、当社では未確認です。</p>
`);

const Y='<span class="yes">○</span>', N='<span class="no">×</span>';
const fig2 = page(`
<h1>料金プランの比較</h1>
<p class="sub">2026年10月時点・Guideless公式の料金ページより</p>
<table>
<tr><th style="width:25%"></th><th class="c">Free</th><th class="c">Pro</th><th class="c">Enterprise</th></tr>
<tr><td class="k">料金</td><td class="c"><b>$0</b></td><td class="c"><b>$39</b><br><small>1人（クリエイター）あたり／月<br>年払いで20%割引</small></td><td class="c"><b>個別見積</b></td></tr>
<tr><td class="k">ユーザー数</td><td class="c">1人</td><td class="c">10人まで</td><td class="c">無制限</td></tr>
<tr><td class="k">ワークスペース</td><td class="c">1つ</td><td class="c">1つ</td><td class="c">複数</td></tr>
<tr><td class="k">公開できるガイド</td><td class="c">3本まで</td><td class="c">無制限</td><td class="c">無制限</td></tr>
<tr><td class="k">AIナレーション</td><td class="c">利用可</td><td class="c">無制限</td><td class="c">無制限</td></tr>
<tr><td class="k">MP4書き出し</td><td class="c">${N}</td><td class="c">${Y}<br><small>4Kまで</small></td><td class="c">${Y}</td></tr>
<tr><td class="k">透かしの削除</td><td class="c">${N}</td><td class="c">${Y}</td><td class="c">${Y}</td></tr>
<tr><td class="k">閲覧分析</td><td class="c">${N}</td><td class="c">${Y}</td><td class="c">${Y}</td></tr>
<tr><td class="k">SSO・データ所在地指定<br>カスタムドメイン<br>専任サポート</td><td class="c">${N}</td><td class="c">${N}</td><td class="c">${Y}</td></tr>
</table>
<p class="note">※Freeは期限なし（公式は「時間制限のあるトライアルではない」と明記）。EnterpriseはProの全機能を含みます（公式）。<br>※価格は公式ページで「$」表記（通貨名の明記なし）。日本円での負担は為替によって変わります。<br>※Proの無料トライアルの記載はありません。最新の料金・条件は必ず公式の料金ページでご確認ください。</p>
`);

const fig3 = page(`
<h1>Guidelessは自社に合う？</h1>
<p class="sub">導入前に、両方の列を確認してみてください</p>
<div class="cols">
<div class="col good"><h2>向いていると思う方</h2><ul>
<li>業務がブラウザ上でほぼ完結している<small>Google Workspace、Notion、クラウドサービスの管理画面など</small></li>
<li>手順書を「書く」より「操作して見せる」方が早い</li>
<li>画面変更のたびにマニュアルを作り直すのがつらい</li>
<li>ヘルプや顧客向けの説明動画を、外注せず社内で作りたい</li>
<li>英語の画面に抵抗がない</li>
</ul></div>
<div class="col chk"><h2>導入前に確認していただきたい点</h2><ul>
<li>記録できるのはブラウザ（Chrome）上の操作<small>第三者レビューより。デスクトップアプリの操作には向かないと考えられます</small></li>
<li>公式サイト・ヘルプは英語<small>管理画面の日本語対応は当社では未確認</small></li>
<li>AIナレーションは固有名詞を読み間違えることがある<small>第三者レビューの指摘。公開前に聞き直しを</small></li>
<li>動画のタイムライン編集はできない<small>第三者レビューより</small></li>
<li>運営元はプレシード段階のスタートアップ<small>報道より。決済は「$」建て、利用規約はリトアニア法準拠</small></li>
</ul></div>
</div>
`);

const fig4 = `<!doctype html><html lang="ja"><head><meta charset="utf-8"><style>${css}
.dia{position:relative;height:540px;margin-top:6px}
.box{position:absolute;border-radius:16px;border:3px solid;padding:18px 20px;text-align:center;background:#fff}
.box b{display:block;font-size:26px;margin-bottom:6px}
.box span{font-size:18px;color:#5a6577;line-height:1.5}
.reader{left:0;top:190px;width:250px;border-color:#5a6577}
.gl{left:470px;top:0;width:620px;border-color:#1f5fae;background:#f4f8fd}
.kh{left:470px;top:350px;width:620px;border-color:#ee7a2f;background:#fff8f3}
.gl b{color:#1f5fae}.kh b{color:#c85d16}
.ar{position:absolute;font-size:18px;font-weight:bold;line-height:1.4}
svg{position:absolute;left:0;top:0}
</style></head><body><div class="wrap">
<h1>申込み・支払い・お問い合わせの流れ</h1>
<p class="sub">誰と契約し、どこに問い合わせればよいかを整理しました</p>
<div class="dia">
<svg width="1104" height="560" viewBox="0 0 1104 560">
<defs><marker id="b" markerUnits="userSpaceOnUse" markerWidth="22" markerHeight="22" refX="20" refY="11" orient="auto"><path d="M0,0 L22,11 L0,22 z" fill="#1f5fae"/></marker>
<marker id="o" markerUnits="userSpaceOnUse" markerWidth="22" markerHeight="22" refX="20" refY="11" orient="auto"><path d="M0,0 L22,11 L0,22 z" fill="#ee7a2f"/></marker>
<marker id="g" markerUnits="userSpaceOnUse" markerWidth="22" markerHeight="22" refX="20" refY="11" orient="auto"><path d="M0,0 L22,11 L0,22 z" fill="#5a6577"/></marker></defs>
<line x1="252" y1="235" x2="462" y2="110" stroke="#1f5fae" stroke-width="4" marker-end="url(#b)"/>
<line x1="252" y1="300" x2="462" y2="420" stroke="#ee7a2f" stroke-width="4" marker-end="url(#o)"/>
<line x1="780" y1="205" x2="780" y2="342" stroke="#5a6577" stroke-width="4" stroke-dasharray="10 7" marker-end="url(#g)"/>
</svg>
<div class="box reader"><b>読者のみなさま</b><span>記事内のリンクから<br>公式サイトへ</span></div>
<div class="box gl"><b>Guideless運営元（公式サイト）</b><span>お申込み・お支払い・ご契約の相手方<br>契約・請求・解約・サービス仕様のお問い合わせ先<br>（公式サイト・ヘルプは英語）</span></div>
<div class="box kh"><b>株式会社コホマダ</b><span>Guidelessの日本市場における独占販売代理店<br>導入のご相談をお受けします<br>（kohomadha.com からお問い合わせ）</span></div>
<div class="ar" style="left:200px;top:50px;color:#1f5fae">お申込み・お支払い<br>契約・請求・解約・仕様の<br>お問い合わせ</div>
<div class="ar" style="left:230px;top:425px;color:#c85d16">導入のご相談</div>
<div class="ar" style="left:805px;top:250px;color:#5a6577">リンク経由のご契約に<br>応じて当社に報酬</div>
</div></div>${foot}</body></html>`;

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' }).catch(()=>chromium.launch());
const ctx = await browser.newContext({ viewport:{width:1200,height:200}, deviceScaleFactor:2 });
for (const [name, html] of [['図1_主な機能一覧',fig1],['図2_料金プラン比較',fig2],['図3_向き不向きチェック',fig3],['図4_申込み問い合わせの流れ',fig4]]) {
  const pg = await ctx.newPage(); await pg.setContent(html); await pg.waitForTimeout(300);
  await pg.screenshot({ path:`${OUT}/${P}${name}_v2.png`, fullPage:true }); await pg.close();
  console.log('ok', name);
}
await browser.close();
