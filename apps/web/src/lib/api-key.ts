import { createHash, randomBytes } from 'node:crypto';

export function generateApiKey(): { plaintext: string; hash: string } {
  const plaintext = `sk_${randomBytes(32).toString('hex')}`;
  const hash = hashApiKey(plaintext);
  return { plaintext, hash };
}

export function hashApiKey(plaintext: string): string {
  return createHash('sha256').update(plaintext).digest('hex');
}
