import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { validateDestinationUrl } from '@/lib/url-validation';
import { db } from '@/lib/store';
import { randomBytes } from 'node:crypto';

const CreateLinkSchema = z.object({
  destination: z.string().min(1),
  slug: z.string().min(1).max(128).optional(),
  password: z.string().optional(),
  expiresAt: z.string().datetime().optional(),
  maxClicks: z.number().int().positive().optional(),
  campaignId: z.string().optional(),
});

export async function POST(req: NextRequest): Promise<NextResponse> {
  // TODO: verify authenticated session (skipped for now)

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

  const slug = parsed.data.slug ?? randomBytes(4).toString('hex');
  const id = randomBytes(8).toString('hex');

  let passwordHash: string | null = null;
  if (parsed.data.password) {
    const { hash } = await import('bcryptjs');
    passwordHash = await hash(parsed.data.password, 10);
  }

  const link = db.links.create({
    id,
    slug,
    destination: urlResult.url,
    passwordHash,
    workspaceId: 'default',
    expiresAt: parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : null,
    maxClicks: parsed.data.maxClicks ?? null,
    clickCount: 0,
    campaignId: parsed.data.campaignId ?? null,
    createdAt: new Date(),
  });

  return NextResponse.json(
    { status: 'success', data: { id: link.id, destination: link.destination, slug: link.slug } },
    { status: 201 },
  );
}
