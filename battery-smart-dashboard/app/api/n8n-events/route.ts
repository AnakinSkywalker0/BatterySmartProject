import { NextResponse } from 'next/server';
import { getN8nEvents } from '@/lib/store-n8n-events';

/** Returns recent n8n webhook/execute events. Client can merge into localStorage (key: battery-smart-n8n-events). */
export async function GET() {
  const limit = 50;
  const events = getN8nEvents(limit);
  return NextResponse.json({ events });
}
