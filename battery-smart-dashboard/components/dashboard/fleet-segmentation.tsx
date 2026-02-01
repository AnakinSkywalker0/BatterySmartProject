'use client';

import React, { useEffect, useState } from 'react';
import { Battery, AlertTriangle, CheckCircle2, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FleetStats {
    critical: number;
    warning: number;
    healthy: number;
    total: number;
}

export default function FleetSegmentation() {
    const [stats, setStats] = useState<FleetStats>({ critical: 0, warning: 0, healthy: 0, total: 0 });

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await fetch('/api/stats');
                const data = await res.json();
                setStats({
                    critical: data.fleetStatus.critical,
                    warning: data.fleetStatus.total - data.fleetStatus.critical - data.fleetStatus.healthy, // simplistic warning logic
                    healthy: data.fleetStatus.healthy,
                    total: data.fleetStatus.total
                });
            } catch (err) {
                console.error('Fleet segmentation fetch error:', err);
            }
        };

        fetchStats();
        const interval = setInterval(fetchStats, 3000);
        return () => clearInterval(interval);
    }, []);

    const segments = [
        { label: 'Critical', count: stats.critical, sub: '< 20% SOC', icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-500/10' },
        { label: 'Active', count: stats.healthy, sub: '> 50% SOC', icon: Zap, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
        { label: 'Caution', count: stats.total - stats.critical - stats.healthy, sub: '20-50% SOC', icon: Battery, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    ];

    return (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {segments.map((seg) => {
                const Icon = seg.icon;
                return (
                    <div
                        key={seg.label}
                        className={cn(
                            "flex flex-col gap-1 rounded-xl border border-white/5 p-4 transition-all hover:shadow-xl shadow-lg",
                            seg.bg
                        )}
                    >
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{seg.label}</span>
                            <Icon className={cn("h-4 w-4", seg.color)} />
                        </div>
                        <div className="mt-1 flex items-baseline gap-2">
                            <span className="text-2xl font-bold tabular-nums text-foreground">{seg.count}</span>
                            <span className="text-[10px] text-muted-foreground">{seg.sub}</span>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
