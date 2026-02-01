import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
    try {
        const { batteryId, targetLat, targetLng, targetName } = await req.json();

        if (!batteryId || targetLat === undefined || targetLng === undefined) {
            return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
        }

        const battery = await (prisma as any).battery.findUnique({
            where: { code: batteryId } // Using code as the identifier
        });

        if (!battery) {
            return NextResponse.json({ error: 'Battery not found' }, { status: 404 });
        }

        await (prisma as any).battery.update({
            where: { id: battery.id },
            data: { targetLat, targetLng }
        });

        // Log the manual intervention
        await (prisma as any).actionLog.create({
            data: {
                actionId: 1, // Reroute ID
                title: `Manual Reroute: ${batteryId}`,
                payload: JSON.stringify({ target: targetName || 'Coordinates', reason: 'Driver Accepted Dispatch' }),
                source: 'driver_app'
            }
        });

        return NextResponse.json({ success: true, message: `Routing ${batteryId} to ${targetName || 'requested location'}` });
    } catch (err) {
        console.error('Divert error:', err);
        return NextResponse.json({ error: 'Failed to divert battery' }, { status: 500 });
    }
}
