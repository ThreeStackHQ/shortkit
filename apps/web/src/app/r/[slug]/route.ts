import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/rate-limit';

const RATE_LIMIT_REDIRECT = 60;
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute

function getClientIp(req: NextRequest): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? '0.0.0.0';
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
): Promise<NextResponse> {
  const { slug } = await params;
  const ip = getClientIp(req);

  const limit = checkRateLimit(`redirect:${ip}`, RATE_LIMIT_REDIRECT, RATE_LIMIT_WINDOW);
  if (!limit.allowed) {
    const retryAfter = Math.ceil((limit.resetAt - Date.now()) / 1000);
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429, headers: { 'Retry-After': String(retryAfter) } },
    );
  }

  // TODO: look up link by slug in DB
  // const link = await db.query.links.findFirst({ where: eq(links.slug, slug) });
  // if (!link) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  // if (link.passwordHash) redirect to password page
  // TODO: record analytics click
  // return NextResponse.redirect(link.destination, 302);

  void slug;

  return NextResponse.json({ error: 'Not found' }, { status: 404 });
}
