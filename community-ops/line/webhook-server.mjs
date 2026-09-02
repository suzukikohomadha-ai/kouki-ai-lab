// LINE Webhook受信サーバー（常時稼働想定・Renderの別サービスへデプロイする）
// - 署名検証 → 「友だち追加（follow）」イベント時に登録時オートリプライを返す
// - 通常のテキストメッセージ（個別の質問・相談）は、自動送信はせず、
//   AIが返信「下書き」を作成して /inbox 画面に貯める。実際の送信は鈴木さんが
//   下書きを確認・編集したうえで、LINEアプリ／LINE公式アカウント管理画面から手動で行う
//   （2026-09-02、鈴木さんの依頼により「個別メッセージには自動返信しない」設計から変更。
//   README.mdの「やること／やらないこと」も参照）
// - 素のNode.js httpモジュールで実装（外部ライブラリ不要）
// - 既存 server/webhook（秘書アイ用・ポート3000）とはポート・トークンを分離している
import { createServer } from "node:http";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import {
  lineConfigured,
  verifySignature,
  replyText,
  replyWithQuickReply,
  getProfile,
} from "./lib/line-client.mjs";
import { anthropicConfigured, generateDraftReply } from "./lib/ai-draft.mjs";
import { hasMessage, addInboxItem, listPending, listHandled, markHandled } from "./lib/inbox-store.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));

// community-ops/.env を読み込む簡易ローダー（dotenv等の外部パッケージは使わない）
function loadEnv(path) {
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf-8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    let val = m[2];
    if (/^".*"$/.test(val) || /^'.*'$/.test(val)) val = val.slice(1, -1);
    if (!(m[1] in process.env)) process.env[m[1]] = val;
  }
}
loadEnv(join(__dirname, "..", ".env"));

const PORT = process.env.LINE_WEBHOOK_PORT || 8090;
const WELCOME_PATH = join(__dirname, "templates", "welcome-reply.md");
// 招待リンク・最小実装（scripts/invite-link-gate.gs）のウェブアプリURL。
// population A/B識別の自己申告（postback）を記録するために使う。未設定でも動く（記録をスキップするだけ）。
const INVITE_GATE_URL = process.env.INVITE_GATE_URL || "";
// /inbox 画面の閲覧・操作に必要な合言葉。個人のLINEメッセージ内容が並ぶ画面のため、
// 未設定の場合はアクセスそのものを拒否する（フェイルセーフ。誤って誰でも見られる状態にしない）。
const INBOX_ACCESS_TOKEN = process.env.INBOX_ACCESS_TOKEN || "";

function loadWelcomeText() {
  if (!existsSync(WELCOME_PATH)) return "友だち追加ありがとうございます。";
  return readFileSync(WELCOME_PATH, "utf-8").trim();
}

// population A/B の自己申告をinvite-link-gate.gsに記録する（fire-and-forget、失敗しても致命的ではない）。
// GASのレスポンス（リダイレクト用HTML）は使わないため待たない。
function recordSelfReport(src) {
  if (!INVITE_GATE_URL) return;
  const url = `${INVITE_GATE_URL}?src=${encodeURIComponent(src)}&dest=line-selfreport&campaign=line-follow-selfreport`;
  fetch(url).catch((e) => console.error("招待リンク自己申告の記録に失敗:", e.message));
}

// 個別のテキストメッセージを受信したときの処理。LINEへは一切返信しない
// （replyTokenは使わず、そのまま期限切れにする＝副作用なし）。AI下書きを作って/inboxに貯めるだけ。
async function handleIncomingMessage(ev) {
  const messageId = ev.message.id;
  if (hasMessage(messageId)) return; // LINE webhookの再送（タイムアウト等）による二重登録を防ぐ

  const userId = ev.source.userId;
  const userText = ev.message.text;

  let displayName = null;
  try {
    const profile = await getProfile(userId);
    displayName = profile.displayName || null;
  } catch (e) {
    console.error("プロフィール取得失敗（下書き作成は続行）:", e.message);
  }

  let draftReply = null;
  let draftError = null;
  if (anthropicConfigured()) {
    try {
      draftReply = await generateDraftReply(userText, { displayName });
    } catch (e) {
      draftError = e.message;
      console.error("AI下書き生成失敗:", e.message);
    }
  } else {
    draftError = "ANTHROPIC_API_KEY が未設定のため、AI下書きは生成されていません。手動で返信してください。";
  }

  addInboxItem({
    id: messageId,
    userId,
    displayName,
    receivedAt: new Date().toISOString(),
    userMessage: userText,
    draftReply,
    draftError,
    status: "pending",
  });
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (ch) => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]
  ));
}

