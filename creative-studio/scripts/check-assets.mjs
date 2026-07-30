#!/usr/bin/env node
// check-assets.mjs
// HTML/CSS内で参照されている画像・フォント等のローカルファイルが実在するか、
// また assets/source・assets/licensed 配下にライセンス未確認と思われる素材が
// 使われていないかを検査します。
//
// 使い方: node scripts/check-assets.mjs <file1> [file2 ...]

import fs from "node:fs";
import path from "node:path";

const files = process.argv.slice(2);
if (files.length === 0) {
  console.error("使い方: node scripts/check-assets.mjs <file1> [file2 ...]");
  process.exit(1);
}

const assetRe = /(?:url\(|src\s*=\s*|href\s*=\s*)["']?([^"')\s]+\.(?:png|jpg|jpeg|gif|svg|webp|woff2?|ttf|otf))["']?/gi;

let missing = 0;
let unlicensed = 0;
for (const file of files) {
  if (!fs.existsSync(file)) { console.error(`ファイルが見つかりません: ${file}`); continue; }
  const content = fs.readFileSync(file, "utf8");
  const dir = path.dirname(file);
  const found = new Set();
  let m;
  while ((m = assetRe.exec(content))) found.add(m[1]);

  console.log(`\n${file}  (参照素材: ${found.size}件)`);
  for (const a of found) {
    if (/^https?:\/\//i.test(a)) { console.log(`  [外部] ${a}（ライセンス・可用性は手動確認）`); continue; }
    const resolved = path.resolve(dir, a);
    if (!fs.existsSync(resolved)) { console.log(`  [NG] ファイルが見つかりません: ${a}`); missing++; continue; }
    if (resolved.includes(`${path.sep}assets${path.sep}source${path.sep}`)) {
      console.log(`  [注意] assets/source（未整理の元素材）を直接参照しています: ${a} → ライセンス確認後に assets/licensed または assets/optimized へ移動してください`);
      unlicensed++;
    }
  }
}
console.log(`\n見つからない素材: ${missing}件 / ライセンス未確認の可能性: ${unlicensed}件`);
process.exit(missing > 0 ? 1 : 0);
