import { toDataset, collectHeaderSignature } from './adapters/index.js';
import { configDiagnostics, stripTodoVerify, verifyConfig, type Profile } from './config.js';
import { parseCsv } from './csv.js';
import { decodeBytes } from './encoding.js';
import { applyMappings } from './mapping.js';
import type { Dataset, Diagnostic } from './model.js';
import { diag } from './model.js';
import { renderOutput } from './output.js';
import { buildReport, type Report } from './report.js';
import { NoopSuggester, type MappingSuggester, type Suggestion } from './suggest.js';
import { taxRateKey, validate } from './validate.js';

export * from './model.js';
export * from './config.js';
export * from './suggest.js';
export { decodeBytes, encodeText, type EncodingHint, type OutputEncoding } from './encoding.js';
export { parseCsv, toCsv } from './csv.js';
export { buildReport, renderReportMarkdown, renderReportCsvBundle, DISCLAIMER, type Report } from './report.js';
export { applyMappings } from './mapping.js';
export { validate } from './validate.js';
export { renderOutput } from './output.js';
export { normalizeName, parseAmount, parseDate, levenshtein } from './normalize.js';

export interface ConvertInput {
  bytes: Uint8Array;
  profile: Profile;
  fileName?: string;
  suggester?: MappingSuggester;
  configHashes?: Record<string, string>;
  runAt?: string;
}

export interface ConvertOptions {
  dev?: boolean;
  force?: boolean;
  strict?: boolean;
}

export interface ConvertResult {
  dataset: Dataset;
  diagnostics: Diagnostic[];
  outputCsv: string | null;
  report: Report;
  stats: { rows: number; entries: number; lines: number; errors: number; warnings: number; outputEntries: number };
  excluded: Map<string, string>;
}

