import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import { parseArgs } from 'node:util';
import { convert, decodeBytes, encodeText, NoopSuggester, parseCsv, renderReportCsvBundle, renderReportMarkdown, RuleSuggester, verifyConfig, type EncodingHint, type MappingSuggester } from '../core/index.js';
import { loadProfile } from './load.js';
import { adoptSourceFile, adoptTargetFile, initLocal } from './setup.js';

const USAGE = `使い方:
  npx tsx src/cli/index.ts inspect       --input <csv> [--encoding auto|utf8|shift_jis]
  npx tsx src/cli/index.ts verify-config --profile <profile.json>
  npx tsx src/cli/index.ts convert       --profile <profile.json> --input <csv> --out <dir> [--dev] [--force] [--strict] [--suggester noop|rule]
  npx tsx src/cli/index.ts init-local    [--config-dir config] [--force]      # 本番用設定（git管理外の .local.json / profile.json）を生成
  npx tsx src/cli/index.ts adopt-headers --target <targets/x.local.json> --file <公式テンプレート.csv>   # 1行目のヘッダーを列名に取り込む
  npx tsx src/cli/index.ts adopt-headers --source <sources/x.local.json> --file <実エクスポート.csv>

終了コード: 0=成功(警告なし) 1=警告あり(出力あり) 2=エラーあり(出力なし)または設定検証失敗
本ツールはネットワーク通信を行いません。`;

function main(): Promise<number> {
  const { values, positionals } = parseArgs({
    args: process.argv.slice(2),
    allowPositionals: true,
    options: {
      profile: { type: 'string' },
      input: { type: 'string' },
      out: { type: 'string' },
      encoding: { type: 'string', default: 'auto' },
      dev: { type: 'boolean', default: false },
      force: { type: 'boolean', default: false },
      strict: { type: 'boolean', default: false },
      suggester: { type: 'string', default: 'noop' },
      'config-dir': { type: 'string', default: 'config' },
      target: { type: 'string' },
      source: { type: 'string' },
      file: { type: 'string' },
      help: { type: 'boolean', short: 'h', default: false },
    },
  });
  const cmd = positionals[0];
  if (values.help || !cmd) {
    console.log(USAGE);
    return Promise.resolve(values.help ? 0 : 2);
  }
  switch (cmd) {
    case 'inspect':
      return Promise.resolve(runInspect(values.input, values.encoding as EncodingHint));
    case 'verify-config':
      return Promise.resolve(runVerify(values.profile));
    case 'convert':
      return runConvert(values);
    case 'init-local':
      return Promise.resolve(runInitLocal(values['config-dir'], values.force));
    case 'adopt-headers':
      return Promise.resolve(runAdoptHeaders(values.target, values.source, values.file));
    default:
      console.error(`未知のコマンド: ${cmd}\n${USAGE}`);
      return Promise.resolve(2);
  }
}

function need(v: string | undefined, name: string): string {
  if (!v) {
    console.error(`--${name} を指定してください\n${USAGE}`);
    process.exit(2);
  }
  return v;
}

function runInspect(input: string | undefined, encoding: EncodingHint): number {
  const path = need(input, 'input');
  const bytes = new Uint8Array(readFileSync(path));
  const dec = decodeBytes(bytes, encoding);
  const parsed = parseCsv(dec.text, { delimiter: ',', hasHeader: true });
  console.log(`ファイル: ${path}`);
  console.log(`文字コード判定: ${dec.encoding}${dec.hadBom ? '（BOM付き）' : ''}`);
  console.log(`物理行数: ${parsed.physicalRows}`);
  console.log(`1行目（ヘッダーと仮定）: ${JSON.stringify(parsed.header)}`);
  console.log('先頭3行:');
  for (const r of parsed.rows.slice(0, 3)) console.log(`  行${r.rowNumber}: ${JSON.stringify(r.cells)}`);
  return 0;
}

