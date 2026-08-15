#!/usr/bin/env node
// validate-workflow.mjs
//
// n8nワークフローJSONの静的検証スクリプト（依存パッケージなし・Node.js標準ライブラリのみ）。
//
// [重要な注意]
// n8nのワークフローJSONの内部スキーマ（nodes/connections の正確な必須フィールドや
// typeVersionの妥当性）は、n8nのバージョンによって差異があり得ます。このスクリプトは
// 「一般的にn8nの公式ドキュメント・公式エクスポートで観測される構造」に基づいた
// 汎用的なチェックのみを行い、特定ノードのtype/typeVersion/パラメータが「正しいか」までは
// 判定しません（それは n8n-schema-researcher が公式情報・接続先インスタンスで確認する領域です）。
// より正確な検証をしたい場合は、実際に接続先n8nインスタンスからエクスポートした
// ワークフローJSONを `--reference` で渡してください（あれば、ノード名の形式などを比較します）。
//
// 使い方:
//   node scripts/validate-workflow.mjs <workflow.json> [--reference <exported.json>]
//
// 出力:
//   標準出力にサマリー、加えて同じディレクトリに <name>.validate.json と
//   <name>.validate.md を書き出します。

import fs from "node:fs";
import path from "node:path";

function fail(msg) {
  console.error("ERROR:", msg);
  process.exit(1);
}

const args = process.argv.slice(2);
const targetPath = args[0];
if (!targetPath) {
  fail("workflow JSONファイルのパスを指定してください。例: node scripts/validate-workflow.mjs workflows/draft/sample.json");
}
const refIdx = args.indexOf("--reference");
const referencePath = refIdx !== -1 ? args[refIdx + 1] : null;

if (!fs.existsSync(targetPath)) {
  fail(`ファイルが見つかりません: ${targetPath}`);
}

const errors = [];
const warnings = [];
const info = [];

let raw;
try {
  raw = fs.readFileSync(targetPath, "utf8");
} catch (e) {
  fail(`読み込みに失敗しました: ${e.message}`);
}

let wf;
try {
  wf = JSON.parse(raw);
} catch (e) {
  errors.push(`JSON構文エラー: ${e.message}`);
  writeResults(targetPath, { errors, warnings, info, valid: false });
  console.error("検証失敗（JSON構文エラー）。詳細は上記・出力ファイルを参照してください。");
  process.exit(1);
}

// --- 必須トップレベルフィールド（n8nエクスポートで一般的に見られる構造） ---
if (!Array.isArray(wf.nodes)) {
  errors.push("トップレベルに `nodes`（配列）がありません。n8nワークフローJSONとして不完全な可能性があります。");
}
if (wf.connections !== undefined && typeof wf.connections !== "object") {
  errors.push("`connections` はオブジェクトである必要があります。");
} else if (wf.connections === undefined) {
  warnings.push("`connections` がありません（ノードが1つだけ、または未接続の可能性）。");
}
if (wf.name === undefined) {
  warnings.push("`name`（ワークフロー名）がありません。");
}

const nodes = Array.isArray(wf.nodes) ? wf.nodes : [];

// --- ノード単位のチェック ---
const nameCount = new Map();
const idCount = new Map();
for (const [i, node] of nodes.entries()) {
  const label = node?.name ?? `(index ${i})`;
  if (!node || typeof node !== "object") {
    errors.push(`nodes[${i}] がオブジェクトではありません。`);
    continue;
  }
  if (!node.name) errors.push(`nodes[${i}] に \`name\` がありません。`);
  if (!node.type) errors.push(`nodes[${i}] (${label}) に \`type\` がありません。`);
  if (node.typeVersion === undefined) warnings.push(`nodes[${i}] (${label}) に \`typeVersion\` がありません。[要インスタンス確認]`);
  if (!node.id) warnings.push(`nodes[${i}] (${label}) に \`id\` がありません（n8nバージョンによっては必須）。`);
  if (!Array.isArray(node.position)) warnings.push(`nodes[${i}] (${label}) に \`position\`（[x, y]）がありません。`);

  if (node.name) {
    nameCount.set(node.name, (nameCount.get(node.name) || 0) + 1);
  }
  if (node.id) {
    idCount.set(node.id, (idCount.get(node.id) || 0) + 1);
  }
}

