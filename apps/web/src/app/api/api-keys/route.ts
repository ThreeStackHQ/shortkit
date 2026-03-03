import { NextRequest, NextResponse } from 'next/server';
import { generateApiKey } from '@/lib/api-key';

export async function POST(req: NextRequest): Promise<NextResponse> {
  // TODO: verify authenticated session and workspace membership
  void req;

  const { plaintext, hash } = generateApiKey();

  // TODO: store hash in DB (never the plaintext)
  // await db.insert(apiKeys).values({
  //   hash,
  //   workspaceId: session.workspaceId,
  //   createdBy: session.userId,
  // });

  void hash;

  // Return the plaintext key exactly once — it is never retrievable again
  return NextResponse.json(
    {
      status: 'success',
      data: {
        key: plaintext,
        message: 'Store this key securely. It will not be shown again.',
      },
    },
    { status: 201 },
  );
}
