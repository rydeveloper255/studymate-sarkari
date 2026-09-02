/**
 * StudyMate Sarkari — Step 5: Organization Resolution & Alias Entity Matcher
 */

import { JobSector, CentralCategory } from '../../../types';

export interface ResolvedOrganization {
  organizationId?: string | null;
  code: string;
  name: string;
  fullName: string;
  sector: JobSector;
  centralCategory?: CentralCategory | null;
  stateCode?: string | null;
  isConfidentMatch: boolean;
}

interface KnownOrgMapping {
  code: string;
  name: string;
  fullName: string;
  aliases: string[];
  sector: JobSector;
  centralCategory?: CentralCategory;
  stateCode?: string;
}

const KNOWN_ORGANIZATIONS: KnownOrgMapping[] = [
  // --- Central Commissions & Bodies ---
  {
    code: 'UPSC',
    name: 'UPSC',
    fullName: 'Union Public Service Commission',
    aliases: ['upsc', 'union public service commission', 'upsconline', 'civil services'],
    sector: 'central',
    centralCategory: 'UPSC',
  },
  {
    code: 'SSC',
    name: 'SSC',
    fullName: 'Staff Selection Commission',
    aliases: ['ssc', 'staff selection commission', 'ssc cgl', 'ssc chsl', 'ssc gd', 'ssc mts', 'ssc cpo'],
    sector: 'central',
    centralCategory: 'SSC',
  },
  {
    code: 'NTA',
    name: 'NTA',
    fullName: 'National Testing Agency',
    aliases: ['nta', 'national testing agency', 'ugc net', 'csir net', 'cuet'],
    sector: 'central',
    centralCategory: 'Other Central Government',
  },
  {
    code: 'RRB',
    name: 'Railway Recruitment Board',
    fullName: 'Railway Recruitment Control Board (RRB / RRC)',
    aliases: ['rrb', 'rrc', 'railway recruitment', 'indian railways', 'railway recruitment board'],
    sector: 'central',
    centralCategory: 'Railway',
  },
  {
    code: 'IBPS',
    name: 'IBPS',
    fullName: 'Institute of Banking Personnel Selection',
    aliases: ['ibps', 'banking personnel', 'ibps po', 'ibps clerk', 'ibps rrb', 'ibps so'],
    sector: 'central',
    centralCategory: 'Banking',
  },
  {
    code: 'SBI',
    name: 'State Bank of India',
    fullName: 'State Bank of India (SBI)',
    aliases: ['sbi', 'state bank of india', 'sbi po', 'sbi clerk'],
    sector: 'central',
    centralCategory: 'Banking',
  },
  {
    code: 'RBI',
    name: 'Reserve Bank of India',
    fullName: 'Reserve Bank of India (RBI)',
    aliases: ['rbi', 'reserve bank of india', 'rbi grade b', 'rbi assistant'],
    sector: 'central',
    centralCategory: 'Banking',
  },
  {
    code: 'INDIAN_ARMY',
    name: 'Indian Army',
    fullName: 'Indian Army (Join Indian Army)',
    aliases: ['indian army', 'join indian army', 'joinindianarmy', 'army recruitment'],
    sector: 'central',
    centralCategory: 'Defence',
  },
  {
    code: 'INDIAN_NAVY',
    name: 'Indian Navy',
    fullName: 'Indian Navy (Nausena)',
    aliases: ['indian navy', 'join indian navy', 'joinindiannavy', 'nausena'],
    sector: 'central',
    centralCategory: 'Defence',
  },
  {
    code: 'INDIAN_AIR_FORCE',
    name: 'Indian Air Force',
    fullName: 'Indian Air Force (IAF / Agniveer Vayu)',
    aliases: ['indian air force', 'iaf', 'airmenselection', 'agniveer vayu'],
    sector: 'central',
    centralCategory: 'Defence',
  },
  {
    code: 'INDIA_POST',
    name: 'India Post',
    fullName: 'Department of Posts (India Post GDS)',
    aliases: ['india post', 'indiapost', 'postal department', 'gramin dak sevak', 'gds'],
    sector: 'central',
    centralCategory: 'Postal',
  },

  // --- Major State Commissions ---
  {
    code: 'BPSC',
    name: 'BPSC',
    fullName: 'Bihar Public Service Commission',
    aliases: ['bpsc', 'bihar public service commission', 'bpsc bihar'],
    sector: 'state',
    stateCode: 'BR',
  },
  {
    code: 'UPPSC',
    name: 'UPPSC',
    fullName: 'Uttar Pradesh Public Service Commission',
    aliases: ['uppsc', 'uttar pradesh public service commission', 'uppsc prayagraj'],
    sector: 'state',
    stateCode: 'UP',
  },
  {
    code: 'UPSSSC',
    name: 'UPSSSC',
    fullName: 'UP Subordinate Services Selection Commission',
    aliases: ['upsssc', 'up subordinate services', 'upsssc pet', 'upsssc lucknow'],
    sector: 'state',
    stateCode: 'UP',
  },
  {
    code: 'RPSC',
    name: 'RPSC',
    fullName: 'Rajasthan Public Service Commission',
    aliases: ['rpsc', 'rajasthan public service commission', 'rpsc ajmer'],
    sector: 'state',
    stateCode: 'RJ',
  },
  {
    code: 'MPPSC',
    name: 'MPPSC',
    fullName: 'Madhya Pradesh Public Service Commission',
    aliases: ['mppsc', 'madhya pradesh public service commission', 'mppsc indore'],
    sector: 'state',
    stateCode: 'MP',
  },
  {
    code: 'MPSC',
    name: 'MPSC',
    fullName: 'Maharashtra Public Service Commission',
    aliases: ['mpsc', 'maharashtra public service commission', 'mpsc mumbai'],
    sector: 'state',
    stateCode: 'MH',
  },
  {
    code: 'TNPSC',
    name: 'TNPSC',
    fullName: 'Tamil Nadu Public Service Commission',
    aliases: ['tnpsc', 'tamil nadu public service commission', 'tnpsc chennai'],
    sector: 'state',
    stateCode: 'TN',
  },
  {
    code: 'WBPSC',
    name: 'WBPSC',
    fullName: 'West Bengal Public Service Commission',
    aliases: ['wbpsc', 'west bengal public service commission', 'wbpsc kolkata'],
    sector: 'state',
    stateCode: 'WB',
  },
  {
    code: 'KPSC',
    name: 'KPSC',
    fullName: 'Karnataka Public Service Commission',
    aliases: ['kpsc', 'karnataka public service commission', 'kpsc bengaluru'],
    sector: 'state',
    stateCode: 'KA',
  },
  {
    code: 'KERALA_PSC',
    name: 'Kerala PSC',
    fullName: 'Kerala Public Service Commission',
    aliases: ['kerala psc', 'keralapsc', 'thiruvananthapuram psc'],
    sector: 'state',
    stateCode: 'KL',
  },
  {
    code: 'TSPSC',
    name: 'TGPSC / TSPSC',
    fullName: 'Telangana Public Service Commission',
    aliases: ['tspsc', 'tgpsc', 'telangana public service commission'],
    sector: 'state',
    stateCode: 'TS',
  },
  {
    code: 'APPSC',
    name: 'APPSC',
    fullName: 'Andhra Pradesh Public Service Commission',
    aliases: ['appsc', 'andhra pradesh public service commission', 'appsc vijayawada'],
    sector: 'state',
    stateCode: 'AP',
  },
  {
    code: 'DSSSB',
    name: 'DSSSB',
    fullName: 'Delhi Subordinate Services Selection Board',
    aliases: ['dsssb', 'delhi subordinate services', 'dsssb delhi'],
    sector: 'state',
    stateCode: 'DL',
  },
  {
    code: 'HPSC',
    name: 'HPSC',
    fullName: 'Haryana Public Service Commission',
    aliases: ['hpsc', 'haryana public service commission', 'hpsc panchkula'],
    sector: 'state',
    stateCode: 'HR',
  },
  {
    code: 'HSSC',
    name: 'HSSC',
    fullName: 'Haryana Staff Selection Commission',
    aliases: ['hssc', 'haryana staff selection commission', 'hssc cet'],
    sector: 'state',
    stateCode: 'HR',
  },
  {
    code: 'PPSC',
    name: 'PPSC',
    fullName: 'Punjab Public Service Commission',
    aliases: ['ppsc', 'punjab public service commission', 'ppsc patiala'],
    sector: 'state',
    stateCode: 'PB',
  },
  {
    code: 'OPSC',
    name: 'OPSC',
    fullName: 'Odisha Public Service Commission',
    aliases: ['opsc', 'odisha public service commission', 'opsc cuttack'],
    sector: 'state',
    stateCode: 'OD',
  },
  {
    code: 'OSSC',
    name: 'OSSC',
    fullName: 'Odisha Staff Selection Commission',
    aliases: ['ossc', 'odisha staff selection commission', 'osssc'],
    sector: 'state',
    stateCode: 'OD',
  },
  {
    code: 'APSC_ASSAM',
    name: 'APSC Assam',
    fullName: 'Assam Public Service Commission',
    aliases: ['apsc assam', 'assam public service commission', 'apsc guwahati'],
    sector: 'state',
    stateCode: 'AS',
  },
  {
    code: 'UKPSC',
    name: 'UKPSC',
    fullName: 'Uttarakhand Public Service Commission',
    aliases: ['ukpsc', 'uttarakhand public service commission', 'ukpsc haridwar'],
    sector: 'state',
    stateCode: 'UK',
  },
  {
    code: 'CGPSC',
    name: 'CGPSC',
    fullName: 'Chhattisgarh Public Service Commission',
    aliases: ['cgpsc', 'chhattisgarh public service commission', 'cgpsc raipur'],
    sector: 'state',
    stateCode: 'CG',
  },
  {
    code: 'JPSC',
    name: 'JPSC',
    fullName: 'Jharkhand Public Service Commission',
    aliases: ['jpsc', 'jharkhand public service commission', 'jpsc ranchi'],
    sector: 'state',
    stateCode: 'JH',
  },
  {
    code: 'JSSC',
    name: 'JSSC',
    fullName: 'Jharkhand Staff Selection Commission',
    aliases: ['jssc', 'jharkhand staff selection commission', 'jssc cgl'],
    sector: 'state',
    stateCode: 'JH',
  },
  {
    code: 'GPSC',
    name: 'GPSC',
    fullName: 'Gujarat Public Service Commission',
    aliases: ['gpsc', 'gujarat public service commission', 'gpsc gandhinagar'],
    sector: 'state',
    stateCode: 'GJ',
  },
];

