import type { ParsedCsv } from '../csv.js';
import type { Profile } from '../config.js';
import type { Dataset, Diagnostic } from '../model.js';
import { buildDataset, type AdapterContext } from './common.js';

export function mfToDataset(parsed: ParsedCsv, profile: Profile, ctx: Omit<AdapterContext, 'system'>): { dataset: Dataset; diagnostics: Diagnostic[] } {
  return buildDataset(parsed, profile, { ...ctx, system: 'mf_journal' });
}