function formatJst(iso) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" });
  } catch {
    return iso;
  }
}

function renderItemCard(item, token, { showHandleButton }) {
  const name = item.displayName ? escapeHtml(item.displayName) : `(表示名取得不可・userId: ${escapeHtml(item.userId)})`;
  const draftBlock = item.draftReply
    ? `<pre class="draft">${escapeHtml(item.draftReply)}</pre>
       <button type="button" class="copy-btn" data-text="${escapeHtml(item.draftReply)}">下書きをコピー</button>`
    : `<p class="draft-error">下書き未生成：${escapeHtml(item.draftError || "不明なエラー")}</p>`;
  const handleForm = showHandleButton
    ? `<form method="POST" action="/inbox/handle">
         <input type="hidden" name="id" value="${escapeHtml(item.id)}" />
         <input type="hidden" name="token" value="${escapeHtml(token)}" />
         <button type="submit">対応済みにする</button>
       </form>`
    : `<p class="handled-at">対応済み（${escapeHtml(formatJst(item.handledAt))}）</p>`;

  return `<div class="card">
    <div class="meta">${escapeHtml(formatJst(item.receivedAt))} ／ ${name}</div>
    <p class="user-message">${escapeHtml(item.userMessage)}</p>
    ${draftBlock}
    ${handleForm}
  </div>`;
}

function renderInboxHtml(token) {
  const pending = listPending();
  const handled = listHandled(20);
  return `<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8" />
<title>実務者のAIエージェント勉強会LINE ― 返信下書き一覧</title>
<style>
  body { font-family: -apple-system, "Hiragino Sans", sans-serif; max-width: 720px; margin: 0 auto; padding: 16px; background: #f7f7f8; color: #222; }
  h1 { font-size: 18px; }
  h2 { font-size: 15px; color: #666; margin-top: 32px; }
  .notice { background: #fff8e1; border: 1px solid #ffe08a; padding: 10px 12px; border-radius: 6px; font-size: 13px; }
  .card { background: #fff; border: 1px solid #ddd; border-radius: 8px; padding: 14px; margin: 12px 0; }
  .meta { font-size: 12px; color: #888; margin-bottom: 6px; }
  .user-message { white-space: pre-wrap; background: #eef1f5; border-radius: 6px; padding: 8px 10px; }
  .draft { white-space: pre-wrap; background: #eafaf0; border-radius: 6px; padding: 8px 10px; }
  .draft-error { color: #b23; font-size: 13px; }
  .copy-btn, button[type=submit] { margin-top: 8px; padding: 6px 12px; border-radius: 6px; border: 1px solid #ccc; background: #fff; cursor: pointer; }
  .handled-at { font-size: 12px; color: #999; }
  .empty { color: #999; font-size: 13px; }
</style>
</head>
<body>
<h1>「実務者のAIエージェント勉強会」公式LINE ― 返信下書き一覧</h1>
<p class="notice">ここに表示される文面はすべてAIによる「下書き」です。内容を確認・必要なら修正のうえ、
LINEアプリまたはLINE公式アカウント管理画面から手動で送信してください。ここから自動送信されることはありません。</p>

<h2>未対応（${pending.length}件）</h2>
${pending.length ? pending.map((item) => renderItemCard(item, token, { showHandleButton: true })).join("\n") : '<p class="empty">未対応のメッセージはありません。</p>'}

<h2>対応済み（直近${handled.length}件）</h2>
${handled.length ? handled.map((item) => renderItemCard(item, token, { showHandleButton: false })).join("\n") : '<p class="empty">対応済みのメッセージはまだありません。</p>'}

<script>
document.querySelectorAll(".copy-btn").forEach((btn) => {
  btn.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(btn.dataset.text);
      const original = btn.textContent;
      btn.textContent = "コピーしました";
      setTimeout(() => { btn.textContent = original; }, 1500);
    } catch (e) {
      alert("コピーに失敗しました。手動で選択してコピーしてください。");
    }
  });
});
</script>
</body>
</html>`;
}

