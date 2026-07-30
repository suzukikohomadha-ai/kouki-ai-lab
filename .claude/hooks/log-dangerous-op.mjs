import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logFile = path.join(__dirname, "..", "..", "logs", "security-audit-log.md");

let raw = "";
process.stdin.on("data", (c) => (raw += c));
process.stdin.on("end", () => {
  try {
    const input = JSON.parse(raw || "{}");
    const tool = input.tool_name || "";
    const ti = input.tool_input || {};
    let detail = null;

    if (tool === "Bash" || tool === "PowerShell") {
      const cmd = ti.command || "";
      if (/(^|[\s&|;])git\s+(push|commit)\b/.test(cmd) || /(^|[\s&|;])rm\s/.test(cmd) || /Remove-Item/.test(cmd)) {
        detail = cmd.slice(0, 300);
      }
    } else if (tool === "WebFetch") {
      detail = ti.url || "";
    } else if (tool === "mcp__claude_ai_Gmail__create_draft") {
      detail = `to=${ti.to || "(不明)"} subject=${(ti.subject || "(不明)").slice(0, 80)}`;
    } else if (
      tool === "mcp__claude_ai_Notion__notion-update-page" ||
      tool === "mcp__claude_ai_Notion__notion-create-pages" ||
      tool === "mcp__claude_ai_Notion__notion-update-data-source"
    ) {
      const pageId = ti.page_id || ti.data_source_id || ti.parent?.data_source_id || "(不明)";
      detail = `page/parent=${pageId}`;
    }

    if (detail !== null) {
      const line = `- ${new Date().toISOString()} | ${tool} | ${detail.replace(/\n/g, " ")}\n`;
      fs.mkdirSync(path.dirname(logFile), { recursive: true });
      fs.appendFileSync(logFile, line);
    }
  } catch (e) {
    // never block on logging failure
  }
  process.exit(0);
});
