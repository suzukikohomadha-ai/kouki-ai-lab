/**
 * 「スターターキット」モニター向け はじめかたステップ配信：進捗記録スクリプト（Google Apps Script）
 *
 * 目的：`community-ops/line/webhook-server.mjs` から fire-and-forget で呼び出され、
 *      モニター（LINE userId）ごとの進捗（現在のステップ・状態・直近のつまずきカテゴリ）と、
 *      分析用のイベントログを記録する。
 *
 * 設計方針（`scripts/invite-link-gate.gs`・`scripts/kit-download-gate.gs`と同じ最小構成パターン）：
 * - Apps Script + 自動生成スプレッドシート。凝ったCRM・外部DBは使わない。
 * - このスクリプトが進捗の「正本」を持つ（webhook-server.mjs側は状態を一切保持しない）。
 * - webhook-server.mjs は本スクリプトの応答を待たずに次の案内を返信するため（応答速度優先の設計、
 *   `logs/kohomada_2026-09-04_LINEステップ配信_技術実装方針_v1.md`参照）、本スクリプト側の遅延・
 *   一時的な失敗が、モニターへの返信そのものに影響することはない。
 *
 * スプレッドシート構成：
 * - `progress`シート：userId単位で上書き更新する現在の状態（正本）。
 *   列：userId / currentStep / status / stuckCode / startedAt / updatedAt
 * - `events`シート：追記のみのイベントログ（KPI・つまずき分析用）。
 *   列：timestamp / userId / step / event / code
 *
 * エンドポイント：
 * - ?action=record&userId=...&step=1-4&event=started|done|stuck|reason|escalated&code=...（event=reasonのみ）
 *     → events に1行追記 ＋ progress を該当userIdでupsert
 *     （escalated：同じステップで「わからない・詰まった」を2回目以降押した＝担当への引き継ぎが必要になった記録）
 * - ?action=get&userId=...
 *     → その1ユーザーの現在の進捗（{currentStep, status}）をJSONで返す。webhook-server.mjsが
 *       合言葉「はじめる」の再送信を受けたときに、Step1からではなく現在のステップから再開する
 *       判定に使う（自由文でクイックリプライが見えなくなった場合の復帰手段）。記録が無ければ
 *       {currentStep: 0}を返し、その場合はwebhook側がStep1から新規開始として扱う。
 * - ?action=stats（&since=YYYY-MM-DD&until=YYYY-MM-DD）
 *     → ステップ別ファネル・つまずきカテゴリ別集計を簡易HTMLで表示（invite-link-gate.gsのhandleStats_と同じ設計）
 *
 * 個人情報の取り扱い（.claude/rules/personal-data.md・.claude/rules/security-policy.md参照）：
 * - 記録するのはLINEのuserId（識別子）のみで、氏名等の直接個人情報は記録しない。
 * - 本スクリプトが生成するスプレッドシートへのアクセス権限は、実装・デプロイ時に社長（および
 *   必要な範囲の運営担当）に限定すること（このスクリプト自体は権限管理を行わない。GAS/Driveの
 *   共有設定側で対応する）。
 */

const SHEET_TITLE = 'スターターキット モニター進捗ログ';
const PROGRESS_SHEET_NAME = 'progress';
const EVENTS_SHEET_NAME = 'events';
const VALID_EVENTS = ['started', 'done', 'stuck', 'reason', 'escalated'];
const LOCK_TIMEOUT_MS = 5000;

function getSpreadsheet_() {
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
    ss = SpreadsheetApp.create(SHEET_TITLE);
    props.setProperty('SHEET_ID', ss.getId());
  }
  return ss;
}

function getOrCreateProgressSheet_(ss) {
  let sheet = ss.getSheetByName(PROGRESS_SHEET_NAME);
  if (!sheet) {
    // 初回実行時、既定の1枚目シートをprogressとして流用する（invite-link-gate.gsと同じパターン）
    const sheets = ss.getSheets();
    const isFresh = sheets.length === 1 && sheets[0].getLastRow() === 0;
    sheet = isFresh ? sheets[0] : ss.insertSheet();
    sheet.setName(PROGRESS_SHEET_NAME);
    sheet.appendRow(['userId', 'currentStep', 'status', 'stuckCode', 'startedAt', 'updatedAt']);
  }
  return sheet;
}

