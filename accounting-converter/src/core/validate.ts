import type { Profile } from './config.js';
import type { Dataset, Diagnostic, JournalEntry } from './model.js';
import { diag } from './model.js';
import { levenshtein, normalizeName, partnerKey, stripCorporate } from './normalize.js';

export interface ValidationConfig {
  fiscalYear?: Profile['fiscalYear'];
  invoiceTransitionDates: string[];
  partnerFuzzyThreshold: number;
  taxRates: Map<string, number>;
  erroredEntryIds: Set<string>;
}

export function taxRateKey(sourceTaxCode: string | null, freeeTaxCode: string): string {
  return JSON.stringify([normalizeName(sourceTaxCode ?? ''), normalizeName(freeeTaxCode)]);
}

export function validate(ds: Dataset, cfg: ValidationConfig): Diagnostic[] {
  const out: Diagnostic[] = [];
  let warnedUnknownMode = false;

  for (const e of ds.entries) {
    if (e.lines.length < 2) {
      if (!cfg.erroredEntryIds.has(e.entryId)) {
        out.push(diag('E008', 'error', `伝票に明細行が ${e.lines.length} 行しかない（グループ化設定 grouping を確認）`, { entryId: e.entryId, sourceRow: e.sourceRows[0], detail: { lines: e.lines.length } }));
      }
      continue;
    }
    const debit = e.lines.filter((l) => l.side === 'debit').reduce((a, l) => a + l.amount, 0);
    const credit = e.lines.filter((l) => l.side === 'credit').reduce((a, l) => a + l.amount, 0);
    if (debit !== credit) {
      out.push(diag('E001', 'error', `借方合計 ${debit} ≠ 貸方合計 ${credit}（差額 ${debit - credit}）`, { entryId: e.entryId, sourceRow: e.sourceRows[0], detail: { debit, credit, diff: debit - credit } }));
      if (e.amountMode === 'unknown' && !warnedUnknownMode) {
        warnedUnknownMode = true;
        out.push(diag('W014', 'warning', 'amountMode が unknown のまま借貸チェックを実施した（source 設定の amountMode を確定させること）', { entryId: e.entryId }));
      }
    }
    if (e.flags.includes('FIXED_ASSET')) {
      out.push(diag('W003', 'warning', '固定資産科目を含む伝票。固定資産台帳を別途インポートする場合、取得仕訳の扱いを確認', { entryId: e.entryId, sourceRow: e.sourceRows[0], detail: { accounts: e.lines.map((l) => l.accountRaw).join('/') } }));
    }
    if (e.flags.includes('DEPRECIATION')) {
      out.push(diag('W004', 'warning', '減価償却関連科目を含む伝票。freee の固定資産台帳から自動生成される減価償却仕訳と二重計上になる恐れ', { entryId: e.entryId, sourceRow: e.sourceRows[0], detail: { accounts: e.lines.map((l) => l.accountRaw).join('/') } }));
    }
    if (e.flags.includes('DEPRECIATION_MIXED')) {
      out.push(diag('W017', 'warning', '償却仕訳に他科目が混在（期中売却の月割償却合算、少額減価償却資産の即時償却等の可能性）。伝票単位で出力に残した', { entryId: e.entryId, sourceRow: e.sourceRows[0], detail: { accounts: e.lines.map((l) => l.accountRaw).join('/') } }));
    }
    if (e.flags.includes('OPENING_BALANCE')) {
      out.push(diag('W007', 'warning', '期首残高・繰越と思われる伝票（既定で出力から除外し、レポートに集計）', { entryId: e.entryId, sourceRow: e.sourceRows[0] }));
    }
    if (cfg.fiscalYear && e.date !== '0000-00-00' && (e.date < cfg.fiscalYear.start || e.date > cfg.fiscalYear.end)) {
      out.push(diag('W006', 'warning', `会計期間（${cfg.fiscalYear.start}〜${cfg.fiscalYear.end}）外の伝票: ${e.date}`, { entryId: e.entryId, sourceRow: e.sourceRows[0], detail: { date: e.date } }));
    }
    for (const l of e.lines) {
      if (l.amount < 0) {
        out.push(diag('W010', 'warning', `負の金額 ${l.amount}（赤伝・訂正仕訳の可能性。freee 側の扱いを確認）`, { entryId: e.entryId, sourceRow: l.sourceRow, detail: { amount: l.amount, account: l.accountRaw } }));
      }
      if (l.taxAmount !== null && l.mapped && e.amountMode !== 'unknown') {
        const rate = cfg.taxRates.get(taxRateKey(l.taxCodeRaw, l.mapped.freeeTaxCode));
        if (rate !== undefined && rate > 0) {
          const r = Math.round(rate * 10000);
          const expected = e.amountMode === 'tax_included' ? Math.floor((l.amount * r) / (10000 + r)) : Math.floor((l.amount * r) / 10000);
          if (Math.abs(expected - l.taxAmount) > 1) {
            out.push(diag('W009', 'warning', `税額 ${l.taxAmount} が逆算値 ${expected}（税率 ${rate}）と ±1円超で乖離`, { entryId: e.entryId, sourceRow: l.sourceRow, detail: { taxAmount: l.taxAmount, expected, rate } }));
          }
        }
      }
    }
  }

  const dates = ds.entries.map((e) => e.date).filter((d) => d !== '0000-00-00').sort();
  if (dates.length > 0) {
    const min = dates[0];
    const max = dates[dates.length - 1];
    for (const d of cfg.invoiceTransitionDates) {
      if (min <= d && max > d) {
        out.push(diag('W005', 'warning', `伝票の日付範囲（${min}〜${max}）がインボイス経過措置の切替日 ${d} をまたぐ。切替日前後で税区分の対応（控80/控50 等）が正しく分かれているか確認`, { detail: { transitionDate: d, min, max } }));
      }
    }
  }

  out.push(...checkPartners(ds.entries, cfg.partnerFuzzyThreshold));
  return out;
}

