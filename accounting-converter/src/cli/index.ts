import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import { parseArgs } from 'node:util';
import { convert, decodeBytes, encodeText, parseCsv, renderReportCsvBundle, renderReportMarkdown, verifyConfig, type EncodingHint } from '../core/index.js';
import { loadProfile } from './load.js';

const USAGE = `使い方:
  npx tsx src/cli/index.ts inspect       --input <csv> [--encoding auto|utf8|shift_jis]
  npx tsx src/cli/index.ts verify-config --profile <profile.json>
  npx tsx src/cli/index.ts convert       --profile <profile.json> --input <csv> --out <dir> [--dev] [--force] [--strict]

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

async function runConvert(values: { profile?: string; input?: string; out?: string; dev: boolean; force: boolean; strict: boolean }): Promise<number> {
  const profilePath = need(values.profile, 'profile');
  const inputPath = need(values.input, 'input');
  const outBase = need(values.out, 'out');
  const started = Date.now();
  const loaded = loadProfile(profilePath);
  const bytes = new Uint8Array(readFileSync(inputPath));
  const runAt = new Date();
  const result = await convert(
    { bytes, profile: loaded.profile, fileName: basename(inputPath), configHashes: loaded.hashes, runAt: runAt.toISOString() },
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
    JSON.stringify({ profile: loaded.profile.name, runAt: runAt.toISOString(), input: basename(inputPath), configHashes: loaded.hashes, flags: { dev: values.dev, force: values.force, strict: values.strict }, stats: result.stats, outputWritten: result.outputCsv !== null, durationMs: Date.now() - started }, null, 2),
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
