import type { ParsedCsv, RawRow } from '../csv.js';
import type { ColumnSpec, Profile, SourceConfig } from '../config.js';
import type { AmountMode, Dataset, Diagnostic, EntryFlag, JournalEntry, JournalLine, SourceSystem } from '../model.js';
import { diag } from '../model.js';
import { isBlank, normalizeName, nullIfBlank, parseAmount, parseDate } from '../normalize.js';

export interface ColumnResolver {
  indexOf(key: string): number | null;
  missingRequired: string[];
}

export function resolveColumns(source: SourceConfig, header: string[] | null): ColumnResolver {
  const map = new Map<string, number>();
  const missing: string[] = [];
  for (const [key, spec] of Object.entries(source.columns)) {
    const idx = resolveSpec(spec, header);
    if (idx === null) {
      if (!spec.optional) missing.push(key);
    } else map.set(key, idx);
  }
  return { indexOf: (k) => map.get(k) ?? null, missingRequired: missing };
}

export function resolveSpec(spec: ColumnSpec | undefined, header: string[] | null): number | null {
  if (!spec) return null;
  if (header && spec.header !== undefined) {
    const i = header.indexOf(spec.header.trim());
    if (i >= 0) return i;
  }
  if (spec.index !== undefined) {
    const n = typeof spec.index === 'number' ? spec.index : Number(spec.index);
    if (Number.isInteger(n) && n >= 0) return n;
  }
  return null;
}

export function collectHeaderSignature(source: SourceConfig): string[] {
  const sig = new Set<string>(source.headerSignature ?? []);
  for (const spec of Object.values(source.columns)) if (spec.header) sig.add(spec.header);
  return [...sig];
}

interface RowSide {
  account: string | null;
  subAccount: string | null;
  department: string | null;
  partner: string | null;
  taxCode: string | null;
  invoice: string | null;
  amountRaw: string | null;
  taxAmountRaw: string | null;
}

interface ParsedRow {
  row: RawRow;
  voucherNo: string | null;
  dateRaw: string;
  description: string;
  memo: string | null;
  tags: string | null;
  closingFlag: string | null;
  groupFlag: string | null;
  debit: RowSide | null;
  credit: RowSide | null;
}

function readSide(cols: ColumnResolver, row: RawRow, side: 'debit' | 'credit'): RowSide | null {
  const get = (k: string): string | null => {
    const i = cols.indexOf(`${side}.${k}`);
    return i === null ? null : nullIfBlank(row.cells[i]);
  };
  const s: RowSide = {
    account: get('account'),
    subAccount: get('subAccount'),
    department: get('department'),
    partner: get('partner'),
    taxCode: get('taxCode'),
    invoice: get('invoice'),
    amountRaw: get('amount'),
    taxAmountRaw: get('taxAmount'),
  };
  if (s.account === null && s.amountRaw === null) return null;
  return s;
}

export interface AdapterContext {
  system: SourceSystem;
  fileName: string;
  encoding: string;
  hadBom: boolean;
}

