import Papa from 'papaparse';

export interface RawRow {
  rowNumber: number;
  cells: string[];
}

export interface ParseCsvOptions {
  delimiter: ',' | '\t';
  hasHeader: boolean | 'auto';
  headerSignature?: string[];
}

export interface ParsedCsv {
  header: string[] | null;
  rows: RawRow[];
  physicalRows: number;
}

export function parseCsv(text: string, opts: ParseCsvOptions): ParsedCsv {
  const result = Papa.parse<string[]>(text, { delimiter: opts.delimiter, skipEmptyLines: false });
  const records: RawRow[] = [];
  let physical = 1;
  for (const cells of result.data) {
    const rowNumber = physical;
    let embeddedNewlines = 0;
    for (const c of cells) embeddedNewlines += (c.match(/\n/g) ?? []).length;
    physical += 1 + embeddedNewlines;
    if (cells.every((c) => c.trim() === '')) continue;
    records.push({ rowNumber, cells: cells.map((c) => c.replace(/^﻿/, '')) });
  }
  const physicalRows = physical - 1 - (text.endsWith('\n') || text.endsWith('\r') ? 1 : 0);

  let header: string[] | null = null;
  let rows = records;
  if (records.length > 0) {
    const first = records[0].cells.map((c) => c.trim());
    let isHeader = false;
    if (opts.hasHeader === true) isHeader = true;
    else if (opts.hasHeader === 'auto') {
      const sig = (opts.headerSignature ?? []).map((s) => s.trim());
      isHeader = sig.length > 0 && first.some((c) => sig.includes(c));
    }
    if (isHeader) {
      header = first;
      rows = records.slice(1);
    }
  }
  return { header, rows, physicalRows: Math.max(physicalRows, 0) };
}

export function toCsv(rows: string[][], newline: 'CRLF' | 'LF' = 'CRLF'): string {
  const nl = newline === 'CRLF' ? '\r\n' : '\n';
  return Papa.unparse(rows, { newline: nl, quotes: false }) + nl;
}
