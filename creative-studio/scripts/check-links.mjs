#!/usr/bin/env node
// check-links.mjs
// HTML/Markdownファイル内のリンク（href/src、Markdownリンク）を抽出し、
// ローカルファイル参照が実在するかを検査します。外部URLへの実接続確認は行いません
// （ネットワークアクセスなしで完結させるため）。外部URLは一覧化するだけです。
//
// 使い方: node scripts/check-links.mjs <file1> [file2 ...]

import fs from "node:fs";
import path from "node:path";

const files = process.argv.slice(2);
if (files.length === 0) {
  console.error("使い方: node scripts/check-links.mjs <file1> [file2 ...]");
  process.exit(1);
}

const linkRe = /(?:href|src)\s*=\s*["']([^"']+)["']|\]\(([^)]+)\)/g;

let brokenCount = 0;
for (const file of files) {
  if (!fs.existsSync(file)) { console.error(`ファイルが見つかりません: ${file}`); continue; }
  const content = fs.readFileSync(file, "utf8");
  const dir = path.dirname(file);
  const local = [];
  const external = [];
  let m;
  while ((m = linkRe.exec(content))) {
    const url = (m[1] || m[2] || "").trim();
    if (!url || url.startsWith("#") || url.startsWith("mailto:") || url.startsWith("tel:")) continue;
    if (/^https?:\/\//i.test(url)) external.push(url);
    else local.push(url);
  }
  console.log(`\n${file}`);
  console.log(`  ローカル参照: ${local.length}件 / 外部URL: ${external.length}件`);
  for (const l of local) {
    const clean = l.split("#")[0].split("?")[0];
    if (!clean) continue;
    const resolved = path.resolve(dir, clean);
    const ok = fs.existsSync(resolved);
    if (!ok) { console.log(`  [NG] ローカルファイルが見つかりません: ${l}`); brokenCount++; }
  }
  if (external.length) {
    console.log("  外部URL一覧（実接続確認はしていません。手動確認してください）:");
    external.forEach((u) => console.log("    - " + u));
  }
}
console.log(`\n壊れたローカル参照: ${brokenCount}件`);
process.exit(brokenCount > 0 ? 1 : 0);
