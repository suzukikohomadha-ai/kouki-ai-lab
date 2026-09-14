import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseCsv } from '../src/core/index.js';
import { bodyRows, codes, codeSet, ROOT, run } from './helpers.js';

test('T1 正常系（MF）: error 0 / warning 0 / 出力行数＝伝票数 / 科目別合計一致', async () => {
  const r = await run('mf', 'mf/normal.csv');
  assert.equal(r.stats.errors, 0, JSON.stringify(codeSet(r)));
  assert.equal(r.stats.warnings, 0, JSON.stringify(codeSet(r)));
  assert.equal(r.stats.entries, 5);
  assert.notEqual(r.outputCsv, null);
  assert.equal(bodyRows(r.outputCsv).length, 5);
  for (const a of r.report.accounts) {
    assert.equal(a.diff, 0, `${a.sourceAccount} の差額が0でない`);
    assert.equal(a.srcDebit, a.outDebit);
    assert.equal(a.srcCredit, a.outCredit);
  }
  const cash = r.report.accounts.find((a) => a.sourceAccount === '現金');
  assert.deepEqual([cash?.srcDebit, cash?.srcCredit], [11000, 3278]);
  assert.equal(r.dataset.sourceFile.hadBom, true);
  assert.ok(r.outputCsv!.includes('\r\n'));
  assert.equal(r.report.subaccountRules.find((s) => s.rule === 'rule:r02-bank-branch-to-subaccount')?.count, 2);
});

test('T2 複合仕訳: blank_side で出力行数＝明細数、unsupported で E007', async () => {
  const r = await run('mf', 'mf/compound.csv');
  assert.equal(r.stats.errors, 0, JSON.stringify(codeSet(r)));
  assert.equal(r.stats.entries, 3);
  const compound = r.dataset.entries.filter((e) => e.flags.includes('COMPOUND'));
  assert.equal(compound.length, 2);
  const compoundLines = compound.reduce((a, e) => a + e.lines.length, 0);
  assert.equal(bodyRows(r.outputCsv).length, compoundLines + 1);

  const r2 = await run('mf', 'mf/compound.csv', (p) => {
    p.target.compoundEntries = 'unsupported';
  });
  assert.equal(codes(r2, 'E007').length, 2);
  assert.equal(r2.outputCsv, null);
  const r3 = await run('mf', 'mf/compound.csv', (p) => {
    p.target.compoundEntries = 'unsupported';
  }, { force: true });
  assert.notEqual(r3.outputCsv, null);
  assert.equal(bodyRows(r3.outputCsv).length, 1);
  assert.equal(r3.report.excluded.entries.length, 2);
});

test('T3 未マッピング科目・税区分: E002/E003 各1種、出力なし、未マッピング一覧', async () => {
  const r = await run('mf', 'mf/unmapped.csv');
  assert.equal(new Set(codes(r, 'E002').map((d) => d.detail?.account)).size, 1);
  assert.equal(new Set(codes(r, 'E003').map((d) => d.detail?.taxCode)).size, 1);
  assert.equal(codes(r, 'E006').length, 0);
  assert.equal(r.outputCsv, null);
  const acc = r.report.unmapped.find((u) => u.kind === 'account');
  const tax = r.report.unmapped.find((u) => u.kind === 'taxcode');
  assert.deepEqual([acc?.sourceValue, acc?.count, acc?.debitTotal, acc?.firstRow], ['例_未知科目', 1, 5500, 2]);
  assert.deepEqual([tax?.sourceValue, tax?.count, tax?.parentAccount], ['例_未知税区分', 1, '消耗品費']);
  assert.equal(acc?.suggestions, '');
});

test('T4 借貸不一致: E001 に伝票IDと差額、他伝票は正常', async () => {
  const r = await run('mf', 'mf/unbalanced.csv');
  const e = codes(r, 'E001');
  assert.equal(e.length, 1);
  assert.equal(e[0].entryId, 'E000002');
  assert.equal(e[0].detail?.diff, 1000);
  assert.equal(r.outputCsv, null);
  const forced = await run('mf', 'mf/unbalanced.csv', undefined, { force: true });
  assert.equal(bodyRows(forced.outputCsv).length, 2);
  assert.equal(forced.excluded.get('E000002')?.includes('--force'), true);
});

