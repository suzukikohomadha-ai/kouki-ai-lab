import type { AmountMode, Diagnostic, SourceSystem } from './model.js';
import { diag } from './model.js';

export const TODO_PREFIX = 'TODO_VERIFY';

export interface ColumnSpec {
  header?: string;
  index?: number | string;
  optional?: boolean;
}

export type GroupingStrategy = 'by_voucher_no' | 'by_flag' | 'each_row';

export interface SourceConfig {
  system: SourceSystem;
  encoding: 'auto' | 'utf8' | 'shift_jis';
  delimiter: ',' | '\t';
  hasHeader: boolean | 'auto';
  headerSignature?: string[];
  dateFormats: string[];
  eraTable?: Record<string, number>;
  amountMode: AmountMode | string;
  grouping: {
    strategy: GroupingStrategy | string;
    flagColumn?: ColumnSpec;
    flagValues?: {
      single: string[];
      compoundStart: string[];
      compoundMiddle: string[];
      compoundEnd: string[];
    };
  };
  columns: Record<string, ColumnSpec>;
  _comment?: string;
}

export interface TargetColumn {
  name: string;
  from: string | null;
  format?: string;
  required?: boolean;
  join?: string;
}

export interface TargetConfig {
  system: string;
  templateInfo?: Record<string, string>;
  encoding: 'utf8_bom' | 'utf8' | 'shift_jis';
  newline: 'CRLF' | 'LF';
  rowModel: 'debit_credit_pair' | 'one_row_per_line';
  compoundEntries: 'blank_side' | 'unsupported' | string;
  columns: TargetColumn[];
  _comment?: string;
}

export interface AccountMapEntry {
  freeeAccount: string;
  freeeSubAccount?: string | null;
  confirmed: boolean;
  source?: 'manual' | 'llm_suggested' | 'rule_suggested';
  note?: string;
}

export interface AccountsMap {
  version: number;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  entries: Record<string, AccountMapEntry>;
}

export interface TaxcodeMapEntry {
  sourceTaxCode: string;
  freeeTaxCode: string;
  rate?: number;
  effectiveFrom?: string;
  effectiveTo?: string;
  confirmed: boolean;
}

export interface TaxcodesMap {
  version: number;
  reviewedBy?: string | null;
  defaultForBlank?: { freeeTaxCode: string; appliesToAccounts: string[] };
  entries: TaxcodeMapEntry[];
}

export type SubaccountAction = 'partner' | 'freee_sub_account' | 'memo_tag' | 'drop' | 'item' | 'department';

export interface SubaccountRule {
  id: string;
  when: { parentAccountIn?: string[]; subAccountMatches?: string; sourceSystemIs?: SourceSystem };
  then: { assign: SubaccountAction };
  note?: string;
}

export interface SubaccountRules {
  version: number;
  defaultAction: SubaccountAction;
  rules: SubaccountRule[];
}

export interface PartnersMap {
  version: number;
  aliases: Record<string, string>;
}

export interface Maps {
  accounts: AccountsMap;
  taxcodes: TaxcodesMap;
  subaccountRules: SubaccountRules;
  partners: PartnersMap;
}

export interface Detectors {
  openingBalanceKeywords: string[];
  openingBalanceCounterAccounts?: string[];
  depreciationAccounts: string[];
  fixedAssetAccounts: string[];
}

export interface ProfileOptions {
  departments: 'drop' | 'passthrough';
  fixedAssets: 'warn' | 'exclude' | 'include';
  openingBalances: 'exclude_and_report' | 'include';
  invoiceTransitionDates: string[];
  partnerFuzzyThreshold: number;
  detectors: Detectors;
}

export interface Profile {
  name: string;
  source: SourceConfig;
  target: TargetConfig;
  maps: Maps;
  fiscalYear?: { start: string; end: string };
  options: ProfileOptions;
}

export interface ConfigIssue {
  severity: 'error' | 'warning';
  path: string;
  message: string;
}

export interface VerifyResult {
  ok: boolean;
  issues: ConfigIssue[];
  todoCount: number;
  unconfirmedAccounts: number;
}

const REQUIRED_SOURCE_COLUMNS = ['date', 'debit.account', 'debit.amount', 'credit.account', 'credit.amount'];

