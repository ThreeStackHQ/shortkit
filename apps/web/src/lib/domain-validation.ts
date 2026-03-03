import { resolve4 } from 'node:dns/promises';
import { isIP } from 'node:net';

const PRIVATE_RANGES = [
  { prefix: '127.', mask: null },
  { prefix: '10.', mask: null },
  { prefix: '192.168.', mask: null },
  { prefix: '0.', mask: null },
  { prefix: '169.254.', mask: null },
];

function isPrivateIp(ip: string): boolean {
  for (const range of PRIVATE_RANGES) {
    if (ip.startsWith(range.prefix)) return true;
  }

  // 172.16.0.0 – 172.31.255.255
  if (ip.startsWith('172.')) {
    const second = parseInt(ip.split('.')[1], 10);
    if (second >= 16 && second <= 31) return true;
  }

  return false;
}

export async function validateDomain(
  domain: string,
): Promise<{ valid: true } | { valid: false; reason: string }> {
  let addresses: string[];

  // If the domain is a raw IP, check it directly
  if (isIP(domain)) {
    if (isPrivateIp(domain)) {
      return { valid: false, reason: 'Private/reserved IP addresses are not allowed' };
    }
    return { valid: true };
  }

  try {
    addresses = await resolve4(domain);
  } catch {
    return { valid: false, reason: 'Domain does not resolve' };
  }

  for (const addr of addresses) {
    if (isPrivateIp(addr)) {
      return {
        valid: false,
        reason: `Domain resolves to private IP ${addr}. This is not allowed.`,
      };
    }
  }

  return { valid: true };
}
