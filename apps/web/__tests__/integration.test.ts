/**
 * ShortKit [3.5] Integration QA
 *
 * FLOW-001: Create link → GET /r/[slug] redirects 301
 * FLOW-002: Link with expiresAt in past → GET /r/[slug] returns 410
 * FLOW-003: Link with maxClicks=1 → first redirect 301 → second redirect 410
 * FLOW-004: Password-protected link → GET /r/[slug] returns gate page → POST correct password → 200
 * FLOW-005: After redirect → GET /api/v1/links/:id/analytics → clickCount incremented
 * FLOW-006: Link with campaignId → redirect URL has utm_source/medium/campaign appended
 * FLOW-007: GET /api/v1/links/:id/qr?format=png → 200 for Pro plan, 402 for free
 * FLOW-008: Stripe checkout.session.completed → workspace.plan updated to pro
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { db } from '@/lib/store';
import { hash } from 'bcryptjs';
import { hashApiKey } from '@/lib/api-key';

// Route handlers
import { GET as redirectGET } from '@/app/r/[slug]/route';
import { POST as createLinkPOST } from '@/app/api/links/route';
import { POST as passwordPOST } from '@/app/api/links/[slug]/password/route';
import { GET as analyticsGET } from '@/app/api/v1/links/[id]/analytics/route';
import { GET as qrGET } from '@/app/api/v1/links/[id]/qr/route';
import { POST as stripeWebhookPOST, _setStripe } from '@/app/api/webhooks/stripe/route';

function makeRequest(url: string, init?: RequestInit): NextRequest {
  return new NextRequest(new URL(url, 'http://localhost:3000'), init);
}

function makeParams<T extends Record<string, string>>(obj: T): Promise<T> {
  return Promise.resolve(obj);
}

beforeEach(() => {
  db._reset();
});

// ---------------------------------------------------------------------------
// FLOW-001: Create link → GET /r/[slug] redirects 301
// ---------------------------------------------------------------------------
describe('FLOW-001: Create link → redirect 301', () => {
  it('creates a link and redirects with 301', async () => {
    // Create a link via the API
    const createReq = makeRequest('http://localhost:3000/api/links', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ destination: 'https://example.com', slug: 'test-001' }),
    });
    const createRes = await createLinkPOST(createReq);
    expect(createRes.status).toBe(201);

    const body = await createRes.json();
    expect(body.data.slug).toBe('test-001');
    expect(body.data.destination).toBe('https://example.com/');

    // Now redirect
    const redirectReq = makeRequest('http://localhost:3000/r/test-001');
    const redirectRes = await redirectGET(redirectReq, { params: makeParams({ slug: 'test-001' }) });

    expect(redirectRes.status).toBe(301);
    expect(redirectRes.headers.get('location')).toBe('https://example.com/');
  });
});

// ---------------------------------------------------------------------------
// FLOW-002: Link with expiresAt in past → 410
// ---------------------------------------------------------------------------
describe('FLOW-002: Expired link → 410', () => {
  it('returns 410 for an expired link', async () => {
    const pastDate = new Date(Date.now() - 86400000).toISOString(); // 1 day ago

    const createReq = makeRequest('http://localhost:3000/api/links', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        destination: 'https://example.com',
        slug: 'expired-link',
        expiresAt: pastDate,
      }),
    });
    const createRes = await createLinkPOST(createReq);
    expect(createRes.status).toBe(201);

    const redirectReq = makeRequest('http://localhost:3000/r/expired-link');
    const redirectRes = await redirectGET(redirectReq, { params: makeParams({ slug: 'expired-link' }) });

    expect(redirectRes.status).toBe(410);
    const body = await redirectRes.json();
    expect(body.error).toMatch(/expired/i);
  });
});

// ---------------------------------------------------------------------------
// FLOW-003: maxClicks=1 → first 301, second 410
// ---------------------------------------------------------------------------
describe('FLOW-003: maxClicks=1 → first 301, second 410', () => {
  it('allows first click then blocks second', async () => {
    const createReq = makeRequest('http://localhost:3000/api/links', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        destination: 'https://example.com',
        slug: 'one-click',
        maxClicks: 1,
      }),
    });
    const createRes = await createLinkPOST(createReq);
    expect(createRes.status).toBe(201);

    // First click → 301
    const req1 = makeRequest('http://localhost:3000/r/one-click');
    const res1 = await redirectGET(req1, { params: makeParams({ slug: 'one-click' }) });
    expect(res1.status).toBe(301);

    // Second click → 410
    const req2 = makeRequest('http://localhost:3000/r/one-click');
    const res2 = await redirectGET(req2, { params: makeParams({ slug: 'one-click' }) });
    expect(res2.status).toBe(410);
    const body = await res2.json();
    expect(body.error).toMatch(/click limit/i);
  });
});

// ---------------------------------------------------------------------------
// FLOW-004: Password-protected link → gate → POST correct password → 200
// ---------------------------------------------------------------------------
describe('FLOW-004: Password-protected link', () => {
  it('shows gate page, then allows access with correct password', async () => {
    const createReq = makeRequest('http://localhost:3000/api/links', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        destination: 'https://example.com/secret',
        slug: 'secret-link',
        password: 'mypassword123',
      }),
    });
    const createRes = await createLinkPOST(createReq);
    expect(createRes.status).toBe(201);

    // GET /r/secret-link → should return gate page (200 HTML)
    const gateReq = makeRequest('http://localhost:3000/r/secret-link');
    const gateRes = await redirectGET(gateReq, { params: makeParams({ slug: 'secret-link' }) });
    expect(gateRes.status).toBe(200);
    expect(gateRes.headers.get('content-type')).toContain('text/html');
    const html = await gateRes.text();
    expect(html).toContain('password-protected');

    // POST correct password → 200 with destination
    const pwReq = makeRequest('http://localhost:3000/api/links/secret-link/password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: 'mypassword123' }),
    });
    const pwRes = await passwordPOST(pwReq, { params: makeParams({ slug: 'secret-link' }) });
    expect(pwRes.status).toBe(200);
    const pwBody = await pwRes.json();
    expect(pwBody.data.destination).toBe('https://example.com/secret');

    // POST wrong password → 403
    const badReq = makeRequest('http://localhost:3000/api/links/secret-link/password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: 'wrongpassword' }),
    });
    const badRes = await passwordPOST(badReq, { params: makeParams({ slug: 'secret-link' }) });
    expect(badRes.status).toBe(403);
  });
});

// ---------------------------------------------------------------------------
// FLOW-005: After redirect → analytics clickCount incremented
// ---------------------------------------------------------------------------
describe('FLOW-005: Redirect → analytics clickCount incremented', () => {
  it('increments clickCount after redirect', async () => {
    const wsId = 'ws-analytics';
    const apiKeyPlaintext = 'sk_testapikey_analytics';

    // Set up workspace, API key, and link directly in store
    db.workspaces.create({ id: wsId, plan: 'pro', stripeCustomerId: null });
    db.apiKeys.createFromPlaintext(apiKeyPlaintext, wsId, 'user-1');

    const createReq = makeRequest('http://localhost:3000/api/links', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ destination: 'https://example.com', slug: 'analytics-test' }),
    });
    const createRes = await createLinkPOST(createReq);
    expect(createRes.status).toBe(201);
    const { data } = await createRes.json();

    // Update the link's workspaceId to match our workspace
    const link = db.links.findBySlug('analytics-test')!;
    link.workspaceId = wsId;

    // Check analytics before redirect → clicks = 0
    const analyticsReq1 = makeRequest(`http://localhost:3000/api/v1/links/${data.id}/analytics`, {
      headers: { 'X-Api-Key': apiKeyPlaintext },
    });
    const analyticsRes1 = await analyticsGET(analyticsReq1, { params: makeParams({ id: data.id }) });
    expect(analyticsRes1.status).toBe(200);
    const before = await analyticsRes1.json();
    expect(before.data.clicks).toBe(0);

    // Trigger redirect
    const redirectReq = makeRequest('http://localhost:3000/r/analytics-test');
    const redirectRes = await redirectGET(redirectReq, { params: makeParams({ slug: 'analytics-test' }) });
    expect(redirectRes.status).toBe(301);

    // Check analytics after redirect → clicks = 1
    const analyticsReq2 = makeRequest(`http://localhost:3000/api/v1/links/${data.id}/analytics`, {
      headers: { 'X-Api-Key': apiKeyPlaintext },
    });
    const analyticsRes2 = await analyticsGET(analyticsReq2, { params: makeParams({ id: data.id }) });
    expect(analyticsRes2.status).toBe(200);
    const after = await analyticsRes2.json();
    expect(after.data.clicks).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// FLOW-006: Link with campaignId → UTM params appended
// ---------------------------------------------------------------------------
describe('FLOW-006: Campaign link → UTM params appended', () => {
  it('appends utm_source/medium/campaign to redirect URL', async () => {
    const campaignId = 'camp-001';
    db.campaigns.create({
      id: campaignId,
      workspaceId: 'default',
      utmSource: 'newsletter',
      utmMedium: 'email',
      utmCampaign: 'spring-sale',
    });

    const createReq = makeRequest('http://localhost:3000/api/links', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        destination: 'https://example.com/landing',
        slug: 'campaign-link',
        campaignId,
      }),
    });
    const createRes = await createLinkPOST(createReq);
    expect(createRes.status).toBe(201);

    const redirectReq = makeRequest('http://localhost:3000/r/campaign-link');
    const redirectRes = await redirectGET(redirectReq, { params: makeParams({ slug: 'campaign-link' }) });
    expect(redirectRes.status).toBe(301);

    const location = redirectRes.headers.get('location')!;
    const url = new URL(location);
    expect(url.searchParams.get('utm_source')).toBe('newsletter');
    expect(url.searchParams.get('utm_medium')).toBe('email');
    expect(url.searchParams.get('utm_campaign')).toBe('spring-sale');
  });
});

// ---------------------------------------------------------------------------
// FLOW-007: QR code → 200 for Pro, 402 for free
// ---------------------------------------------------------------------------
describe('FLOW-007: QR code → 200 Pro, 402 free', () => {
  it('returns 402 for free plan workspace', async () => {
    const wsId = 'ws-free';
    const apiKeyPlaintext = 'sk_testapikey_free';

    db.workspaces.create({ id: wsId, plan: 'free', stripeCustomerId: null });
    db.apiKeys.createFromPlaintext(apiKeyPlaintext, wsId, 'user-1');
    db.links.create({
      id: 'link-free',
      slug: 'qr-free',
      destination: 'https://example.com',
      passwordHash: null,
      workspaceId: wsId,
      expiresAt: null,
      maxClicks: null,
      clickCount: 0,
      campaignId: null,
      createdAt: new Date(),
    });

    const qrReq = makeRequest('http://localhost:3000/api/v1/links/link-free/qr?format=png', {
      headers: { 'X-Api-Key': apiKeyPlaintext },
    });
    const qrRes = await qrGET(qrReq, { params: makeParams({ id: 'link-free' }) });
    expect(qrRes.status).toBe(402);
    const body = await qrRes.json();
    expect(body.error).toMatch(/pro plan/i);
  });

  it('returns 200 with PNG for Pro plan workspace', async () => {
    const wsId = 'ws-pro';
    const apiKeyPlaintext = 'sk_testapikey_pro';

    db.workspaces.create({ id: wsId, plan: 'pro', stripeCustomerId: null });
    db.apiKeys.createFromPlaintext(apiKeyPlaintext, wsId, 'user-1');
    db.links.create({
      id: 'link-pro',
      slug: 'qr-pro',
      destination: 'https://example.com',
      passwordHash: null,
      workspaceId: wsId,
      expiresAt: null,
      maxClicks: null,
      clickCount: 0,
      campaignId: null,
      createdAt: new Date(),
    });

    const qrReq = makeRequest('http://localhost:3000/api/v1/links/link-pro/qr?format=png', {
      headers: { 'X-Api-Key': apiKeyPlaintext },
    });
    const qrRes = await qrGET(qrReq, { params: makeParams({ id: 'link-pro' }) });
    expect(qrRes.status).toBe(200);
    expect(qrRes.headers.get('content-type')).toBe('image/png');
  });
});

// ---------------------------------------------------------------------------
// FLOW-008: Stripe checkout.session.completed → workspace.plan updated to pro
// ---------------------------------------------------------------------------
describe('FLOW-008: Stripe webhook → workspace plan updated', () => {
  it('updates workspace plan to pro on checkout.session.completed', async () => {
    const wsId = 'ws-stripe';
    db.workspaces.create({ id: wsId, plan: 'free', stripeCustomerId: 'cus_test123' });

    // Verify workspace starts as free
    expect(db.workspaces.findById(wsId)!.plan).toBe('free');

    // Build a mock Stripe event
    const event = {
      id: 'evt_test',
      type: 'checkout.session.completed',
      data: {
        object: {
          customer: 'cus_test123',
          metadata: { workspaceId: wsId },
        },
      },
    };
    const payload = JSON.stringify(event);

    // Mock Stripe to bypass signature verification
    const mockStripe = {
      webhooks: {
        constructEvent: () => event,
      },
    } as unknown as import('stripe').default;
    _setStripe(mockStripe);

    const req = makeRequest('http://localhost:3000/api/webhooks/stripe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'stripe-signature': 'test_signature',
      },
      body: payload,
    });

    const res = await stripeWebhookPOST(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.received).toBe(true);

    // Verify workspace plan is now 'pro'
    expect(db.workspaces.findById(wsId)!.plan).toBe('pro');

    // Clean up
    _setStripe(null);
  });
});
