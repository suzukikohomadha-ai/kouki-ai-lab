import type { SourceSystem } from './model.js';

export interface UnmappedItem {
  kind: 'account' | 'taxcode' | 'subaccount';
  sourceValue: string;
  count: number;
  debitTotal: number;
  creditTotal: number;
  firstRow?: number;
  parentAccount?: string;
}

export interface Suggestion {
  sourceValue: string;
  candidates: { target: string; confidence: number; reason: string }[];
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