function walkTodo(value: unknown, path: string, out: ConfigIssue[]): void {
  if (typeof value === 'string') {
    if (value.startsWith(TODO_PREFIX)) out.push({ severity: 'error', path, message: `未転記の値: ${value}` });
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((v, i) => walkTodo(v, `${path}[${i}]`, out));
    return;
  }
  if (value && typeof value === 'object') {
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (k === '_comment') continue;
      if (k.startsWith(TODO_PREFIX)) out.push({ severity: 'error', path: `${path}.${k}`, message: `未転記のキー: ${k}` });
      walkTodo(v, `${path}.${k}`, out);
    }
  }
}

export function verifyConfig(profile: Profile): VerifyResult {
  const issues: ConfigIssue[] = [];
  walkTodo(profile.source, 'source', issues);
  walkTodo(profile.target, 'target', issues);
  walkTodo(profile.maps, 'maps', issues);
  const todoCount = issues.length;

  for (const [i, col] of profile.target.columns.entries()) {
    if (col.required && (col.from === null || col.from === undefined || col.from === '')) {
      issues.push({ severity: 'error', path: `target.columns[${i}]`, message: `required:true の列「${col.name}」に from がない` });
    }
  }
  for (const key of REQUIRED_SOURCE_COLUMNS) {
    const spec = profile.source.columns[key];
    if (!spec || (spec.header === undefined && spec.index === undefined)) {
      issues.push({ severity: 'error', path: `source.columns.${key}`, message: `必須列 ${key} が定義されていない` });
    }
  }
  const strategies = ['by_voucher_no', 'by_flag', 'each_row'];
  if (!strategies.includes(profile.source.grouping.strategy)) {
    issues.push({ severity: 'error', path: 'source.grouping.strategy', message: `未知のグループ化戦略: ${profile.source.grouping.strategy}` });
  }
  if (!['tax_included', 'tax_excluded', 'unknown'].includes(profile.source.amountMode)) {
    issues.push({ severity: 'error', path: 'source.amountMode', message: `amountMode が不正: ${profile.source.amountMode}` });
  }

  const byCode = new Map<string, TaxcodeMapEntry[]>();
  for (const e of profile.maps.taxcodes.entries) {
    const list = byCode.get(e.sourceTaxCode) ?? [];
    list.push(e);
    byCode.set(e.sourceTaxCode, list);
  }
  for (const [code, list] of byCode) {
    for (let a = 0; a < list.length; a++) {
      for (let b = a + 1; b < list.length; b++) {
        if (rangesOverlap(list[a], list[b])) {
          issues.push({ severity: 'error', path: 'maps.taxcodes.entries', message: `税区分「${code}」の日付範囲が重複している` });
        }
      }
    }
  }

  const unconfirmedAccounts = Object.values(profile.maps.accounts.entries).filter((e) => !e.confirmed).length;
  if (unconfirmedAccounts > 0) {
    issues.push({ severity: 'warning', path: 'maps.accounts.entries', message: `confirmed:false の勘定科目エントリが ${unconfirmedAccounts} 件` });
  }

  return { ok: !issues.some((i) => i.severity === 'error'), issues, todoCount, unconfirmedAccounts };
}

function rangesOverlap(a: TaxcodeMapEntry, b: TaxcodeMapEntry): boolean {
  const aFrom = a.effectiveFrom ?? '0000-00-00';
  const aTo = a.effectiveTo ?? '9999-99-99';
  const bFrom = b.effectiveFrom ?? '0000-00-00';
  const bTo = b.effectiveTo ?? '9999-99-99';
  return aFrom <= bTo && bFrom <= aTo;
}

export function stripTodoVerify<T>(value: T): { value: T; count: number } {
  let count = 0;
  const walk = (v: unknown): unknown => {
    if (typeof v === 'string') {
      if (v.startsWith(TODO_PREFIX + ':')) {
        count++;
        const rest = v.slice(TODO_PREFIX.length + 1);
        return /^-?\d+$/.test(rest) ? Number(rest) : rest;
      }
      if (v === TODO_PREFIX) {
        count++;
        return '';
      }
      return v;
    }
    if (Array.isArray(v)) return v.map(walk);
    if (v && typeof v === 'object') {
      const o: Record<string, unknown> = {};
      for (const [k, x] of Object.entries(v as Record<string, unknown>)) o[k] = walk(x);
      return o;
    }
    return v;
  };
  return { value: walk(value) as T, count };
}

export function configDiagnostics(result: VerifyResult): Diagnostic[] {
  return result.issues
    .filter((i) => i.severity === 'error')
    .map((i) => diag('E000', 'error', `設定検証エラー: ${i.path}: ${i.message}`, { detail: { path: i.path } }));
}
