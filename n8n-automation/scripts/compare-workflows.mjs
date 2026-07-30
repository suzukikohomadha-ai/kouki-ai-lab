#!/usr/bin/env node
// compare-workflows.mjs
//
// 2つのn8nワークフローJSON（変更前／変更後）を比較し、ノード・パラメータ・接続・
// Credential参照・有効/無効状態の差分をレポートします（依存パッケージなし）。
//
// 使い方:
//   node scripts/compare-workflows.mjs <before.json> <after.json>

import fs from "node:fs";

const [beforePath, afterPath] = process.argv.slice(2);
if (!beforePath || !afterPath) {
  console.error("使い方: node scripts/compare-workflows.mjs <before.json> <after.json>");
  process.exit(1);
}
for (const p of [beforePath, afterPath]) {
  if (!fs.existsSync(p)) {
    console.error(`ファイルが見つかりません: ${p}`);
    process.exit(1);
  }
}

function loadJson(p) {
  try {
    return JSON.parse(fs.readFileSync(p, "utf8"));
  } catch (e) {
    console.error(`JSON構文エラー (${p}):`, e.message);
    process.exit(1);
  }
}

const before = loadJson(beforePath);
const after = loadJson(afterPath);

const report = { added: [], removed: [], changed: [], riskyChanges: [], connectionsChanged: false, activeChanged: null };

const beforeNodes = new Map((before.nodes || []).map((n) => [n.name, n]));
const afterNodes = new Map((after.nodes || []).map((n) => [n.name, n]));

for (const name of afterNodes.keys()) {
  if (!beforeNodes.has(name)) report.added.push(name);
}
for (const name of beforeNodes.keys()) {
  if (!afterNodes.has(name)) report.removed.push(name);
}
for (const name of beforeNodes.keys()) {
  if (!afterNodes.has(name)) continue;
  const b = beforeNodes.get(name);
  const a = afterNodes.get(name);
  const diffs = [];
  if (b.type !== a.type) diffs.push(`type: ${b.type} → ${a.type}`);
  if (b.typeVersion !== a.typeVersion) diffs.push(`typeVersion: ${b.typeVersion} → ${a.typeVersion}`);
  const bParams = JSON.stringify(b.parameters ?? {});
  const aParams = JSON.stringify(a.parameters ?? {});
  if (bParams !== aParams) diffs.push("parameters が変更されています（詳細は各ファイルを直接比較してください）");
  const bCred = JSON.stringify(b.credentials ?? {});
  const aCred = JSON.stringify(a.credentials ?? {});
  if (bCred !== aCred) {
    diffs.push("credentials 参照が変更されています");
    report.riskyChanges.push(`ノード "${name}" のCredential参照が変更されました。誤った環境のCredentialを参照していないか要確認。`);
  }
  if (diffs.length > 0) report.changed.push({ name, diffs });
}

const beforeConn = JSON.stringify(before.connections ?? {});
const afterConn = JSON.stringify(after.connections ?? {});
report.connectionsChanged = beforeConn !== afterConn;

if (before.active !== after.active) {
  report.activeChanged = `${before.active} → ${after.active}`;
  if (after.active === true) {
    report.riskyChanges.push("ワークフローが「無効→有効」に変更されています。本番反映前に承認済みか確認してください。");
  }
}

if (report.removed.length > 0) {
  report.riskyChanges.push(`ノードが削除されています: ${report.removed.join(", ")}（データ欠落・処理漏れがないか確認）`);
}

console.log(`\n=== compare-workflows: ${beforePath} → ${afterPath} ===`);
console.log(`追加ノード: ${report.added.length > 0 ? report.added.join(", ") : "なし"}`);
console.log(`削除ノード: ${report.removed.length > 0 ? report.removed.join(", ") : "なし"}`);
console.log(`変更ノード: ${report.changed.length}件`);
for (const c of report.changed) {
  console.log(`  - ${c.name}: ${c.diffs.join(" / ")}`);
}
console.log(`接続(connections)の変更: ${report.connectionsChanged ? "あり" : "なし"}`);
console.log(`active状態の変更: ${report.activeChanged ?? "なし"}`);
if (report.riskyChanges.length > 0) {
  console.log("\n[要注意な変更]");
  for (const r of report.riskyChanges) console.log("  - " + r);
}

process.exit(0);
