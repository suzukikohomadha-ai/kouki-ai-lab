import { toCsv } from './csv.js';
import type { Dataset, Diagnostic, JournalEntry } from './model.js';
import type { Suggestion, UnmappedItem } from './suggest.js';

export interface AccountRow {
  sourceAccount: string;
  freeeAccount: string;
  srcDebit: number;
  srcCredit: number;
  outDebit: number;
  outCredit: number;
  diff: number;
  count: number;
  note: string;
}

export interface FreeeSubtotalRow {
  freeeAccount: string;
  sources: string[];
  outDebit: number;
  outCredit: number;
}

export interface TaxRow {
  sourceTaxCode: string;
  freeeTaxCode: string;
  period: string;
  amount: number;
  taxAmount: number;
  count: number;
}

export interface ExcludedEntry {
  entryId: string;
  date: string;
  voucherNo: string | null;
  reason: string;
  accounts: string;
  debit: number;
}

export interface ExcludedAccountTotal {
  account: string;
  debit: number;
  credit: number;
}

export interface UnmappedRow extends UnmappedItem {
  suggestions: string;
}

export interface PartnerRow {
  name: string;
  count: number;
}

export interface Report {
  overview: {
    profileName: string;
    runAt: string;
    sourceFile: string;
    encoding: string;
    hadBom: boolean;
    hasHeader: boolean;
    physicalRows: number;
    entries: number;
    lines: number;
    outputEntries: number;
    errors: number;
    warnings: number;
    outputWritten: boolean;
    configHashes: Record<string, string>;
  };
  accounts: AccountRow[];
  freeeSubtotals: FreeeSubtotalRow[];
  taxcodes: TaxRow[];
  excluded: { entries: ExcludedEntry[]; accountTotals: ExcludedAccountTotal[] };
  unmapped: UnmappedRow[];
  partners: { names: PartnerRow[]; candidates: Diagnostic[] };
  warningsByCode: { code: string; count: number }[];
  diagnostics: Diagnostic[];
  subaccountRules: { rule: string; count: number }[];
  disclaimer: string;
}

export const DISCLAIMER =
  '本レポートは自動変換の下書きです。freeeへのインポートおよび勘定科目・税区分対応表の妥当性の最終確認は、会計事務所側の有資格者が行ってください。本ツールは税務・会計上の判断を行いません。';

export interface ReportContext {
  profileName: string;
  runAt: string;
  sourceFile: string;
  excluded: Map<string, string>;
  outputEntryIds: Set<string>;
  outputWritten: boolean;
  unmapped: UnmappedItem[];
  suggestions: Suggestion[];
  configHashes?: Record<string, string>;
}