for (const [name, count] of nameCount) {
  if (count > 1) errors.push(`ノード名が重複しています: "${name}" (${count}件)。n8nではノード名は一意である必要があります。`);
}
for (const [id, count] of idCount) {
  if (count > 1) errors.push(`ノードIDが重複しています: "${id}" (${count}件)。`);
}

const nodeNames = new Set(nodes.map((n) => n?.name).filter(Boolean));

// --- 接続整合性チェック ---
if (wf.connections && typeof wf.connections === "object") {
  for (const [fromName, outputs] of Object.entries(wf.connections)) {
    if (!nodeNames.has(fromName)) {
      errors.push(`connections に存在するノード名 "${fromName}" が nodes[] に見つかりません。`);
      continue;
    }
    if (!outputs || typeof outputs !== "object") continue;
    for (const [outputType, branches] of Object.entries(outputs)) {
      if (!Array.isArray(branches)) continue;
      for (const branch of branches) {
        if (!Array.isArray(branch)) continue;
        for (const conn of branch) {
          const toName = conn?.node;
          if (toName && !nodeNames.has(toName)) {
            errors.push(`connections["${fromName}"]["${outputType}"] の接続先 "${toName}" が nodes[] に見つかりません。`);
          }
        }
      }
    }
  }
}

// --- 未接続ノード（トリガー系以外で、接続元にも接続先にも出てこないノード） ---
const connectedFrom = new Set(Object.keys(wf.connections || {}));
const connectedTo = new Set();
if (wf.connections) {
  for (const outputs of Object.values(wf.connections)) {
    if (!outputs || typeof outputs !== "object") continue;
    for (const branches of Object.values(outputs)) {
      if (!Array.isArray(branches)) continue;
      for (const branch of branches) {
        if (!Array.isArray(branch)) continue;
        for (const conn of branch) {
          if (conn?.node) connectedTo.add(conn.node);
        }
      }
    }
  }
}
for (const node of nodes) {
  if (!node?.name) continue;
  const looksLikeTrigger = /trigger|webhook|start|manual/i.test(node.type || "");
  if (!connectedFrom.has(node.name) && !connectedTo.has(node.name) && nodes.length > 1 && !looksLikeTrigger) {
    warnings.push(`ノード "${node.name}" が他のどのノードとも接続されていません（孤立ノードの可能性）。`);
  }
}

// --- Credential参照の検出（値そのものではなく「参照の有無」だけをチェック） ---
for (const node of nodes) {
  if (node?.credentials && typeof node.credentials === "object") {
    for (const [credType, credRef] of Object.entries(node.credentials)) {
      if (typeof credRef === "object" && credRef !== null) {
        if (!credRef.id && !credRef.name) {
          warnings.push(`ノード "${node.name}" のCredential参照(${credType})に id/name がありません。`);
        }
      } else {
        warnings.push(`ノード "${node.name}" のCredential参照(${credType})の形式が不明です。[要インスタンス確認]`);
      }
    }
  }
}

// --- Sticky Note とノードのレイアウト重なりチェック（キャンバス上の視覚的な重なり防止） ---
// 通常ノードのフットプリントは実測値ではなく、目視確認で問題ないと分かっている間隔
// （PUB-001での実機確認、2026-08-10）に基づく推定値。80px未満の間隔は重なって見える
// リスクが高いため警告する。座標系の都合上、正確なピクセル一致を保証するものではない。
const NODE_W_ESTIMATE = 180;
const NODE_H_ESTIMATE = 100;
const MIN_GAP = 80;

function nodeBox(node) {
  if (!Array.isArray(node.position) || node.position.length < 2) return null;
  const [x, y] = node.position;
  if (node.type === "n8n-nodes-base.stickyNote") {
    const w = node.parameters?.width;
    const h = node.parameters?.height;
    if (typeof w !== "number" || typeof h !== "number") return null;
    return { x0: x, y0: y, x1: x + w, y1: y + h, label: node.name, sticky: true };
  }
  return { x0: x, y0: y, x1: x + NODE_W_ESTIMATE, y1: y + NODE_H_ESTIMATE, label: node.name, sticky: false };
}

