import type { Maps, ProfileOptions, SubaccountAction, SubaccountRule, TaxcodeMapEntry } from './config.js';
import type { Dataset, Diagnostic, JournalEntry, JournalLine, MappedLine } from './model.js';
import { diag } from './model.js';
import { normalizeName } from './normalize.js';
import type { UnmappedItem } from './suggest.js';

export interface MappingOptions {
  departments: ProfileOptions['departments'];
  tags: NonNullable<ProfileOptions['tags']>;
  memoTagColumnExists: boolean;
  strict: boolean;
  sourceSystem: Dataset['source'];
}

export interface MappingResult {
  dataset: Dataset;
  diagnostics: Diagnostic[];
  unmapped: UnmappedItem[];
}

export function applyMappings(ds: Dataset, maps: Maps, opts: MappingOptions): MappingResult {
  const diagnostics: Diagnostic[] = [];
  const accountIndex = new Map<string, { key: string; entry: Maps['accounts']['entries'][string] }>();
  for (const [k, v] of Object.entries(maps.accounts.entries)) accountIndex.set(normalizeName(k), { key: k, entry: v });
  const taxIndex = new Map<string, TaxcodeMapEntry[]>();
  for (const e of maps.taxcodes.entries) {
    const k = normalizeName(e.sourceTaxCode);
    const list = taxIndex.get(k) ?? [];
    list.push(e);
    taxIndex.set(k, list);
  }
  const blankAccounts = new Set((maps.taxcodes.defaultForBlank?.appliesToAccounts ?? []).map(normalizeName));
  const aliasIndex = new Map<string, string>();
  for (const [k, v] of Object.entries(maps.partners.aliases ?? {})) aliasIndex.set(normalizeName(k), v);

  const unmappedAcc = new Map<string, UnmappedItem>();
  const unmappedTax = new Map<string, UnmappedItem>();
  const warnedUnconfirmed = new Set<string>();
  const subaccountOutcomes = new Map<string, Map<string, string>>();

  const noteUnmapped = (map: Map<string, UnmappedItem>, kind: UnmappedItem['kind'], value: string, line: JournalLine, parent?: string) => {
    const item = map.get(value) ?? { kind, sourceValue: value, count: 0, debitTotal: 0, creditTotal: 0, firstRow: line.sourceRow, parentAccount: parent };
    item.count++;
    if (line.side === 'debit') item.debitTotal += line.amount;
    else item.creditTotal += line.amount;
    map.set(value, item);
  };

  for (const entry of ds.entries) {
    for (const line of entry.lines) {
      const mapped: MappedLine = {
        freeeAccount: '',
        freeeSubAccount: null,
        freeeTaxCode: '',
        partner: null,
        item: null,
        department: null,
        memoTags: [],
        provenance: { account: 'table', tax: 'table', subAccount: 'none', partner: 'none' },
      };

      const acc = accountIndex.get(line.account);
      if (!acc) {
        noteUnmapped(unmappedAcc, 'account', line.accountRaw, line);
        diagnostics.push(diag('E002', 'error', `勘定科目「${line.accountRaw}」が対応表にない`, { entryId: entry.entryId, sourceRow: line.sourceRow, detail: { account: line.accountRaw, side: line.side } }));
      } else {
        mapped.freeeAccount = acc.entry.freeeAccount;
        mapped.freeeSubAccount = acc.entry.freeeSubAccount ?? null;
        if (!acc.entry.confirmed) {
          if (opts.strict) {
            diagnostics.push(diag('E002', 'error', `勘定科目「${line.accountRaw}」の対応は confirmed:false（--strict のため停止）`, { entryId: entry.entryId, sourceRow: line.sourceRow, detail: { account: line.accountRaw } }));
          } else if (!warnedUnconfirmed.has(`acc:${acc.key}`)) {
            warnedUnconfirmed.add(`acc:${acc.key}`);
            diagnostics.push(diag('W012', 'warning', `勘定科目「${acc.key}」→「${acc.entry.freeeAccount}」は confirmed:false の対応表エントリ（有資格者の確認が必要）`, { entryId: entry.entryId, sourceRow: line.sourceRow, detail: { account: acc.key, source: acc.entry.source ?? null } }));
          }
        }
      }

      const taxRes = resolveTax(line, entry, taxIndex, blankAccounts, maps, mapped.freeeAccount);
      if (taxRes.kind === 'ok') {
        mapped.freeeTaxCode = taxRes.entry.freeeTaxCode;
        mapped.provenance.tax = taxRes.dated ? 'table_dated' : 'table';
        if (!taxRes.entry.confirmed) {
          const k = `tax:${taxRes.entry.sourceTaxCode}:${taxRes.entry.freeeTaxCode}`;
          if (opts.strict) {
            diagnostics.push(diag('E003', 'error', `税区分「${taxRes.entry.sourceTaxCode}」の対応は confirmed:false（--strict のため停止）`, { entryId: entry.entryId, sourceRow: line.sourceRow, detail: { taxCode: taxRes.entry.sourceTaxCode } }));
          } else if (!warnedUnconfirmed.has(k)) {
            warnedUnconfirmed.add(k);
            diagnostics.push(diag('W012', 'warning', `税区分「${taxRes.entry.sourceTaxCode}」→「${taxRes.entry.freeeTaxCode}」は confirmed:false の対応表エントリ`, { entryId: entry.entryId, sourceRow: line.sourceRow, detail: { taxCode: taxRes.entry.sourceTaxCode } }));
          }
        }
      } else if (taxRes.kind === 'blank_default') {
        mapped.freeeTaxCode = taxRes.code;
        mapped.provenance.tax = 'default_blank';
      } else {
        const label = line.taxCodeRaw ?? '(空欄)';
        noteUnmapped(unmappedTax, 'taxcode', label, line, line.accountRaw);
        const why = taxRes.kind === 'no_period' ? `対応表に日付 ${entry.date} を含む期間のエントリがない` : '対応表にない';
        diagnostics.push(diag('E003', 'error', `税区分「${label}」（科目「${line.accountRaw}」）: ${why}`, { entryId: entry.entryId, sourceRow: line.sourceRow, detail: { taxCode: label, account: line.accountRaw } }));
      }

      if (line.subAccountRaw !== null) {
        const rule = findRule(maps.subaccountRules.rules, line, opts.sourceSystem);
        const action: SubaccountAction = rule ? rule.then.assign : maps.subaccountRules.defaultAction;
        mapped.provenance.subAccount = rule ? `rule:${rule.id}` : 'rule:default';
        applySubaccountAction(action, line, entry, mapped, opts, diagnostics);
        const byParent = subaccountOutcomes.get(line.subAccountRaw) ?? new Map<string, string>();
        byParent.set(line.account, action);
        subaccountOutcomes.set(line.subAccountRaw, byParent);
      }

      if (line.partnerRaw !== null) {
        mapped.partner = line.partnerRaw;
        mapped.provenance.partner = 'column';
      }
      if (mapped.partner !== null) {
        const alias = aliasIndex.get(normalizeName(mapped.partner));
        if (alias !== undefined) {
          mapped.partner = alias;
          mapped.provenance.partner = 'alias';
        }
      }

      if (line.departmentRaw !== null) {
        if (opts.departments === 'passthrough') mapped.department = line.departmentRaw;
        else diagnostics.push(diag('W008', 'warning', `部門「${line.departmentRaw}」は出力しない（options.departments=drop）`, { entryId: entry.entryId, sourceRow: line.sourceRow, detail: { kind: 'department', value: line.departmentRaw } }));
      }
      if (line.tagsRaw !== null) {
        if (opts.tags === 'memo_tag' && opts.memoTagColumnExists) {
          mapped.memoTags.push(line.tagsRaw);
        } else if (opts.tags === 'memo_tag') {
          diagnostics.push(diag('W008', 'warning', `タグ「${line.tagsRaw}」: options.tags=memo_tag だが出力テンプレートにメモタグ列（from: *.mapped.memoTags）が無いため出力しない`, { entryId: entry.entryId, sourceRow: line.sourceRow, detail: { kind: 'tags', value: line.tagsRaw } }));
        } else {
          diagnostics.push(diag('W008', 'warning', `タグ「${line.tagsRaw}」は出力しない（options.tags=drop）`, { entryId: entry.entryId, sourceRow: line.sourceRow, detail: { kind: 'tags', value: line.tagsRaw } }));
        }
      }

      line.mapped = mapped;
    }
  }

  for (const [sub, byParent] of subaccountOutcomes) {
    const actions = new Set(byParent.values());
    if (byParent.size > 1 && actions.size > 1) {
      diagnostics.push(diag('W015', 'warning', `補助科目「${sub}」が複数の親科目（${[...byParent.keys()].join('、')}）に出現し、割当結果が異なる（${[...actions].join('/')}）`, { detail: { subAccount: sub, parents: [...byParent.keys()].join(',') } }));
    }
  }

  return { dataset: ds, diagnostics, unmapped: [...unmappedAcc.values(), ...unmappedTax.values()] };
}

