// 架空データ fixtures の生成スクリプト（テスト専用）。実在の企業名・人名・住所・電話番号・登録番号は含めない。
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { encodeText, toCsv } from '../src/core/index.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const mfDir = join(root, 'fixtures', 'mf');
const yayoiDir = join(root, 'fixtures', 'yayoi');
mkdirSync(mfDir, { recursive: true });
mkdirSync(yayoiDir, { recursive: true });

const MF_HEADER = [
  '例_取引No', '例_取引日',
  '例_借方勘定科目', '例_借方補助科目', '例_借方部門', '例_借方取引先', '例_借方税区分', '例_借方インボイス', '例_借方金額', '例_借方税額',
  '例_貸方勘定科目', '例_貸方補助科目', '例_貸方部門', '例_貸方取引先', '例_貸方税区分', '例_貸方インボイス', '例_貸方金額', '例_貸方税額',
  '例_摘要', '例_仕訳メモ', '例_タグ',
];

interface Side { acc?: string; sub?: string; dept?: string; partner?: string; tax?: string; inv?: string; amt?: string | number; taxAmt?: string | number }
interface MfRow { no: string; date: string; dr?: Side; cr?: Side; desc?: string; memo?: string; tags?: string }

const side = (s: Side | undefined): string[] => [s?.acc ?? '', s?.sub ?? '', s?.dept ?? '', s?.partner ?? '', s?.tax ?? '', s?.inv ?? '', s?.amt === undefined ? '' : String(s.amt), s?.taxAmt === undefined ? '' : String(s.taxAmt)];
const mfRow = (r: MfRow): string[] => [r.no, r.date, ...side(r.dr), ...side(r.cr), r.desc ?? '', r.memo ?? '', r.tags ?? ''];

function writeMf(name: string, rows: MfRow[], bom = true): void {
  const csv = toCsv([MF_HEADER, ...rows.map(mfRow)], 'CRLF');
  writeFileSync(join(mfDir, name), encodeText(csv, bom ? 'utf8_bom' : 'utf8'));
}

const SALES = '例_課税売上10%';
const PURCHASE = '例_課税仕入10%';
const EXEMPT_SUPPLIER = '例_課税仕入免税10%';
const OUT_OF_SCOPE = '例_対象外';

const normal: MfRow[] = [
  { no: '1', date: '2026/04/05', dr: { acc: '現金', amt: 11000 }, cr: { acc: '売上高', tax: SALES, amt: 11000, taxAmt: 1000 }, desc: '店頭売上' },
  { no: '2', date: '2026/04/10', dr: { acc: '消耗品費', tax: PURCHASE, amt: 3278, taxAmt: 298 }, cr: { acc: '現金', amt: 3278 }, desc: '文房具購入' },
  { no: '3', date: '2026/04/15', dr: { acc: '売掛金', partner: 'サンプル商事株式会社', amt: 55000 }, cr: { acc: '売上高', tax: SALES, amt: 55000, taxAmt: 5000 }, desc: '請負売上' },
  { no: '4', date: '2026/04/20', dr: { acc: '普通預金', sub: '例_A銀行', amt: 55000 }, cr: { acc: '売掛金', partner: 'サンプル商事株式会社', amt: 55000 }, desc: '売掛金入金' },
  { no: '5', date: '2026/05/01', dr: { acc: '通信費', tax: PURCHASE, amt: 4980, taxAmt: 452 }, cr: { acc: '普通預金', sub: '例_A銀行', amt: 4980 }, desc: '通信料' },
];
writeMf('normal.csv', normal, true);
writeMf('utf8-nobom.csv', normal, false);

writeMf('compound.csv', [
  { no: '10', date: '2026/04/06', dr: { acc: '現金', amt: 33000 }, cr: { acc: '売上高', tax: SALES, amt: 22000, taxAmt: 2000 }, desc: '複合売上' },
  { no: '10', date: '2026/04/06', cr: { acc: '売上高', tax: SALES, amt: 8800, taxAmt: 800 }, desc: '複合売上' },
  { no: '10', date: '2026/04/06', cr: { acc: '預り金', amt: 2200 }, desc: '複合売上' },
  { no: '11', date: '2026/04/07', dr: { acc: '仕入高', tax: PURCHASE, amt: 11000, taxAmt: 1000 }, cr: { acc: '普通預金', amt: 11000 }, desc: '仕入と手数料' },
  { no: '11', date: '2026/04/07', dr: { acc: '支払手数料', tax: PURCHASE, amt: 550, taxAmt: 50 }, cr: { acc: '現金', amt: 550 }, desc: '仕入と手数料' },
  { no: '12', date: '2026/04/08', dr: { acc: '雑費', tax: PURCHASE, amt: 1100, taxAmt: 100 }, cr: { acc: '現金', amt: 1100 }, desc: '雑費' },
]);

