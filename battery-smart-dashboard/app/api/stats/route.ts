import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { type Station, type Battery } from '@/lib/simulation-engine';

export async function GET() {
    try {
        const stations = await (prisma as any).station.findMany() as Station[];
        const batteries = await (prisma as any).battery.findMany() as Battery[];

        const totalSwapRate = stations.reduce((acc, s) => acc + (s.swapRate || 0), 0);
        const surgeStations = stations.filter(s => (s.surgePrice || 1.0) > 1.0).length;
        const avgUptime = stations.reduce((acc, s) => acc + (s.chargerHealth || 0), 0) / (stations.length || 1);

        return NextResponse.json({
            totalSwapRate,
            surgeStations,
            avgUptime,
            stations,
            fleetStatus: {
                critical: batteries.filter(b => b.soc < 20).length,
                healthy: batteries.filter(b => b.soc >= 20).length,
                total: batteries.length
            }
        });
    } catch (err) {
        console.error('Stats Sync Error:', err);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