export function buildReport(ds: Dataset, diags: Diagnostic[], ctx: ReportContext): Report {
  const errors = diags.filter((d) => d.severity === 'error').length;
  const warnings = diags.filter((d) => d.severity === 'warning').length;

  const accMap = new Map<string, AccountRow>();
  for (const e of ds.entries) {
    const included = ctx.outputEntryIds.has(e.entryId);
    for (const l of e.lines) {
      const key = l.accountRaw;
      const row = accMap.get(key) ?? { sourceAccount: key, freeeAccount: l.mapped?.freeeAccount ?? '(未マッピング)', srcDebit: 0, srcCredit: 0, outDebit: 0, outCredit: 0, diff: 0, count: 0, note: '' };
      row.count++;
      if (l.side === 'debit') {
        row.srcDebit += l.amount;
        if (included) row.outDebit += l.amount;
      } else {
        row.srcCredit += l.amount;
        if (included) row.outCredit += l.amount;
      }
      accMap.set(key, row);
    }
  }
  const excludedAccounts = new Set<string>();
  for (const e of ds.entries) if (ctx.excluded.has(e.entryId)) for (const l of e.lines) excludedAccounts.add(l.accountRaw);
  for (const r of accMap.values()) {
    r.diff = r.srcDebit - r.srcCredit - (r.outDebit - r.outCredit);
    const notes: string[] = [];
    if (r.freeeAccount === '(未マッピング)') notes.push('未マッピング');
    if (r.diff !== 0 && excludedAccounts.has(r.sourceAccount)) notes.push('除外伝票（期首残高・固定資産除外・エラー）を含むため差額あり');
    else if (r.diff !== 0) notes.push('差額あり（出力対象外の伝票を含む）');
    r.note = notes.join('；');
  }
  const accounts = [...accMap.values()].sort((a, b) => a.sourceAccount.localeCompare(b.sourceAccount, 'ja'));
  const byFreee = new Map<string, FreeeSubtotalRow>();
  for (const r of accounts) {
    const s = byFreee.get(r.freeeAccount) ?? { freeeAccount: r.freeeAccount, sources: [], outDebit: 0, outCredit: 0 };
    s.sources.push(r.sourceAccount);
    s.outDebit += r.outDebit;
    s.outCredit += r.outCredit;
    byFreee.set(r.freeeAccount, s);
  }
  const freeeSubtotals = [...byFreee.values()].filter((s) => s.sources.length > 1);

  const taxMap = new Map<string, TaxRow>();
  for (const e of ds.entries) for (const l of e.lines) {
    const src = l.taxCodeRaw ?? '(空欄)';
    const dst = l.mapped?.freeeTaxCode || '(未マッピング)';
    const period = l.mapped?.provenance.tax === 'table_dated' ? datedPeriodLabel(e) : '';
    const key = JSON.stringify([src, dst, period]);
    const row = taxMap.get(key) ?? { sourceTaxCode: src, freeeTaxCode: dst, period, amount: 0, taxAmount: 0, count: 0 };
    row.amount += l.amount;
    row.taxAmount += l.taxAmount ?? 0;
    row.count++;
    taxMap.set(key, row);
  }

  const excludedEntries: ExcludedEntry[] = [];
  const exTotals = new Map<string, ExcludedAccountTotal>();
  for (const e of ds.entries) {
    const reason = ctx.excluded.get(e.entryId);
    if (!reason) continue;
    excludedEntries.push({ entryId: e.entryId, date: e.date, voucherNo: e.voucherNo, reason, accounts: e.lines.map((l) => l.accountRaw).join('/'), debit: e.lines.filter((l) => l.side === 'debit').reduce((a, l) => a + l.amount, 0) });
    for (const l of e.lines) {
      const t = exTotals.get(l.accountRaw) ?? { account: l.accountRaw, debit: 0, credit: 0 };
      if (l.side === 'debit') t.debit += l.amount;
      else t.credit += l.amount;
      exTotals.set(l.accountRaw, t);
    }
  }

  const sugIndex = new Map(ctx.suggestions.map((s) => [s.sourceValue, s]));
  const unmapped: UnmappedRow[] = ctx.unmapped.map((u) => ({ ...u, suggestions: (sugIndex.get(u.sourceValue)?.candidates ?? []).map((c) => `${c.target}（${c.confidence.toFixed(1)}・${c.reason}）`).join('; ') }));

  const partnerCounts = new Map<string, number>();
  for (const e of ds.entries) if (ctx.outputEntryIds.has(e.entryId)) for (const l of e.lines) {
    const p = l.mapped?.partner;
    if (p) partnerCounts.set(p, (partnerCounts.get(p) ?? 0) + 1);
  }

  const codeCounts = new Map<string, number>();
  for (const d of diags) if (d.severity === 'warning') codeCounts.set(d.code, (codeCounts.get(d.code) ?? 0) + 1);

  const ruleCounts = new Map<string, number>();
  for (const e of ds.entries) for (const l of e.lines) {
    const p = l.mapped?.provenance.subAccount;
    if (p && p !== 'none') ruleCounts.set(p, (ruleCounts.get(p) ?? 0) + 1);
  }

  return {
    overview: {
      profileName: ctx.profileName,
      runAt: ctx.runAt,
      sourceFile: ctx.sourceFile,
      encoding: ds.sourceFile.encoding,
      hadBom: ds.sourceFile.hadBom,
      hasHeader: ds.sourceFile.hasHeader,
      physicalRows: ds.sourceFile.physicalRows,
      entries: ds.entries.length,
      lines: ds.entries.reduce((a, e) => a + e.lines.length, 0),
      outputEntries: ctx.outputEntryIds.size,
      errors,
      warnings,
      outputWritten: ctx.outputWritten,
      configHashes: ctx.configHashes ?? {},
    },
    accounts,
    freeeSubtotals,
    taxcodes: [...taxMap.values()],
    excluded: { entries: excludedEntries, accountTotals: [...exTotals.values()] },
    unmapped,
    partners: { names: [...partnerCounts].map(([name, count]) => ({ name, count })), candidates: diags.filter((d) => d.code === 'W001' || d.code === 'W002') },
    warningsByCode: [...codeCounts].sort().map(([code, count]) => ({ code, count })),
    diagnostics: diags,
    subaccountRules: [...ruleCounts].map(([rule, count]) => ({ rule, count })),
    disclaimer: DISCLAIMER,
  };
}

