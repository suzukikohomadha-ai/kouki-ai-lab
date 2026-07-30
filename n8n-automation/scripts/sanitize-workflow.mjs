#!/usr/bin/env node
// sanitize-workflow.mjs
//
// ワークフローJSONの共有・コミット前チェック。既定はレポートのみ（何も書き換えません）。
// `--write` を付けたときだけ、安全と判断した項目（pinData等の実行データ）を除去した
// コピーを `<name>.sanitized.json` として書き出します（元ファイルは変更しません）。
//
// [注意] Credentialの参照形式（id/name等）はn8nのバージョンで差異があり得るため、
// このスクリプトはCredentialの「値」を書き換えることはしません（そもそもn8nの正規エクスポートは
// Credentialの秘密値を含まない設計のはずですが、断定はせず必ず check-secrets.mjs も併用してください）。
//
// 使い方:
//   node scripts/sanitize-workflow.mjs <workflow.json> [--write]

import fs from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
const targetPath = args[0];
const doWrite = args.includes("--write");

if (!targetPath || !fs.existsSync(targetPath)) {
  console.error("使い方: node scripts/sanitize-workflow.mjs <workflow.json> [--write]");
  process.exit(1);
}

const raw = fs.readFileSync(targetPath, "utf8");
let wf;
try {
  wf = JSON.parse(raw);
} catch (e) {
  console.error("JSON構文エラー:", e.message);
  process.exit(1);
}

const findings = [];

// 実行データ・ピン留めデータらしきフィールド（存在すれば実データを含む可能性がある）
const riskyTopLevelKeys = ["pinData", "staticData"];
for (const key of riskyTopLevelKeys) {
  if (wf[key] && Object.keys(wf[key]).length > 0) {
    findings.push(`トップレベルに "${key}" があり、実行時データを含んでいる可能性があります。`);
  }
}

// 本番URLらしき文字列の検出（ノードのparameters内）
const prodUrlRe = /https?:\/\/(?!example\.com|localhost|127\.0\.0\.1)[A-Za-z0-9.-]+\.(com|net|jp|io|co)[^\s"']*/g;
function scan(obj, pathStr = "") {
  if (obj === null || obj === undefined) return;
  if (typeof obj === "string") {
    const matches = obj.match(prodUrlRe);
    if (matches) {
      findings.push(`${pathStr || "(root)"} に本番URLらしき文字列: ${matches[0].slice(0, 40)}...`);
    }
    return;
  }
  if (Array.isArray(obj)) {
    obj.forEach((v, i) => scan(v, `${pathStr}[${i}]`));
    return;
  }
  if (typeof obj === "object") {
    for (const [k, v] of Object.entries(obj)) {
      scan(v, pathStr ? `${pathStr}.${k}` : k);
    }
  }
}
for (const node of wf.nodes || []) {
  scan(node.parameters, `nodes["${node.name}"].parameters`);
}

console.log(`\n=== sanitize-workflow: ${targetPath} ===`);
if (findings.length === 0) {
  console.log("検出なし。");
} else {
  for (const f of findings) console.log("  [注意]", f);
}

if (doWrite) {
  const clean = JSON.parse(JSON.stringify(wf));
  for (const key of riskyTopLevelKeys) delete clean[key];
  const dir = path.dirname(targetPath);
  const base = path.basename(targetPath, path.extname(targetPath));
  const outPath = path.join(dir, `${base}.sanitized.json`);
  fs.writeFileSync(outPath, JSON.stringify(clean, null, 2), "utf8");
  console.log(`\n除去済みコピーを書き出しました: ${outPath}`);
  console.log("（pinData/staticData のみ除去。URL・パラメータ内容は書き換えていません。手動確認してください）");
} else {
  console.log("\n--write を付けていないため、ファイルは変更していません（レポートのみ）。");
}