function checkPartners(entries: JournalEntry[], threshold: number): Diagnostic[] {
  const out: Diagnostic[] = [];
  const counts = new Map<string, number>();
  for (const e of entries) for (const l of e.lines) {
    const p = l.mapped?.partner;
    if (p) counts.set(p, (counts.get(p) ?? 0) + 1);
  }
  const names = [...counts.keys()];
  const exactPairs = new Set<string>();
  const byKey = new Map<string, string[]>();
  for (const n of names) {
    const k = partnerKey(n);
    const list = byKey.get(k) ?? [];
    list.push(n);
    byKey.set(k, list);
  }
  for (const list of byKey.values()) {
    if (list.length < 2) continue;
    for (let i = 0; i < list.length; i++) for (let j = i + 1; j < list.length; j++) {
      exactPairs.add(pairKey(list[i], list[j]));
      out.push(diag('W001', 'warning', `取引先名「${list[i]}」と「${list[j]}」は正規化すると同一（freee は完全一致重複を許可しない前提。事前名寄せを検討）`, { detail: { a: list[i], b: list[j], countA: counts.get(list[i]) ?? 0, countB: counts.get(list[j]) ?? 0 } }));
    }
  }
  for (let i = 0; i < names.length; i++) for (let j = i + 1; j < names.length; j++) {
    if (exactPairs.has(pairKey(names[i], names[j]))) continue;
    const a = stripCorporate(names[i]);
    const b = stripCorporate(names[j]);
    if (a === '' || b === '') continue;
    const limit = Math.min(a.length, b.length) <= 5 ? Math.min(1, threshold) : threshold;
    const d = levenshtein(a, b);
    if (d <= limit) {
      out.push(diag('W002', 'warning', `取引先名「${names[i]}」と「${names[j]}」は表記ゆれ候補（法人格除去後の距離 ${d}）`, { detail: { a: names[i], b: names[j], distance: d, countA: counts.get(names[i]) ?? 0, countB: counts.get(names[j]) ?? 0 } }));
    }
  }
  return out;
}

function pairKey(a: string, b: string): string {
  return JSON.stringify(a < b ? [a, b] : [b, a]);
}
