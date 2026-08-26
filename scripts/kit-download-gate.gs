/**
 * スターターキット・期限付きダウンロード発行スクリプト（Google Apps Script）
 *
 * 目的：note有料記事の購入者が、記事内のリンクを開く→「発行する」ボタンを押す→
 *      自分専用のダウンロードリンクを受け取る→そのリンクは発行から24時間だけ有効。
 *
 * 前提：
 * - このスクリプトは、スターターキットのZIPファイル（Google Drive）を
 *   「自分（デプロイした本人）のアカウント」の権限で読み込んで配布します。
 *   ファイル自体を「リンクを知っている全員に公開」にする必要はありません
 *   （むしろ非公開のままでOKです。トークンの検証を通った場合のみ、
 *   このスクリプトがサーバー側でファイルを読み込んで配布します）。
 * - トークンの発行記録は、初回実行時に自動作成されるGoogleスプレッドシート
 *   「スターターキット ダウンロードトークン台帳」に保存されます。
 *
 * 注意（セキュリティモデル）：
 * - このリンク自体は「購入した人だけが知っている」ことを前提にしています。
 *   note側の有料エリア（ペイウォール）の中にだけこのURLを掲載することで、
 *   実質的に購入者だけがアクセスできる状態にしてください。
 * - noteの決済とこのスクリプトは自動連携していません
 *   （「支払ったらこのスクリプトが自動で動く」わけではなく、
 *   「有料エリアに置かれたリンクを、支払った人だけが見られる」ことで
 *   実質的にアクセスを制限する設計です）。
 */

const FILE_ID = '1f_3bg51L5QlrxGjW9jMpE8RZp_MSVLZD'; // スターターキットのZIPファイルのDriveファイルID
const EXPIRY_HOURS = 24; // リンクの有効期限（時間）。変更したい場合はこの数字だけ書き換えてください
const SHEET_NAME = 'tokens';

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
    ss = SpreadsheetApp.create('スターターキット ダウンロードトークン台帳');
    props.setProperty('SHEET_ID', ss.getId());
  }
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.getSheets()[0];
    sheet.setName(SHEET_NAME);
    sheet.appendRow(['token', 'issued_at_epoch_ms', 'downloaded_count']);
  }
  return sheet;
}

function doGet(e) {
  const action = (e.parameter.action || 'request');
  if (action === 'issue') return handleIssue_();
  if (action === 'download') return handleDownload_(e.parameter.token);
  return handleRequestPage_();
}

function handleRequestPage_() {
  const url = ScriptApp.getService().getUrl();
  return htmlPage_(
    'スターターキットのダウンロード',
    '<p>下のボタンを押すと、あなた専用のダウンロードリンクが発行されます。<br>発行から' + EXPIRY_HOURS + '時間だけ有効です。</p>' +
    '<p><a href="' + url + '?action=issue" style="display:inline-block;padding:12px 24px;background:#111;color:#fff;text-decoration:none;border-radius:6px;">ダウンロードリンクを発行する</a></p>'
  );
}

function handleIssue_() {
  const sheet = getOrCreateSheet_();
  const token = Utilities.getUuid().replace(/-/g, '');
  const now = new Date();
  sheet.appendRow([token, now.getTime(), 0]);
  const url = ScriptApp.getService().getUrl();
  const downloadUrl = url + '?action=download&token=' + token;
  const expiresAt = new Date(now.getTime() + EXPIRY_HOURS * 3600 * 1000);
  return htmlPage_(
    'あなた専用のダウンロードリンク',
    '<p>下のリンクからダウンロードできます。<br>有効期限：' + Utilities.formatDate(expiresAt, 'Asia/Tokyo', 'yyyy年MM月dd日 HH:mm') + ' まで</p>' +
    '<p><a href="' + downloadUrl + '" style="display:inline-block;padding:12px 24px;background:#111;color:#fff;text-decoration:none;border-radius:6px;">今すぐダウンロード</a></p>' +
    '<p style="color:#666;font-size:13px;">このページ（またはこのリンク）を保存しておけば、期限内は何度でも再ダウンロードできます。期限が切れた場合は、記事内のリンクからもう一度発行してください。</p>'
  );
}

function handleDownload_(token) {
  if (!token) return htmlPage_('エラー', '<p>リンクが正しくありません。</p>');
  const sheet = getOrCreateSheet_();
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === token) {
      const issuedAt = new Date(data[i][1]);
      const hoursPassed = (Date.now() - issuedAt.getTime()) / 3600000;
      if (hoursPassed > EXPIRY_HOURS) {
        const requestUrl = ScriptApp.getService().getUrl();
        return htmlPage_(
          '有効期限切れ',
          '<p>このダウンロードリンクの有効期限（発行から' + EXPIRY_HOURS + '時間）が切れています。</p>' +
          '<p><a href="' + requestUrl + '">こちらから新しいリンクを発行してください</a></p>'
        );
      }
      sheet.getRange(i + 1, 3).setValue((data[i][2] || 0) + 1);
      return DriveApp.getFileById(FILE_ID).getBlob();
    }
  }
  return htmlPage_('エラー', '<p>リンクが見つかりません。お手数ですが、記事内のリンクからもう一度発行し直してください。</p>');
}

function htmlPage_(title, bodyHtml) {
  return HtmlService.createHtmlOutput(
    '<html><body style="font-family:sans-serif;max-width:480px;margin:60px auto;text-align:center;line-height:1.7;">' +
    '<h2>' + title + '</h2>' + bodyHtml +
    '</body></html>'
  );
}
