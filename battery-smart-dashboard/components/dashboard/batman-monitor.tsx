'use client';

import React, { useEffect, useState } from 'react';
import { ShieldAlert, Activity, Wrench, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Fault {
    id: string;
    code: string;
    type: 'station' | 'battery';
    severity: 'critical' | 'warning';
    message: string;
    lat?: number;
    lng?: number;
    nearestStation?: string;
}

export default function BatmanMonitor() {
    const [faults, setFaults] = useState<Fault[]>([]);
    const [raisingId, setRaisingId] = useState<string | null>(null);

    useEffect(() => {
        const fetchFaults = async () => {
            try {
                const [sRes, fRes] = await Promise.all([
                    fetch('/api/stations'),
                    fetch('/api/fleet')
                ]);
                const stations = await sRes.json();
                const batteries = await fRes.json();

                const newFaults: Fault[] = [];

                stations.filter((s: any) => s.chargerHealth < 90).forEach((s: any) => {
                    newFaults.push({
                        id: s.id,
                        code: s.code,
                        type: 'station',
                        severity: s.chargerHealth < 70 ? 'critical' : 'warning',
                        message: `Charger health degraded to ${s.chargerHealth.toFixed(0)}%`,
                        nearestStation: s.code
                    });
                });

                batteries.filter((b: any) => b.status === 'faulty' || b.soc < 5).forEach((b: any) => {
                    // Calculate nearest station for battery
                    let nearest = 'DEL-01';
                    let minPerf = Infinity;
                    if (b.lat && b.lng) {
                        stations.forEach((s: any) => {
                            const dist = Math.sqrt(Math.pow(s.lat - b.lat, 2) + Math.pow(s.lng - b.lng, 2));
                            if (dist < minPerf) {
                                minPerf = dist;
                                nearest = s.code;
                            }
                        });
                    }

                    newFaults.push({
                        id: b.id,
                        code: b.code,
                        type: 'battery',
                        severity: 'critical',
                        message: `Intermittent SOC drop detected`,
                        lat: b.lat,
                        lng: b.lng,
                        nearestStation: nearest
                    });
                });

                setFaults(newFaults.slice(0, 5));
            } catch (err) {
                console.error('Batman fetch error:', err);
            }
        };

        fetchFaults();
        const interval = setInterval(fetchFaults, 3000);
        return () => clearInterval(interval);
    }, []);

    const handleRaiseTicket = async (fault: Fault) => {
        setRaisingId(`${fault.id}-${fault.type}`);
        try {
            const title = `Maint: ${fault.code} -> ${fault.nearestStation}`;
            const res = await fetch('/api/actions/execute', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    actionId: 2, // Raising maintenance ticket
                    title,
                    payload: {
                        entity: fault.code,
                        type: fault.type,
                        target: fault.nearestStation,
                        severity: fault.severity
                    },
                }),
            });
            await res.json();
            // Optional: show local success state
        } catch (err) {
            console.error('Raise ticket error:', err);
        } finally {
            setRaisingId(null);
        }
    };

    return (
        <div className="flex flex-col rounded-xl border border-border bg-card p-4 shadow-sm h-full">
            <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                        <ShieldAlert className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                        <h2 className="text-sm font-semibold text-foreground">BATMAN</h2>
                        <p className="text-[10px] text-muted-foreground">Pattern Recognition Engine</p>
                    </div>
                </div>
                <div className="flex items-center gap-1 rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-bold text-blue-500">
                    <Activity className="h-3 w-3 animate-pulse" />
                    SCANNING
                </div>
            </div>

            <div className="space-y-3 flex-1 overflow-y-auto custom-scrollbar">
                {faults.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-center opacity-50">
                        <Eye className="h-8 w-8 mb-2" />
                        <p className="text-[10px] font-medium uppercase tracking-widest">Everything is Optimal</p>
                    </div>
                ) : (
                    faults.map((fault) => {
                        const isRaising = raisingId === `${fault.id}-${fault.type}`;
                        return (
                            <div
                                key={`${fault.id}-${fault.type}`}
                                className={cn(
                                    "group relative flex flex-col gap-1 rounded-lg border border-border/50 bg-muted/20 p-3 transition-all hover:bg-muted/40",
                                    fault.severity === 'critical' ? "border-l-4 border-l-red-500" : "border-l-4 border-l-amber-500"
                                )}
                            >
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-bold text-foreground">{fault.code}</span>
                                    <span className={cn(
                                        "text-[9px] font-bold uppercase tracking-tight",
                                        fault.severity === 'critical' ? "text-red-500" : "text-amber-500"
                                    )}>
                                        {fault.severity}
                                    </span>
                                </div>
                                <p className="text-[10px] leading-relaxed text-muted-foreground">{fault.message}</p>
                                <div className="mt-2 flex items-center justify-between">
                                    <p className="text-[9px] font-medium text-muted-foreground/60 italic">
                                        Near: {fault.nearestStation}
                                    </p>
                                    <button
                                        disabled={isRaising}
                                        onClick={() => handleRaiseTicket(fault)}
                                        className="flex items-center gap-1 text-[9px] font-bold text-primary opacity-0 transition-opacity group-hover:opacity-100 uppercase tracking-widest disabled:opacity-50"
                                    >
                                        {isRaising ? 'Raising...' : 'Raise Ticket'}
                                    </button>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
