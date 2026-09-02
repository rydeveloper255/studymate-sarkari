/**
 * StudyMate Sarkari — Step 5: Official URL & Link Security Verifier
 */

export interface VerifiedUrlResult {
  isValid: boolean;
  canonicalUrl: string | null;
  hostname: string | null;
  isOfficialDomain: boolean;
  warning?: string;
  error?: string;
}

const FORBIDDEN_SCHEMES = ['javascript:', 'data:', 'file:', 'blob:', 'vbscript:'];

const THIRD_PARTY_AGGREGATOR_DOMAINS = [
  'sarkariresult.com',
  'freejobalert.com',
  'sarkariprep.in',
  'fresherslive.com',
  'jagranjosh.com',
  'testbook.com',
  'adda247.com',
  'gradeup.co',
  'byjus.com',
  'unacademy.com',
];

/**
 * Validates extracted links, resolving relative paths against the source base URL.
 */
export function verifyAndSanitizeUrl(
  inputUrl: string | undefined | null,
  baseUrl?: string
): VerifiedUrlResult {
  if (!inputUrl || typeof inputUrl !== 'string' || !inputUrl.trim()) {
    return {
      isValid: false,
      canonicalUrl: null,
      hostname: null,
      isOfficialDomain: false,
      error: 'Empty or missing URL',
    };
  }

  const trimmed = inputUrl.trim();

  // Check forbidden schemes
  for (const scheme of FORBIDDEN_SCHEMES) {
    if (trimmed.toLowerCase().startsWith(scheme)) {
      return {
        isValid: false,
        canonicalUrl: null,
        hostname: null,
        isOfficialDomain: false,
        error: `Forbidden URL scheme "${scheme}" is not permitted`,
      };
    }
  }

  try {
    let resolved: URL;
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      resolved = new URL(trimmed);
    } else if (baseUrl) {
      resolved = new URL(trimmed, baseUrl);
    } else {
      resolved = new URL(`https://${trimmed}`);
    }

    if (resolved.protocol !== 'http:' && resolved.protocol !== 'https:') {
      return {
        isValid: false,
        canonicalUrl: null,
        hostname: null,
        isOfficialDomain: false,
        error: `Invalid protocol: ${resolved.protocol}`,
      };
    }

    const hostname = resolved.hostname.toLowerCase();

    // Check if URL belongs to known third-party aggregator (which must never be marked as official)
    const isThirdParty = THIRD_PARTY_AGGREGATOR_DOMAINS.some(
      (domain) => hostname === domain || hostname.endsWith(`.${domain}`)
    );

    if (isThirdParty) {
      return {
        isValid: false,
        canonicalUrl: resolved.toString(),
        hostname,
        isOfficialDomain: false,
        error: `Third-party domain "${hostname}" cannot be treated as an authoritative official government link`,
      };
    }

    // Check if domain is a recognized government / official academic domain (.gov.in, .nic.in, .edu.in, .ac.in, .org.in, .res.in, or verified portal)
    const isGovDomain =
      hostname.endsWith('.gov.in') ||
      hostname.endsWith('.nic.in') ||
      hostname.endsWith('.ac.in') ||
      hostname.endsWith('.edu.in') ||
      hostname.endsWith('.org.in') ||
      hostname.endsWith('.res.in') ||
      hostname.includes('.bihar.gov.in') ||
      hostname.includes('.up.gov.in') ||
      hostname.includes('upsc.gov.in') ||
      hostname.includes('ssc.gov.in') ||
      hostname.includes('nta.ac.in') ||
      hostname.includes('ibps.in') ||
      hostname.includes('sbi.co.in') ||
      hostname.includes('rbi.org.in') ||
      hostname.includes('indianrailways.gov.in') ||
      hostname.includes('joinindianarmy.nic.in') ||
      hostname.includes('joinindiannavy.gov.in');

    return {
      isValid: true,
      canonicalUrl: resolved.toString(),
      hostname,
      isOfficialDomain: isGovDomain,
      warning: !isGovDomain ? 'Domain is not a standard .gov.in/.nic.in portal; verify authority' : undefined,
    };
  } catch (err: any) {
    return {
      isValid: false,
      canonicalUrl: null,
      hostname: null,
      isOfficialDomain: false,
      error: `Malformed URL: ${err?.message || 'Invalid syntax'}`,
    };
  }
}
