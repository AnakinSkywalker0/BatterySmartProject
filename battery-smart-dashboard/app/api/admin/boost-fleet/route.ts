import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { GUR_BOUNDS } from '@/lib/simulation-engine';

export async function POST() {
    try {
        const currentCount = await (prisma as any).battery.count();
        const TO_ADD = 100;

        const batteries = [];
        for (let i = 0; i < TO_ADD; i++) {
            const id = `BOOST-${Date.now()}-${i}`;
            const code = `BAT-${100 + i}`;

            batteries.push({
                id,
                code,
                lat: GUR_BOUNDS.latMin + Math.random() * (GUR_BOUNDS.latMax - GUR_BOUNDS.latMin),
                lng: GUR_BOUNDS.lngMin + Math.random() * (GUR_BOUNDS.lngMax - GUR_BOUNDS.lngMin),
                soc: 30 + Math.random() * 70,
                soh: 85 + Math.random() * 15,
                temp: 25 + Math.random() * 10,
                status: 'active',
                voltage: 52.0,
                speed: 0,
                cycles: Math.floor(Math.random() * 50)
            });
        }

        await (prisma as any).battery.createMany({
            data: batteries,
            skipDuplicates: true
        });

        return NextResponse.json({ success: true, added: TO_ADD, total: currentCount + TO_ADD });
    } catch (err) {
        console.error('Boost Error:', err);
        return NextResponse.json({ error: 'Failed to boost fleet' }, { status: 500 });
    }
}
