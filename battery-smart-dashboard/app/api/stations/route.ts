import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const stations = await prisma.station.findMany({
      orderBy: { code: 'asc' },
      select: { id: true, code: true, name: true, region: true, loadPct: true, status: true, lat: true, lng: true },
    });
    return NextResponse.json(stations);
  } catch (err) {
    console.error('Stations API error:', err);
    return NextResponse.json({ error: 'Failed to fetch stations' }, { status: 500 });
  }
}
