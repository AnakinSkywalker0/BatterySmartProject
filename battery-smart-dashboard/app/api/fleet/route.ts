import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface Battery {
    id: string;
    code: string;
    soc: number;
    lat: number | null;
    lng: number | null;
    status: string;
    voltage?: number;
    speed?: number;
}

export async function GET() {
    try {
        const batteries = await (prisma as any).battery.findMany({
            orderBy: { code: 'asc' },
        }) as Battery[];
        return NextResponse.json(batteries);
    } catch (err) {
        console.error('Fleet API error:', err);
        return NextResponse.json({ error: 'Failed to fetch fleet' }, { status: 500 });
    }
}