function getOrCreateEventsSheet_(ss) {
  let sheet = ss.getSheetByName(EVENTS_SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet();
    sheet.setName(EVENTS_SHEET_NAME);
    sheet.appendRow(['timestamp', 'userId', 'step', 'event', 'code']);
  }
  return sheet;
}

function doGet(e) {
  const params = (e && e.parameter) || {};
  if (params.action === 'record') return handleRecord_(params);
  if (params.action === 'get') return handleGet_(params);
  if (params.action === 'stats') return handleStats_(params);
  return htmlPage_(
    SHEET_TITLE,
    '<p>このエンドポイントは community-ops/line/webhook-server.mjs から呼び出される記録用APIです。</p>' +
    '<p style="color:#666;font-size:13px;">?action=record（進捗記録・webhook側から呼び出し）／' +
    '?action=get（現在の進捗照会・「はじめる」再送信時の再開判定用）／?action=stats（集計表示）</p>'
  );
}

// upsert対象の行番号（1始まり・ヘッダー込み）を探す。見つからなければ -1。
function findProgressRow_(sheet, userId) {
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === userId) return i + 1;
  }
  return -1;
}

function handleRecord_(params) {
  const userId = params.userId || '';
  const step = Number(params.step);
  const event = params.event || '';
  const code = params.code || '';

  if (!userId || !Number.isInteger(step) || step < 1 || VALID_EVENTS.indexOf(event) === -1) {
    return htmlPage_('パラメータ不正', '<p>userId・step・eventのいずれかが不正です。記録をスキップしました。</p>');
  }

  const lock = LockService.getScriptLock();
  const gotLock = lock.tryLock(LOCK_TIMEOUT_MS);
  if (!gotLock) {
    // 競合時は記録を諦める（webhook側は応答を待たないfire-and-forget呼び出しのため、
    // ここで失敗してもモニターへの返信自体には影響しない）。
    return htmlPage_('一時的に混み合っています', '<p>記録できませんでした。次回の操作時に再度記録されます。</p>');
  }

  try {
    const ss = getSpreadsheet_();
    const now = new Date();
    const nowIso = Utilities.formatDate(now, 'Asia/Tokyo', "yyyy-MM-dd'T'HH:mm:ssXXX");

    // events：追記のみ
    const eventsSheet = getOrCreateEventsSheet_(ss);
    eventsSheet.appendRow([now, userId, step, event, code]);

    // progress：userId単位でupsert
    const progressSheet = getOrCreateProgressSheet_(ss);
    const rowIndex = findProgressRow_(progressSheet, userId);

    // status算出：stuck/reason/escalatedは「詰まっている」状態、doneでStep4完了ならcompleted、それ以外はin_progress
    let status = 'in_progress';
    if (event === 'stuck' || event === 'reason' || event === 'escalated') status = 'stuck';
    if (event === 'done' && step >= 4) status = 'completed';

    const stuckCode = event === 'reason' ? code : (event === 'done' ? '' : undefined);

    if (rowIndex === -1) {
      // 新規行：startedAt = 今回の記録時刻
      progressSheet.appendRow([
        userId,
        step,
        status,
        event === 'reason' ? code : '',
        nowIso,
        nowIso,
      ]);
    } else {
      progressSheet.getRange(rowIndex, 2).setValue(step); // currentStep
      progressSheet.getRange(rowIndex, 3).setValue(status); // status
      if (stuckCode !== undefined) {
        progressSheet.getRange(rowIndex, 4).setValue(stuckCode); // stuckCode（doneで完了扱いになったらクリア）
      }
      progressSheet.getRange(rowIndex, 6).setValue(nowIso); // updatedAt
    }

    return htmlPage_('記録しました', '<p>OK</p>');
  } finally {
    lock.releaseLock();
  }
}

