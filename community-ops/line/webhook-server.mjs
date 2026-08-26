// LINE Webhook受信サーバー（常時稼働想定・Renderの別サービスへデプロイする）
// - 署名検証 → 「友だち追加（follow）」イベント時に登録時オートリプライを返すだけの最小サーバー
// - 通常のテキストメッセージには反応しない（このアカウントは告知配信専用のため）
// - 素のNode.js httpモジュールで実装（外部ライブラリ不要）
// - 既存 server/webhook（秘書アイ用・ポート3000）とはポート・トークンを分離している
import { createServer } from "node:http";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { lineConfigured, verifySignature, replyText, replyWithQuickReply } from "./lib/line-client.mjs";

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

const server = createServer(async (req, res) => {
  if (req.method === "GET" && req.url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: true, name: "community-ops-line-webhook", lineConfigured: lineConfigured() }));
    return;
  }

  if (req.method !== "POST" || req.url !== "/webhook") {
    res.writeHead(404);
    res.end("not found");
    return;
  }

  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const rawBody = Buffer.concat(chunks).toString("utf-8");
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
      }
      // follow/postback以外（通常メッセージ等）には反応しない設計（告知配信専用アカウントのため）
    } catch (e) {
      console.error("webhook handling error:", e.message);
    }
  }
});

server.listen(PORT, () => {
  console.log(`community-ops LINE webhookサーバー起動: http://localhost:${PORT}/webhook`);
  if (!lineConfigured()) {
    console.warn(
      "⚠ LINE_COMMUNITY_CHANNEL_ACCESS_TOKEN / LINE_COMMUNITY_CHANNEL_SECRET が未設定です。.envを設定してください。"
    );
  }
});
