/**
 * 招待リンク・最小実装（population A/B識別ゲート）
 *
 * 目的：「繋 -TSUNAGU- AI Integration Studio」プラン2の送客メカニズムで前提とされている
 *      population A（既存商談経由のダウンセル対象）／population B（note/X等の公開マーケ経由）
 *      を、Discord・LINE・noteへの入口の手前で識別できるようにする、UTMパラメータ相当の最小の仕組み。
 *
 * 設計方針（v5・v11で示された「凝ったCRM連携は不要」の方針に従う）：
 * - kit-download-gate.gs と同じパターン（Apps Script + 自動生成スプレッドシート）を流用
 * - 入室イベントそのものは検知しない（community-ops/discordのA案＝固定投稿方針と整合。
 *   Discord Gatewayの常時接続やSERVER MEMBERS INTENTは今回も使わない）
 * - この仕組みが分かるのは「どちらの経路からリンクを踏んだか」までであり、
 *   実際にDiscord/LINE/noteへの入会まで完了したかどうかまでは追跡しない（クリックログのみ）
 *
 * 使い方：
 * 1. 個別営業（population A向け）で送るリンク　→ ?src=A&label=<任意の案件メモ>
 * 2. note/X等の公開投稿（population B向け）で使うリンク　→ ?src=B&campaign=<今回の企画名>
 *   （例：?src=B&campaign=2026-09_claudecode活用術）
 *   campaignは省略可能だが、SNSハッシュタグ施策（4.5節）のように毎月お題が変わる場合、
 *   これを付けておかないと後から「どの月・どの投稿が効いたか」を集計できなくなる。
 * 3. リンクを踏むと、クリックがスプレッドシートに記録された上で、実際の入会先
 *   （Discord招待 / LINE友だち追加 / note等）へ自動的に移動する
 * 4. 集計を見たいときは、発行したURLの末尾に &action=stats を付けて開く
 *   （例：https://script.google.com/.../exec?action=stats）
 */

// [要設定] 実際の入会先URLに書き換えてから使ってください。
// 未設定（プレースホルダーのまま）の宛先が指定された場合は、
// リンクを踏んだ人には「準備中」の案内だけを表示し、記録は行います。
const DESTINATIONS = {
  discord: 'https://discord.gg/XTDHjJ6e3',
  line: 'https://lin.ee/XCsg7rb',
  note: 'https://note.com/kohomadha/membership?from=self',
};
const DEFAULT_DEST = 'discord';
const VALID_SRC = ['A', 'B'];
const SHEET_NAME = 'clicks';

// label欄（自由記述）に個人情報らしき文字列が入っていた場合、シートには残さずマスクする。
// 完全な検出は保証しない簡易パターンマッチ（[[.claude/rules/personal-data.md]]相当の配慮）。
const PII_PATTERNS = [
  /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/, // メールアドレス
  /0\d{1,4}-?\d{1,4}-?\d{3,4}/, // 電話番号（市外局番あり・ハイフン有無問わず）
];

function sanitizeLabel_(label) {
  if (!label) return label;
  for (const pattern of PII_PATTERNS) {
    if (pattern.test(label)) {
      return '[個人情報らしき値のため自動マスク]';
    }
  }
  return label;
}

function getOrCreateSheet_() {
  const props = PropertiesService.getScriptProperties();
  let ssId = props.getProperty('SHEET_ID');
  let ss;
  if (ssId) {
    try {
      ss = SpreadsheetApp.openById(ssId);
    } catch (e) {
      ss = null;
    }
  }
  if (!ss) {
    ss = SpreadsheetApp.create('招待リンク クリックログ');
    props.setProperty('SHEET_ID', ss.getId());
  }
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.getSheets()[0];
    sheet.setName(SHEET_NAME);
    sheet.appendRow(['timestamp', 'src', 'dest', 'label', 'campaign']);
  } else {
    // 既にデプロイ済みの旧シート（timestamp/src/dest/labelの4列のみ）に
    // campaign列を後付けする。既存行は壊さず、5列目のヘッダーだけ追加する。
    const lastCol = Math.max(sheet.getLastColumn(), 1);
    const header = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
    if (header.indexOf('campaign') === -1) {
      sheet.getRange(1, lastCol + 1).setValue('campaign');
    }
  }
  return sheet;
}

function doGet(e) {
  const params = (e && e.parameter) || {};
  if (params.action === 'stats') return handleStats_(params);
  return handleClick_(params);
}

