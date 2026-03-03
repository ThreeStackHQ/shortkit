import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { validateDomain } from '@/lib/domain-validation';

const VerifyDomainSchema = z.object({
  domain: z.string().min(1).max(253),
});

export async function POST(req: NextRequest): Promise<NextResponse> {
  // TODO: verify authenticated session

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = VerifyDomainSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 422 },
    );
  }

  const result = await validateDomain(parsed.data.domain);
  if (!result.valid) {
    return NextResponse.json({ error: result.reason }, { status: 422 });
  }

  // TODO: store verified domain in DB, initiate TLS provisioning

  return NextResponse.json({ status: 'success', data: { domain: parsed.data.domain, verified: true } });
}
