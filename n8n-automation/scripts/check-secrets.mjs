#!/usr/bin/env node
// check-secrets.mjs
//
// ワークフローJSON（またはその他テキストファイル）から、シークレットらしき文字列・
// 個人情報らしきテストデータ・本番URLを検出します（依存パッケージなし）。
//
// [重要] 誤検知を前提としたツールです。検出しただけで自動削除はしません。
// 検出結果は人（ユーザーまたは n8n-quality-auditor）が最終判断してください。
//
// 使い方:
//   node scripts/check-secrets.mjs <file1> [file2 ...]
//   node scripts/check-secrets.mjs workflows/draft/*.json   （シェルのglob展開に依存）

import fs from "node:fs";

const patterns = [
  { label: "APIキーらしき文字列（sk-... 等）", re: /\b(sk|pk|api|key)[-_][A-Za-z0-9]{16,}\b/gi },
  { label: "AWSアクセスキー", re: /\bAKIA[0-9A-Z]{16}\b/g },
  { label: "Bearer Token", re: /\bBearer\s+[A-Za-z0-9\-_.=]{20,}/g },
  { label: "Basic認証（Base64っぽい長い文字列を含む）", re: /\bBasic\s+[A-Za-z0-9+/=]{16,}/g },
  { label: "秘密鍵ヘッダー", re: /-----BEGIN (RSA |EC |OPENSSH |)PRIVATE KEY-----/g },
  { label: "汎用トークンらしき長いhex/base64文字列", re: /\b[A-Fa-f0-9]{32,}\b/g },
  { label: "Google系APIキー（AIza...）", re: /\bAIza[0-9A-Za-z\-_]{35}\b/g },
  { label: "Slack Token", re: /\bxox[baprs]-[0-9A-Za-z-]{10,}\b/g },
  { label: "メールアドレス（個人情報の可能性）", re: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g },
  { label: "本番らしきURL（例示ドメイン以外）", re: /https?:\/\/(?!example\.com|localhost|127\.0\.0\.1)[A-Za-z0-9.-]+\.(com|net|jp|io|co)[^\s"']*/g },
  { label: "パスワードらしきキー", re: /"(password|passwd|pwd)"\s*:\s*"[^"]{3,}"/gi },
];

const files = process.argv.slice(2);
if (files.length === 0) {
  console.error("使い方: node scripts/check-secrets.mjs <file1> [file2 ...]");
  process.exit(1);
}

let totalHits = 0;
const results = [];

for (const file of files) {
  if (!fs.existsSync(file)) {
    console.error(`ファイルが見つかりません: ${file}`);
    continue;
  }
  const content = fs.readFileSync(file, "utf8");
  const fileHits = [];
  for (const { label, re } of patterns) {
    const matches = [...content.matchAll(re)];
    if (matches.length > 0) {
      fileHits.push({
        label,
        count: matches.length,
        // 値そのものは伏せて、先頭数文字だけ表示（機微情報をログに残しすぎないため）
        samples: matches.slice(0, 3).map((m) => m[0].slice(0, 8) + "…(masked)"),
      });
    }
  }
  results.push({ file, hits: fileHits });
  totalHits += fileHits.reduce((n, h) => n + h.count, 0);
}

console.log("\n=== check-secrets 結果 ===");
for (const r of results) {
  console.log(`\n${r.file}`);
  if (r.hits.length === 0) {
    console.log("  検出なし");
    continue;
  }
  for (const h of r.hits) {
    console.log(`  [検出] ${h.label} × ${h.count}件  例: ${h.samples.join(", ")}`);
  }
}
console.log(`\n合計検出件数: ${totalHits}件`);
console.log("これは誤検知を含む可能性があります。自動削除はしていません。人が内容を確認してください。");

process.exit(totalHits > 0 ? 1 : 0);