function datedPeriodLabel(e: JournalEntry): string {
  return `伝票日付 ${e.date} で選択`;
}

const yen = (n: number) => n.toLocaleString('ja-JP');

export function renderReportMarkdown(r: Report): string {
  const o = r.overview;
  const L: string[] = [];
  L.push(`# 会計データ変換レポート: ${o.profileName}`, '');
  L.push('## 1. 概要', '');
  L.push('| 項目 | 値 |', '|---|---|');
  L.push(`| 実行日時 | ${o.runAt} |`);
  L.push(`| 入力ファイル | ${o.sourceFile} |`);
  L.push(`| 文字コード | ${o.encoding}${o.hadBom ? '（BOM付き）' : ''} |`);
  L.push(`| ヘッダー行 | ${o.hasHeader ? 'あり' : 'なし（列indexで読取）'} |`);
  L.push(`| 物理行数 | ${o.physicalRows} |`);
  L.push(`| 伝票数 / 明細数 | ${o.entries} / ${o.lines} |`);
  L.push(`| 出力伝票数 | ${o.outputEntries} |`);
  L.push(`| error / warning | ${o.errors} / ${o.warnings} |`);
  L.push(`| freee用CSV出力 | ${o.outputWritten ? 'あり' : 'なし（errorあり）'} |`);
  for (const [k, v] of Object.entries(o.configHashes)) L.push(`| 設定ハッシュ ${k} | ${v} |`);
  L.push('');

  L.push('## 2. 勘定科目別 借方/貸方合計（移行元 vs 変換後）', '');
  L.push('| 元科目名 | freee科目名 | 元・借方 | 元・貸方 | 変換後・借方 | 変換後・貸方 | 差額 | 件数 | 備考 |', '|---|---|---:|---:|---:|---:|---:|---:|---|');
  for (const a of r.accounts) L.push(`| ${a.sourceAccount} | ${a.freeeAccount} | ${yen(a.srcDebit)} | ${yen(a.srcCredit)} | ${yen(a.outDebit)} | ${yen(a.outCredit)} | ${yen(a.diff)} | ${a.count} | ${a.note} |`);
  if (r.freeeSubtotals.length > 0) {
    L.push('', '### freee科目別 小計（複数の元科目が統合されるもの）', '', '| freee科目名 | 元科目 | 変換後・借方 | 変換後・貸方 |', '|---|---|---:|---:|');
    for (const s of r.freeeSubtotals) L.push(`| ${s.freeeAccount} | ${s.sources.join('、')} | ${yen(s.outDebit)} | ${yen(s.outCredit)} |`);
  }
  L.push('');

  L.push('## 3. 税区分別 合計', '', '| 元税区分 | freee税区分 | 適用日付範囲 | 金額合計 | 税額合計 | 件数 |', '|---|---|---|---:|---:|---:|');
  for (const t of r.taxcodes) L.push(`| ${t.sourceTaxCode} | ${t.freeeTaxCode} | ${t.period} | ${yen(t.amount)} | ${yen(t.taxAmount)} | ${t.count} |`);
  L.push('');

  L.push('## 4. 期首残高・除外伝票', '');
  if (r.excluded.entries.length === 0) L.push('除外した伝票はありません。');
  else {
    L.push('| 伝票ID | 日付 | 伝票番号 | 除外理由 | 科目 | 借方合計 |', '|---|---|---|---|---|---:|');
    for (const x of r.excluded.entries) L.push(`| ${x.entryId} | ${x.date} | ${x.voucherNo ?? ''} | ${x.reason} | ${x.accounts} | ${yen(x.debit)} |`);
    L.push('', '### 除外伝票の科目別合計（freee開始残高登録の下書き資料）', '', '| 科目 | 借方 | 貸方 |', '|---|---:|---:|');
    for (const t of r.excluded.accountTotals) L.push(`| ${t.account} | ${yen(t.debit)} | ${yen(t.credit)} |`);
  }
  L.push('');

  L.push('## 5. 未マッピング一覧', '');
  if (r.unmapped.length === 0) L.push('未マッピングはありません。');
  else {
    L.push('| 種別 | 元の値 | 親科目 | 件数 | 借方合計 | 貸方合計 | 初出行 | 候補（未適用） |', '|---|---|---|---:|---:|---:|---:|---|');
    for (const u of r.unmapped) L.push(`| ${u.kind} | ${u.sourceValue} | ${u.parentAccount ?? ''} | ${u.count} | ${yen(u.debitTotal)} | ${yen(u.creditTotal)} | ${u.firstRow ?? ''} | ${u.suggestions} |`);
    if (r.unmapped.some((u) => u.suggestions !== '')) L.push('', '「候補（未適用）」列はローカル規則（文字列一致・別名辞書）による候補で、変換には適用されていません。数値は規則ごとの固定スコアで確率ではありません。対応表に転記して confirmed:true にするまで E002/E003 は解消されません。');
  }
  L.push('');

  L.push('## 6. 取引先', '');
  if (r.partners.names.length === 0) L.push('出力される取引先はありません。');
  else {
    L.push('| 取引先名 | 件数 |', '|---|---:|');
    for (const p of r.partners.names) L.push(`| ${p.name} | ${p.count} |`);
  }
  if (r.partners.candidates.length > 0) {
    L.push('', '### 重複・表記ゆれ候補', '');
    for (const c of r.partners.candidates) L.push(`- ${c.code}: ${c.message}`);
  }
  L.push('');

  L.push('## 7. 警告一覧', '');
  if (r.warningsByCode.length === 0) L.push('警告はありません。');
  else {
    L.push('| コード | 件数 |', '|---|---:|');
    for (const w of r.warningsByCode) L.push(`| ${w.code} | ${w.count} |`);
    L.push('', '| コード | 重要度 | 伝票ID | 行 | メッセージ |', '|---|---|---|---:|---|');
    for (const d of r.diagnostics.filter((d) => d.severity !== 'info')) L.push(`| ${d.code} | ${d.severity} | ${d.entryId ?? ''} | ${d.sourceRow ?? ''} | ${d.message.replace(/\|/g, '\\|')} |`);
  }
  L.push('');

  L.push('## 8. 補助科目割当サマリ', '');
  if (r.subaccountRules.length === 0) L.push('補助科目の割当はありません。');
  else {
    L.push('| ルール | 件数 |', '|---|---:|');
    for (const s of r.subaccountRules) L.push(`| ${s.rule} | ${s.count} |`);
  }
  L.push('');
  L.push('## 9. 確認依頼事項', '', r.disclaimer, '');
  return L.join('\n');
}

