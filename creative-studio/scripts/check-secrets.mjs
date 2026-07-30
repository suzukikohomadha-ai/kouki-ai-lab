#!/usr/bin/env node
// check-secrets.mjs
// 制作物（HTML/CSS/JS/Markdown/JSON等）からシークレットらしき文字列・個人情報らしき
// 値・本番URLを検出します（依存パッケージなし）。誤検知前提のため自動削除はしません。
//
// 使い方: node scripts/check-secrets.mjs <file1> [file2 ...]

import fs from "node:fs";

const patterns = [
  { label: "APIキーらしき文字列", re: /\b(sk|pk|api|key)[-_][A-Za-z0-9]{16,}\b/gi },
  { label: "AWSアクセスキー", re: /\bAKIA[0-9A-Z]{16}\b/g },
  { label: "Bearer Token", re: /\bBearer\s+[A-Za-z0-9\-_.=]{20,}/g },
  { label: "秘密鍵ヘッダー", re: /-----BEGIN (RSA |EC |OPENSSH |)PRIVATE KEY-----/g },
  { label: "汎用トークンらしき長いhex文字列", re: /\b[A-Fa-f0-9]{32,}\b/g },
  { label: "メールアドレス", re: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g },
  { label: "電話番号らしき文字列", re: /\b0\d{1,4}-\d{1,4}-\d{3,4}\b/g },
  { label: "本番URLらしき文字列（example.com以外）", re: /https?:\/\/(?!example\.com|localhost|127\.0\.0\.1)[A-Za-z0-9.-]+\.(com|net|jp|io|co)[^\s"']*/g },
];

const files = process.argv.slice(2);
if (files.length === 0) {
  console.error("使い方: node scripts/check-secrets.mjs <file1> [file2 ...]");
  process.exit(1);
}

let totalHits = 0;
for (const file of files) {
  if (!fs.existsSync(file)) { console.error(`ファイルが見つかりません: ${file}`); continue; }
  const content = fs.readFileSync(file, "utf8");
  const hits = [];
  for (const { label, re } of patterns) {
    const matches = [...content.matchAll(re)];
    if (matches.length > 0) {
      hits.push({ label, count: matches.length, samples: matches.slice(0, 3).map((m) => m[0].slice(0, 8) + "…(masked)") });
    }
  }
  console.log(`\n${file}`);
  if (hits.length === 0) { console.log("  検出なし"); continue; }
  for (const h of hits) {
    console.log(`  [検出] ${h.label} × ${h.count}件  例: ${h.samples.join(", ")}`);
    totalHits += h.count;
  }
}
console.log(`\n合計検出件数: ${totalHits}件（誤検知を含む可能性あり。自動削除はしていません）`);
process.exit(totalHits > 0 ? 1 : 0);
