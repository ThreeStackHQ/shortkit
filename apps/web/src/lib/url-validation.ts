const ALLOWED_SCHEMES = new Set(['http:', 'https:']);

export function validateDestinationUrl(raw: string): { valid: true; url: string } | { valid: false; reason: string } {
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    return { valid: false, reason: 'Invalid URL format' };
  }

  if (!ALLOWED_SCHEMES.has(parsed.protocol)) {
    return { valid: false, reason: `Scheme "${parsed.protocol}" is not allowed. Only http and https are accepted.` };
  }

  return { valid: true, url: parsed.toString() };
}
