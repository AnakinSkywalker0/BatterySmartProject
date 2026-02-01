import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const alerts = await prisma.alert.findMany({
      where: { resolved: false },
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: { id: true, stationCode: true, type: true, message: true, createdAt: true },
    });
    const list = alerts.map((a) => ({
      id: a.id,
      station: a.stationCode ?? '—',
      message: a.message,
      type: a.type,
      time: formatTimeAgo(a.createdAt),
    }));
    return NextResponse.json(list);
  } catch (err) {
    console.error('Alerts API error:', err);
    return NextResponse.json({ error: 'Failed to fetch alerts' }, { status: 500 });
  }
}

function formatTimeAgo(d: Date): string {
  const sec = Math.floor((Date.now() - d.getTime()) / 1000);
  if (sec < 60) return 'Just now';
  if (sec < 3600) return `${Math.floor(sec / 60)}m ago`;
  if (sec < 86400) return `${Math.floor(sec / 3600)}h ago`;
  return `${Math.floor(sec / 86400)}d ago`;
}
