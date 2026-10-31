import type { ParsedCsv } from '../csv.js';
import type { Profile } from '../config.js';
import type { Dataset, Diagnostic } from '../model.js';
import type { AdapterContext } from './common.js';
import { mfToDataset } from './mf.js';
import { yayoiToDataset } from './yayoi.js';

export { collectHeaderSignature } from './common.js';

export function toDataset(parsed: ParsedCsv, profile: Profile, ctx: Omit<AdapterContext, 'system'>): { dataset: Dataset; diagnostics: Diagnostic[] } {
  switch (profile.source.system) {
    case 'mf_journal':
      return mfToDataset(parsed, profile, ctx);
    case 'yayoi_generic':
      return yayoiToDataset(parsed, profile, ctx);
    default:
      throw new Error(`未対応の入力システム: ${String(profile.source.system)}`);
  }
}
