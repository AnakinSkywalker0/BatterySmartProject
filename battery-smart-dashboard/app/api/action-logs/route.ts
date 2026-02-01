import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const limit = Math.min(Number(req.nextUrl.searchParams.get('limit')) || 20, 100);
    const logs = await prisma.actionLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: { id: true, actionId: true, title: true, runId: true, createdAt: true },
    });
    const list = logs.map((l) => ({
      id: l.id,
      actionId: l.actionId,
      title: l.title,
      runId: l.runId,
      timestamp: l.createdAt.toLocaleTimeString(),
    }));
    return NextResponse.json(list);
  } catch (err) {
    console.error('Action logs API error:', err);
    return NextResponse.json({ error: 'Failed to fetch action logs' }, { status: 500 });
  }
}
