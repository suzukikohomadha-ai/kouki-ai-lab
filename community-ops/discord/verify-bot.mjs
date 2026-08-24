// Discord Botトークンの疎通確認（Bot情報取得APIを叩くだけの小さいスクリプト）
// 使い方: node verify-bot.mjs
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { getBotInfo, listChannels } from "./lib/discord-client.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));

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

async function main() {
  if (!process.env.DISCORD_BOT_TOKEN) {
    console.error("❌ DISCORD_BOT_TOKEN が未設定です。community-ops/.env を確認してください。");
    process.exit(1);
  }

  try {
    const bot = await getBotInfo();
    console.log(`✅ Bot疎通確認OK: ${bot.username}${bot.discriminator && bot.discriminator !== "0" ? "#" + bot.discriminator : ""} (id=${bot.id})`);
  } catch (e) {
    console.error("❌ Bot疎通確認に失敗しました:", e.message);
    process.exit(1);
  }

  const guildId = process.env.DISCORD_GUILD_ID;
  if (!guildId) {
    console.log("ℹ DISCORD_GUILD_ID が未設定のため、サーバー接続確認はスキップしました。");
    return;
  }

  try {
    const channels = await listChannels(guildId);
    console.log(`✅ サーバー（guildId=${guildId}）への接続を確認できました。既存チャンネル数: ${channels.length}`);
  } catch (e) {
    console.error(
      "❌ サーバーへの接続確認に失敗しました（Botがサーバーに招待されているか、DISCORD_GUILD_IDが正しいか確認してください）:",
      e.message
    );
    process.exit(1);
  }
}

main();