export function buildDataset(parsed: ParsedCsv, profile: Profile, ctx: AdapterContext): { dataset: Dataset; diagnostics: Diagnostic[] } {
  const source = profile.source;
  const diagnostics: Diagnostic[] = [];
  const cols = resolveColumns(source, parsed.header);
  const dataset: Dataset = {
    source: ctx.system,
    sourceFile: { name: ctx.fileName, encoding: ctx.encoding, hadBom: ctx.hadBom, hasHeader: parsed.header !== null, physicalRows: parsed.physicalRows },
    entries: [],
  };
  if (cols.missingRequired.length > 0) {
    diagnostics.push(diag('E005', 'error', `入力に必須列が見つからない: ${cols.missingRequired.join(', ')}（ヘッダー名・index の設定を確認）`, { detail: { missing: cols.missingRequired.join(',') } }));
    return { dataset, diagnostics };
  }
  const expectedWidth = parsed.header ? parsed.header.length : null;
  const amountMode: AmountMode = (['tax_included', 'tax_excluded'].includes(source.amountMode) ? source.amountMode : 'unknown') as AmountMode;

  const rows: ParsedRow[] = [];
  for (const row of parsed.rows) {
    if (expectedWidth !== null && row.cells.length !== expectedWidth) {
      diagnostics.push(diag('E005', 'error', `列数がヘッダーと一致しない（期待 ${expectedWidth}、実際 ${row.cells.length}）`, { sourceRow: row.rowNumber, detail: { expected: expectedWidth, actual: row.cells.length } }));
      continue;
    }
    const cell = (k: string): string | null => {
      const i = cols.indexOf(k);
      return i === null ? null : nullIfBlank(row.cells[i]);
    };
    const flagIdx = resolveSpec(source.grouping.flagColumn, parsed.header);
    rows.push({
      row,
      voucherNo: cell('voucherNo'),
      dateRaw: cell('date') ?? '',
      description: cell('description') ?? '',
      memo: cell('memo'),
      tags: cell('tags'),
      closingFlag: cell('closingFlag'),
      groupFlag: flagIdx === null ? null : nullIfBlank(row.cells[flagIdx]),
      debit: readSide(cols, row, 'debit'),
      credit: readSide(cols, row, 'credit'),
    });
  }

  const groups = groupRows(rows, source, diagnostics);
  let seq = 0;
  for (const group of groups) {
    seq++;
    const entryId = `E${String(seq).padStart(6, '0')}`;
    const first = group[0];
    const date = parseDate(first.dateRaw, source.dateFormats, source.eraTable);
    if (date === null) {
      diagnostics.push(diag('E004', 'error', `日付を解析できない: 「${first.dateRaw}」`, { entryId, sourceRow: first.row.rowNumber, detail: { value: first.dateRaw } }));
    }
    const lines: JournalLine[] = [];
    for (const pr of group) {
      const rowMemo = pr.description !== first.description && pr.description !== '' ? pr.description : null;
      const memo = [rowMemo, pr.memo].filter((x): x is string => x !== null).join(' / ') || null;
      for (const side of ['debit', 'credit'] as const) {
        const s = pr[side];
        if (!s) continue;
        const line = toLine(side, s, pr, memo, entryId, diagnostics);
        if (line) lines.push(line);
      }
    }
    const entry: JournalEntry = {
      entryId,
      voucherNo: first.voucherNo,
      date: date ?? '0000-00-00',
      description: first.description,
      lines,
      amountMode,
      flags: [],
      sourceRows: group.map((g) => g.row.rowNumber),
    };
    entry.flags = detectFlags(entry, group, profile);
    dataset.entries.push(entry);
  }
  diagnostics.push(diag('I003', 'info', `グループ化戦略 ${source.grouping.strategy}: 伝票 ${dataset.entries.length} 件、明細 ${dataset.entries.reduce((a, e) => a + e.lines.length, 0)} 行`, { detail: { strategy: source.grouping.strategy, entries: dataset.entries.length } }));
  return { dataset, diagnostics };
}

function toLine(side: 'debit' | 'credit', s: RowSide, pr: ParsedRow, memo: string | null, entryId: string, diagnostics: Diagnostic[]): JournalLine | null {
  const sideLabel = side === 'debit' ? '借方' : '貸方';
  if (s.account === null) {
    diagnostics.push(diag('E005', 'error', `${sideLabel}の勘定科目が空（金額のみ入力されている）`, { entryId, sourceRow: pr.row.rowNumber, detail: { side } }));
    return null;
  }
  if (s.amountRaw === null) {
    diagnostics.push(diag('E005', 'error', `${sideLabel}の金額が空（科目「${s.account}」）`, { entryId, sourceRow: pr.row.rowNumber, detail: { side, account: s.account } }));
    return null;
  }
  const amt = parseAmount(s.amountRaw);
  if (!amt.ok) {
    const why = amt.reason === 'decimal' ? '円未満の小数' : '数値として解釈できない';
    diagnostics.push(diag('E005', 'error', `${sideLabel}の金額を解析できない（${why}）: 「${s.amountRaw}」`, { entryId, sourceRow: pr.row.rowNumber, detail: { side, value: s.amountRaw } }));
    return null;
  }
  let taxAmount: number | null = null;
  if (s.taxAmountRaw !== null) {
    const t = parseAmount(s.taxAmountRaw);
    if (t.ok) taxAmount = t.value;
    else diagnostics.push(diag('E005', 'error', `${sideLabel}の税額を解析できない: 「${s.taxAmountRaw}」`, { entryId, sourceRow: pr.row.rowNumber, detail: { side, value: s.taxAmountRaw } }));
  }
  return {
    side,
    accountRaw: s.account,
    account: normalizeName(s.account),
    subAccountRaw: s.subAccount,
    departmentRaw: s.department,
    partnerRaw: s.partner,
    taxCodeRaw: s.taxCode,
    amount: amt.value,
    taxAmount,
    invoiceRaw: s.invoice,
    memo,
    tagsRaw: pr.tags,
    sourceRow: pr.row.rowNumber,
  };
}

