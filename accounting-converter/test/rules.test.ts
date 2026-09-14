import assert from 'node:assert/strict';
import { test } from 'node:test';
import { convert, toCsv, type Profile } from '../src/core/index.js';
import { codes, exampleProfile } from './helpers.js';

const HEADER = ['例_取引No', '例_取引日', '例_借方勘定科目', '例_借方補助科目', '例_借方部門', '例_借方取引先', '例_借方税区分', '例_借方インボイス', '例_借方金額', '例_借方税額', '例_貸方勘定科目', '例_貸方補助科目', '例_貸方部門', '例_貸方取引先', '例_貸方税区分', '例_貸方インボイス', '例_貸方金額', '例_貸方税額', '例_摘要', '例_仕訳メモ', '例_タグ'];

interface Side { acc?: string; sub?: string; dept?: string; partner?: string; tax?: string; amt?: string | number; taxAmt?: string | number }
interface Row { no: string; date: string; dr?: Side; cr?: Side; desc?: string; tags?: string }
const side = (s?: Side) => [s?.acc ?? '', s?.sub ?? '', s?.dept ?? '', s?.partner ?? '', s?.tax ?? '', '', s?.amt === undefined ? '' : String(s.amt), s?.taxAmt === undefined ? '' : String(s.taxAmt)];
const row = (r: Row) => [r.no, r.date, ...side(r.dr), ...side(r.cr), r.desc ?? '', '', r.tags ?? ''];

async function runRows(rows: (string[] | Row)[], mutate?: (p: Profile) => void) {
  const profile = exampleProfile('mf');
  mutate?.(profile);
  const csv = toCsv([HEADER, ...rows.map((r) => (Array.isArray(r) ? r : row(r)))]);
  return convert({ bytes: new TextEncoder().encode(csv), profile, fileName: 'inline.csv' });
}

test('W006 会計期間外の伝票', async () => {
  const r = await runRows([{ no: '1', date: '2025/12/31', dr: { acc: '雑費', tax: '例_課税仕入10%', amt: 1100 }, cr: { acc: '現金', amt: 1100 } }]);
  assert.equal(codes(r, 'W006').length, 1);
});

test('W009 税額が逆算値と±1円超で乖離（税込）', async () => {
  const r = await runRows([{ no: '1', date: '2026/04/05', dr: { acc: '雑費', tax: '例_課税仕入10%', amt: 11000, taxAmt: 1500 }, cr: { acc: '現金', amt: 11000 } }]);
  assert.equal(codes(r, 'W009').length, 1);
  assert.equal(codes(r, 'W009')[0].detail?.expected, 1000);
  const ok = await runRows([{ no: '1', date: '2026/04/05', dr: { acc: '雑費', tax: '例_課税仕入10%', amt: 11000, taxAmt: 1001 }, cr: { acc: '現金', amt: 11000 } }]);
  assert.equal(codes(ok, 'W009').length, 0);
});

test('W011 伝票番号の非連続重複', async () => {
  const r = await runRows([
    { no: '1', date: '2026/04/05', dr: { acc: '雑費', tax: '例_課税仕入10%', amt: 1100 }, cr: { acc: '現金', amt: 1100 } },
    { no: '2', date: '2026/04/06', dr: { acc: '雑費', tax: '例_課税仕入10%', amt: 1100 }, cr: { acc: '現金', amt: 1100 } },
    { no: '1', date: '2026/04/07', dr: { acc: '雑費', tax: '例_課税仕入10%', amt: 1100 }, cr: { acc: '現金', amt: 1100 } },
  ]);
  assert.equal(codes(r, 'W011').length, 1);
  assert.equal(r.stats.entries, 3);
});

test('E008 明細行が1つしかない伝票（片側のみ）', async () => {
  const r = await runRows([{ no: '1', date: '2026/04/05', dr: { acc: '雑費', tax: '例_課税仕入10%', amt: 1100 } }]);
  assert.equal(codes(r, 'E008').length, 1);
  assert.equal(codes(r, 'E001').length, 0);
});

