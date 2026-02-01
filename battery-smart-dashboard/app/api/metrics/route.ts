import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const latest = await prisma.metricSnapshot.findFirst({
      orderBy: { createdAt: 'desc' },
    });
    if (!latest) {
      return NextResponse.json({
        queueLengthMins: 12,
        chargerUptimePct: 92,
        inventoryChargedPct: 45,
      });
    }
    return NextResponse.json({
      queueLengthMins: latest.queueLengthMins ?? 12,
      chargerUptimePct: latest.chargerUptimePct ?? 92,
      inventoryChargedPct: latest.inventoryChargedPct ?? 45,
    });
  } catch (err) {
    console.error('Metrics API error:', err);
    return NextResponse.json(
      { queueLengthMins: 12, chargerUptimePct: 92, inventoryChargedPct: 45 },
      { status: 200 }
    );
  }
}
