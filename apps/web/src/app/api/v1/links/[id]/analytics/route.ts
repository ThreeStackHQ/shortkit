import { NextRequest, NextResponse } from 'next/server';
import { corsHeaders, optionsResponse } from '@/lib/cors';
import { checkRateLimit } from '@/lib/rate-limit';
import { hashApiKey } from '@/lib/api-key';

const RATE_LIMIT_API_KEY = 30;
const RATE_LIMIT_IP = 60;
const RATE_LIMIT_WINDOW = 60 * 1000;

function getClientIp(req: NextRequest): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? '0.0.0.0';
}

export async function OPTIONS(): Promise<NextResponse> {
  return optionsResponse();
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id: linkId } = await params;

  // Rate limiting
  const apiKey = req.headers.get('x-api-key');
  const ip = getClientIp(req);

  if (apiKey) {
    const hash = hashApiKey(apiKey);
    const keyResult = checkRateLimit(`v1:key:${hash}`, RATE_LIMIT_API_KEY, RATE_LIMIT_WINDOW);
    if (!keyResult.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429, headers: { ...corsHeaders(), 'Retry-After': String(Math.ceil((keyResult.resetAt - Date.now()) / 1000)) } },
      );
    }
  }

  const ipResult = checkRateLimit(`v1:ip:${ip}`, RATE_LIMIT_IP, RATE_LIMIT_WINDOW);
  if (!ipResult.allowed) {
    return NextResponse.json(
      { error: 'Rate limit exceeded' },
      { status: 429, headers: { ...corsHeaders(), 'Retry-After': String(Math.ceil((ipResult.resetAt - Date.now()) / 1000)) } },
    );
  }

  // Auth: require API key
  if (!apiKey) {
    return NextResponse.json(
      { error: 'Missing X-Api-Key header' },
      { status: 401, headers: corsHeaders() },
    );
  }

  // IDOR prevention: scope analytics to the workspace that owns the API key
  const keyHash = hashApiKey(apiKey);

  // TODO: look up API key row to find workspaceId
  // const apiKeyRow = await db.query.apiKeys.findFirst({ where: eq(apiKeys.hash, keyHash) });
  // if (!apiKeyRow) return NextResponse.json({ error: 'Invalid API key' }, { status: 401, headers: corsHeaders() });

  // TODO: verify link belongs to the same workspace as the API key
  // const link = await db.query.links.findFirst({
  //   where: and(eq(links.id, linkId), eq(links.workspaceId, apiKeyRow.workspaceId)),
  // });
  // if (!link) return NextResponse.json({ error: 'Not found' }, { status: 404, headers: corsHeaders() });

  // TODO: fetch analytics scoped to this link
  void linkId;
  void keyHash;

  return NextResponse.json(
    { status: 'success', data: { linkId, clicks: 0, analytics: [] } },
    { headers: corsHeaders() },
  );
}
