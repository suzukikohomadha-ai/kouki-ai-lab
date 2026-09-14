import assert from 'node:assert/strict';
import { test } from 'node:test';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readdirSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { ROOT } from './helpers.js';

const TSX = join(ROOT, 'node_modules', 'tsx', 'dist', 'cli.mjs');
const CLI = join(ROOT, 'src', 'cli', 'index.ts');

function cli(...args: string[]) {
  const r = spawnSync(process.execPath, [TSX, CLI, ...args], { cwd: ROOT, encoding: 'utf8' });
  return { code: r.status, out: r.stdout + r.stderr };
}

test('CLI verify-config: sample は終了コード2、例設定は0', () => {
  const bad = cli('verify-config', '--profile', 'config/profile.sample.json');
  assert.equal(bad.code, 2, bad.out);
  assert.ok(bad.out.includes('TODO_VERIFY'));
  const good = cli('verify-config', '--profile', 'config/examples/profile.mf.json');
  assert.equal(good.code, 0, good.out);
});

test('CLI convert: 正常系は終了コード0で成果物一式を書き出す', () => {
  const out = mkdtempSync(join(tmpdir(), 'acc-conv-'));
  const r = cli('convert', '--profile', 'config/examples/profile.mf.json', '--input', 'fixtures/mf/normal.csv', '--out', out);
  assert.equal(r.code, 0, r.out);
  const dir = join(out, readdirSync(out)[0]);
  for (const f of ['freee_import.csv', 'report.md', 'report_accounts.csv', 'report_taxcodes.csv', 'report_unmapped.csv', 'report_diagnostics.csv', 'run.json']) {
    assert.ok(existsSync(join(dir, f)), `${f} がない`);
  }
  const bytes = readFileSync(join(dir, 'freee_import.csv'));
  assert.deepEqual([...bytes.subarray(0, 3)], [0xef, 0xbb, 0xbf]);
  const run = JSON.parse(readFileSync(join(dir, 'run.json'), 'utf8'));
  assert.equal(run.outputWritten, true);
  assert.equal(run.stats.entries, 5);
  assert.ok(!('entries' in run) && !JSON.stringify(run).includes('店頭売上'));
});

test('CLI convert: error ありは終了コード2、freee_import.csv を書かない', () => {
  const out = mkdtempSync(join(tmpdir(), 'acc-conv-'));
  const r = cli('convert', '--profile', 'config/examples/profile.mf.json', '--input', 'fixtures/mf/unmapped.csv', '--out', out);
  assert.equal(r.code, 2, r.out);
  const dir = join(out, readdirSync(out)[0]);
  assert.ok(!existsSync(join(dir, 'freee_import.csv')));
  assert.ok(existsSync(join(dir, 'report_unmapped.csv')));
});

test('CLI convert: 警告ありは終了コード1', () => {
  const out = mkdtempSync(join(tmpdir(), 'acc-conv-'));
  const r = cli('convert', '--profile', 'config/examples/profile.mf.json', '--input', 'fixtures/mf/partners.csv', '--out', out);
  assert.equal(r.code, 1, r.out);
});

test('CLI convert: TODO_VERIFY 残りの sample は --dev なしで終了コード2', () => {
  const out = mkdtempSync(join(tmpdir(), 'acc-conv-'));
  const r = cli('convert', '--profile', 'config/profile.sample.json', '--input', 'fixtures/mf/normal.csv', '--out', out);
  assert.equal(r.code, 2, r.out);
  assert.ok(r.out.includes('E000'));
});

test('CLI inspect: Shift_JIS ファイルの判定と先頭行表示', () => {
  const r = cli('inspect', '--input', 'fixtures/yayoi/normal.txt');
  assert.equal(r.code, 0, r.out);
  assert.ok(r.out.includes('shift_jis'));
  assert.ok(r.out.includes('店頭売上'));
});