function boxGap(a, b) {
  const xGap = a.x1 < b.x0 ? b.x0 - a.x1 : b.x1 < a.x0 ? a.x0 - b.x1 : -1;
  const yGap = a.y1 < b.y0 ? b.y0 - a.y1 : b.y1 < a.y0 ? a.y0 - b.y1 : -1;
  if (xGap === -1 && yGap === -1) return -1; // 実際に重なっている
  if (xGap === -1) return yGap; // x方向は重なっており、y方向の間隔のみが実際の隙間
  if (yGap === -1) return xGap; // y方向は重なっており、x方向の間隔のみが実際の隙間
  // どちらの軸でも重なっていない（斜めに離れている）場合、2点間の最短距離はユークリッド距離
  return Math.sqrt(xGap * xGap + yGap * yGap);
}

const boxes = nodes.map(nodeBox).filter(Boolean);
const stickyBoxes = boxes.filter((b) => b.sticky);
const otherBoxes = boxes.filter((b) => !b.sticky);

for (const s of stickyBoxes) {
  for (const o of otherBoxes) {
    const g = boxGap(s, o);
    if (g < MIN_GAP) {
      const desc = g < 0 ? "実際に重なっています" : `間隔が${g}px（推奨${MIN_GAP}px以上）しかありません`;
      warnings.push(`レイアウト: Sticky Note "${s.label}" とノード "${o.label}" は${desc}。position/width/heightの見直しを推奨します。`);
    }
  }
}
for (let i = 0; i < stickyBoxes.length; i++) {
  for (let j = i + 1; j < stickyBoxes.length; j++) {
    const g = boxGap(stickyBoxes[i], stickyBoxes[j]);
    if (g < MIN_GAP) {
      const desc = g < 0 ? "実際に重なっています" : `間隔が${g}px（推奨${MIN_GAP}px以上）しかありません`;
      warnings.push(`レイアウト: Sticky Note "${stickyBoxes[i].label}" と "${stickyBoxes[j].label}" は${desc}。`);
    }
  }
}

if (referencePath) {
  if (fs.existsSync(referencePath)) {
    info.push(`参照ファイル ${referencePath} との比較は簡易実装です。詳細な差分は compare-workflows.mjs を使用してください。`);
  } else {
    warnings.push(`--reference で指定されたファイルが見つかりません: ${referencePath}`);
  }
}

const valid = errors.length === 0;

console.log(`\n=== validate-workflow: ${targetPath} ===`);
console.log(`エラー: ${errors.length}件 / 警告: ${warnings.length}件`);
for (const e of errors) console.log("  [ERROR]", e);
for (const w of warnings) console.log("  [WARN] ", w);
for (const i2 of info) console.log("  [INFO] ", i2);
console.log(valid ? "\n結果: 重大な問題なし（警告は個別に確認してください）" : "\n結果: 重大な問題あり。修正が必要です。");

writeResults(targetPath, { errors, warnings, info, valid });

function writeResults(targetPath, result) {
  const dir = path.dirname(targetPath);
  const base = path.basename(targetPath, path.extname(targetPath));
  const jsonOut = path.join(dir, `${base}.validate.json`);
  const mdOut = path.join(dir, `${base}.validate.md`);
  fs.writeFileSync(jsonOut, JSON.stringify({ file: targetPath, checkedAt: new Date().toISOString(), ...result }, null, 2), "utf8");
  const md = [
    `# 静的検証結果: ${targetPath}`,
    ``,
    `検証日時: ${new Date().toISOString()}`,
    `結果: ${result.valid ? "重大な問題なし" : "重大な問題あり"}`,
    ``,
    `## エラー (${result.errors.length})`,
    ...result.errors.map((e) => `- ${e}`),
    ``,
    `## 警告 (${result.warnings.length})`,
    ...result.warnings.map((w) => `- ${w}`),
    ``,
    `## 情報 (${result.info.length})`,
    ...result.info.map((i2) => `- ${i2}`),
  ].join("\n");
  fs.writeFileSync(mdOut, md, "utf8");
}

process.exit(valid ? 0 : 1);
