// Discordサーバー初期セットアップCLI
// 使い方: node setup-server.mjs           … 作成・投稿予定の内容をプレビュー表示のみ（dry-run、既定）
//        node setup-server.mjs --apply    … 実際にチャンネル作成・トピック設定・投稿を行う
//
// A案（固定投稿）で確定：入室イベント検知・常時稼働のGatewayは実装しない。
// 冪等性：既存チャンネルは GET /guilds/{id}/channels で確認し、同名なら作成をスキップする。
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import {
  discordConfigured,
  getBotInfo,
  listChannels,
  createTextChannel,
  setChannelTopic,
  sendMessage,
} from "./lib/discord-client.mjs";

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

const CONTENT_DIR = join(__dirname, "content");

function parseChannelTopics(md) {
  const channels = [];
  const parts = md.split(/^##\s+#/m).slice(1);
  for (const part of parts) {
    const [firstLine, ...rest] = part.split("\n");
    const name = firstLine.trim();
    const topic = rest.join("\n").trim();
    if (name) channels.push({ name, topic });
  }
  return channels;
}

function loadWelcomeMessage() {
  return readFileSync(join(CONTENT_DIR, "welcome-message.md"), "utf-8").trim();
}

function parseArgs(argv) {
  return { apply: argv.includes("--apply") };
}

async function main() {
  const { apply } = parseArgs(process.argv.slice(2));
  const guildId = process.env.DISCORD_GUILD_ID;

  console.log("======================================");
  console.log(" Discordサーバー初期セットアップ");
  console.log("======================================");

  const channels = parseChannelTopics(readFileSync(join(CONTENT_DIR, "channel-topics.md"), "utf-8"));
  const welcomeMessage = loadWelcomeMessage();

  console.log("\n作成予定のチャンネル（既存の同名チャンネルがあれば作成をスキップします）:");
  for (const ch of channels) {
    console.log(`  #${ch.name}`);
    console.log(`    トピック: ${ch.topic}`);
  }
  console.log("\n#お知らせ に投稿予定のウェルカムメッセージ:");
  console.log(welcomeMessage);
  if (/\[[^\]]+\]/.test(welcomeMessage)) {
    console.log("\n⚠ 未確定のプレースホルダー（[Meetリンク]等）が残っています。投稿前に必ず埋めてください。");
  }

  if (!apply) {
    console.log("\n[dry-run] 実際のAPI呼び出しは行っていません。実行するには --apply を付けて実行してください。");
    return;
  }

  if (!discordConfigured()) {
    console.error("\nDISCORD_BOT_TOKEN / DISCORD_GUILD_ID が未設定のため実行できません。.envを設定してください。");
    process.exit(1);
  }

  console.log("\n--apply が指定されました。Bot疎通確認から実行します...");

  const bot = await getBotInfo();
  console.log(`Bot疎通確認OK: ${bot.username}${bot.discriminator && bot.discriminator !== "0" ? "#" + bot.discriminator : ""}`);

  const existing = await listChannels(guildId);
  const existingByName = new Map(existing.map((c) => [c.name, c]));

  const resolved = {};
  for (const ch of channels) {
    const found = existingByName.get(ch.name);
    if (found) {
      console.log(`スキップ（既存チャンネル）: #${ch.name}`);
      if (found.topic !== ch.topic) {
        await setChannelTopic(found.id, ch.topic);
        console.log(`  トピックを最新の内容に更新しました: #${ch.name}`);
      }
      resolved[ch.name] = found;
      continue;
    }
    const created = await createTextChannel(guildId, ch.name, ch.topic);
    console.log(`作成しました: #${ch.name} (id=${created.id})`);
    resolved[ch.name] = created;
  }

  const announceChannel = resolved["お知らせ"];
  if (announceChannel) {
    await sendMessage(announceChannel.id, welcomeMessage);
    console.log("\nウェルカムメッセージを #お知らせ に投稿しました。");
  } else {
    console.warn("\n⚠ #お知らせ チャンネルが見つからず、ウェルカムメッセージは投稿していません。");
  }

  console.log("\n✅ セットアップ完了。");
}

main().catch((e) => {
  console.error("エラー:", e.message);
  process.exit(1);
});
