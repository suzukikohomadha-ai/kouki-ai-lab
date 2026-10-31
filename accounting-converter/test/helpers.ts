import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { convert, type ConvertOptions, type ConvertResult, type Profile } from '../src/core/index.js';
import { loadProfile } from '../src/cli/load.js';

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

export function exampleProfile(name: 'mf' | 'yayoi'): Profile {
  return structuredClone(loadProfile(join(ROOT, 'config', 'examples', `profile.${name}.json`)).profile);
}

export function fixtureBytes(rel: string): Uint8Array {
  return new Uint8Array(readFileSync(join(ROOT, 'fixtures', rel)));
}

export async function run(system: 'mf' | 'yayoi', fixture: string, mutate?: (p: Profile) => void, opts: ConvertOptions = {}): Promise<ConvertResult> {
  const profile = exampleProfile(system);
  mutate?.(profile);
  return convert({ bytes: fixtureBytes(fixture), profile, fileName: fixture, runAt: '2026-09-14T00:00:00.000Z' }, opts);
}

export function codes(r: ConvertResult, code: string) {
  return r.diagnostics.filter((d) => d.code === code);
}

export function codeSet(r: ConvertResult): string[] {
  return [...new Set(r.diagnostics.map((d) => d.code))].sort();
}

export function bodyRows(csv: string | null): string[][] {
  if (csv === null) return [];
  return csv.trim().split('\r\n').slice(1).map((l) => l.split(','));
}
