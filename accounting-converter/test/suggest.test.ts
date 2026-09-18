import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { convert, NoopSuggester, RuleSuggester, toCsv, type AccountAliasesMap, type UnmappedItem } from '../src/core/index.js';
import { codes, exampleProfile, ROOT } from './helpers.js';

const aliases = JSON.parse(readFileSync(join(ROOT, 'config', 'examples', 'maps', 'account-aliases.example.json'), 'utf8')) as AccountAliasesMap;
const ctx = { targetAccounts: ['例_売掛金', '例_消耗品費', '例_現金', '例_普通預金', '例_売上高', '例_雑費', '例_旅費交通費'], targetTaxCodes: ['例_freee課税売上10%', '例_freee課対仕入10%', '例_freee課対仕入軽8%', '例_freee対象外'], sourceSystem: 'mf_journal' as const };
const item = (sourceValue: string, kind: UnmappedItem['kind'] = 'account'): UnmappedItem => ({ kind, sourceValue, count: 1, debitTotal: 0, creditTotal: 0 });

test('RuleSuggester: (i) 正規化後の完全一致（全角/半角・空白差）', async () => {
  const s = new RuleSuggester(aliases);
  const [r] = await s.suggest([item('例＿売掛金 ')], ctx);
  assert.equal(r.provider, 'rule');
  assert.equal(r.candidates[0].target, '例_売掛金');
  assert.equal(r.candidates[0].confidence, 1.0);
  assert.ok(r.candidates[0].reason.includes('完全一致'));
});

test('RuleSuggester: (ii) 記号・空白・括弧内の除去後に一致', async () => {
  const s = new RuleSuggester(aliases);
  const [r] = await s.suggest([item('例_消耗品費（本社）')], ctx);
  assert.equal(r.candidates[0].target, '例_消耗品費');
  assert.equal(r.candidates[0].confidence, 0.9);
});

test('RuleSuggester: (iii) 別名辞書に一致（辞書の note を根拠に含める）', async () => {
  const s = new RuleSuggester(aliases);
  const [r] = await s.suggest([item('例_売掛金-A')], ctx);
  assert.ok(r.candidates.some((c) => c.target === '例_売掛金' && c.confidence === 0.8 && c.reason.includes('別名辞書')));
  const none = new RuleSuggester(null);
  const r2 = await none.suggest([item('例_事務用品費')], ctx);
  assert.equal(r2.length, 0);
});

test('RuleSuggester: (iv) 前方/後方一致、候補は最大3件・根拠付き', async () => {
  const s = new RuleSuggester(aliases);
  const [r] = await s.suggest([item('例_旅費')], ctx);
  assert.ok(r.candidates.some((c) => c.target === '例_旅費交通費' && c.confidence === 0.5 && c.reason === '前方一致'));
  const [r2] = await s.suggest([item('例_売掛金')], { ...ctx, targetAccounts: ['例_売掛金A', '例_売掛金B', '例_売掛金C', '例_売掛金D'] });
  assert.equal(r2.candidates.length, 3);
  assert.ok(r2.candidates.every((c) => c.reason === '前方一致'));
  assert.ok(r2.candidates.every((c) => c.reason.length > 0));
  const nothing = await s.suggest([item('全く無関係な科目')], ctx);
  assert.equal(nothing.length, 0);
});

test('RuleSuggester: 税区分は正規化一致＋税率数字（売上/仕入の語で優先）', async () => {
  const s = new RuleSuggester(aliases);
  const [r] = await s.suggest([item('課税仕入 10%', 'taxcode')], ctx);
  assert.equal(r.candidates[0].target, '例_freee課対仕入10%');
  assert.equal(r.candidates[0].confidence, 0.6);
  assert.ok(r.candidates.some((c) => c.target === '例_freee課税売上10%' && c.confidence === 0.4));
  assert.ok(!r.candidates.some((c) => c.target === '例_freee課対仕入軽8%'));
  const [exact] = await s.suggest([item('例_freee対象外', 'taxcode')], ctx);
  assert.equal(exact.candidates[0].confidence, 1.0);
});

test('convert + RuleSuggester: 候補はレポートに併記されるだけで変換には適用されない（E002 のまま・出力なし）', async () => {
  const HEADER = ['例_取引No', '例_取引日', '例_借方勘定科目', '例_借方補助科目', '例_借方部門', '例_借方取引先', '例_借方税区分', '例_借方インボイス', '例_借方金額', '例_借方税額', '例_貸方勘定科目', '例_貸方補助科目', '例_貸方部門', '例_貸方取引先', '例_貸方税区分', '例_貸方インボイス', '例_貸方金額', '例_貸方税額', '例_摘要', '例_仕訳メモ', '例_タグ'];
  const row = ['1', '2026/04/05', '例_事務用品費', '', '', '', '例_課税仕入10%', '', '1100', '100', '現金', '', '', '', '', '', '1100', '', '架空', '', ''];
  const profile = exampleProfile('mf');
  const bytes = new TextEncoder().encode(toCsv([HEADER, row]));
  const withRule = await convert({ bytes, profile, suggester: new RuleSuggester(profile.maps.accountAliases) });
  assert.equal(codes(withRule, 'E002').length, 1);
  assert.equal(withRule.outputCsv, null);
  const u = withRule.report.unmapped.find((x) => x.kind === 'account')!;
  assert.ok(u.suggestions.includes('例_消耗品費'));
  assert.ok(u.suggestions.includes('別名辞書'));
  assert.equal(withRule.dataset.entries[0].lines[0].mapped?.freeeAccount, '');
  assert.equal(profile.maps.accounts.entries['例_事務用品費'], undefined);

  const withNoop = await convert({ bytes, profile, suggester: new NoopSuggester() });
  assert.equal(withNoop.report.unmapped.find((x) => x.kind === 'account')!.suggestions, '');
});

test('src/core/suggest.ts: RuleSuggester はあるが LlmSuggester は無い（静的検査）', () => {
  const src = readFileSync(join(ROOT, 'src', 'core', 'suggest.ts'), 'utf8');
  assert.ok(/class\s+RuleSuggester/.test(src));
  assert.ok(!/class\s+Llm\w*Suggester/.test(src));
  assert.ok(!/approvals\.json|W016/.test(src));
});
