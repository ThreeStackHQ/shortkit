import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/store';

// Stripe client and env are lazily loaded to allow tests to mock them
let _stripe: import('stripe').default | null = null;

function getStripe(): import('stripe').default {
  if (!_stripe) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Stripe = require('stripe').default as typeof import('stripe').default;
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? '');
  }
  return _stripe;
}

/** Allow tests to inject a mock Stripe instance */
export function _setStripe(mock: import('stripe').default | null): void {
  _stripe = mock;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const signature = req.headers.get('stripe-signature');
  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
  }

  const buf = Buffer.from(await req.arrayBuffer());
  const stripe = getStripe();

  let event: import('stripe').default.Event;
  try {
    event = stripe.webhooks.constructEvent(
      buf,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET ?? '',
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: `Webhook verification failed: ${message}` }, { status: 400 });
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as { customer?: string; metadata?: Record<string, string> };
      const workspaceId = session.metadata?.workspaceId;
      if (workspaceId) {
        db.workspaces.updatePlan(workspaceId, 'pro');
      }
      break;
    }
    case 'customer.subscription.deleted': {
      const subscription = event.data.object as { customer?: string };
      const customerId = typeof subscription.customer === 'string' ? subscription.customer : undefined;
      if (customerId) {
        const ws = db.workspaces.findByStripeCustomerId(customerId);
        if (ws) {
          db.workspaces.updatePlan(ws.id, 'free');
        }
      }
      break;
    }
    default:
      break;
  }

  return NextResponse.json({ received: true });
}
