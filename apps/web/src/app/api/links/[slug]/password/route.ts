import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/rate-limit';

const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes

function getClientIp(req: NextRequest): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? '0.0.0.0';
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
): Promise<NextResponse> {
  const { slug } = await params;
  const ip = getClientIp(req);
  const rateLimitKey = `pwd:${slug}:${ip}`;

  const limit = checkRateLimit(rateLimitKey, MAX_ATTEMPTS, LOCKOUT_MS);
  if (!limit.allowed) {
    const retryAfter = Math.ceil((limit.resetAt - Date.now()) / 1000);
    return NextResponse.json(
      { error: 'Too many incorrect attempts. Try again later.' },
      {
        status: 429,
        headers: { 'Retry-After': String(retryAfter) },
      },
    );
  }

  let body: { password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (!body.password || typeof body.password !== 'string') {
    return NextResponse.json({ error: 'Password is required' }, { status: 400 });
  }

  // TODO: look up link by slug, compare hashed password
  // const link = await db.query.links.findFirst({ where: eq(links.slug, slug) });
  // if (!link) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  // const valid = await bcrypt.compare(body.password, link.passwordHash);
  // if (!valid) return NextResponse.json({ error: 'Incorrect password' }, { status: 403 });

  // On success: return the destination or redirect URL
  return NextResponse.json({ status: 'success', data: { destination: '' } });
}
