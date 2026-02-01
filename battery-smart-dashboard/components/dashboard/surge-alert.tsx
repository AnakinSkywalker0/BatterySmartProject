'use client';

import React, { useEffect, useState } from 'react';
import { AlertCircle, TrendingUp, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { triggerAlert } from '@/lib/hooks/use-notifications';

interface SurgeAlertProps {
    surgeCount: number;
}

export default function SurgeAlert({ surgeCount }: SurgeAlertProps) {
    const [isVisible, setIsVisible] = useState(false);
    const [hasDismissed, setHasDismissed] = useState(false);
    const [lastNotifiedCount, setLastNotifiedCount] = useState(0);

    // Request Notification Permission on first mount
    useEffect(() => {
        if (typeof window !== 'undefined' && Notification.permission === 'default') {
            Notification.requestPermission();
        }
    }, []);

    useEffect(() => {
        if (surgeCount > 0 && !hasDismissed) {
            setIsVisible(true);

            // Trigger Browser Push if count increased
            if (surgeCount > lastNotifiedCount && Notification.permission === 'granted') {
                /* Silenced by user request to prevent popups
                new Notification('⚠️ GURUGRAM SURGE ALERT', {
                    body: `Demand spike in ${surgeCount} zones. Rerouting fleet to Green Hubs.`,
                    icon: '/favicon.ico'
                });
                */

                // Add to Global Inbox (Silent)
                triggerAlert({
                    type: 'critical',
                    title: 'Zonal Surge Detected',
                    message: `Congestion in ${surgeCount} sectors`,
                    description: 'Automated rebalancing triggered across Gurugram network.'
                });

                /* Silenced by user request
                triggerAlert({
                    type: 'sms',
                    title: 'Route Optimization',
                    message: 'Drive to Medicity Radar for instant swap & ₹20 bonus.',
                    description: '[ALERT] Sector 45 is critical. Budget Hub available at Medicity.',
                    metadata: {
                        targetLat: 28.435,
                        targetLng: 77.045,
                        targetName: 'Medicity Radar'
                    }
                });
                */

                setLastNotifiedCount(surgeCount);
            }
        } else {
            setIsVisible(false);
        }
    }, [surgeCount, hasDismissed, lastNotifiedCount]);

    if (!isVisible) return null;

    return (
        <div className="fixed top-4 left-0 right-0 z-[100] flex flex-col items-center gap-4 px-4 pointer-events-none">
            {/* Main Push View */}
            <div
                className={cn(
                    "pointer-events-auto flex w-full max-w-lg items-center gap-4 rounded-[2.5rem] border border-white/20 bg-black/80 p-4 pr-6 shadow-[0_0_50px_rgba(0,0,0,0.5)] backdrop-blur-3xl transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)]",
                    isVisible ? "translate-y-0 opacity-100 scale-100" : "-translate-y-24 opacity-0 scale-90"
                )}
            >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500 to-amber-600 shadow-lg animate-pulse ring-1 ring-white/20">
                    <AlertCircle className="h-7 w-7 text-white" />
                </div>

                <div className="flex-1 overflow-hidden">
                    <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                            <span className="text-[10px] font-black text-red-500 uppercase tracking-[0.2em]">Priority Alpha</span>
                        </div>
                        <span className="text-[10px] text-white/40 font-bold whitespace-nowrap">URGENT</span>
                    </div>

                    <h3 className="mt-0.5 text-sm font-black text-white tracking-tight leading-tight uppercase">Zonal Congestion Detected</h3>
                    <p className="truncate text-xs text-zinc-400 font-bold leading-tight mt-0.5">
                        <span className="text-red-500 underline decoration-red-500/30 font-black">₹60 SURCHARGE</span> active in {surgeCount} zones. Save with Reroute.
                    </p>
                </div>

                <button
                    onClick={() => setHasDismissed(true)}
                    className="ml-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 active:scale-90 transition-all"
                >
                    <X className="h-4 w-4 text-white" />
                </button>
            </div>
        </div>
    );
}
