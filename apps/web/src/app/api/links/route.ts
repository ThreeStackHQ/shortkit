import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { validateDestinationUrl } from '@/lib/url-validation';

const CreateLinkSchema = z.object({
  destination: z.string().min(1),
  slug: z.string().min(1).max(128).optional(),
  password: z.string().optional(),
});

export async function POST(req: NextRequest): Promise<NextResponse> {
  // TODO: verify authenticated session

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = CreateLinkSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 422 },
    );
  }

  const urlResult = validateDestinationUrl(parsed.data.destination);
  if (!urlResult.valid) {
    return NextResponse.json({ error: urlResult.reason }, { status: 422 });
  }

  // TODO: insert link into DB with urlResult.url as the sanitized destination

  return NextResponse.json(
    { status: 'success', data: { destination: urlResult.url, slug: parsed.data.slug } },
    { status: 201 },
  );
}