type TaxResolution =
  | { kind: 'ok'; entry: TaxcodeMapEntry; dated: boolean }
  | { kind: 'blank_default'; code: string }
  | { kind: 'missing' }
  | { kind: 'no_period' };

function resolveTax(line: JournalLine, entry: JournalEntry, taxIndex: Map<string, TaxcodeMapEntry[]>, blankAccounts: Set<string>, maps: Maps, freeeAccount: string): TaxResolution {
  if (line.taxCodeRaw === null) {
    const d = maps.taxcodes.defaultForBlank;
    if (d && (blankAccounts.has(line.account) || (freeeAccount && blankAccounts.has(normalizeName(freeeAccount))))) {
      return { kind: 'blank_default', code: d.freeeTaxCode };
    }
    return { kind: 'missing' };
  }
  const list = taxIndex.get(normalizeName(line.taxCodeRaw));
  if (!list || list.length === 0) return { kind: 'missing' };
  const dated = list.filter((e) => e.effectiveFrom !== undefined || e.effectiveTo !== undefined);
  if (dated.length === 0) return { kind: 'ok', entry: list[0], dated: false };
  const hit = list.find((e) => (e.effectiveFrom === undefined || e.effectiveFrom <= entry.date) && (e.effectiveTo === undefined || entry.date <= e.effectiveTo));
  if (hit) return { kind: 'ok', entry: hit, dated: true };
  return { kind: 'no_period' };
}

