import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
    try {
        const { stationId } = await req.json();

        const station = await (prisma as any).station.findUnique({
            where: { id: stationId }
        });

        if (!station) return NextResponse.json({ error: 'Station not found' }, { status: 404 });

        // Find batteries within 4km (0.035) radius that aren't already charging
        const batteries = await (prisma as any).battery.findMany({
            where: {
                status: 'active',
                lat: { not: null },
                lng: { not: null }
            }
        });

        const nearby = batteries.filter((b: any) =>
            Math.sqrt(Math.pow(b.lat! - station.lat, 2) + Math.pow(b.lng! - station.lng, 2)) < 0.06 // Relaxed radius for recruitment
        );

        const updates = nearby.map((b: any) =>
            (prisma as any).battery.update({
                where: { id: b.id },
                data: {
                    targetLat: station.lat,
                    targetLng: station.lng,
                    targetName: station.name
                }
            })
        );

        await prisma.$transaction(updates);

        return NextResponse.json({
            success: true,
            routedCount: nearby.length,
            stationName: station.name
        });
    } catch (err) {
        console.error('Routing Error:', err);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
