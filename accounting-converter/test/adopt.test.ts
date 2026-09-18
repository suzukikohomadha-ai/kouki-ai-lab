import assert from 'node:assert/strict';
import { test } from 'node:test';
import { spawnSync } from 'node:child_process';
import { cpSync, existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { adoptSourceHeaders, adoptTargetHeaders, verifyConfig, type SourceConfig, type TargetConfig } from '../src/core/index.js';
import { loadProfile, readJson } from '../src/cli/load.js';
import { initLocal } from '../src/cli/setup.js';
import { ROOT } from './helpers.js';

const TSX = join(ROOT, 'node_modules', 'tsx', 'dist', 'cli.mjs');
const CLI = join(ROOT, 'src', 'cli', 'index.ts');
function cli(...args: string[]) {
  const r = spawnSync(process.execPath, [TSX, CLI, ...args], { cwd: ROOT, encoding: 'utf8' });
  return { code: r.status, out: r.stdout + r.stderr };
}

function scratchConfig(): string {
  const dir = mkdtempSync(join(tmpdir(), 'acc-init-'));
  cpSync(join(ROOT, 'config'), join(dir, 'config'), { recursive: true });
  rmSync(join(dir, 'config', 'examples'), { recursive: true, force: true });
  return join(dir, 'config');
}

test('adoptTargetHeaders: 置換・未確定・削除を正しく分類し from を引き継ぐ', () => {
  const target = readJson<TargetConfig>(join(ROOT, 'config', 'targets', 'freee-generic.json'));
  const header = ['例_日付', '例_伝票番号', '例_借方勘定科目', '例_借方税区分', '例_借方金額', '例_貸方勘定科目', '例_貸方税区分', '例_貸方金額', '例_摘要', '例_新規列X'];
  const r = adoptTargetHeaders(target, header);
  assert.deepEqual(r.target.columns.map((c) => c.name), header);
  assert.equal(r.target.columns[0].from, 'entry.date');
  assert.equal(r.target.columns[0].format, 'YYYY/MM/DD');
  assert.equal(r.target.columns[2].from, 'debit.mapped.freeeAccount');
  assert.equal(r.target.columns[2].required, true);
  assert.deepEqual(r.unresolved, ['例_新規列X']);
  assert.equal(r.target.columns[9].from, null);
  assert.ok(r.target.columns[9]._todo);
  assert.ok(r.removed.includes('TODO_VERIFY:借方補助科目'));
  assert.ok(r.removed.includes('TODO_VERIFY:貸方メモタグ'));
  assert.equal(r.removed.length, 8);
  assert.equal(r.replaced.length, 9);
  assert.ok(r.replaced.every((x) => x.how === 'contains'));
  assert.ok(!JSON.stringify(r.target.columns).includes('TODO_VERIFY'));
});

test('adoptTargetHeaders: 完全一致（推定名＝ヘッダー）は exact、既に確定済みの列名も維持', () => {
  const target: TargetConfig = { system: 'x', encoding: 'utf8_bom', newline: 'CRLF', rowModel: 'debit_credit_pair', compoundEntries: 'blank_side', columns: [
    { name: 'TODO_VERIFY:日付', from: 'entry.date', required: true },
    { name: '確定済み列', from: 'entry.voucherNo' },
  ] };
  const r = adoptTargetHeaders(target, ['﻿日付', '確定済み列']);
  assert.deepEqual(r.replaced.map((x) => [x.after, x.how]), [['日付', 'exact']]);
  assert.deepEqual(r.target.columns.map((c) => c.name), ['日付', '確定済み列']);
  assert.deepEqual(r.unresolved, []);
  assert.deepEqual(r.removed, []);
});

test('adoptTargetHeaders: 曖昧な部分一致（候補2つ）は置換しない', () => {
  const target: TargetConfig = { system: 'x', encoding: 'utf8_bom', newline: 'CRLF', rowModel: 'debit_credit_pair', compoundEntries: 'blank_side', columns: [{ name: 'TODO_VERIFY:金額', from: 'debit.amount' }] };
  const r = adoptTargetHeaders(target, ['借方金額', '貸方金額']);
  assert.deepEqual(r.removed, ['TODO_VERIFY:金額']);
  assert.deepEqual(r.unresolved, ['借方金額', '貸方金額']);
});

test('adoptSourceHeaders: header の TODO_VERIFY を置換し、未確定と設定に無い列を報告', () => {
  const source = readJson<SourceConfig>(join(ROOT, 'config', 'sources', 'mf-journal.json'));
  const header = readFileSync(join(ROOT, 'fixtures', 'templates', '例_mf_export.csv'), 'utf8').split('\n')[0].split(',');
  const r = adoptSourceHeaders(source, header);
  assert.equal(r.source.columns['date'].header, '例_取引日');
  assert.equal(r.source.columns['debit.account'].header, '例_借方勘定科目');
  assert.equal(r.source.columns['debit.amount'].header, 'TODO_VERIFY:借方金額(円)');
  assert.deepEqual(r.unresolved.map((u) => u.key).sort(), ['columns.closingFlag', 'columns.credit.amount', 'columns.debit.amount']);
  assert.deepEqual(r.unusedHeaders, ['例_借方金額', '例_貸方金額', '例_未知の列']);
  assert.deepEqual(r.source.headerSignature, ['例_取引No', '例_取引日']);
  assert.equal(r.source.amountMode, 'TODO_VERIFY:tax_included');
});

test('verifyConfig: adopt-headers が付けた _todo 列を error として検出', () => {
  const { profile } = loadProfile(join(ROOT, 'config', 'examples', 'profile.mf.json'));
  profile.target.columns.push({ name: '例_新規列', from: null, _todo: 'x' });
  const v = verifyConfig(profile);
  assert.ok(v.issues.some((i) => i.severity === 'error' && i.message.includes('未確定の列')));
});

test('initLocal: .local.json と profile.json を生成し、2回目は上書きしない（--force で上書き）', () => {
  const cfg = scratchConfig();
  const r1 = initLocal(cfg, false);
  assert.ok(r1.copied.includes(join(cfg, 'profile.json')));
  assert.ok(existsSync(join(cfg, 'targets', 'freee-generic.local.json')));
  assert.ok(existsSync(join(cfg, 'sources', 'mf-journal.local.json')));
  assert.ok(existsSync(join(cfg, 'sources', 'yayoi-generic.local.json')));
  assert.ok(existsSync(join(cfg, 'maps', 'accounts.local.json')));
  assert.ok(existsSync(join(cfg, 'maps', 'account-aliases.local.json')));
  assert.ok(!existsSync(join(cfg, 'maps', 'accounts.sample.local.json')));
  const pf = readJson<{ source: string; target: string; maps: Record<string, string> }>(join(cfg, 'profile.json'));
  assert.equal(pf.source, './sources/mf-journal.local.json');
  assert.equal(pf.target, './targets/freee-generic.local.json');
  assert.ok(Object.values(pf.maps).every((p) => p.endsWith('.local.json')));
  const loaded = loadProfile(join(cfg, 'profile.json'));
  assert.equal(loaded.profile.source.system, 'mf_journal');

  writeFileSync(join(cfg, 'targets', 'freee-generic.local.json'), '{"edited":true}');
  const r2 = initLocal(cfg, false);
  assert.equal(r2.copied.length, 0);
  assert.ok(r2.skipped.includes(join(cfg, 'targets', 'freee-generic.local.json')));
  assert.equal(readFileSync(join(cfg, 'targets', 'freee-generic.local.json'), 'utf8'), '{"edited":true}');

  const r3 = initLocal(cfg, true);
  assert.ok(r3.copied.includes(join(cfg, 'targets', 'freee-generic.local.json')));
  assert.notEqual(readFileSync(join(cfg, 'targets', 'freee-generic.local.json'), 'utf8'), '{"edited":true}');
});

test('CLI init-local → adopt-headers（target/source）→ verify-config の流れ', () => {
  const cfg = scratchConfig();
  const init = cli('init-local', '--config-dir', cfg);
  assert.equal(init.code, 0, init.out);
  const t = cli('adopt-headers', '--target', join(cfg, 'targets', 'freee-generic.local.json'), '--file', 'fixtures/templates/例_freee_template.csv');
  assert.equal(t.code, 0, t.out);
  assert.ok(t.out.includes('置換した列（15）'));
  assert.ok(t.out.includes('未確定の列（1'));
  assert.ok(t.out.includes('例_新規列X'));
  assert.ok(t.out.includes('削除した列（2'));
  assert.ok(t.out.includes('AI の推定ではありません'));
  const target = readJson<TargetConfig>(join(cfg, 'targets', 'freee-generic.local.json'));
  assert.equal(target.templateInfo?.name, '例_freee_template.csv');
  assert.match(target.templateInfo?.sha256 ?? '', /^[0-9a-f]{64}$/);
  assert.equal(target.templateInfo?.encodingObserved, 'utf8');
  assert.ok(!target.templateInfo?.name.startsWith('TODO_VERIFY'));

  const s = cli('adopt-headers', '--source', join(cfg, 'sources', 'mf-journal.local.json'), '--file', 'fixtures/templates/例_mf_export.csv');
  assert.equal(s.code, 0, s.out);
  assert.ok(s.out.includes('置換した列（21）'));
  assert.ok(s.out.includes('columns.debit.amount: TODO_VERIFY:借方金額(円)'));
  assert.ok(s.out.includes('例_未知の列'));

  const both = cli('adopt-headers', '--target', 'x', '--source', 'y', '--file', 'z');
  assert.equal(both.code, 2);

  const v = cli('verify-config', '--profile', join(cfg, 'profile.json'));
  assert.equal(v.code, 2);
  assert.ok(v.out.includes('例_新規列X'));
  assert.ok(!v.out.includes('target.columns[0]'));
});
