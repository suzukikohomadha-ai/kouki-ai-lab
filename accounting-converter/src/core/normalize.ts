export function normalizeName(s: string): string {
  return s.normalize('NFKC').trim().replace(/\s+/g, ' ');
}

export function partnerKey(s: string): string {
  return s.normalize('NFKC').replace(/\s+/g, '').toLowerCase();
}

const CORPORATE_PATTERNS = [
  /株式会社/g, /\(株\)/g, /㈱/g, /有限会社/g, /\(有\)/g, /㈲/g, /合同会社/g, /\(同\)/g, /合資会社/g, /合名会社/g,
  /一般社団法人/g, /一般財団法人/g, /医療法人/g, /社会福祉法人/g, /学校法人/g,
];

export function stripCorporate(s: string): string {
  let t = s.normalize('NFKC').replace(/\s+/g, '').toLowerCase();
  for (const p of CORPORATE_PATTERNS) t = t.replace(p, '');
  return t;
}

export function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  let prev = new Array<number>(n + 1);
  let cur = new Array<number>(n + 1);
  for (let j = 0; j <= n; j++) prev[j] = j;
  for (let i = 1; i <= m; i++) {
    cur[0] = i;
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost);
    }
    [prev, cur] = [cur, prev];
  }
  return prev[n];
}

export type AmountParse = { ok: true; value: number } | { ok: false; reason: 'empty' | 'invalid' | 'decimal' };

export function parseAmount(raw: string): AmountParse {
  let s = raw.normalize('NFKC').trim();
  if (s === '') return { ok: false, reason: 'empty' };
  s = s.replace(/[,\s円¥￥]/g, '');
  let negative = false;
  if (/^[△▲]/.test(s)) {
    negative = true;
    s = s.slice(1);
  }
  const paren = s.match(/^\((.+)\)$/);
  if (paren) {
    negative = true;
    s = paren[1];
  }
  if (s.startsWith('-')) {
    negative = !negative;
    s = s.slice(1);
  }
  if (/^\d+$/.test(s)) {
    const v = Number(s);
    return { ok: true, value: negative ? -v : v };
  }
  if (/^\d+\.\d+$/.test(s)) {
    const [intPart, frac] = s.split('.');
    if (/^0+$/.test(frac)) {
      const v = Number(intPart);
      return { ok: true, value: negative ? -v : v };
    }
    return { ok: false, reason: 'decimal' };
  }
  return { ok: false, reason: 'invalid' };
}

const ERA_ALIASES: Record<string, string> = { '令': 'R', '平': 'H', '昭': 'S', '大': 'T', '明': 'M' };
const DEFAULT_ERA_TABLE: Record<string, number> = { R: 2018, H: 1988, S: 1925, T: 1911, M: 1867 };

interface CompiledFormat {
  regex: RegExp;
  groups: string[];
}

const formatCache = new Map<string, CompiledFormat>();

function compileFormat(fmt: string): CompiledFormat {
  const cached = formatCache.get(fmt);
  if (cached) return cached;
  const tokens = ['YYYY', 'YY', 'MM', 'M', 'DD', 'D', 'G'];
  const groups: string[] = [];
  let re = '^';
  let i = 0;
  while (i < fmt.length) {
    const tok = tokens.find((t) => fmt.startsWith(t, i));
    if (tok) {
      groups.push(tok);
      re += { YYYY: '(\\d{4})', YY: '(\\d{1,2})', MM: '(\\d{2})', M: '(\\d{1,2})', DD: '(\\d{2})', D: '(\\d{1,2})', G: '([A-Za-z令平昭大明])' }[tok];
      i += tok.length;
    } else {
      re += fmt[i].replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      i++;
    }
  }
  re += '$';
  const compiled = { regex: new RegExp(re), groups };
  formatCache.set(fmt, compiled);
  return compiled;
}

export function parseDate(raw: string, formats: string[], eraTable?: Record<string, number>): string | null {
  const s = raw.normalize('NFKC').trim();
  if (s === '') return null;
  const eras = { ...DEFAULT_ERA_TABLE, ...(eraTable ?? {}) };
  for (const fmt of formats) {
    const { regex, groups } = compileFormat(fmt);
    const m = s.match(regex);
    if (!m) continue;
    let year: number | null = null;
    let month = 0;
    let day = 0;
    let era: string | null = null;
    let yy: number | null = null;
    groups.forEach((g, idx) => {
      const v = m[idx + 1];
      if (g === 'YYYY') year = Number(v);
      else if (g === 'YY') yy = Number(v);
      else if (g === 'MM' || g === 'M') month = Number(v);
      else if (g === 'DD' || g === 'D') day = Number(v);
      else if (g === 'G') era = ERA_ALIASES[v] ?? v.toUpperCase();
    });
    if (year === null && yy !== null) {
      if (era === null) continue;
      const base = eras[era];
      if (base === undefined) continue;
      year = base + yy;
    }
    if (year === null || month < 1 || month > 12 || day < 1 || day > 31) continue;
    const d = new Date(Date.UTC(year, month - 1, day));
    if (d.getUTCFullYear() !== year || d.getUTCMonth() !== month - 1 || d.getUTCDate() !== day) continue;
    return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }
  return null;
}

export function formatDate(iso: string, fmt: string): string {
  const [y, m, d] = iso.split('-');
  return fmt.replace('YYYY', y).replace('MM', m).replace('DD', d).replace(/(?<![M])M(?![M])/, String(Number(m))).replace(/(?<![D])D(?![D])/, String(Number(d)));
}

export function isBlank(v: string | null | undefined): boolean {
  return v === null || v === undefined || v.trim() === '';
}

export function nullIfBlank(v: string | null | undefined): string | null {
  return isBlank(v) ? null : (v as string).trim();
}
