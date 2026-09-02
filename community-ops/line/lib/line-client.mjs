// LINE Messaging API の薄いクライアント（fetchベース・外部ライブラリ不要）
// 認証情報は community-ops/.env の LINE_COMMUNITY_* から読み込む。
// 既存 server/lib/line.js（秘書アイ用・社長個人向け）とは、トークン・シークレット・
// エンドポイント（本サーバーはWebhookを別ポートで受ける）を完全に分離している。混線しない。
import crypto from "node:crypto";

const API_BASE = "https://api.line.me/v2/bot";

export function lineConfigured() {
  return !!(
    process.env.LINE_COMMUNITY_CHANNEL_ACCESS_TOKEN &&
    process.env.LINE_COMMUNITY_CHANNEL_SECRET
  );
}

// Webhook署名検証（rawBodyが必要）
export function verifySignature(rawBody, signature) {
  const secret = process.env.LINE_COMMUNITY_CHANNEL_SECRET;
  if (!secret || !signature) return false;
  const hash = crypto.createHmac("sha256", secret).update(rawBody).digest("base64");
  return hash === signature;
}

async function lineFetch(path, { method = "POST", body } = {}) {
  const token = process.env.LINE_COMMUNITY_CHANNEL_ACCESS_TOKEN;
  if (!token) throw new Error("LINE_COMMUNITY_CHANNEL_ACCESS_TOKEN が未設定です");
  const res = await fetch(API_BASE + path, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`LINE API error: ${res.status} ${detail}`);
  }
  if (res.status === 204) return {};
  return res.json().catch(() => ({}));
}

export async function replyText(replyToken, text) {
  return lineFetch("/message/reply", {
    body: { replyToken, messages: [{ type: "text", text }] },
  });
}

// items: [{ label: "表示ラベル", data: "postbackで返ってくる値" }, ...]（最大13件、LINE仕様）
export async function replyWithQuickReply(replyToken, text, items) {
  return lineFetch("/message/reply", {
    body: {
      replyToken,
      messages: [
        {
          type: "text",
          text,
          quickReply: {
            items: items.map((item) => ({
              type: "action",
              action: { type: "postback", label: item.label, data: item.data, displayText: item.label },
            })),
          },
        },
      ],
    },
  });
}

// 宛先リスト管理不要（誤配信リスクが低い）。告知配信は原則このbroadcastのみを使う。
export async function broadcast(text) {
  return lineFetch("/message/broadcast", {
    body: { messages: [{ type: "text", text }] },
  });
}

// 今月の送信可能通数（無料枠は月1,000通。send-broadcast.mjsのdry-runプレビューで参考表示する）
export async function getQuota() {
  return lineFetch("/message/quota", { method: "GET" });
}

export async function getQuotaConsumption() {
  return lineFetch("/message/quota/consumption", { method: "GET" });
}

// 個別メッセージの送信者プロフィール取得（表示名を下書き一覧に出すためだけに使う。失敗しても致命的ではない）
export async function getProfile(userId) {
  return lineFetch(`/profile/${encodeURIComponent(userId)}`, { method: "GET" });
}
