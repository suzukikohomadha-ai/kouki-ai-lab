import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { ROOT } from './helpers.js';

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else if (p.endsWith('.ts')) out.push(p);
  }
  return out;
}

const FORBIDDEN_MODULES = ['fetch', 'http', 'https', 'net', 'fs', 'child_process', 'dns', 'tls', 'dgram', 'worker_threads', 'vm'];

test('T12 src/core はネットワーク・ファイルシステム・プロセスに触れない（静的検査）', () => {
  const files = walk(join(ROOT, 'src', 'core'));
  assert.ok(files.length >= 10);
  for (const f of files) {
    const src = readFileSync(f, 'utf8');
    const rel = relative(ROOT, f);
    for (const m of FORBIDDEN_MODULES) {
      const importRe = new RegExp(`(from\\s+['"](node:)?${m}['"]|require\\(\\s*['"](node:)?${m}['"]\\s*\\)|import\\(\\s*['"](node:)?${m}['"]\\s*\\))`);
      assert.ok(!importRe.test(src), `${rel} が ${m} を import している`);
    }
    assert.ok(!/\bfetch\s*\(/.test(src), `${rel} が fetch() を呼んでいる`);
    assert.ok(!/\bprocess\.env\b/.test(src), `${rel} が process.env を参照している`);
    assert.ok(!/\bXMLHttpRequest\b|\bWebSocket\b/.test(src), `${rel} がブラウザのネットワークAPIを参照している`);
  }
});

test('T12 src/ 全体でもネットワーク系モジュール・child_process を使わない', () => {
  const files = walk(join(ROOT, 'src'));
  for (const f of files) {
    const src = readFileSync(f, 'utf8');
    const rel = relative(ROOT, f);
    for (const m of ['http', 'https', 'net', 'child_process', 'dns', 'tls', 'dgram']) {
      const importRe = new RegExp(`(from\\s+['"](node:)?${m}['"]|require\\(\\s*['"](node:)?${m}['"]\\s*\\))`);
      assert.ok(!importRe.test(src), `${rel} が ${m} を import している`);
    }
    assert.ok(!/\bfetch\s*\(/.test(src), `${rel} が fetch() を呼んでいる`);
  }
});

test('依存は papaparse と iconv-lite のみ（runtime）', () => {
  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));
  assert.deepEqual(Object.keys(pkg.dependencies).sort(), ['iconv-lite', 'papaparse']);
});

test('LLM 実装は同梱しない（NoopSuggester のみ）', () => {
  const src = readFileSync(join(ROOT, 'src', 'core', 'suggest.ts'), 'utf8');
  assert.ok(src.includes('class NoopSuggester'));
  assert.ok(src.includes('class RuleSuggester'));
  assert.ok(!/class\s+Llm\w*Suggester/.test(src));
});