/**
 * Resolves an organization from raw extracted text, source metadata, and fallback rules.
 */
export function resolveOrganization(
  rawText: string | undefined | null,
  sourceContext?: { sourceName?: string; scope?: string; stateCode?: string | null }
): ResolvedOrganization {
  const combined = `${rawText || ''} ${sourceContext?.sourceName || ''}`.toLowerCase();

  // Try direct alias match
  for (const org of KNOWN_ORGANIZATIONS) {
    for (const alias of org.aliases) {
      const regex = new RegExp(`\\b${alias.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'i');
      if (regex.test(combined)) {
        return {
          code: org.code,
          name: org.name,
          fullName: org.fullName,
          sector: org.sector,
          centralCategory: org.centralCategory,
          stateCode: org.stateCode || sourceContext?.stateCode || null,
          isConfidentMatch: true,
        };
      }
    }
  }

  // Fallback: derive from source context
  const sourceName = sourceContext?.sourceName || rawText || 'Government Authority';
  const isCentral = sourceContext?.scope === 'central';

  return {
    code: generateOrgCode(sourceName),
    name: sourceName.slice(0, 50),
    fullName: sourceName,
    sector: isCentral ? 'central' : 'state',
    centralCategory: isCentral ? 'Other Central Government' : undefined,
    stateCode: sourceContext?.stateCode || null,
    isConfidentMatch: false,
  };
}

function generateOrgCode(name: string): string {
  return name
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '_')
    .slice(0, 20);
}