function handleClick_(params) {
  const src = (params.src || '').toUpperCase();
  if (VALID_SRC.indexOf(src) === -1) {
    return htmlPage_(
      'リンクが正しくありません',
      '<p>このリンクには <code>src=A</code> または <code>src=B</code> が必要です。</p>' +
      '<p style="color:#666;font-size:13px;">例：<code>' + ScriptApp.getService().getUrl() + '?src=A&dest=discord</code></p>'
    );
  }

  const dest = (params.dest || DEFAULT_DEST).toLowerCase();
  const campaign = params.campaign || '';
  const label = sanitizeLabel_(params.label || '');

  const sheet = getOrCreateSheet_();
  sheet.appendRow([new Date(), src, dest, label, campaign]);

  const destUrl = DESTINATIONS[dest];
  if (!destUrl || /XXXXXXX/.test(destUrl)) {
    return htmlPage_(
      '準備中',
      '<p>クリックは記録しました。移動先（' + dest + '）のURLがまだ設定されていません。</p>' +
      '<p style="color:#666;font-size:13px;">invite-link-gate.gs の DESTINATIONS を実際のURLに書き換えてから再デプロイしてください。</p>'
    );
  }

  // Apps Script のウェブアプリは生の302を返せないため、即時リダイレクトのHTMLで代替する。
  return HtmlService.createHtmlOutput(
    '<html><head><meta http-equiv="refresh" content="0;url=' + destUrl + '"></head>' +
    '<body style="font-family:sans-serif;max-width:480px;margin:60px auto;text-align:center;line-height:1.7;">' +
    '<p>移動しています…自動で切り替わらない場合は<a href="' + destUrl + '">こちら</a>をクリックしてください。</p>' +
    '</body></html>'
  );
}

// "YYYY-MM-DD" 形式の文字列をDateに変換する。不正な形式ならnullを返す（例外を投げない）。
function parseDateParam_(value) {
  if (!value) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return isNaN(d.getTime()) ? null : d;
}

function handleStats_(params) {
  params = params || {};
  const since = parseDateParam_(params.since); // 未指定・不正な形式は無視（絞り込みなし）
  const until = parseDateParam_(params.until); // untilはその日の終わりまでを含める
  if (until) until.setHours(23, 59, 59, 999);

  const sheet = getOrCreateSheet_();
  const data = sheet.getDataRange().getValues();
  const header = data[0] || [];
  const campaignCol = header.indexOf('campaign'); // 旧シート（4列のみ）では -1 になりうる

  const counts = {}; // src -> { total, byDest: {} }
  const campaignCounts = {}; // campaign -> { total, bySrc: {} }
  for (let i = 1; i < data.length; i++) {
    const timestamp = data[i][0];
    if (since && timestamp instanceof Date && timestamp < since) continue;
    if (until && timestamp instanceof Date && timestamp > until) continue;

    const src = data[i][1];
    const dest = data[i][2];
    const campaign = campaignCol > -1 ? data[i][campaignCol] : '';
    if (!src) continue;
    if (!counts[src]) counts[src] = { total: 0, byDest: {} };
    counts[src].total++;
    counts[src].byDest[dest] = (counts[src].byDest[dest] || 0) + 1;

    if (campaign) {
      if (!campaignCounts[campaign]) campaignCounts[campaign] = { total: 0, bySrc: {} };
      campaignCounts[campaign].total++;
      campaignCounts[campaign].bySrc[src] = (campaignCounts[campaign].bySrc[src] || 0) + 1;
    }
  }

  let rows = '';
  const srcs = Object.keys(counts).sort();
  if (srcs.length === 0) {
    rows = '<tr><td colspan="3">まだクリック記録がありません</td></tr>';
  }
  for (const src of srcs) {
    const destBreakdown = Object.entries(counts[src].byDest)
      .map(([d, n]) => d + ':' + n)
      .join(' / ');
    rows += '<tr><td>' + src + '</td><td>' + counts[src].total + '</td><td>' + destBreakdown + '</td></tr>';
  }

  let campaignRows = '';
  const campaigns = Object.keys(campaignCounts).sort();
  if (campaigns.length === 0) {
    campaignRows = '<tr><td colspan="3">campaign付きのクリックはまだありません</td></tr>';
  }
  for (const c of campaigns) {
    const srcBreakdown = Object.entries(campaignCounts[c].bySrc)
      .map(([s, n]) => s + ':' + n)
      .join(' / ');
    campaignRows += '<tr><td>' + c + '</td><td>' + campaignCounts[c].total + '</td><td>' + srcBreakdown + '</td></tr>';
  }

  const periodNote = (since || until)
    ? '<p style="color:#666;font-size:13px;">期間絞り込み：' +
      (since ? params.since : '指定なし') + ' 〜 ' + (until ? params.until : '指定なし') + '</p>'
    : '<p style="color:#666;font-size:13px;">全期間の集計です。期間を絞りたい場合は末尾に &since=2026-09-01&until=2026-09-30 のように付けてください。</p>';

  return htmlPage_(
    '招待リンク クリック集計',
    periodNote +
    '<table style="margin:0 auto;border-collapse:collapse;text-align:left;" border="1" cellpadding="8">' +
    '<tr><th>population</th><th>クリック数</th><th>内訳（宛先別）</th></tr>' + rows + '</table>' +
    '<h3 style="margin-top:24px;">キャンペーン別内訳</h3>' +
    '<table style="margin:0 auto;border-collapse:collapse;text-align:left;" border="1" cellpadding="8">' +
    '<tr><th>campaign</th><th>クリック数</th><th>内訳（population別）</th></tr>' + campaignRows + '</table>' +
    '<p style="color:#666;font-size:13px;margin-top:16px;">※ クリック数のみで、実際の入会完了までは追跡していません（最小実装のため）。</p>'
  );
}

function htmlPage_(title, bodyHtml) {
  return HtmlService.createHtmlOutput(
    '<html><body style="font-family:sans-serif;max-width:480px;margin:60px auto;text-align:center;line-height:1.7;">' +
    '<h2>' + title + '</h2>' + bodyHtml +
    '</body></html>'
  );
}