export async function convert(input: ConvertInput, opts: ConvertOptions = {}): Promise<ConvertResult> {
  const diagnostics: Diagnostic[] = [];
  const fileName = input.fileName ?? 'input.csv';
  const runAt = input.runAt ?? new Date().toISOString();
  const suggester = input.suggester ?? new NoopSuggester();

  let profile = input.profile;
  if (opts.dev) {
    const stripped = stripTodoVerify(profile);
    profile = stripped.value;
    if (stripped.count > 0) {
      diagnostics.push(diag('W013', 'warning', `--dev モード: TODO_VERIFY の値 ${stripped.count} 件を推定名のまま使用（本番変換には使用しないこと）`, { detail: { count: stripped.count } }));
    }
  }
  const verification = verifyConfig(profile);
  if (!verification.ok) {
    diagnostics.push(...configDiagnostics(verification));
    const empty: Dataset = { source: profile.source.system, sourceFile: { name: fileName, encoding: 'unknown', hadBom: false, hasHeader: false, physicalRows: 0 }, entries: [] };
    const report = buildReport(empty, diagnostics, { profileName: profile.name, runAt, sourceFile: fileName, excluded: new Map(), outputEntryIds: new Set(), outputWritten: false, unmapped: [], suggestions: [], configHashes: input.configHashes });
    return { dataset: empty, diagnostics, outputCsv: null, report, stats: { rows: 0, entries: 0, lines: 0, errors: diagnostics.filter((d) => d.severity === 'error').length, warnings: 0, outputEntries: 0 }, excluded: new Map() };
  }

  const decoded = decodeBytes(input.bytes, profile.source.encoding);
  diagnostics.push(diag('I001', 'info', `文字コード判定: ${decoded.encoding}${decoded.hadBom ? '（BOM付き）' : ''}`, { detail: { encoding: decoded.encoding, hadBom: decoded.hadBom } }));

  const parsed = parseCsv(decoded.text, { delimiter: profile.source.delimiter, hasHeader: profile.source.hasHeader, headerSignature: collectHeaderSignature(profile.source) });

  const built = toDataset(parsed, profile, { fileName, encoding: decoded.encoding, hadBom: decoded.hadBom });
  diagnostics.push(...built.diagnostics);
  const ds = built.dataset;

  const mapping = applyMappings(ds, profile.maps, { departments: profile.options.departments, strict: opts.strict ?? false, sourceSystem: ds.source });
  diagnostics.push(...mapping.diagnostics);

  const erroredEntryIds = new Set(diagnostics.filter((d) => d.severity === 'error' && d.entryId).map((d) => d.entryId as string));
  const taxRates = new Map<string, number>();
  for (const t of profile.maps.taxcodes.entries) if (t.rate !== undefined) taxRates.set(taxRateKey(t.sourceTaxCode, t.freeeTaxCode), t.rate);
  diagnostics.push(...validate(ds, { fiscalYear: profile.fiscalYear, invoiceTransitionDates: profile.options.invoiceTransitionDates ?? [], partnerFuzzyThreshold: profile.options.partnerFuzzyThreshold ?? 2, taxRates, erroredEntryIds }));
  for (const d of diagnostics) if (d.severity === 'error' && d.entryId) erroredEntryIds.add(d.entryId);

  let suggestions: Suggestion[] = [];
  if (mapping.unmapped.length > 0) {
    suggestions = await suggester.suggest(mapping.unmapped, {
      targetAccounts: [...new Set(Object.values(profile.maps.accounts.entries).map((e) => e.freeeAccount))],
      targetTaxCodes: [...new Set(profile.maps.taxcodes.entries.map((e) => e.freeeTaxCode))],
      sourceSystem: ds.source,
    });
  }

  const excluded = new Map<string, string>();
  let excludedOpening = 0;
  let excludedFixed = 0;
  for (const e of ds.entries) {
    if (e.flags.includes('OPENING_BALANCE') && profile.options.openingBalances !== 'include') {
      excluded.set(e.entryId, '期首残高・繰越（options.openingBalances=exclude_and_report）');
      excludedOpening++;
    } else if ((e.flags.includes('FIXED_ASSET') || e.flags.includes('DEPRECIATION')) && profile.options.fixedAssets === 'exclude') {
      excluded.set(e.entryId, '固定資産・減価償却関連（options.fixedAssets=exclude）');
      excludedFixed++;
    } else if (opts.force && erroredEntryIds.has(e.entryId)) {
      excluded.set(e.entryId, 'エラーを含む伝票（--force により除外）');
    }
  }
  if (excludedOpening + excludedFixed > 0) {
    diagnostics.push(diag('I002', 'info', `出力から除外した伝票: 期首残高 ${excludedOpening} 件、固定資産・減価償却 ${excludedFixed} 件`, { detail: { openingBalances: excludedOpening, fixedAssets: excludedFixed } }));
  }

  const rendered = renderOutput(ds, profile.target, new Set([...excluded.keys(), ...erroredEntryIds]));
  diagnostics.push(...rendered.diagnostics);
  for (const d of rendered.diagnostics) if (d.severity === 'error' && d.entryId) excluded.set(d.entryId, `出力不可（${d.code}）`);

  const errors = diagnostics.filter((d) => d.severity === 'error').length;
  const warnings = diagnostics.filter((d) => d.severity === 'warning').length;
  const datasetLevelErrors = diagnostics.some((d) => d.severity === 'error' && !d.entryId);
  const outputWritten = errors === 0 || (opts.force === true && !datasetLevelErrors);
  const outputEntryIds = new Set(outputWritten ? rendered.outputEntryIds : []);

  const report = buildReport(ds, diagnostics, { profileName: profile.name, runAt, sourceFile: fileName, excluded, outputEntryIds, outputWritten, unmapped: mapping.unmapped, suggestions, configHashes: input.configHashes });

  return {
    dataset: ds,
    diagnostics,
    outputCsv: outputWritten ? rendered.csv : null,
    report,
    stats: { rows: parsed.rows.length, entries: ds.entries.length, lines: ds.entries.reduce((a, e) => a + e.lines.length, 0), errors, warnings, outputEntries: outputEntryIds.size },
    excluded,
  };
}