test('E005 列数不整合・科目のみで金額が空', async () => {
  const r = await runRows([
    ['1', '2026/04/05', '雑費'],
    { no: '2', date: '2026/04/06', dr: { acc: '雑費', tax: '例_課税仕入10%' }, cr: { acc: '現金', amt: 1100 } },
  ]);
  const e = codes(r, 'E005');
  assert.equal(e.length, 2);
  assert.equal(e[0].sourceRow, 2);
  assert.ok(e[1].message.includes('金額が空'));
});

test('E005 必須列がヘッダーに無い（データセット全体エラー・--force でも出力しない）', async () => {
  const profile = exampleProfile('mf');
  const csv = toCsv([['例_取引No', '例_取引日'], ['1', '2026/04/05']]);
  const r = await convert({ bytes: new TextEncoder().encode(csv), profile }, { force: true });
  assert.equal(codes(r, 'E005').length, 1);
  assert.equal(r.outputCsv, null);
});

test('W015 同一補助科目名が複数の親科目で異なる割当結果', async () => {
  const r = await runRows([
    { no: '1', date: '2026/04/05', dr: { acc: '普通預金', sub: '本社', amt: 1100 }, cr: { acc: '売上高', tax: '例_課税売上10%', amt: 1100 } },
    { no: '2', date: '2026/04/06', dr: { acc: '雑費', sub: '本社', tax: '例_課税仕入10%', amt: 1100 }, cr: { acc: '現金', amt: 1100 } },
  ]);
  assert.equal(codes(r, 'W015').length, 1);
  assert.equal(codes(r, 'W008').length, 1);
});

test('W008 タグ列の値は落として警告、E003 税区分空欄で対象外リストに無い科目', async () => {
  const r = await runRows([{ no: '1', date: '2026/04/05', dr: { acc: '雑費', amt: 1100 }, cr: { acc: '現金', amt: 1100 }, tags: '例タグ' }]);
  assert.equal(codes(r, 'E003').length, 1);
  assert.ok(codes(r, 'E003')[0].message.includes('(空欄)'));
  assert.equal(codes(r, 'W008').filter((d) => d.detail?.kind === 'tags').length, 2);
});

test('取引先: 取引先列 > 補助科目ルール、alias で置換', async () => {
  const r = await runRows([
    { no: '1', date: '2026/04/05', dr: { acc: '売掛金', sub: 'ダミー物産', partner: 'サンプル商事株式会社', amt: 1100 }, cr: { acc: '売上高', tax: '例_課税売上10%', amt: 1100 } },
    { no: '2', date: '2026/04/06', dr: { acc: '売掛金', sub: 'ダミー物産', amt: 2200 }, cr: { acc: '売上高', tax: '例_課税売上10%', amt: 2200 } },
  ], (p) => {
    p.maps.partners.aliases = { 'ダミー物産': 'ダミー物産株式会社' };
  });
  const [l1, l2] = r.dataset.entries.map((e) => e.lines[0].mapped!);
  assert.deepEqual([l1.partner, l1.provenance.partner, l1.memoTags], ['サンプル商事株式会社', 'column', ['ダミー物産']]);
  assert.deepEqual([l2.partner, l2.provenance.partner], ['ダミー物産株式会社', 'alias']);
});