async function readRequestBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return Buffer.concat(chunks).toString("utf-8");
}

function parseFormBody(raw) {
  const params = new URLSearchParams(raw);
  return Object.fromEntries(params.entries());
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url, "http://localhost");

  if (req.method === "GET" && url.pathname === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({
      ok: true,
      name: "community-ops-line-webhook",
      lineConfigured: lineConfigured(),
      anthropicConfigured: anthropicConfigured(),
      inboxProtected: !!INBOX_ACCESS_TOKEN,
    }));
    return;
  }

  if (req.method === "GET" && url.pathname === "/inbox") {
    if (!INBOX_ACCESS_TOKEN || url.searchParams.get("token") !== INBOX_ACCESS_TOKEN) {
      res.writeHead(401, { "Content-Type": "text/plain; charset=utf-8" });
      res.end(
        INBOX_ACCESS_TOKEN
          ? "認証エラー：正しい ?token=... を付けてアクセスしてください。"
          : "INBOX_ACCESS_TOKEN が未設定のため、この画面は無効化されています。.envに設定してください。"
      );
      return;
    }
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(renderInboxHtml(url.searchParams.get("token")));
    return;
  }

  if (req.method === "POST" && url.pathname === "/inbox/handle") {
    const raw = await readRequestBody(req);
    const { id, token } = parseFormBody(raw);
    if (!INBOX_ACCESS_TOKEN || token !== INBOX_ACCESS_TOKEN) {
      res.writeHead(401, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("認証エラー");
      return;
    }
    markHandled(id);
    res.writeHead(303, { Location: `/inbox?token=${encodeURIComponent(token)}` });
    res.end();
    return;
  }

  if (req.method !== "POST" || url.pathname !== "/webhook") {
    res.writeHead(404);
    res.end("not found");
    return;
  }

  const rawBody = await readRequestBody(req);
  const signature = req.headers["x-line-signature"] || "";

  if (!lineConfigured() || !verifySignature(rawBody, signature)) {
    res.writeHead(401);
    res.end("bad signature");
    return;
  }

  // LINEには即200を返す（応答が遅いとエラー扱いになるため、後処理は非同期で行う）
  res.writeHead(200);
  res.end();

  let payload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return;
  }

  for (const ev of payload.events || []) {
    try {
      if (ev.type === "follow" && ev.replyToken) {
        // ウェルカムメッセージ本文 + population A/B識別のための自己申告クイックリプライを添える
        // （B13：招待リンク最小実装の一部。Discord同様、入室検知そのものは行わない設計を踏襲）。
        await replyWithQuickReply(ev.replyToken, loadWelcomeText(), [
          { label: "すでにご相談中の案件から", data: "src=A" },
          { label: "SNS・noteを見て", data: "src=B" },
        ]);
      } else if (ev.type === "postback" && ev.postback && ev.replyToken) {
        const m = /^src=(A|B)$/.exec(ev.postback.data || "");
        if (m) {
          recordSelfReport(m[1]);
          await replyText(ev.replyToken, "ありがとうございます！参考にさせていただきますね。");
        }
      } else if (ev.type === "message" && ev.message?.type === "text" && ev.source?.type === "user" && ev.source.userId) {
        await handleIncomingMessage(ev);
      }
      // 上記以外（グループ・ルームからのメッセージ、テキスト以外のメッセージ種別等）には反応しない
    } catch (e) {
      console.error("webhook handling error:", e.message);
    }
  }
});

server.listen(PORT, () => {
  console.log(`community-ops LINE webhookサーバー起動: http://localhost:${PORT}/webhook`);
  console.log(`返信下書き一覧: http://localhost:${PORT}/inbox?token=<INBOX_ACCESS_TOKENの値>`);
  if (!lineConfigured()) {
    console.warn(
      "⚠ LINE_COMMUNITY_CHANNEL_ACCESS_TOKEN / LINE_COMMUNITY_CHANNEL_SECRET が未設定です。.envを設定してください。"
    );
  }
  if (!anthropicConfigured()) {
    console.warn("⚠ ANTHROPIC_API_KEY が未設定です。個別メッセージのAI下書きは生成されません（手動対応が必要）。");
  }
  if (!INBOX_ACCESS_TOKEN) {
    console.warn("⚠ INBOX_ACCESS_TOKEN が未設定です。/inbox 画面は無効化されています（.envに設定してください）。");
  }
});
