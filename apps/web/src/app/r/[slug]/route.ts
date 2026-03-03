import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/rate-limit';
import { db } from '@/lib/store';
import { escapeHtml } from '@/lib/escape';

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

  const link = db.links.findBySlug(slug);
  if (!link) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  // Check expiration
  if (link.expiresAt && new Date() >= link.expiresAt) {
    return NextResponse.json({ error: 'Link has expired' }, { status: 410 });
  }

  // Check max clicks
  if (link.maxClicks !== null && link.clickCount >= link.maxClicks) {
    return NextResponse.json({ error: 'Link has reached its click limit' }, { status: 410 });
  }

  // Password-protected: return gate page
  if (link.passwordHash) {
    const safeSlug = escapeHtml(slug);
    const html = `<!DOCTYPE html>
<html><head><title>Password Required</title></head>
<body>
<h1>This link is password-protected</h1>
<form method="POST" action="/api/links/${safeSlug}/password">
<input type="password" name="password" required />
<button type="submit">Submit</button>
</form>
</body></html>`;
    return new NextResponse(html, {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }

  // Record click
  db.links.incrementClicks(link.id);

  // Build destination URL with campaign UTM params if applicable
  let destination = link.destination;
  if (link.campaignId) {
    const campaign = db.campaigns.findById(link.campaignId);
    if (campaign) {
      const url = new URL(destination);
      url.searchParams.set('utm_source', campaign.utmSource);
      url.searchParams.set('utm_medium', campaign.utmMedium);
      url.searchParams.set('utm_campaign', campaign.utmCampaign);
      destination = url.toString();
    }
  }

  return NextResponse.redirect(destination, 301);
}
