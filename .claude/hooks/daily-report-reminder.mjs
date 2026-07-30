import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const reportFile = path.join(__dirname, "..", "..", "logs", "日報.md");

const today = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Tokyo",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
}).format(new Date()); // YYYY-MM-DD

let already = false;
try {
  const content = fs.readFileSync(reportFile, "utf-8");
  already = content.includes(today);
} catch (e) {
  already = false; // file missing -> treat as not yet logged
}

if (already) {
  process.exit(0);
} else {
  process.stdout.write(JSON.stringify({
    decision: "block",
    reason:
      `logs/日報.md に本日（${today}）のエントリがまだありません。終了前に、今日やったこと・決めたこと・次回への申し送りを短くまとめて logs/日報.md に追記してください（既存の見出し形式に合わせる）。追記済みなら、そのまま終了して構いません。`
  }));
  process.exit(0);
}