export function renderReportCsvBundle(r: Report): { accounts: string; unmapped: string; diagnostics: string; taxcodes: string } {
  const accounts = [['元科目名', 'freee科目名', '元・借方', '元・貸方', '変換後・借方', '変換後・貸方', '差額', '件数', '備考'], ...r.accounts.map((a) => [a.sourceAccount, a.freeeAccount, String(a.srcDebit), String(a.srcCredit), String(a.outDebit), String(a.outCredit), String(a.diff), String(a.count), a.note])];
  const taxcodes = [['元税区分', 'freee税区分', '適用日付範囲', '金額合計', '税額合計', '件数'], ...r.taxcodes.map((t) => [t.sourceTaxCode, t.freeeTaxCode, t.period, String(t.amount), String(t.taxAmount), String(t.count)])];
  const unmapped = [['種別', '元の値', '親科目', '件数', '借方合計', '貸方合計', '初出行', '候補（未適用）'], ...r.unmapped.map((u) => [u.kind, u.sourceValue, u.parentAccount ?? '', String(u.count), String(u.debitTotal), String(u.creditTotal), String(u.firstRow ?? ''), u.suggestions])];
  const diagnostics = [['code', 'severity', 'entryId', 'sourceRow', 'message', 'detail'], ...r.diagnostics.map((d) => [d.code, d.severity, d.entryId ?? '', String(d.sourceRow ?? ''), d.message, d.detail ? JSON.stringify(d.detail) : ''])];
  return { accounts: toCsv(accounts), taxcodes: toCsv(taxcodes), unmapped: toCsv(unmapped), diagnostics: toCsv(diagnostics) };
}