test('T5 重複取引先: W001×1・W002×1、aliases 設定時は消える', async () => {
  const r = await run('mf', 'mf/partners.csv');
  assert.equal(r.stats.errors, 0);
  assert.equal(codes(r, 'W001').length, 1);
  assert.equal(codes(r, 'W002').length, 1);
  const w1 = codes(r, 'W001')[0].detail!;
  assert.deepEqual([w1.a, w1.b].sort(), ['ABC商事', 'ＡＢＣ商事']);
  const w2 = codes(r, 'W002')[0].detail!;
  assert.deepEqual([w2.a, w2.b].sort(), ['サンプル商事株式会社', '（株）サンプル商事']);
  assert.equal(r.report.partners.candidates.length, 2);

  const aliases = JSON.parse(readFileSync(join(ROOT, 'config/examples/maps/partners.aliases.example.json'), 'utf8'));
  const r2 = await run('mf', 'mf/partners.csv', (p) => {
    p.maps.partners = aliases;
  });
  assert.equal(codes(r2, 'W001').length, 0);
  assert.equal(codes(r2, 'W002').length, 0);
  assert.equal(r2.report.partners.names.length, 3);
  assert.ok(r2.outputCsv!.includes('サンプル商事株式会社'));
  assert.ok(!r2.outputCsv!.includes('（株）サンプル商事'));
});

test('T6 固定資産・減価償却: W003/W004、exclude で除外・I002・レポート除外セクション', async () => {
  const r = await run('mf', 'mf/fixed-assets.csv');
  assert.equal(r.stats.errors, 0);
  assert.equal(codes(r, 'W003').length, 1);
  assert.equal(codes(r, 'W004').length, 1);
  assert.equal(bodyRows(r.outputCsv).length, 3);
  assert.equal(codes(r, 'I002').length, 0);

  const r2 = await run('mf', 'mf/fixed-assets.csv', (p) => {
    p.options.fixedAssets = 'exclude';
  });
  assert.equal(bodyRows(r2.outputCsv).length, 1);
  assert.equal(codes(r2, 'I002').length, 1);
  assert.equal(codes(r2, 'I002')[0].detail?.fixedAssets, 2);
  assert.equal(r2.report.excluded.entries.length, 2);
  const tools = r2.report.accounts.find((a) => a.sourceAccount === '工具器具備品')!;
  assert.deepEqual([tools.srcDebit, tools.outDebit, tools.diff], [220000, 0, 220000]);
  assert.ok(tools.note.includes('除外'));
});

test('T7 経過措置切替日またぎ: W005、免税事業者仕入が日付で控80/控50に振り分け', async () => {
  const r = await run('mf', 'mf/transition.csv');
  assert.equal(r.stats.errors, 0, JSON.stringify(codeSet(r)));
  assert.equal(codes(r, 'W005').length, 1);
  assert.equal(codes(r, 'W005')[0].detail?.transitionDate, '2026-09-30');
  const [e1, e2] = r.dataset.entries;
  const tax = (e: typeof e1) => e.lines.find((l) => l.side === 'debit')!.mapped!;
  assert.equal(tax(e1).freeeTaxCode, '例_freee課対仕入控80_10%');
  assert.equal(tax(e2).freeeTaxCode, '例_freee課対仕入控50_10%');
  assert.equal(tax(e1).provenance.tax, 'table_dated');
  const rows = bodyRows(r.outputCsv);
  assert.ok(rows[0].includes('例_freee課対仕入控80_10%'));
  assert.ok(rows[1].includes('例_freee課対仕入控50_10%'));

  const r2 = await run('mf', 'mf/transition.csv', (p) => {
    p.maps.taxcodes.entries = p.maps.taxcodes.entries.filter((e) => e.effectiveFrom !== '2026-10-01');
  });
  assert.equal(codes(r2, 'E003').length, 1);
  assert.ok(codes(r2, 'E003')[0].message.includes('期間'));
});

