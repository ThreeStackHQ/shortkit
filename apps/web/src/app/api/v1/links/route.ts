import { NextRequest, NextResponse } from 'next/server';
import { corsHeaders, optionsResponse } from '@/lib/cors';
import { checkRateLimit } from '@/lib/rate-limit';
import { hashApiKey } from '@/lib/api-key';
import { validateDestinationUrl } from '@/lib/url-validation';
import { z } from 'zod';

const RATE_LIMIT_API_KEY = 30;
const RATE_LIMIT_IP = 60;
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute

function getClientIp(req: NextRequest): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? '0.0.0.0';
}

function applyRateLimit(req: NextRequest): NextResponse | null {
  const apiKey = req.headers.get('x-api-key');
  const ip = getClientIp(req);

  if (apiKey) {
    const hash = hashApiKey(apiKey);
    const result = checkRateLimit(`v1:key:${hash}`, RATE_LIMIT_API_KEY, RATE_LIMIT_WINDOW);
    if (!result.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded for API key (30/min)' },
        { status: 429, headers: { ...corsHeaders(), 'Retry-After': String(Math.ceil((result.resetAt - Date.now()) / 1000)) } },
      );
    }
  }

  const ipResult = checkRateLimit(`v1:ip:${ip}`, RATE_LIMIT_IP, RATE_LIMIT_WINDOW);
  if (!ipResult.allowed) {
    return NextResponse.json(
      { error: 'Rate limit exceeded for IP (60/min)' },
      { status: 429, headers: { ...corsHeaders(), 'Retry-After': String(Math.ceil((ipResult.resetAt - Date.now()) / 1000)) } },
    );
  }

  return null;
}

export async function OPTIONS(): Promise<NextResponse> {
  return optionsResponse();
}

const CreateLinkV1Schema = z.object({
  destination: z.string().min(1),
  slug: z.string().min(1).max(128).optional(),
});

export async function POST(req: NextRequest): Promise<NextResponse> {
  const limited = applyRateLimit(req);
  if (limited) return limited;

  const apiKey = req.headers.get('x-api-key');
  if (!apiKey) {
    return NextResponse.json(
      { error: 'Missing X-Api-Key header' },
      { status: 401, headers: corsHeaders() },
    );
  }

  // TODO: look up hashed API key in DB to identify workspace
  // const keyHash = hashApiKey(apiKey);
  // const apiKeyRow = await db.query.apiKeys.findFirst({ where: eq(apiKeys.hash, keyHash) });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400, headers: corsHeaders() });
  }

  const parsed = CreateLinkV1Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 422, headers: corsHeaders() },
    );
  }

  const urlResult = validateDestinationUrl(parsed.data.destination);
  if (!urlResult.valid) {
    return NextResponse.json({ error: urlResult.reason }, { status: 422, headers: corsHeaders() });
  }

  // TODO: insert link scoped to workspace from API key

  return NextResponse.json(
    { status: 'success', data: { destination: urlResult.url, slug: parsed.data.slug } },
    { status: 201, headers: corsHeaders() },
  );
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const limited = applyRateLimit(req);
  if (limited) return limited;

  const apiKey = req.headers.get('x-api-key');
  if (!apiKey) {
    return NextResponse.json(
      { error: 'Missing X-Api-Key header' },
      { status: 401, headers: corsHeaders() },
    );
  }

  // TODO: look up hashed API key, fetch links scoped to workspace

  return NextResponse.json(
    { status: 'success', data: [] },
    { headers: corsHeaders() },
  );
}
