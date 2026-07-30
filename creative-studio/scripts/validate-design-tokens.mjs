#!/usr/bin/env node
// validate-design-tokens.mjs
// brand/design-tokens.json の構文・必須キーの有無を確認し、
// 定義済みの色同士のコントラスト比（WCAG基準）を計算します。
//
// 使い方: node scripts/validate-design-tokens.mjs [path/to/design-tokens.json]
// 既定パス: brand/design-tokens.json

import fs from "node:fs";

const target = process.argv[2] || "brand/design-tokens.json";
if (!fs.existsSync(target)) {
  console.error(`ファイルが見つかりません: ${target}`);
  process.exit(1);
}

let tokens;
try {
  tokens = JSON.parse(fs.readFileSync(target, "utf8"));
} catch (e) {
  console.error("JSON構文エラー:", e.message);
  process.exit(1);
}

const requiredGroups = ["color", "typography", "spacing", "radius", "shadow", "breakpoint"];
const warnings = [];
for (const g of requiredGroups) {
  if (!(g in tokens)) warnings.push(`トップレベルに "${g}" がありません。`);
}

function hexToRgb(hex) {
  if (typeof hex !== "string") return null;
  const m = hex.trim().match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (!m) return null;
  let h = m[1];
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  const num = parseInt(h, 16);
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
}
function relLuminance({ r, g, b }) {
  const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}
function contrastRatio(hex1, hex2) {
  const c1 = hexToRgb(hex1), c2 = hexToRgb(hex2);
  if (!c1 || !c2) return null;
  const l1 = relLuminance(c1) + 0.05, l2 = relLuminance(c2) + 0.05;
  return l1 > l2 ? l1 / l2 : l2 / l1;
}

const color = tokens.color || {};
const pairsToCheck = [
  ["textPrimary", "background"],
  ["textPrimary", "surface"],
  ["textSecondary", "background"],
  ["primary", "background"],
];

console.log(`\n=== validate-design-tokens: ${target} ===`);
if (warnings.length) warnings.forEach((w) => console.log("  [WARN] " + w));
else console.log("  必須グループ: OK");

console.log("\n--- コントラスト比チェック（WCAG AA: 通常文字4.5、大文字3.0） ---");
let anyChecked = false;
for (const [a, b] of pairsToCheck) {
  const ca = color[a], cb = color[b];
  if (!ca || !cb) { console.log(`  ${a} vs ${b}: 未確定のためスキップ`); continue; }
  const ratio = contrastRatio(ca, cb);
  anyChecked = true;
  if (ratio == null) { console.log(`  ${a}(${ca}) vs ${b}(${cb}): 色形式を解釈できませんでした（#rrggbb形式を推奨）`); continue; }
  const passAA = ratio >= 4.5, passAALarge = ratio >= 3.0;
  console.log(`  ${a}(${ca}) vs ${b}(${cb}): 比率 ${ratio.toFixed(2)} — 通常文字AA:${passAA ? "合格" : "不合格"} / 大文字AA:${passAALarge ? "合格" : "不合格"}`);
}
if (!anyChecked) console.log("  色トークンが未確定のため、コントラストチェックは実施できませんでした。");

console.log("\n(このスクリプトはWCAG 2.x のコントラスト計算式のみを実装しています。実際のブラウザ表示・書体による見え方の最終確認は別途行ってください。)");
