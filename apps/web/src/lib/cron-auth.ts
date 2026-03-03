import { timingSafeEqual } from 'node:crypto';
import { env } from '@/lib/env';

export function verifyCronSecret(headerValue: string | null): boolean {
  if (!headerValue) return false;

  const expected = Buffer.from(env.CRON_SECRET);
  const actual = Buffer.from(headerValue);

  if (expected.length !== actual.length) return false;

  return timingSafeEqual(expected, actual);
}
