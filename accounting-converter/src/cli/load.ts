import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import type { Profile } from '../core/index.js';

interface ProfileFile {
  name: string;
  source: string;
  target: string;
  maps: { accounts: string; taxcodes: string; subaccountRules: string; partners: string; accountAliases?: string };
  fiscalYear?: { start: string; end: string };
  options: Profile['options'];
}

export interface LoadedProfile {
  profile: Profile;
  files: Record<string, string>;
  hashes: Record<string, string>;
}

export function readJson<T>(path: string): T {
  let text = readFileSync(path, 'utf8');
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);
  try {
    return JSON.parse(text) as T;
  } catch (e) {
    throw new Error(`JSONの読み込みに失敗: ${path}: ${(e as Error).message}`);
  }
}

export function sha256File(path: string): string {
  return createHash('sha256').update(readFileSync(path)).digest('hex');
}

export function loadProfile(profilePath: string): LoadedProfile {
  const abs = resolve(profilePath);
  const base = dirname(abs);
  const pf = readJson<ProfileFile>(abs);
  const rel = (p: string) => resolve(base, p);
  const files: Record<string, string> = {
    profile: abs,
    source: rel(pf.source),
    target: rel(pf.target),
    'maps.accounts': rel(pf.maps.accounts),
    'maps.taxcodes': rel(pf.maps.taxcodes),
    'maps.subaccountRules': rel(pf.maps.subaccountRules),
    'maps.partners': rel(pf.maps.partners),
  };
  if (pf.maps.accountAliases) files['maps.accountAliases'] = rel(pf.maps.accountAliases);
  const profile: Profile = {
    name: pf.name,
    source: readJson(files.source),
    target: readJson(files.target),
    maps: {
      accounts: readJson(files['maps.accounts']),
      taxcodes: readJson(files['maps.taxcodes']),
      subaccountRules: readJson(files['maps.subaccountRules']),
      partners: readJson(files['maps.partners']),
      accountAliases: files['maps.accountAliases'] ? readJson(files['maps.accountAliases']) : null,
    },
    fiscalYear: pf.fiscalYear,
    options: pf.options,
  };
  const hashes: Record<string, string> = {};
  for (const [k, p] of Object.entries(files)) hashes[k] = sha256File(p).slice(0, 16);
  return { profile, files, hashes };
}
