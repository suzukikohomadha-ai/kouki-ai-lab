import type { SourceSystem } from './model.js';
import { normalizeName } from './normalize.js';

export interface UnmappedItem {
  kind: 'account' | 'taxcode' | 'subaccount';
  sourceValue: string;
  count: number;
  debitTotal: number;
  creditTotal: number;
  firstRow?: number;
  parentAccount?: string;
}

export interface SuggestionCandidate {
  target: string;
  confidence: number;
  reason: string;
}

export interface Suggestion {
  sourceValue: string;
  candidates: SuggestionCandidate[];
  provider: 'noop' | 'rule' | 'llm_local' | 'llm_external';
}

export interface SuggestContext {
  targetAccounts: string[];
  targetTaxCodes: string[];
  sourceSystem: SourceSystem;
}

export interface MappingSuggester {
  readonly provider: Suggestion['provider'];
  suggest(items: UnmappedItem[], ctx: SuggestContext): Promise<Suggestion[]>;
}

export class NoopSuggester implements MappingSuggester {
  readonly provider = 'noop' as const;
  async suggest(): Promise<Suggestion[]> {
    return [];
  }
}

export interface AccountAliasEntry {
  sourceNames: string[];
  freeeAccount: string;
  note?: string;
}

export interface AccountAliasesMap {
  version: number;
  entries: AccountAliasEntry[];
  _comment?: string;
}

const MAX_CANDIDATES = 3;

export function stripSymbols(s: string): string {
  return normalizeName(s)
    .replace(/[（(][^）)]*[）)]/g, '')
    .replace(/[\s　・･\-－_＿/／.。,、:：;；'"「」『』【】\[\]<>＜＞#＃*＊]/g, '')
    .toLowerCase();
}

function rateDigits(s: string): string | null {
  const m = normalizeName(s).match(/(\d+(?:\.\d+)?)\s*%/);
  return m ? m[1] : null;
}

export class RuleSuggester implements MappingSuggester {
  readonly provider = 'rule' as const;
  private readonly aliasIndex = new Map<string, AccountAliasEntry[]>();

  constructor(aliases?: AccountAliasesMap | null) {
    for (const e of aliases?.entries ?? []) {
      for (const n of e.sourceNames) {
        const k = normalizeName(n);
        const list = this.aliasIndex.get(k) ?? [];
        list.push(e);
        this.aliasIndex.set(k, list);
      }
    }
  }

  async suggest(items: UnmappedItem[], ctx: SuggestContext): Promise<Suggestion[]> {
    const out: Suggestion[] = [];
    for (const item of items) {
      const candidates = item.kind === 'taxcode' ? this.suggestTaxCode(item.sourceValue, ctx.targetTaxCodes) : this.suggestAccount(item.sourceValue, ctx.targetAccounts);
      if (candidates.length > 0) out.push({ sourceValue: item.sourceValue, candidates, provider: 'rule' });
    }
    return out;
  }

  private suggestAccount(value: string, targets: string[]): SuggestionCandidate[] {
    const found: SuggestionCandidate[] = [];
    const add = (target: string, confidence: number, reason: string) => {
      if (found.length >= MAX_CANDIDATES || found.some((c) => c.target === target)) return;
      found.push({ target, confidence, reason });
    };
    const v = normalizeName(value);
    const uniqueTargets = [...new Set(targets)];
    for (const t of uniqueTargets) if (normalizeName(t) === v) add(t, 1.0, '正規化後に完全一致');
    const vs = stripSymbols(value);
    if (vs !== '') for (const t of uniqueTargets) if (stripSymbols(t) === vs) add(t, 0.9, '記号・空白・括弧内を除去して一致');
    for (const e of this.aliasIndex.get(v) ?? []) add(e.freeeAccount, 0.8, `別名辞書に一致${e.note ? `（${e.note}）` : ''}`);
    if (vs.length >= 2) {
      for (const t of uniqueTargets) {
        const ts = stripSymbols(t);
        if (ts === '' || ts === vs) continue;
        if (ts.startsWith(vs) || vs.startsWith(ts)) add(t, 0.5, '前方一致');
        else if (ts.endsWith(vs) || vs.endsWith(ts)) add(t, 0.5, '後方一致');
      }
    }
    return found;
  }

  private suggestTaxCode(value: string, targets: string[]): SuggestionCandidate[] {
    const found: SuggestionCandidate[] = [];
    const add = (target: string, confidence: number, reason: string) => {
      if (found.length >= MAX_CANDIDATES || found.some((c) => c.target === target)) return;
      found.push({ target, confidence, reason });
    };
    const v = normalizeName(value);
    const uniqueTargets = [...new Set(targets)];
    for (const t of uniqueTargets) if (normalizeName(t) === v) add(t, 1.0, '正規化後に完全一致');
    const vs = stripSymbols(value);
    if (vs !== '') for (const t of uniqueTargets) if (stripSymbols(t) === vs) add(t, 0.9, '記号・空白・括弧内を除去して一致');
    const rate = rateDigits(value);
    if (rate !== null) {
      const kind = /売上/.test(v) ? '売上' : /仕入/.test(v) ? '仕入' : null;
      for (const t of uniqueTargets) {
        if (rateDigits(t) !== rate) continue;
        if (kind && t.includes(kind)) add(t, 0.6, `税率 ${rate}% と「${kind}」が一致`);
      }
      for (const t of uniqueTargets) if (rateDigits(t) === rate) add(t, 0.4, `税率 ${rate}% が一致`);
    }
    return found;
  }
}
