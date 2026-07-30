#!/usr/bin/env node
// generate-asset-manifest.mjs
// assets/ 配下を棚卸しして、brand/sources/source-register.md に登録されていない
// ファイルを一覧化します（新規に台帳へ追記すべき候補のリストアップ用）。
// ファイルの自動削除・自動移動は行いません。
//
// 使い方: node scripts/generate-asset-manifest.mjs

import fs from "node:fs";
import path from "node:path";

const ASSET_DIRS = ["assets/source", "assets/generated", "assets/licensed", "assets/optimized"];
const REGISTER = "brand/sources/source-register.md";

function walk(dir) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === ".gitkeep") continue;
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(p));
    else out.push(p);
  }
  return out;
}

const allFiles = ASSET_DIRS.flatMap(walk);

let registered = new Set();
if (fs.existsSync(REGISTER)) {
  const content = fs.readFileSync(REGISTER, "utf8");
  const lines = content.split("\n").filter((l) => l.startsWith("|") && !l.startsWith("| ファイル名") && !l.startsWith("|---"));
  for (const line of lines) {
    const cell = line.split("|")[1];
    if (cell) registered.add(cell.trim());
  }
}

console.log(`=== generate-asset-manifest ===`);
console.log(`assets/ 配下のファイル数: ${allFiles.length}`);
console.log(`source-register.md に登録済み: ${registered.size}件\n`);

const unregistered = allFiles.filter((f) => !registered.has(path.basename(f)));
if (unregistered.length === 0) {
  console.log("台帳に未登録のファイルはありません。");
} else {
  console.log(`台帳に未登録のファイル（${unregistered.length}件）— brand/sources/source-register.md への追記を検討してください:`);
  unregistered.forEach((f) => console.log("  - " + f));
}
