export type SourceSystem = 'mf_journal' | 'yayoi_generic';

export type EntryFlag =
  | 'OPENING_BALANCE'
  | 'CLOSING_ADJUSTMENT'
  | 'FIXED_ASSET'
  | 'DEPRECIATION'
  | 'DEPRECIATION_MIXED'
  | 'COMPOUND';

export type AmountMode = 'tax_included' | 'tax_excluded' | 'unknown';

export interface Dataset {
  source: SourceSystem;
  sourceFile: {
    name: string;
    encoding: string;
    hadBom: boolean;
    hasHeader: boolean;
    physicalRows: number;
  };
  entries: JournalEntry[];
}

export interface JournalEntry {
  entryId: string;
  voucherNo: string | null;
  date: string;
  description: string;
  lines: JournalLine[];
  amountMode: AmountMode;
  flags: EntryFlag[];
  sourceRows: number[];
}

export interface JournalLine {
  side: 'debit' | 'credit';
  accountRaw: string;
  account: string;
  subAccountRaw: string | null;
  departmentRaw: string | null;
  partnerRaw: string | null;
  taxCodeRaw: string | null;
  amount: number;
  taxAmount: number | null;
  invoiceRaw: string | null;
  memo: string | null;
  tagsRaw: string | null;
  sourceRow: number;
  mapped?: MappedLine;
}

export interface MappedLine {
  freeeAccount: string;
  freeeSubAccount: string | null;
  freeeTaxCode: string;
  partner: string | null;
  item: string | null;
  department: string | null;
  memoTags: string[];
  provenance: {
    account: 'table';
    tax: 'table' | 'table_dated' | 'default_blank';
    subAccount: `rule:${string}` | 'none';
    partner: 'column' | 'subaccount' | 'alias' | 'none';
  };
}

export type Severity = 'error' | 'warning' | 'info';

export interface Diagnostic {
  code: string;
  severity: Severity;
  message: string;
  entryId?: string;
  sourceRow?: number;
  detail?: Record<string, string | number | boolean | null>;
}

export function diag(
  code: string,
  severity: Severity,
  message: string,
  extra: Partial<Pick<Diagnostic, 'entryId' | 'sourceRow' | 'detail'>> = {},
): Diagnostic {
  return { code, severity, message, ...extra };
}