test('T10 金額・日付フォーマット異常: E004、E005、W010、全角数字は正常解析', async () => {
  const r = await run('mf', 'mf/bad-formats.csv');
  assert.equal(codes(r, 'E004').length, 1);
  assert.equal(codes(r, 'E004')[0].entryId, 'E000001');
  assert.equal(codes(r, 'E005').length, 1);
  assert.equal(codes(r, 'E005')[0].entryId, 'E000002');
  assert.equal(codes(r, 'E008').length, 0);
  assert.equal(codes(r, 'W010').length, 2);
  const e4 = r.dataset.entries[3];
  assert.deepEqual(e4.lines.map((l) => l.amount), [11000, 11000]);
  assert.equal(e4.lines[0].taxAmount, 1000);
  assert.equal(codes(r, 'E001').filter((d) => d.entryId === 'E000004').length, 0);
  assert.equal(r.outputCsv, null);
});

test('T13 往復整合: 出力CSVを再パースし科目別借方/貸方合計が中間モデルと一致', async () => {
  const r = await run('mf', 'mf/normal.csv');
  const parsed = parseCsv(r.outputCsv!, { delimiter: ',', hasHeader: true });
  const h = parsed.header!;
  const idx = (n: string) => h.indexOf(n);
  const debit = new Map<string, number>();
  const credit = new Map<string, number>();
  for (const row of parsed.rows) {
    const da = row.cells[idx('例_借方勘定科目')];
    const ca = row.cells[idx('例_貸方勘定科目')];
    if (da) debit.set(da, (debit.get(da) ?? 0) + Number(row.cells[idx('例_借方金額')]));
    if (ca) credit.set(ca, (credit.get(ca) ?? 0) + Number(row.cells[idx('例_貸方金額')]));
  }
  for (const a of r.report.accounts) {
    assert.equal(debit.get(a.freeeAccount) ?? 0, a.outDebit, a.freeeAccount);
    assert.equal(credit.get(a.freeeAccount) ?? 0, a.outCredit, a.freeeAccount);
  }
  const rc = await run('mf', 'mf/compound.csv');
  const p2 = parseCsv(rc.outputCsv!, { delimiter: ',', hasHeader: true });
  const totalDebit = p2.rows.reduce((a, row) => a + Number(row.cells[idx('例_借方金額')] || 0), 0);
  const totalCredit = p2.rows.reduce((a, row) => a + Number(row.cells[idx('例_貸方金額')] || 0), 0);
  assert.equal(totalDebit, totalCredit);
  assert.equal(totalDebit, 33000 + 11550 + 1100);
});

test('utf8 BOM なし: I001 が utf8 / hadBom=false', async () => {
  const r = await run('mf', 'mf/utf8-nobom.csv');
  assert.equal(r.stats.errors, 0);
  assert.deepEqual(codes(r, 'I001')[0].detail, { encoding: 'utf8', hadBom: false });
});

test('部門 passthrough と drop（W008）', async () => {
  const r = await run('mf', 'mf/normal.csv', (p) => {
    p.maps.subaccountRules.rules = [{ id: 'dept', when: { parentAccountIn: ['普通預金'] }, then: { assign: 'department' } }];
  });
  assert.equal(codes(r, 'W008').length, 2);
  const r2 = await run('mf', 'mf/normal.csv', (p) => {
    p.options.departments = 'passthrough';
    p.maps.subaccountRules.rules = [{ id: 'dept', when: { parentAccountIn: ['普通預金'] }, then: { assign: 'department' } }];
  });
  assert.equal(codes(r2, 'W008').length, 0);
  assert.ok(r2.outputCsv!.includes(',例_A銀行,'));
});

test('--strict: confirmed:false の科目対応は E002', async () => {
  const mutate = (p: Parameters<Parameters<typeof run>[2] & object>[0]) => {
    p.maps.accounts.entries['通信費'].confirmed = false;
  };
  const r = await run('mf', 'mf/normal.csv', mutate);
  assert.equal(codes(r, 'W012').length, 1);
  assert.notEqual(r.outputCsv, null);
  const r2 = await run('mf', 'mf/normal.csv', mutate, { strict: true });
  assert.equal(codes(r2, 'E002').length, 1);
  assert.equal(r2.outputCsv, null);
});
