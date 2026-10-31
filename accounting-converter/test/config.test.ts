import assert from 'node:assert/strict';
import { test } from 'node:test';
import { join } from 'node:path';
import { convert, stripTodoVerify, verifyConfig } from '../src/core/index.js';
import { loadProfile } from '../src/cli/load.js';
import { fixtureBytes, ROOT } from './helpers.js';

test('T11 verify-config: 本番用 sample は TODO_VERIFY を検出して失敗', () => {
  const { profile } = loadProfile(join(ROOT, 'config', 'profile.sample.json'));
  const v = verifyConfig(profile);
  assert.equal(v.ok, false);
  assert.ok(v.todoCount > 0);
  assert.ok(v.issues.some((i) => i.path.startsWith('source.columns')));
  assert.ok(v.issues.some((i) => i.path.startsWith('target.columns')));
  assert.ok(v.issues.some((i) => i.path.startsWith('maps.taxcodes')));
  assert.ok(v.issues.some((i) => i.severity === 'warning' && i.message.includes('confirmed:false')));
});

test('T11 verify-config: 例設定（TODO_VERIFY なし）は通る', () => {
  for (const name of ['profile.mf.json', 'profile.yayoi.json']) {
    const { profile } = loadProfile(join(ROOT, 'config', 'examples', name));
    const v = verifyConfig(profile);
    assert.equal(v.ok, true, JSON.stringify(v.issues));
    assert.equal(v.todoCount, 0);
  }
});

test('T11 convert: TODO_VERIFY が残った設定は --dev なしでは E000 で変換しない', async () => {
  const { profile } = loadProfile(join(ROOT, 'config', 'profile.sample.json'));
  const r = await convert({ bytes: fixtureBytes('mf/normal.csv'), profile });
  assert.equal(r.outputCsv, null);
  assert.ok(r.diagnostics.every((d) => d.code === 'E000'));
  assert.equal(r.stats.entries, 0);
});

test('T11 convert --dev: TODO_VERIFY を推定名のまま使い W013', async () => {
  const { profile } = loadProfile(join(ROOT, 'config', 'profile.sample.json'));
  const r = await convert({ bytes: fixtureBytes('mf/normal.csv'), profile }, { dev: true });
  const w = r.diagnostics.filter((d) => d.code === 'W013');
  assert.equal(w.length, 1);
  assert.ok((w[0].detail?.count as number) > 0);
  assert.ok(!r.diagnostics.some((d) => d.code === 'E000'));
});

test('stripTodoVerify: 文字列接頭辞を除去し、数値文字列は数値化', () => {
  const { value, count } = stripTodoVerify({ a: 'TODO_VERIFY:取引日', b: { index: 'TODO_VERIFY:3' }, c: ['x', 'TODO_VERIFY:y'], d: 'TODO_VERIFY' });
  assert.deepEqual(value, { a: '取引日', b: { index: 3 }, c: ['x', 'y'], d: '' });
  assert.equal(count, 4);
});

test('verify-config: 税区分の日付範囲重複を検出', () => {
  const { profile } = loadProfile(join(ROOT, 'config', 'examples', 'profile.mf.json'));
  profile.maps.taxcodes.entries.push({ sourceTaxCode: '例_課税仕入免税10%', freeeTaxCode: '例_dup', effectiveFrom: '2026-01-01', effectiveTo: '2026-12-31', confirmed: true });
  const v = verifyConfig(profile);
  assert.equal(v.ok, false);
  assert.ok(v.issues.some((i) => i.message.includes('重複')));
});

test('verify-config: 必須入力列の欠落と required 出力列の from 欠落を検出', () => {
  const { profile } = loadProfile(join(ROOT, 'config', 'examples', 'profile.mf.json'));
  delete profile.source.columns['debit.amount'];
  profile.target.columns[0].from = null;
  const v = verifyConfig(profile);
  assert.ok(v.issues.some((i) => i.path === 'source.columns.debit.amount'));
  assert.ok(v.issues.some((i) => i.path === 'target.columns[0]'));
});
