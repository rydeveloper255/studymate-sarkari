/**
 * StudyMate Sarkari — Step 5: State & Union Territory Entity Resolver
 */

import { ALL_STATES_AND_UTS } from '../../../data/statesData';

export interface ResolvedState {
  code: string;
  name: string;
  slug: string;
  type: 'state' | 'ut';
  isConfidentMatch: boolean;
}

const STATE_ALIASES: Record<string, string> = {
  'up': 'UP', 'u.p.': 'UP', 'uttar pradesh': 'UP',
  'br': 'BR', 'bihar': 'BR',
  'mp': 'MP', 'm.p.': 'MP', 'madhya pradesh': 'MP',
  'rj': 'RJ', 'rajasthan': 'RJ',
  'mh': 'MH', 'maharashtra': 'MH',
  'delhi': 'DL', 'nct of delhi': 'DL', 'dl': 'DL',
  'tn': 'TN', 'tamil nadu': 'TN', 'tamilnadu': 'TN',
  'ka': 'KA', 'karnataka': 'KA',
  'kl': 'KL', 'kerala': 'KL',
  'ts': 'TS', 'tg': 'TS', 'telangana': 'TS',
  'ap': 'AP', 'andhra pradesh': 'AP',
  'wb': 'WB', 'west bengal': 'WB',
  'od': 'OD', 'or': 'OD', 'odisha': 'OD', 'orissa': 'OD',
  'pb': 'PB', 'punjab': 'PB',
  'hr': 'HR', 'haryana': 'HR',
  'gj': 'GJ', 'gujarat': 'GJ',
  'as': 'AS', 'assam': 'AS',
  'jh': 'JH', 'jharkhand': 'JH',
  'cg': 'CG', 'chhattisgarh': 'CG',
  'uk': 'UK', 'uttarakhand': 'UK', 'uttaranchal': 'UK',
  'hp': 'HP', 'himachal pradesh': 'HP',
  'jk': 'JK', 'j&k': 'JK', 'jammu and kashmir': 'JK', 'jammu & kashmir': 'JK',
  'ga': 'GA', 'goa': 'GA',
  'tr': 'TR', 'tripura': 'TR',
  'mn': 'MN', 'manipur': 'MN',
  'ml': 'ML', 'meghalaya': 'ML',
  'mz': 'MZ', 'mizoram': 'MZ',
  'nl': 'NL', 'nagaland': 'NL',
  'sk': 'SK', 'sikkim': 'SK',
  'ar': 'AR', 'arunachal pradesh': 'AR',
  'ch': 'CH', 'chandigarh': 'CH',
  'la': 'LA', 'ladakh': 'LA',
  'py': 'PY', 'puducherry': 'PY', 'pondicherry': 'PY',
  'an': 'AN', 'andaman and nicobar': 'AN',
};

/**
 * Resolves a state code and details from raw text or metadata.
 */
export function resolveState(rawInput: string | undefined | null): ResolvedState | null {
  if (!rawInput || typeof rawInput !== 'string' || !rawInput.trim()) {
    return null;
  }

  const key = rawInput.toLowerCase().trim();
  const matchedCode = STATE_ALIASES[key];

  if (matchedCode) {
    const stateInfo = ALL_STATES_AND_UTS.find((s) => s.code === matchedCode);
    if (stateInfo) {
      return {
        code: stateInfo.code,
        name: stateInfo.name,
        slug: stateInfo.slug,
        type: stateInfo.type,
        isConfidentMatch: true,
      };
    }
  }

  // Check substring search
  for (const [alias, code] of Object.entries(STATE_ALIASES)) {
    if (alias.length > 3 && key.includes(alias)) {
      const stateInfo = ALL_STATES_AND_UTS.find((s) => s.code === code);
      if (stateInfo) {
        return {
          code: stateInfo.code,
          name: stateInfo.name,
          slug: stateInfo.slug,
          type: stateInfo.type,
          isConfidentMatch: true,
        };
      }
    }
  }

  return null;
}
