import { NextRequest, NextResponse } from 'next/server';
import { corsHeaders, optionsResponse } from '@/lib/cors';
import { checkRateLimit } from '@/lib/rate-limit';
import { hashApiKey } from '@/lib/api-key';
import { db } from '@/lib/store';
import QRCode from 'qrcode';

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

  if (!apiKey) {
    return NextResponse.json(
      { error: 'Missing X-Api-Key header' },
      { status: 401, headers: corsHeaders() },
    );
  }

  const keyHash = hashApiKey(apiKey);
  const apiKeyRow = db.apiKeys.findByHash(keyHash);
  if (!apiKeyRow) {
    return NextResponse.json(
      { error: 'Invalid API key' },
      { status: 401, headers: corsHeaders() },
    );
  }

  // Check workspace plan
  const workspace = db.workspaces.findById(apiKeyRow.workspaceId);
  if (!workspace || workspace.plan !== 'pro') {
    return NextResponse.json(
      { error: 'QR code generation requires a Pro plan' },
      { status: 402, headers: corsHeaders() },
    );
  }

  const link = db.links.findByIdAndWorkspace(linkId, apiKeyRow.workspaceId);
  if (!link) {
    return NextResponse.json(
      { error: 'Not found' },
      { status: 404, headers: corsHeaders() },
    );
  }

  const format = req.nextUrl.searchParams.get('format') ?? 'png';

  if (format === 'svg') {
    const svg = await QRCode.toString(link.destination, { type: 'svg' });
    return new NextResponse(svg, {
      status: 200,
      headers: { ...corsHeaders(), 'Content-Type': 'image/svg+xml' },
    });
  }

  // Default: PNG
  const buffer = await QRCode.toBuffer(link.destination, { type: 'png' });
  return new NextResponse(buffer, {
    status: 200,
    headers: { ...corsHeaders(), 'Content-Type': 'image/png' },
  });
}
