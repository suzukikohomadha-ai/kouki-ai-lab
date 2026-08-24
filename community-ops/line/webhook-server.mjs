// LINE Webhook受信サーバー（常時稼働想定・Renderの別サービスへデプロイする）
// - 署名検証 → 「友だち追加（follow）」イベント時に登録時オートリプライを返すだけの最小サーバー
// - 通常のテキストメッセージには反応しない（このアカウントは告知配信専用のため）
// - 素のNode.js httpモジュールで実装（外部ライブラリ不要）
// - 既存 server/webhook（秘書アイ用・ポート3000）とはポート・トークンを分離している
import { createServer } from "node:http";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { lineConfigured, verifySignature, replyText } from "./lib/line-client.mjs";

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

function loadWelcomeText() {
  if (!existsSync(WELCOME_PATH)) return "友だち追加ありがとうございます。";
  return readFileSync(WELCOME_PATH, "utf-8").trim();
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
        await replyText(ev.replyToken, loadWelcomeText());
      }
      // follow以外（通常メッセージ等）には反応しない設計（告知配信専用アカウントのため）
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
