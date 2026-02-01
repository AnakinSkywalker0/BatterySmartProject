import { NextRequest, NextResponse } from 'next/server';
import { appendN8nEvent } from '@/lib/store-n8n-events';

/** Receives callbacks from n8n (e.g. workflow completed, alert). Client can poll GET /api/n8n-events and merge into localStorage. */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { type = 'webhook', ...payload } = (typeof body === 'object' ? body : {}) as Record<string, unknown>;
    appendN8nEvent(String(type), payload as Record<string, unknown>);
    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('n8n webhook error:', err);
    return NextResponse.json({ error: 'Webhook failed' }, { status: 500 });
  }
}
