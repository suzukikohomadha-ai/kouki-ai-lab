import { TODO_PREFIX, type SourceConfig, type TargetColumn, type TargetConfig } from './config.js';

export interface AdoptReplaced {
  key: string;
  before: string;
  after: string;
  how: 'exact' | 'contains';
}

export interface AdoptTargetResult {
  target: TargetConfig;
  replaced: AdoptReplaced[];
  unresolved: string[];
  removed: string[];
}

export interface AdoptSourceResult {
  source: SourceConfig;
  replaced: AdoptReplaced[];
  unresolved: { key: string; value: string }[];
  unusedHeaders: string[];
}

export const UNRESOLVED_TODO = '対応する中間モデル項目を指定（from を埋めるか、不要なら列ごと削除。削除するとその列は出力されない）';

function norm(s: string): string {
  return s.normalize('NFKC').replace(/\s+/g, '').trim();
}

function guessOf(value: string): { guess: string; isTodo: boolean } {
  if (value.startsWith(TODO_PREFIX + ':')) return { guess: value.slice(TODO_PREFIX.length + 1), isTodo: true };
  if (value === TODO_PREFIX) return { guess: '', isTodo: true };
  return { guess: value, isTodo: false };
}

function findMatch(guess: string, headers: string[], used: Set<number>): { index: number; how: AdoptReplaced['how'] } | null {
  const g = norm(guess);
  if (g === '') return null;
  const exact = headers.findIndex((h, i) => !used.has(i) && norm(h) === g);
  if (exact >= 0) return { index: exact, how: 'exact' };
  if (g.length < 2) return null;
  const contains = headers.map((h, i) => ({ h: norm(h), i })).filter(({ h, i }) => !used.has(i) && h !== '' && (h.includes(g) || g.includes(h)));
  if (contains.length === 1) return { index: contains[0].i, how: 'contains' };
  return null;
}

export function adoptTargetHeaders(target: TargetConfig, headers: string[]): AdoptTargetResult {
  const cleaned = headers.map((h) => h.replace(/^﻿/, '').trim());
  const used = new Set<number>();
  const assignment = new Map<number, TargetColumn>();
  const replaced: AdoptReplaced[] = [];
  const removed: string[] = [];

  for (const col of target.columns) {
    const { guess, isTodo } = guessOf(col.name);
    const m = findMatch(guess, cleaned, used);
    if (!m) {
      removed.push(col.name);
      continue;
    }
    used.add(m.index);
    const { _todo: _dropped, ...rest } = col as TargetColumn & { _todo?: string };
    assignment.set(m.index, { ...rest, name: cleaned[m.index] });
    if (isTodo || cleaned[m.index] !== col.name) replaced.push({ key: `columns[${m.index}]`, before: col.name, after: cleaned[m.index], how: m.how });
  }

  const unresolved: string[] = [];
  const columns: TargetColumn[] = cleaned.map((h, i) => {
    const a = assignment.get(i);
    if (a) return a;
    unresolved.push(h);
    return { name: h, from: null, _todo: UNRESOLVED_TODO } as TargetColumn;
  });
  return { target: { ...target, columns }, replaced, unresolved, removed };
}

export function adoptSourceHeaders(source: SourceConfig, headers: string[]): AdoptSourceResult {
  const cleaned = headers.map((h) => h.replace(/^﻿/, '').trim());
  const used = new Set<number>();
  const replaced: AdoptReplaced[] = [];
  const unresolved: { key: string; value: string }[] = [];
  const columns: SourceConfig['columns'] = {};

  const entries = Object.entries(source.columns);
  const ordered = [...entries.filter(([, s]) => s.header !== undefined && !guessOf(s.header).isTodo), ...entries.filter(([, s]) => s.header === undefined || guessOf(s.header).isTodo)];
  const resolvedHeader = new Map<string, string>();
  for (const [key, spec] of ordered) {
    if (spec.header === undefined) continue;
    const { guess } = guessOf(spec.header);
    const m = findMatch(guess, cleaned, used);
    if (m) {
      used.add(m.index);
      resolvedHeader.set(key, cleaned[m.index]);
      if (cleaned[m.index] !== spec.header) replaced.push({ key: `columns.${key}`, before: spec.header, after: cleaned[m.index], how: m.how });
    } else {
      unresolved.push({ key: `columns.${key}`, value: spec.header });
    }
  }
  for (const [key, spec] of entries) {
    const h = resolvedHeader.get(key);
    columns[key] = h === undefined ? { ...spec } : { ...spec, header: h };
  }

  let headerSignature = source.headerSignature;
  if (headerSignature) {
    headerSignature = headerSignature.map((sig) => {
      const { guess } = guessOf(sig);
      const m = findMatch(guess, cleaned, new Set());
      if (m) {
        if (cleaned[m.index] !== sig) replaced.push({ key: 'headerSignature', before: sig, after: cleaned[m.index], how: m.how });
        return cleaned[m.index];
      }
      unresolved.push({ key: 'headerSignature', value: sig });
      return sig;
    });
  }
  const unusedHeaders = cleaned.filter((_, i) => !used.has(i));
  return { source: { ...source, columns, headerSignature }, replaced, unresolved, unusedHeaders };
}