// 現在の進捗を1ユーザー分だけ返す（webhook-server.mjsの「はじめる」再送信時の再開判定用）。
// 記録が無い場合は currentStep: 0 を返す（＝Step1から新規に開始する扱い）。
function handleGet_(params) {
  const userId = params.userId || '';
  if (!userId) {
    return ContentService.createTextOutput(JSON.stringify({ currentStep: 0 }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  const ss = getSpreadsheet_();
  const progressSheet = getOrCreateProgressSheet_(ss);
  const rowIndex = findProgressRow_(progressSheet, userId);
  if (rowIndex === -1) {
    return ContentService.createTextOutput(JSON.stringify({ currentStep: 0 }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  const row = progressSheet.getRange(rowIndex, 1, 1, 6).getValues()[0];
  return ContentService.createTextOutput(JSON.stringify({
    currentStep: row[1],
    status: row[2],
  })).setMimeType(ContentService.MimeType.JSON);
}

function parseDateParam_(value) {
  if (!value) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return isNaN(d.getTime()) ? null : d;
}

function handleStats_(params) {
  params = params || {};
  const since = parseDateParam_(params.since);
  const until = parseDateParam_(params.until);
  if (until) until.setHours(23, 59, 59, 999);

  const ss = getSpreadsheet_();
  const eventsSheet = getOrCreateEventsSheet_(ss);
  const data = eventsSheet.getDataRange().getValues();

  // ステップ別ファネル（done件数、ユーザー重複排除）
  const doneUsersByStep = {}; // step -> Set(userId)
  // つまずきカテゴリ別集計（step+codeの組）
  const reasonCounts = {}; // "step:code" -> count

  for (let i = 1; i < data.length; i++) {
    const timestamp = data[i][0];
    if (since && timestamp instanceof Date && timestamp < since) continue;
    if (until && timestamp instanceof Date && timestamp > until) continue;

    const userId = data[i][1];
    const step = data[i][2];
    const event = data[i][3];
    const code = data[i][4];

    if (event === 'done') {
      if (!doneUsersByStep[step]) doneUsersByStep[step] = new Set();
      doneUsersByStep[step].add(userId);
    }
    if (event === 'reason' && code) {
      const key = step + ':' + code;
      reasonCounts[key] = (reasonCounts[key] || 0) + 1;
    }
  }

  let funnelRows = '';
  const steps = Object.keys(doneUsersByStep).map(Number).sort((a, b) => a - b);
  if (steps.length === 0) {
    funnelRows = '<tr><td colspan="2">まだ記録がありません</td></tr>';
  }
  for (const step of steps) {
    funnelRows += '<tr><td>Step' + step + ' 完了</td><td>' + doneUsersByStep[step].size + '人</td></tr>';
  }

  let reasonRows = '';
  const reasonKeys = Object.keys(reasonCounts).sort();
  if (reasonKeys.length === 0) {
    reasonRows = '<tr><td colspan="2">つまずきカテゴリの記録はまだありません</td></tr>';
  }
  for (const key of reasonKeys) {
    reasonRows += '<tr><td>' + key + '</td><td>' + reasonCounts[key] + '件</td></tr>';
  }

  const periodNote = (since || until)
    ? '<p style="color:#666;font-size:13px;">期間絞り込み：' +
      (since ? params.since : '指定なし') + ' 〜 ' + (until ? params.until : '指定なし') + '</p>'
    : '<p style="color:#666;font-size:13px;">全期間の集計です。期間を絞りたい場合は末尾に &since=2026-09-01&until=2026-09-30 のように付けてください。</p>';

  return htmlPage_(
    SHEET_TITLE + '：集計',
    periodNote +
    '<h3>ステップ別ファネル（完了ユーザー数）</h3>' +
    '<table style="margin:0 auto;border-collapse:collapse;text-align:left;" border="1" cellpadding="8">' +
    '<tr><th>ステップ</th><th>完了人数</th></tr>' + funnelRows + '</table>' +
    '<h3 style="margin-top:24px;">つまずきカテゴリ別内訳（ステップ:コード）</h3>' +
    '<table style="margin:0 auto;border-collapse:collapse;text-align:left;" border="1" cellpadding="8">' +
    '<tr><th>ステップ:コード</th><th>件数</th></tr>' + reasonRows + '</table>'
  );
}

function htmlPage_(title, bodyHtml) {
  return HtmlService.createHtmlOutput(
    '<html><body style="font-family:sans-serif;max-width:480px;margin:60px auto;text-align:center;line-height:1.7;">' +
    '<h2>' + title + '</h2>' + bodyHtml +
    '</body></html>'
  );
}