test('期首残高の誤判定防止: 繰越利益剰余金を含む決算振替仕訳・摘要「前月繰越」は除外されない', async () => {
  const r = await runRows([
    { no: '1', date: '2027/03/31', dr: { acc: '売上高', tax: '例_対象外', amt: 100000 }, cr: { acc: '繰越利益剰余金', amt: 100000 }, desc: '決算振替' },
    { no: '2', date: '2026/05/01', dr: { acc: '現金', amt: 5000 }, cr: { acc: '売上高', tax: '例_課税売上10%', amt: 5000 }, desc: '前月繰越分の売上' },
    { no: '3', date: '2026/04/01', dr: { acc: '現金', amt: 70000 }, cr: { acc: '元入金', amt: 70000 }, desc: '期首残高' },
    { no: '4', date: '2026/04/01', dr: { acc: '普通預金', amt: 80000 }, cr: { acc: '元入金', amt: 80000 }, desc: '' },
    { no: '5', date: '2026/04/10', dr: { acc: '現金', amt: 3000 }, cr: { acc: '元入金', amt: 3000 }, desc: '事業主借' },
  ]);
  assert.equal(r.stats.errors, 0, JSON.stringify(r.diagnostics.filter((d) => d.severity === 'error')));
  const flagged = r.dataset.entries.filter((e) => e.flags.includes('OPENING_BALANCE')).map((e) => e.voucherNo);
  assert.deepEqual(flagged, ['3', '4']);
  assert.equal(codes(r, 'W007').length, 2);
  assert.equal(r.excluded.size, 2);
  assert.ok(r.outputCsv!.includes('例_繰越利益剰余金'));
  assert.ok(r.outputCsv!.includes('前月繰越分の売上'));
});

test('options.tags: memo_tag でメモタグ列に渡す／メモタグ列が無ければ W008／drop は W008', async () => {
  const rows: Row[] = [{ no: '1', date: '2026/04/05', dr: { acc: '雑費', tax: '例_課税仕入10%', amt: 1100 }, cr: { acc: '現金', amt: 1100 }, tags: '例タグA' }];
  const drop = await runRows(rows);
  assert.equal(codes(drop, 'W008').length, 2);
  assert.ok(!drop.outputCsv!.includes('例タグA'));

  const memo = await runRows(rows, (p) => {
    p.options.tags = 'memo_tag';
  });
  assert.equal(codes(memo, 'W008').length, 0);
  assert.deepEqual(memo.dataset.entries[0].lines.map((l) => l.mapped!.memoTags), [['例タグA'], ['例タグA']]);
  assert.ok(memo.outputCsv!.includes(',例タグA,'));

  const noCol = await runRows(rows, (p) => {
    p.options.tags = 'memo_tag';
    p.target.columns = p.target.columns.filter((c) => !(c.from ?? '').endsWith('.mapped.memoTags'));
  });
  assert.equal(codes(noCol, 'W008').length, 2);
  assert.ok(codes(noCol, 'W008')[0].message.includes('メモタグ列'));
  assert.ok(!noCol.outputCsv!.includes('例タグA'));
});

test('verifyConfig: options の値域検査（tags / openingBalances / fixedAssets / departments）', async () => {
  const { verifyConfig } = await import('../src/core/index.js');
  const p = exampleProfile('mf');
  (p.options as { tags: string }).tags = 'bogus';
  (p.options as { openingBalances: string }).openingBalances = 'include';
  const v = verifyConfig(p);
  assert.equal(v.ok, false);
  assert.ok(v.issues.some((i) => i.path === 'options.tags'));
  assert.ok(v.issues.some((i) => i.path === 'options.openingBalances'));
});

test('ConvertInput.codec: 注入した codec の decodeBytes が使われる', async () => {
  const calls: string[] = [];
  const profile = exampleProfile('mf');
  const csv = toCsv([HEADER, row({ no: '1', date: '2026/04/05', dr: { acc: '雑費', tax: '例_課税仕入10%', amt: 1100 }, cr: { acc: '現金', amt: 1100 } })]);
  const bytes = new TextEncoder().encode(csv);
  const codec = {
    decodeBytes: (b: Uint8Array, hint: string) => {
      calls.push(`decode:${hint}:${b.length}`);
      return { text: new TextDecoder().decode(b), encoding: 'utf8' as const, hadBom: true };
    },
    encodeText: (t: string) => {
      calls.push('encode');
      return new TextEncoder().encode(t);
    },
  };
  const r = await convert({ bytes, profile, codec });
  assert.deepEqual(calls, [`decode:auto:${bytes.length}`]);
  assert.equal(r.stats.errors, 0);
  assert.deepEqual(codes(r, 'I001')[0].detail, { encoding: 'utf8', hadBom: true });
  assert.equal(r.dataset.sourceFile.hadBom, true);
});
