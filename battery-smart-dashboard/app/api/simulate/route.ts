import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calculateAutonomousLogic, GUR_BOUNDS, type Station, type Battery } from '@/lib/simulation-engine';

export async function POST() {
    try {
        const stations = await (prisma as any).station.findMany() as Station[];
        const batteries = await (prisma as any).battery.findMany() as Battery[];

        const DRAIN_RATE = 0.4;
        const CHARGE_RATE_FAST = 6.0;
        const CHARGE_RATE_SLOW = 2.0;
        const MOVEMENT_STEP = 0.006; // Slower, realistic speed
        const FLEET_TARGET = 25; // Optimal Fleet for demo

        const updates = [];
        const debugLogs: string[] = [];

        // 0. Fleet Expansion Auto-Logic
        if (batteries.length < FLEET_TARGET) {
            const diff = FLEET_TARGET - batteries.length;
            debugLogs.push(`[SIM] Boosting fleet by ${diff}`);
            for (let i = 0; i < diff; i++) {
                const id = `AUTO-${Date.now()}-${i}`;
                const code = `BAT-${200 + i}`;
                await (prisma as any).battery.create({
                    data: {
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
                    }
                });
            }
            // Refresh batteries list after creation
            const newBatteries = await (prisma as any).battery.findMany() as Battery[];
            batteries.length = 0;
            batteries.push(...newBatteries);
        }

        // 0.1. Ensure USER-001 exists (POV Battery)
        const userExists = batteries.find((b: Battery) => b.code === 'USER-001');
        if (!userExists) {
            await (prisma as any).battery.create({
                data: {
                    id: `USER-${Date.now()}`,
                    code: 'USER-001',
                    lat: 28.470 + (Math.random() - 0.5) * 0.01,
                    lng: 77.050 + (Math.random() - 0.5) * 0.01,
                    soc: 25 + Math.random() * 20, // Low SOC to trigger alerts
                    soh: 95 + Math.random() * 5,
                    temp: 28,
                    status: 'active',
                    voltage: 51.5,
                    speed: 0,
                    cycles: 10
                }
            });
            // Refresh batteries list
            const refreshedBatteries = await (prisma as any).battery.findMany() as Battery[];
            batteries.length = 0;
            batteries.push(...refreshedBatteries);
        }

        // 1. Main Simulation
        for (const battery of batteries) {
            let { soc, lat, lng, status, targetLat, targetLng, cycles = 0 } = battery;
            let currentSpeed = 0;
            let currentVoltage = 52.0;

            if (status === 'active' && lat && lng) {
                soc = Math.max(0, soc - DRAIN_RATE);
                const { latForce, lngForce } = calculateAutonomousLogic(battery, stations, batteries);
                // Increased noise for "scattered" effect
                const noise = (Math.random() - 0.5) * MOVEMENT_STEP * 1.5;

                const bLatForce = lat < GUR_BOUNDS.latMin ? 0.012 : lat > GUR_BOUNDS.latMax ? -0.012 : 0;
                const bLngForce = lng < GUR_BOUNDS.lngMin ? 0.012 : lng > GUR_BOUNDS.lngMax ? -0.012 : 0;

                const deltaLat = noise + latForce + bLatForce;
                const deltaLng = noise + lngForce + bLngForce;

                lat = lat + deltaLat;
                lng = lng + deltaLng;

                // Speed calculation (boosted scaling)
                currentSpeed = Math.sqrt(deltaLat * deltaLat + deltaLng * deltaLng) * 1500;

                // Voltage calculation: 48V (empty) to 54V (full)
                currentVoltage = 48 + (soc / 100) * 6 + (Math.random() * 0.2);

                if (targetLat && targetLng) {
                    const dist = Math.sqrt(Math.pow(lat - targetLat, 2) + Math.pow(lng - targetLng, 2));
                    if (dist < 0.005) {
                        targetLat = null; targetLng = null;
                        debugLogs.push(`[LOGISTICS] ${battery.code} arrived.`);
                    }
                }

                if (soc < 10) status = 'charging';
            } else if (status === 'charging') {
                soc = Math.min(100, soc + (soc < 80 ? CHARGE_RATE_FAST : CHARGE_RATE_SLOW));
                currentVoltage = 54.5 + (Math.random() * 0.5); // Charging voltage
                currentSpeed = 0;
                if (soc >= 98) {
                    status = 'active';
                    cycles++;
                }
            }

            updates.push((prisma as any).battery.update({
                where: { id: battery.id },
                data: {
                    soc,
                    lat,
                    lng,
                    status,
                    targetLat,
                    targetLng,
                    voltage: currentVoltage,
                    speed: currentSpeed,
                    cycles
                }
            }));
        }

        // 2. Station Logic (Thermals & Queues)
        for (const station of stations) {
            // Physical Density (Sector: 0.04 ~= 4.5km for tighter zones)
            const nearbyFleet = batteries.filter(b => {
                if (!b.lat || !b.lng) return false;
                return Math.sqrt(Math.pow(b.lat - station.lat, 2) + Math.pow(b.lng - station.lng, 2)) < 0.04;
            });

            // Arrival Queue: Count batteries currently targeting THIS station
            const localQueue = batteries.filter(b =>
                b.targetLat === station.lat && b.targetLng === station.lng
            ).length;

            // Load based on nearby battery count (15 batteries = 100% load)
            // 7 batteries = ~47% (amber), 12+ batteries = 80%+ (red)
            const loadPct = Math.min(100, (nearbyFleet.length / 15) * 100);

            // Thermal Logic: Baseline 28°C, increasing with load
            const thermal = 28 + (loadPct * 0.25) + (Math.random() * 2);

            updates.push((prisma as any).station.update({
                where: { id: station.id },
                data: {
                    loadPct,
                    surgePrice: loadPct > 80 ? 2.5 : loadPct > 50 ? 1.8 : 1.0,
                    status: loadPct > 80 ? 'critical' : loadPct > 50 ? 'degraded' : 'ok'
                }
            }));
        }

        await prisma.$transaction(updates);
        return NextResponse.json({ success: true, logs: debugLogs });
    } catch (err) {
        console.error('Sim Error:', err);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