writeMf('unmapped.csv', [
  { no: '20', date: '2026/04/05', dr: { acc: '例_未知科目', tax: PURCHASE, amt: 5500, taxAmt: 500 }, cr: { acc: '現金', amt: 5500 }, desc: '未知科目' },
  { no: '21', date: '2026/04/06', dr: { acc: '消耗品費', tax: '例_未知税区分', amt: 2200, taxAmt: 200 }, cr: { acc: '現金', amt: 2200 }, desc: '未知税区分' },
  { no: '22', date: '2026/04/07', dr: { acc: '雑費', tax: PURCHASE, amt: 1100, taxAmt: 100 }, cr: { acc: '現金', amt: 1100 }, desc: '正常' },
]);

writeMf('unbalanced.csv', [
  { no: '30', date: '2026/04/05', dr: { acc: '現金', amt: 11000 }, cr: { acc: '売上高', tax: SALES, amt: 11000, taxAmt: 1000 }, desc: '正常' },
  { no: '31', date: '2026/04/06', dr: { acc: '消耗品費', tax: PURCHASE, amt: 10000, taxAmt: 909 }, cr: { acc: '現金', amt: 9000 }, desc: '借貸不一致' },
  { no: '32', date: '2026/04/07', dr: { acc: '雑費', tax: PURCHASE, amt: 1100, taxAmt: 100 }, cr: { acc: '現金', amt: 1100 }, desc: '正常' },
]);

writeMf('partners.csv', [
  { no: '40', date: '2026/04/05', dr: { acc: '売掛金', partner: '例_ABC商事', amt: 11000 }, cr: { acc: '売上高', tax: SALES, amt: 11000, taxAmt: 1000 }, desc: '売上' },
  { no: '41', date: '2026/04/06', dr: { acc: '売掛金', partner: '例_ＡＢＣ商事', amt: 22000 }, cr: { acc: '売上高', tax: SALES, amt: 22000, taxAmt: 2000 }, desc: '売上' },
  { no: '42', date: '2026/04/07', dr: { acc: '売掛金', partner: 'サンプル商事株式会社', amt: 33000 }, cr: { acc: '売上高', tax: SALES, amt: 33000, taxAmt: 3000 }, desc: '売上' },
  { no: '43', date: '2026/04/08', dr: { acc: '売掛金', partner: '（株）サンプル商事', amt: 44000 }, cr: { acc: '売上高', tax: SALES, amt: 44000, taxAmt: 4000 }, desc: '売上' },
  { no: '44', date: '2026/04/09', dr: { acc: '買掛金', partner: 'ダミー物産', amt: 5500 }, cr: { acc: '普通預金', amt: 5500 }, desc: '支払' },
]);

writeMf('fixed-assets.csv', [
  { no: '50', date: '2026/04/05', dr: { acc: '工具器具備品', tax: PURCHASE, amt: 220000, taxAmt: 20000 }, cr: { acc: '普通預金', amt: 220000 }, desc: '備品購入' },
  { no: '51', date: '2026/04/30', dr: { acc: '減価償却費', tax: OUT_OF_SCOPE, amt: 5000 }, cr: { acc: '減価償却累計額', tax: OUT_OF_SCOPE, amt: 5000 }, desc: '月次償却' },
  { no: '52', date: '2026/05/01', dr: { acc: '雑費', tax: PURCHASE, amt: 1100, taxAmt: 100 }, cr: { acc: '現金', amt: 1100 }, desc: '雑費' },
]);

writeMf('transition.csv', [
  { no: '60', date: '2026/09/15', dr: { acc: '仕入高', tax: EXEMPT_SUPPLIER, amt: 11000, taxAmt: 1000 }, cr: { acc: '買掛金', partner: 'ダミー物産', amt: 11000 }, desc: '免税事業者からの仕入（切替前）' },
  { no: '61', date: '2026/10/15', dr: { acc: '仕入高', tax: EXEMPT_SUPPLIER, amt: 22000, taxAmt: 2000 }, cr: { acc: '買掛金', partner: 'ダミー物産', amt: 22000 }, desc: '免税事業者からの仕入（切替後）' },
]);

