import assert from 'node:assert/strict';
import { test } from 'node:test';
import { bodyRows, codes, codeSet, run } from './helpers.js';

test('T1/T9 弥生 正常系: Shift_JIS・ヘッダー無し・index読取・フラグ複合仕訳・和暦', async () => {
  const r = await run('yayoi', 'yayoi/normal.txt');
  assert.equal(r.stats.errors, 0, JSON.stringify(codeSet(r)));
  assert.equal(r.stats.warnings, 0, JSON.stringify(codeSet(r)));
  assert.deepEqual(codes(r, 'I001')[0].detail, { encoding: 'shift_jis', hadBom: false });
  assert.equal(r.dataset.sourceFile.hasHeader, false);
  assert.equal(r.stats.entries, 4);
  assert.equal(r.dataset.entries[1].date, '2026-04-10');
  const compound = r.dataset.entries[2];
  assert.deepEqual(compound.flags, ['COMPOUND']);
  assert.equal(compound.lines.length, 3);
  assert.equal(compound.voucherNo, '103');
  assert.equal(bodyRows(r.outputCsv).length, 3 + 3);
  const rows = bodyRows(r.outputCsv);
  assert.ok(rows[5].includes('テスト工業有限会社'));
  for (const a of r.report.accounts) assert.equal(a.diff, 0, a.sourceAccount);
  for (const e of r.dataset.entries) for (const l of e.lines) assert.equal(l.partnerRaw, null);
});

test('T9 弥生 sjis-noheader: 文字コード指定 auto でも Shift_JIS と判定', async () => {
  const r = await run('yayoi', 'yayoi/sjis-noheader.txt', (p) => {
    p.source.encoding = 'auto';
  });
  assert.equal(r.stats.errors, 0, JSON.stringify(codeSet(r)));
  assert.equal(codes(r, 'I001')[0].detail?.encoding, 'shift_jis');
});

test('T8 期首残高: W007、出力から除外、期首残高セクションに科目別合計', async () => {
  const r = await run('yayoi', 'yayoi/opening.txt');
  assert.equal(r.stats.errors, 0, JSON.stringify(codeSet(r)));
  assert.equal(codes(r, 'W007').length, 2);
  assert.equal(bodyRows(r.outputCsv).length, 1);
  assert.equal(r.report.excluded.entries.length, 2);
  const totals = Object.fromEntries(r.report.excluded.accountTotals.map((t) => [t.account, [t.debit, t.credit]]));
  assert.deepEqual(totals, { 現金: [100000, 0], 普通預金: [250000, 0], 元入金: [0, 350000] });
  assert.equal(codes(r, 'I002')[0].detail?.openingBalances, 2);
  const r2 = await run('yayoi', 'yayoi/opening.txt', (p) => {
    p.options.openingBalances = 'include_with_warning';
  });
  assert.equal(bodyRows(r2.outputCsv).length, 3);
});

test('弥生 グループ化: 未知フラグ値は E005', async () => {
  const r = await run('yayoi', 'yayoi/normal.txt', (p) => {
    p.source.grouping.flagValues!.compoundMiddle = [];
  });
  assert.equal(codes(r, 'E005').length, 1);
  assert.ok(codes(r, 'E005')[0].message.includes('flagValues'));
});