function runVerify(profilePath: string | undefined): number {
  const path = need(profilePath, 'profile');
  const loaded = loadProfile(path);
  const result = verifyConfig(loaded.profile);
  console.log(`設定検証: ${loaded.profile.name}`);
  for (const [k, f] of Object.entries(loaded.files)) console.log(`  ${k}: ${f} (sha256 ${loaded.hashes[k]})`);
  if (result.issues.length === 0) console.log('問題なし');
  for (const i of result.issues) console.log(`  [${i.severity}] ${i.path}: ${i.message}`);
  console.log(`TODO_VERIFY 残数: ${result.todoCount} / confirmed:false の科目: ${result.unconfirmedAccounts}`);
  console.log(result.ok ? '結果: OK（本番変換可）' : '結果: NG（TODO_VERIFY を転記し、エラーを解消してください。開発用途は --dev）');
  return result.ok ? 0 : 2;
}

function runInitLocal(configDir: string, force: boolean): number {
  const r = initLocal(configDir, force);
  console.log('init-local: 本番用設定ファイルを準備しました（git 管理外）');
  for (const f of r.copied) console.log(`  作成: ${f}`);
  for (const f of r.skipped) console.log(`  既存のため保持（上書きするには --force）: ${f}`);
  console.log(`次: 公式テンプレート・実エクスポートを config/templates/ に置き、adopt-headers を実行してください。プロファイル: ${r.profilePath}`);
  return 0;
}

function runAdoptHeaders(target: string | undefined, source: string | undefined, file: string | undefined): number {
  const filePath = need(file, 'file');
  if ((target ? 1 : 0) + (source ? 1 : 0) !== 1) {
    console.error('--target か --source のどちらか一方を指定してください');
    return 2;
  }
  if (target) {
    const { info, result } = adoptTargetFile(target, filePath);
    console.log(`adopt-headers: ${info.fileName}（${info.encoding}${info.hadBom ? '・BOM付き' : ''}、${info.header.length} 列）→ ${target}`);
    console.log(`  置換した列（${result.replaced.length}）:`);
    for (const r of result.replaced) console.log(`    ${r.before} → ${r.after}（${r.how === 'exact' ? '完全一致' : '部分一致・要確認'}）`);
    console.log(`  未確定の列（${result.unresolved.length}。from:null・_todo を付与。中間モデルの項目を指定するか、不要なら列ごと削除）:`);
    for (const n of result.unresolved) console.log(`    ${n}`);
    console.log(`  削除した列（${result.removed.length}。テンプレートのヘッダーに見つからなかった設定側の列）:`);
    for (const n of result.removed) console.log(`    ${n}`);
  } else {
    const { info, result } = adoptSourceFile(source!, filePath);
    console.log(`adopt-headers: ${info.fileName}（${info.encoding}${info.hadBom ? '・BOM付き' : ''}、${info.header.length} 列）→ ${source}`);
    console.log(`  置換した列（${result.replaced.length}）:`);
    for (const r of result.replaced) console.log(`    ${r.key}: ${r.before} → ${r.after}（${r.how === 'exact' ? '完全一致' : '部分一致・要確認'}）`);
    console.log(`  未確定（${result.unresolved.length}。TODO_VERIFY のまま。エクスポートのヘッダーに該当が無い。optional なら削除、必須なら手で指定）:`);
    for (const u of result.unresolved) console.log(`    ${u.key}: ${u.value}`);
    console.log(`  エクスポートにあって設定に無い列（${result.unusedHeaders.length}。必要なら columns に追加）:`);
    for (const h of result.unusedHeaders) console.log(`    ${h}`);
  }
  console.log('注意: 置換した列名は「指定ファイルの1行目の文字列」であり AI の推定ではありません。ただし from（中間モデルとの対応）が正しいかは人が確認してください（confirmed:false 相当）。');
  console.log('次: npx tsx src/cli/index.ts verify-config --profile config/profile.json');
  return 0;
}

function pickSuggester(name: string, aliases: ConstructorParameters<typeof RuleSuggester>[0]): MappingSuggester {
  if (name === 'rule') return new RuleSuggester(aliases);
  if (name === 'noop') return new NoopSuggester();
  throw new Error(`--suggester は noop | rule のいずれか（外部LLMは未承認のため選べません）: ${name}`);
}

