// LINE配信テンプレート送信CLI
// 使い方: node send-broadcast.mjs --template=<name>          … 本文プレビュー表示のみ（dry-run、既定）
//        node send-broadcast.mjs --template=<name> --send    … 実際にbroadcast APIを呼び出す
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { broadcast, lineConfigured, getQuota, getQuotaConsumption } from "./lib/line-client.mjs";

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

const TEMPLATES_DIR = join(__dirname, "templates");

function parseArgs(argv) {
  const args = { send: false, template: null };
  for (const a of argv) {
    if (a === "--send") args.send = true;
    else if (a.startsWith("--template=")) args.template = a.slice("--template=".length);
  }
  return args;
}

function listTemplates() {
  return readdirSync(TEMPLATES_DIR)
    .filter((f) => f.endsWith(".md") && f !== "welcome-reply.md")
    .map((f) => f.replace(/\.md$/, ""));
}

function loadTemplate(name) {
  const path = join(TEMPLATES_DIR, `${name}.md`);
  if (!existsSync(path)) return null;
  return readFileSync(path, "utf-8").trim();
}

async function main() {
  const { template, send } = parseArgs(process.argv.slice(2));

  if (!template) {
    console.log("使い方: node send-broadcast.mjs --template=<name> [--send]");
    console.log("利用可能なテンプレート:", listTemplates().join(", "));
    process.exit(1);
  }

  const body = loadTemplate(template);
  if (body === null) {
    console.error(`テンプレートが見つかりません: ${template}`);
    console.log("利用可能なテンプレート:", listTemplates().join(", "));
    process.exit(1);
  }

  console.log("======================================");
  console.log(` これから配信する内容（テンプレート: ${template}）`);
  console.log("======================================");
  console.log(body);
  console.log("======================================");

  if (/\[[^\]]+\]/.test(body)) {
    console.log("⚠ 未確定のプレースホルダー（[〇〇]等）が残っています。実送信前に必ず埋めてください。");
  }

  if (!send) {
    console.log("\n[dry-run] 実際の送信は行っていません。実送信するには --send を付けて実行してください。");
    if (lineConfigured()) {
      try {
        const quota = await getQuota();
        const consumption = await getQuotaConsumption();
        console.log(`\n参考（今月の送信枠）: ${JSON.stringify(quota)}`);
        console.log(`参考（消費済み）: ${JSON.stringify(consumption)}`);
      } catch (e) {
        console.log("(送信枠の確認に失敗しました:", e.message, ")");
      }
    } else {
      console.log("(LINE_COMMUNITY_CHANNEL_ACCESS_TOKEN 未設定のため送信枠の確認はスキップしました)");
    }
    return;
  }

  if (!lineConfigured()) {
    console.error("LINE_COMMUNITY_CHANNEL_ACCESS_TOKEN / LINE_COMMUNITY_CHANNEL_SECRET が未設定のため送信できません。");
    process.exit(1);
  }

  console.log("\n--send が指定されました。実際にbroadcast APIを呼び出します...");
  await broadcast(body);
  console.log("✅ 配信しました。");
}

main().catch((e) => {
  console.error("エラー:", e.message);
  process.exit(1);
});