function groupRows(rows: ParsedRow[], source: SourceConfig, diagnostics: Diagnostic[]): ParsedRow[][] {
  const strategy = source.grouping.strategy;
  const groups: ParsedRow[][] = [];
  if (strategy === 'each_row') {
    for (const r of rows) groups.push([r]);
    return groups;
  }
  if (strategy === 'by_flag') {
    const fv = source.grouping.flagValues;
    const norm = (xs: (string | number)[] | undefined) => (xs ?? []).map((x) => String(x).trim());
    const single = norm(fv?.single);
    const start = norm(fv?.compoundStart);
    const middle = norm(fv?.compoundMiddle);
    const end = norm(fv?.compoundEnd);
    let current: ParsedRow[] | null = null;
    for (const r of rows) {
      const f = (r.groupFlag ?? '').trim();
      if (single.includes(f)) {
        if (current) { groups.push(current); current = null; }
        groups.push([r]);
      } else if (start.includes(f)) {
        if (current) groups.push(current);
        current = [r];
      } else if (middle.includes(f)) {
        if (!current) current = [];
        current.push(r);
      } else if (end.includes(f)) {
        if (!current) current = [];
        current.push(r);
        groups.push(current);
        current = null;
      } else {
        diagnostics.push(diag('E005', 'error', `識別フラグ値「${f}」が grouping.flagValues に無い`, { sourceRow: r.row.rowNumber, detail: { flag: f } }));
        if (current) { groups.push(current); current = null; }
        groups.push([r]);
      }
    }
    if (current) groups.push(current);
    return groups;
  }
  const seen = new Map<string, number>();
  let current: ParsedRow[] | null = null;
  let currentKey: string | null = null;
  for (const r of rows) {
    const key = r.voucherNo;
    if (key !== null && current && currentKey === key) {
      current.push(r);
      continue;
    }
    if (current) groups.push(current);
    current = [r];
    currentKey = key;
    if (key !== null) {
      const prev = seen.get(key);
      if (prev !== undefined) {
        diagnostics.push(diag('W011', 'warning', `伝票番号「${key}」が離れた位置（行 ${prev}）にも出現する`, { sourceRow: r.row.rowNumber, detail: { voucherNo: key, firstRow: prev } }));
      } else seen.set(key, r.row.rowNumber);
    }
  }
  if (current) groups.push(current);
  return groups;
}

function detectFlags(entry: JournalEntry, group: ParsedRow[], profile: Profile): EntryFlag[] {
  const d = profile.options.detectors;
  const flags = new Set<EntryFlag>();
  const accounts = entry.lines.map((l) => l.account);
  const inList = (list: string[] | undefined, name: string) => (list ?? []).map(normalizeName).includes(name);
  const texts = [entry.description, ...entry.lines.map((l) => l.memo ?? '')];
  if ((d.openingBalanceKeywords ?? []).some((kw) => texts.some((t) => t.includes(kw)))) flags.add('OPENING_BALANCE');
  if (profile.fiscalYear && entry.date === profile.fiscalYear.start) {
    const counters = d.openingBalanceCounterAccounts ?? ['元入金', '資本金', '繰越利益剰余金'];
    if (accounts.some((a) => inList(counters, a))) flags.add('OPENING_BALANCE');
  }
  if (accounts.some((a) => inList(d.depreciationAccounts, a))) flags.add('DEPRECIATION');
  if (accounts.some((a) => inList(d.fixedAssetAccounts, a))) flags.add('FIXED_ASSET');
  if (group.some((g) => !isBlank(g.closingFlag) && !['0', 'false', 'no', '通常'].includes(g.closingFlag!.toLowerCase()))) flags.add('CLOSING_ADJUSTMENT');
  if (entry.lines.length > 2) flags.add('COMPOUND');
  return [...flags];
}
