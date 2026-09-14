import assert from 'node:assert/strict';
import { test } from 'node:test';
import { decodeBytes, encodeText, levenshtein, normalizeName, parseAmount, parseCsv, parseDate } from '../src/core/index.js';

test('parseAmount: 全角・カンマ・円記号・負号表記', () => {
  assert.deepEqual(parseAmount('１１，０００'), { ok: true, value: 11000 });
  assert.deepEqual(parseAmount('11,000円'), { ok: true, value: 11000 });
  assert.deepEqual(parseAmount('¥1,000'), { ok: true, value: 1000 });
  assert.deepEqual(parseAmount('△1,000'), { ok: true, value: -1000 });
  assert.deepEqual(parseAmount('▲500'), { ok: true, value: -500 });
  assert.deepEqual(parseAmount('-300'), { ok: true, value: -300 });
  assert.deepEqual(parseAmount('1000.00'), { ok: true, value: 1000 });
  assert.deepEqual(parseAmount('1000.50'), { ok: false, reason: 'decimal' });
  assert.deepEqual(parseAmount(''), { ok: false, reason: 'empty' });
  assert.deepEqual(parseAmount('abc'), { ok: false, reason: 'invalid' });
});

test('parseDate: 西暦各形式・和暦・不正日付', () => {
  const f = ['YYYY/MM/DD', 'YYYY-MM-DD', 'YYYY/M/D', 'GYY/MM/DD'];
  assert.equal(parseDate('2026/04/05', f), '2026-04-05');
  assert.equal(parseDate('2026-04-05', f), '2026-04-05');
  assert.equal(parseDate('2026/4/5', f), '2026-04-05');
  assert.equal(parseDate('２０２６／０４／０５', f), '2026-04-05');
  assert.equal(parseDate('R08/04/05', f, { R: 2018 }), '2026-04-05');
  assert.equal(parseDate('令08/04/05', f), '2026-04-05');
  assert.equal(parseDate('2026/02/30', f), null);
  assert.equal(parseDate('2026/13/01', f), null);
  assert.equal(parseDate('', f), null);
  assert.equal(parseDate('R08/04/05', ['YYYY/MM/DD']), null);
});

test('normalizeName / levenshtein', () => {
  assert.equal(normalizeName(' ＡＢＣ　商事  '), 'ABC 商事');
  assert.equal(levenshtein('kitten', 'sitting'), 3);
  assert.equal(levenshtein('', 'abc'), 3);
  assert.equal(levenshtein('同じ', '同じ'), 0);
});

test('encoding: Shift_JIS 往復と BOM', () => {
  const text = '株式会社サンプル,①,㈱';
  const sjis = encodeText(text, 'shift_jis');
  const back = decodeBytes(sjis, 'auto');
  assert.equal(back.encoding, 'shift_jis');
  assert.equal(back.text, text);
  const bom = encodeText('a', 'utf8_bom');
  assert.deepEqual([...bom], [0xef, 0xbb, 0xbf, 0x61]);
  assert.deepEqual(decodeBytes(bom, 'auto'), { text: 'a', encoding: 'utf8', hadBom: true });
});

test('parseCsv: 引用符内の改行・カンマ・物理行番号・空行スキップ', () => {
  const text = 'h1,h2\r\n"a\nb",1\r\n\r\nc,"x,y"\r\n';
  const p = parseCsv(text, { delimiter: ',', hasHeader: 'auto', headerSignature: ['h1'] });
  assert.deepEqual(p.header, ['h1', 'h2']);
  assert.equal(p.rows.length, 2);
  assert.deepEqual(p.rows[0], { rowNumber: 2, cells: ['a\nb', '1'] });
  assert.deepEqual(p.rows[1], { rowNumber: 5, cells: ['c', 'x,y'] });
  const noHeader = parseCsv('1,2\r\n3,4\r\n', { delimiter: ',', hasHeader: 'auto', headerSignature: ['h1'] });
  assert.equal(noHeader.header, null);
  assert.equal(noHeader.rows.length, 2);
});
