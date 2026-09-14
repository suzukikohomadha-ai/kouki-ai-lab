import type { ParsedCsv } from '../csv.js';
import type { Profile } from '../config.js';
import type { Dataset, Diagnostic } from '../model.js';
import { buildDataset, type AdapterContext } from './common.js';

export function yayoiToDataset(parsed: ParsedCsv, profile: Profile, ctx: Omit<AdapterContext, 'system'>): { dataset: Dataset; diagnostics: Diagnostic[] } {
  const r = buildDataset(parsed, profile, { ...ctx, system: 'yayoi_generic' });
  for (const e of r.dataset.entries) for (const l of e.lines) l.partnerRaw = null;
  return r;
}
