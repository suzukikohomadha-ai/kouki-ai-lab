import type { TargetColumn, TargetConfig } from './config.js';
import { toCsv } from './csv.js';
import type { Dataset, Diagnostic, JournalEntry, JournalLine } from './model.js';
import { diag } from './model.js';
import { formatDate } from './normalize.js';

export interface RenderResult {
  csv: string;
  rows: string[][];
  diagnostics: Diagnostic[];
  outputEntryIds: string[];
}

export function renderOutput(ds: Dataset, target: TargetConfig, excluded: Set<string>): RenderResult {
  const diagnostics: Diagnostic[] = [];
  const rows: string[][] = [target.columns.map((c) => c.name)];
  const outputEntryIds: string[] = [];

  for (const entry of ds.entries) {
    if (excluded.has(entry.entryId)) continue;
    const debits = entry.lines.filter((l) => l.side === 'debit');
    const credits = entry.lines.filter((l) => l.side === 'credit');
    let entryRows: { debit: JournalLine | null; credit: JournalLine | null }[] = [];

    if (target.rowModel === 'one_row_per_line') {
      entryRows = entry.lines.map((l) => (l.side === 'debit' ? { debit: l, credit: null } : { debit: null, credit: l }));
    } else if (debits.length === 1 && credits.length === 1) {
      entryRows = [{ debit: debits[0], credit: credits[0] }];
    } else if (target.compoundEntries === 'blank_side') {
      entryRows = [...debits.map((d) => ({ debit: d, credit: null })), ...credits.map((c) => ({ debit: null, credit: c }))];
    } else {
      diagnostics.push(diag('E007', 'error', `複合仕訳（借方 ${debits.length} 行・貸方 ${credits.length} 行）は出力テンプレート設定 compoundEntries=${target.compoundEntries} では表現できない`, { entryId: entry.entryId, sourceRow: entry.sourceRows[0], detail: { debits: debits.length, credits: credits.length } }));
      continue;
    }

    let entryOk = true;
    const built: string[][] = [];
    for (const r of entryRows) {
      const cells: string[] = [];
      for (const col of target.columns) {
        const v = resolveValue(col, entry, r.debit, r.credit);
        if (col.required && v === '' && isRequiredApplicable(col, r)) {
          diagnostics.push(diag('E006', 'error', `出力テンプレートの必須列「${col.name}」に値が入らない（from: ${col.from}）`, { entryId: entry.entryId, sourceRow: (r.debit ?? r.credit)?.sourceRow, detail: { column: col.name, from: col.from } }));
          entryOk = false;
        }
        cells.push(v);
      }
      built.push(cells);
    }
    if (!entryOk) continue;
    rows.push(...built);
    outputEntryIds.push(entry.entryId);
  }

  return { csv: toCsv(rows, target.newline ?? 'CRLF'), rows, diagnostics, outputEntryIds };
}

function isRequiredApplicable(col: TargetColumn, r: { debit: JournalLine | null; credit: JournalLine | null }): boolean {
  const from = col.from ?? '';
  if (from.startsWith('debit.')) return r.debit !== null;
  if (from.startsWith('credit.')) return r.credit !== null;
  return true;
}

export function resolveValue(col: TargetColumn, entry: JournalEntry, debit: JournalLine | null, credit: JournalLine | null): string {
  if (!col.from) return '';
  const parts = col.from.split('.');
  const head = parts[0];
  let value: unknown;
  if (head === 'entry') value = pick(entry as unknown as Record<string, unknown>, parts.slice(1));
  else if (head === 'debit') value = debit ? pick(debit as unknown as Record<string, unknown>, parts.slice(1)) : null;
  else if (head === 'credit') value = credit ? pick(credit as unknown as Record<string, unknown>, parts.slice(1)) : null;
  else if (head === 'line') {
    const l = debit ?? credit;
    value = l ? pick(l as unknown as Record<string, unknown>, parts.slice(1)) : null;
  } else value = null;

  if (value === null || value === undefined) return '';
  if (Array.isArray(value)) return value.map(String).join(col.join ?? ',');
  if (col.from === 'entry.date' && col.format) return formatDate(String(value), col.format);
  return String(value);
}

function pick(obj: Record<string, unknown>, path: string[]): unknown {
  let cur: unknown = obj;
  for (const p of path) {
    if (cur === null || cur === undefined || typeof cur !== 'object') return null;
    cur = (cur as Record<string, unknown>)[p];
  }
  return cur;
}
