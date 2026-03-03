import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/rate-limit';
import { db } from '@/lib/store';
import { compare } from 'bcryptjs';

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

  const link = db.links.findBySlug(slug);
  if (!link) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  if (!link.passwordHash) {
    return NextResponse.json({ error: 'Link is not password-protected' }, { status: 400 });
  }

  const valid = await compare(body.password, link.passwordHash);
  if (!valid) {
    return NextResponse.json({ error: 'Incorrect password' }, { status: 403 });
  }

  // Record click on successful password verification
  db.links.incrementClicks(link.id);

  return NextResponse.json(
    { status: 'success', data: { destination: link.destination } },
    { status: 200 },
  );
}
