/**
 * StudyMate Sarkari — Step 4: URL Validator & SSRF Prevention Engine
 * 
 * Strict server-side security checks:
 * - Protocol verification (only HTTP and HTTPS allowed)
 * - Anti-SSRF protection: Blocks private IP ranges (10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16, 127.0.0.0/8, 169.254.0.0/16, etc.)
 * - Blocks loopback, metadata services (169.254.169.254), IPv6 private/link-local/multicast, and local domains (.local, .internal, localhost)
 * - Safe URL canonicalization and redirect validation
 */

export interface UrlValidationResult {
  isValid: boolean;
  normalizedUrl?: string;
  hostname?: string;
  protocol?: string;
  error?: string;
  isPrivateOrRestricted?: boolean;
}

/**
 * Checks if an IPv4 address string falls within private, loopback, or restricted ranges.
 */
function isRestrictedIpv4(ip: string): boolean {
  const parts = ip.split('.').map(Number);
  if (parts.length !== 4 || parts.some(p => isNaN(p) || p < 0 || p > 255)) {
    return false;
  }

  const [p0, p1] = parts;

  // 0.0.0.0/8 (Current network)
  if (p0 === 0) return true;

  // 10.0.0.0/8 (Private)
  if (p0 === 10) return true;

  // 127.0.0.0/8 (Loopback)
  if (p0 === 127) return true;

  // 169.254.0.0/16 (Link-local / Cloud metadata like 169.254.169.254)
  if (p0 === 169 && p1 === 254) return true;

  // 172.16.0.0/12 (Private: 172.16.0.0 – 172.31.255.255)
  if (p0 === 172 && p1 >= 16 && p1 <= 31) return true;

  // 192.168.0.0/16 (Private)
  if (p0 === 192 && p1 === 168) return true;

  // 224.0.0.0/4 (Multicast)
  if (p0 >= 224 && p0 <= 239) return true;

  // 240.0.0.0/4 (Reserved) & 255.255.255.255 (Broadcast)
  if (p0 >= 240) return true;

  return false;
}

/**
 * Checks if an IPv6 address string is restricted (loopback, link-local, unique-local, etc.).
 */
function isRestrictedIpv6(ipv6: string): boolean {
  const clean = ipv6.toLowerCase().replace(/^\[|\]$/g, '');

  if (clean === '::1' || clean === '::' || clean === '0:0:0:0:0:0:0:1' || clean === '0:0:0:0:0:0:0:0') {
    return true; // Loopback or unspecified
  }

  // fe80::/10 (Link-local)
  if (clean.startsWith('fe8') || clean.startsWith('fe9') || clean.startsWith('fea') || clean.startsWith('feb')) {
    return true;
  }

  // fc00::/7 & fd00::/8 (Unique Local Address)
  if (clean.startsWith('fc') || clean.startsWith('fd')) {
    return true;
  }

  // ff00::/8 (Multicast)
  if (clean.startsWith('ff')) {
    return true;
  }

  // IPv4 mapped IPv6 (::ffff:127.0.0.1)
  if (clean.startsWith('::ffff:')) {
    const v4Part = clean.slice(7);
    return isRestrictedIpv4(v4Part);
  }

  return false;
}

export interface UrlValidationOptions {
  allowLoopbackForTesting?: boolean;
}

/**
 * Validates a target URL against SSRF and protocol requirements.
 */
export function validateSourceUrl(
  inputUrl: string,
  options: UrlValidationOptions = {}
): UrlValidationResult {
  if (!inputUrl || typeof inputUrl !== 'string' || !inputUrl.trim()) {
    return { isValid: false, error: 'URL is required and cannot be empty' };
  }

  const trimmed = inputUrl.trim();

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return { isValid: false, error: `Invalid URL format: ${inputUrl}` };
  }

  // 1. Protocol check (only HTTP and HTTPS allowed)
  const protocol = parsed.protocol.toLowerCase();
  if (protocol !== 'http:' && protocol !== 'https:') {
    return {
      isValid: false,
      protocol,
      error: `Forbidden protocol: "${protocol}". Only http: and https: are allowed.`,
    };
  }

  // 2. Port check (prevent port-scanning abuse)
  if (
    !options.allowLoopbackForTesting &&
    parsed.port &&
    parsed.port !== '80' &&
    parsed.port !== '443' &&
    parsed.port !== '8080' &&
    parsed.port !== '8443'
  ) {
    return {
      isValid: false,
      error: `Non-standard port "${parsed.port}" is not permitted for government source fetching.`,
    };
  }

  // 3. Hostname checks
  const hostname = parsed.hostname.toLowerCase();

  // If allowLoopbackForTesting is active, allow 127.0.0.1 or localhost specifically for automated mock test harness
  if (options.allowLoopbackForTesting && (hostname === '127.0.0.1' || hostname === 'localhost')) {
    const canonicalUrl = new URL(parsed.toString());
    return {
      isValid: true,
      normalizedUrl: canonicalUrl.toString(),
      hostname,
      protocol,
      isPrivateOrRestricted: false,
    };
  }

  // Hostname string blacklists
  const forbiddenHosts = [
    'localhost',
    'localhost.localdomain',
    '127.0.0.1',
    '0.0.0.0',
    'metadata.google.internal',
    'metadata',
    'instance-data',
  ];

  if (forbiddenHosts.includes(hostname)) {
    return {
      isValid: false,
      hostname,
      isPrivateOrRestricted: true,
      error: `Blocked access to local or internal host: ${hostname}`,
    };
  }

  if (
    hostname.endsWith('.localhost') ||
    hostname.endsWith('.local') ||
    hostname.endsWith('.internal') ||
    hostname.endsWith('.lan') ||
    hostname.endsWith('.home')
  ) {
    return {
      isValid: false,
      hostname,
      isPrivateOrRestricted: true,
      error: `Blocked access to internal domain suffix: ${hostname}`,
    };
  }

  // 4. IP check (IPv4 / IPv6)
  if (/^(\d{1,3}\.){3}\d{1,3}$/.test(hostname)) {
    if (isRestrictedIpv4(hostname)) {
      return {
        isValid: false,
        hostname,
        isPrivateOrRestricted: true,
        error: `Blocked access to private or restricted IPv4 address: ${hostname}`,
      };
    }
  }

  if (hostname.includes(':')) {
    if (isRestrictedIpv6(hostname)) {
      return {
        isValid: false,
        hostname,
        isPrivateOrRestricted: true,
        error: `Blocked access to private or restricted IPv6 address: ${hostname}`,
      };
    }
  }

  // 5. Canonicalization (remove tracking parameters, preserve valid queries)
  const canonicalUrl = new URL(parsed.toString());
  const trackingParams = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'fbclid', 'gclid'];
  for (const param of trackingParams) {
    canonicalUrl.searchParams.delete(param);
  }

  return {
    isValid: true,
    normalizedUrl: canonicalUrl.toString(),
    hostname,
    protocol,
    isPrivateOrRestricted: false,
  };
}

/**
 * Validates a redirection target to ensure it doesn't pivot into an internal or private resource.
 */
export function validateRedirect(
  originalUrl: string,
  redirectLocation: string,
  options: UrlValidationOptions = {}
): UrlValidationResult {
  try {
    const resolvedUrl = new URL(redirectLocation, originalUrl).toString();
    return validateSourceUrl(resolvedUrl, options);
  } catch {
    return {
      isValid: false,
      error: `Malformed redirect location: "${redirectLocation}" from "${originalUrl}"`,
    };
  }
}
