// Discord REST APIの薄いクライアント（fetchベース。discord.js等の外部ライブラリは使わない）
// A案（固定投稿）を前提としており、Discord Gatewayへの常時接続は行わない。
const API_BASE = "https://discord.com/api/v10";

export function discordConfigured() {
  return !!(process.env.DISCORD_BOT_TOKEN && process.env.DISCORD_GUILD_ID);
}

function authHeaders() {
  const token = process.env.DISCORD_BOT_TOKEN;
  if (!token) throw new Error("DISCORD_BOT_TOKEN が未設定です");
  return {
    Authorization: "Bot " + token,
    "Content-Type": "application/json",
  };
}

async function discordFetch(path, { method = "GET", body } = {}) {
  const res = await fetch(API_BASE + path, {
    method,
    headers: authHeaders(),
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Discord API error: ${res.status} ${detail}`);
  }
  if (res.status === 204) return null;
  return res.json().catch(() => null);
}

export async function getBotInfo() {
  return discordFetch("/users/@me");
}

export async function listChannels(guildId) {
  return discordFetch(`/guilds/${guildId}/channels`);
}

// type: 0 = テキストチャンネル
export async function createTextChannel(guildId, name, topic) {
  return discordFetch(`/guilds/${guildId}/channels`, {
    method: "POST",
    body: { name, type: 0, topic },
  });
}

export async function setChannelTopic(channelId, topic) {
  return discordFetch(`/channels/${channelId}`, {
    method: "PATCH",
    body: { topic },
  });
}

export async function sendMessage(channelId, content) {
  return discordFetch(`/channels/${channelId}/messages`, {
    method: "POST",
    body: { content },
  });
}
