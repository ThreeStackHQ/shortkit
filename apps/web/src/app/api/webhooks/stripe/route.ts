import { NextRequest, NextResponse } from 'next/server';
import { env } from '@/lib/env';
import Stripe from 'stripe';

const stripe = new Stripe(env.STRIPE_SECRET_KEY);

export async function POST(req: NextRequest): Promise<NextResponse> {
  const signature = req.headers.get('stripe-signature');
  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
  }

  // Use arrayBuffer + Buffer.from to get the raw body — never req.json()
  const buf = Buffer.from(await req.arrayBuffer());

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(buf, signature, env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: `Webhook verification failed: ${message}` }, { status: 400 });
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      // TODO: activate subscription in DB
      break;
    }
    case 'customer.subscription.deleted': {
      // TODO: deactivate subscription in DB
      break;
    }
    default:
      break;
  }

  return NextResponse.json({ received: true });
}
