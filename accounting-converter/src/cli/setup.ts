import { createHash } from 'node:crypto';
import { copyFileSync, existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';
import { adoptSourceHeaders, adoptTargetHeaders, decodeBytes, parseCsv, TODO_PREFIX, type SourceConfig, type TargetConfig } from '../core/index.js';
import { readJson } from './load.js';

export interface InitLocalResult {
  copied: string[];
  skipped: string[];
  profilePath: string;
}

const LOCAL_SUFFIX = '.local.json';

function localName(file: string): string {
  return file.replace(/\.sample\.json$/, LOCAL_SUFFIX).replace(/(?<!\.local)\.json$/, LOCAL_SUFFIX);
}

function isCandidate(file: string): boolean {
  return file.endsWith('.json') && !file.endsWith(LOCAL_SUFFIX) && !file.endsWith('.example.json');
}

export function initLocal(configDir: string, force: boolean): InitLocalResult {
  const dir = resolve(configDir);
  const copied: string[] = [];
  const skipped: string[] = [];
  const copy = (from: string, to: string) => {
    if (existsSync(to) && !force) {
      skipped.push(to);
      return;
    }
    copyFileSync(from, to);
    copied.push(to);
  };
  for (const sub of ['sources', 'targets', 'maps']) {
    const d = join(dir, sub);
    if (!existsSync(d)) continue;
    for (const f of readdirSync(d).filter(isCandidate)) copy(join(d, f), join(d, localName(f)));
  }
  const samplePath = join(dir, 'profile.sample.json');
  const profilePath = join(dir, 'profile.json');
  if (!existsSync(samplePath)) throw new Error(`profile.sample.json が見つからない: ${samplePath}`);
  if (existsSync(profilePath) && !force) {
    skipped.push(profilePath);
  } else {
    const pf = readJson<Record<string, unknown>>(samplePath);
    const rewrite = (v: unknown): unknown => (typeof v === 'string' && /^\.\/(sources|targets|maps)\/.+\.json$/.test(v) ? localName(v) : v);
    pf.source = rewrite(pf.source);
    pf.target = rewrite(pf.target);
    const maps = (pf.maps ?? {}) as Record<string, unknown>;
    for (const k of Object.keys(maps)) maps[k] = rewrite(maps[k]);
    pf.name = typeof pf.name === 'string' ? pf.name.replace(/^sample-/, 'local-') : 'local';
    pf._comment = 'init-local が profile.sample.json から生成した本番用プロファイル（git 管理外）。参照先は .local.json。';
    writeFileSync(profilePath, JSON.stringify(pf, null, 2) + '\n', 'utf8');
    copied.push(profilePath);
  }
  return { copied, skipped, profilePath };
}

export interface AdoptFileInfo {
  fileName: string;
  encoding: string;
  hadBom: boolean;
  header: string[];
  sha256: string;
}

export function readHeaderRow(filePath: string): AdoptFileInfo {
  const bytes = readFileSync(filePath);
  const dec = decodeBytes(new Uint8Array(bytes), 'auto');
  const parsed = parseCsv(dec.text, { delimiter: ',', hasHeader: true });
  if (!parsed.header || parsed.header.length === 0) throw new Error(`1行目（ヘッダー）を読み取れない: ${filePath}`);
  return { fileName: basename(filePath), encoding: dec.encoding, hadBom: dec.hadBom, header: parsed.header, sha256: createHash('sha256').update(bytes).digest('hex') };
}

export function adoptTargetFile(targetPath: string, filePath: string): { info: AdoptFileInfo; result: ReturnType<typeof adoptTargetHeaders> } {
  const info = readHeaderRow(filePath);
  const target = readJson<TargetConfig>(targetPath);
  const result = adoptTargetHeaders(target, info.header);
  const ti = { ...(result.target.templateInfo ?? {}) };
  const isTodo = (v: unknown) => typeof v !== 'string' || v.startsWith(TODO_PREFIX);
  if (isTodo(ti.name)) ti.name = info.fileName;
  if (isTodo(ti.downloadedAt)) ti.downloadedAt = new Date().toISOString().slice(0, 10);
  if (isTodo(ti.sha256)) ti.sha256 = info.sha256;
  ti.encodingObserved = `${info.encoding}${info.hadBom ? '_bom' : ''}`;
  result.target = { ...result.target, templateInfo: ti };
  writeFileSync(targetPath, JSON.stringify(result.target, null, 2) + '\n', 'utf8');
  return { info, result };
}

export function adoptSourceFile(sourcePath: string, filePath: string): { info: AdoptFileInfo; result: ReturnType<typeof adoptSourceHeaders> } {
  const info = readHeaderRow(filePath);
  const source = readJson<SourceConfig>(sourcePath);
  const result = adoptSourceHeaders(source, info.header);
  writeFileSync(sourcePath, JSON.stringify(result.source, null, 2) + '\n', 'utf8');
  return { info, result };
}