function findRule(rules: SubaccountRule[], line: JournalLine, system: Dataset['source']): SubaccountRule | null {
  for (const r of rules) {
    const w = r.when ?? {};
    if (w.parentAccountIn && !w.parentAccountIn.map(normalizeName).includes(line.account)) continue;
    if (w.subAccountMatches && !new RegExp(w.subAccountMatches).test(line.subAccountRaw ?? '')) continue;
    if (w.sourceSystemIs && w.sourceSystemIs !== system) continue;
    return r;
  }
  return null;
}

function applySubaccountAction(action: SubaccountAction, line: JournalLine, entry: JournalEntry, mapped: MappedLine, opts: MappingOptions, diagnostics: Diagnostic[]): void {
  const sub = line.subAccountRaw!;
  const ctx = { entryId: entry.entryId, sourceRow: line.sourceRow, detail: { kind: 'subaccount', value: sub, action } };
  switch (action) {
    case 'partner':
      if (line.partnerRaw === null) {
        mapped.partner = sub;
        mapped.provenance.partner = 'subaccount';
      } else {
        mapped.memoTags.push(sub);
      }
      return;
    case 'freee_sub_account':
      if (mapped.freeeSubAccount === null) mapped.freeeSubAccount = sub;
      else mapped.memoTags.push(sub);
      return;
    case 'memo_tag':
      mapped.memoTags.push(sub);
      return;
    case 'department':
      if (opts.departments === 'passthrough' && mapped.department === null) mapped.department = sub;
      else diagnostics.push(diag('W008', 'warning', `補助科目「${sub}」（部門扱い）は出力しない（options.departments=drop）`, ctx));
      return;
    case 'item':
      diagnostics.push(diag('W008', 'warning', `補助科目「${sub}」（品目扱い）は PoC では出力しない`, ctx));
      return;
    case 'drop':
      diagnostics.push(diag('W008', 'warning', `補助科目「${sub}」は出力しない（ルール: drop）`, ctx));
      return;
  }
}