async function runConvert(values: { profile?: string; input?: string; out?: string; dev: boolean; force: boolean; strict: boolean; suggester: string }): Promise<number> {
  const profilePath = need(values.profile, 'profile');
  const inputPath = need(values.input, 'input');
  const outBase = need(values.out, 'out');
  const started = Date.now();
  const loaded = loadProfile(profilePath);
  const bytes = new Uint8Array(readFileSync(inputPath));
  const runAt = new Date();
  const result = await convert(
    { bytes, profile: loaded.profile, fileName: basename(inputPath), configHashes: loaded.hashes, runAt: runAt.toISOString(), suggester: pickSuggester(values.suggester, loaded.profile.maps.accountAliases ?? null) },
    { dev: values.dev, force: values.force, strict: values.strict },
  );

  const stamp = runAt.toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, '').replace('T', '-');
  const outDir = join(outBase, `${stamp}_${loaded.profile.name}`);
  mkdirSync(outDir, { recursive: true });
  const md = renderReportMarkdown(result.report);
  const bundle = renderReportCsvBundle(result.report);
  writeFileSync(join(outDir, 'report.md'), md, 'utf8');
  writeFileSync(join(outDir, 'report_accounts.csv'), encodeText(bundle.accounts, 'utf8_bom'));
  writeFileSync(join(outDir, 'report_taxcodes.csv'), encodeText(bundle.taxcodes, 'utf8_bom'));
  writeFileSync(join(outDir, 'report_unmapped.csv'), encodeText(bundle.unmapped, 'utf8_bom'));
  writeFileSync(join(outDir, 'report_diagnostics.csv'), encodeText(bundle.diagnostics, 'utf8_bom'));
  if (result.outputCsv !== null) {
    writeFileSync(join(outDir, 'freee_import.csv'), encodeText(result.outputCsv, loaded.profile.target.encoding ?? 'utf8_bom'));
  }
  writeFileSync(
    join(outDir, 'run.json'),
    JSON.stringify({ profile: loaded.profile.name, runAt: runAt.toISOString(), input: { fileName: basename(inputPath), encoding: result.dataset.sourceFile.encoding, hadBom: result.dataset.sourceFile.hadBom, physicalRows: result.dataset.sourceFile.physicalRows, sha256: createHash('sha256').update(bytes).digest('hex') }, configHashes: loaded.hashes, flags: { dev: values.dev, force: values.force, strict: values.strict, suggester: values.suggester }, stats: result.stats, outputWritten: result.outputCsv !== null, durationMs: Date.now() - started }, null, 2),
    'utf8',
  );

  console.log(`プロファイル: ${loaded.profile.name}`);
  console.log(`入力: ${inputPath}（${result.dataset.sourceFile.encoding}${result.dataset.sourceFile.hadBom ? ', BOM' : ''}、ヘッダー${result.dataset.sourceFile.hasHeader ? 'あり' : 'なし'}）`);
  console.log(`伝票 ${result.stats.entries} 件 / 明細 ${result.stats.lines} 行 / error ${result.stats.errors} / warning ${result.stats.warnings}`);
  for (const d of result.diagnostics.filter((d) => d.severity === 'error').slice(0, 20)) console.log(`  [${d.code}] ${d.entryId ?? ''} 行${d.sourceRow ?? '-'}: ${d.message}`);
  if (result.stats.errors > 20) console.log(`  ... 他 ${result.stats.errors - 20} 件（report_diagnostics.csv 参照）`);
  console.log(result.outputCsv !== null ? `freee用CSV: ${join(outDir, 'freee_import.csv')}（${result.stats.outputEntries} 伝票）` : 'freee用CSV: 出力なし（error あり。レポートを確認）');
  console.log(`レポート: ${join(outDir, 'report.md')}`);
  if (result.stats.errors > 0 && result.outputCsv === null) return 2;
  return result.stats.warnings > 0 ? 1 : 0;
}

main().then(
  (code) => process.exit(code),
  (err: unknown) => {
    console.error(`エラー: ${(err as Error).message}`);
    process.exit(2);
  },
);