writeMf('bad-formats.csv', [
  { no: '70', date: '2026/13/45', dr: { acc: '雑費', tax: PURCHASE, amt: 1100, taxAmt: 100 }, cr: { acc: '現金', amt: 1100 }, desc: '日付不正' },
  { no: '71', date: '2026/04/06', dr: { acc: '雑費', tax: PURCHASE, amt: '1234.56', taxAmt: 112 }, cr: { acc: '現金', amt: 1234 }, desc: '金額小数' },
  { no: '72', date: '2026/04/07', dr: { acc: '売上高', tax: SALES, amt: -1000, taxAmt: -90 }, cr: { acc: '現金', amt: -1000 }, desc: '赤伝' },
  { no: '73', date: '2026/04/08', dr: { acc: '消耗品費', tax: PURCHASE, amt: '１１，０００', taxAmt: '１，０００' }, cr: { acc: '現金', amt: '11,000' }, desc: '全角数字' },
]);

// 弥生汎用形式（架空の列順・ヘッダー無し・Shift_JIS・22列）
interface YRow { flag: string; no: string; closing?: string; date: string; dr?: Side; cr?: Side; desc?: string; memo?: string }
const ySide = (s: Side | undefined): string[] => [s?.acc ?? '', s?.sub ?? '', s?.dept ?? '', s?.tax ?? '', s?.amt === undefined ? '' : String(s.amt), s?.taxAmt === undefined ? '' : String(s.taxAmt)];
const yRow = (r: YRow): string[] => [r.flag, r.no, r.closing ?? '', r.date, ...ySide(r.dr), ...ySide(r.cr), r.desc ?? '', '', '', '', '', r.memo ?? ''];
function writeYayoi(name: string, rows: YRow[]): void {
  writeFileSync(join(yayoiDir, name), encodeText(toCsv(rows.map(yRow), 'CRLF'), 'shift_jis'));
}
const YS = '例_課税売上込10%';
const YP = '例_課税仕入込10%';
const YO = '例_対象外';

const yayoiNormal: YRow[] = [
  { flag: '例S', no: '101', date: '2026/04/05', dr: { acc: '現金', tax: YO, amt: 11000 }, cr: { acc: '売上高', tax: YS, amt: 11000, taxAmt: 1000 }, desc: '店頭売上' },
  { flag: '例S', no: '102', date: 'R08/04/10', dr: { acc: '消耗品費', tax: YP, amt: 3278, taxAmt: 298 }, cr: { acc: '現金', tax: YO, amt: 3278 }, desc: '文房具購入（和暦）' },
  { flag: '例CS', no: '103', date: '2026/04/12', dr: { acc: '現金', tax: YO, amt: 33000 }, desc: '複合売上' },
  { flag: '例CM', no: '103', date: '2026/04/12', cr: { acc: '売上高', tax: YS, amt: 30000, taxAmt: 2727 }, desc: '複合売上' },
  { flag: '例CE', no: '103', date: '2026/04/12', cr: { acc: '預り金', tax: YO, amt: 3000 }, desc: '複合売上' },
  { flag: '例S', no: '104', date: '2026/04/20', dr: { acc: '普通預金', sub: '例_B銀行', tax: YO, amt: 5500 }, cr: { acc: '売掛金', sub: 'テスト工業有限会社', tax: YO, amt: 5500 }, desc: '売掛金入金' },
];
writeYayoi('normal.txt', yayoiNormal);
writeYayoi('sjis-noheader.txt', yayoiNormal);

writeYayoi('opening.txt', [
  { flag: '例S', no: '1', date: '2026/04/01', dr: { acc: '現金', tax: YO, amt: 100000 }, cr: { acc: '元入金', tax: YO, amt: 100000 }, desc: '前期繰越' },
  { flag: '例S', no: '2', date: '2026/04/01', dr: { acc: '普通預金', sub: '例_B銀行', tax: YO, amt: 250000 }, cr: { acc: '元入金', tax: YO, amt: 250000 }, desc: '前期繰越' },
  { flag: '例S', no: '3', date: '2026/04/05', dr: { acc: '雑費', tax: YP, amt: 1100, taxAmt: 100 }, cr: { acc: '現金', tax: YO, amt: 1100 }, desc: '雑費' },
]);

console.log('fixtures generated');
