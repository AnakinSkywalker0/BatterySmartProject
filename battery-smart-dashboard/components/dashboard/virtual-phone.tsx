'use client';

import React, { useState, useEffect } from 'react';
import { Smartphone, Wifi, Battery, Signal, Bell, Navigation, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNotifications, AlertEvent } from '@/lib/hooks/use-notifications';

export default function VirtualPhone() {
    const { alerts } = useNotifications();
    const [activeNotif, setActiveNotif] = useState<AlertEvent | null>(null);
    const [isVibrating, setIsVibrating] = useState(false);
    const [routingTarget, setRoutingTarget] = useState<string | null>(null);
    const [isSyncing, setIsSyncing] = useState(false);

    useEffect(() => {
        if (alerts.length > 0) {
            const latest = alerts[0];
            const isFresh = new Date().getTime() - new Date(latest.timestamp).getTime() < 3000;

            if (isFresh && latest.type === 'sms') {
                setActiveNotif(latest);
                setIsVibrating(true);
                setTimeout(() => setIsVibrating(false), 500);
            }
        }
    }, [alerts]);

    // Proximity-based auto-notification (every 5s)
    useEffect(() => {
        const checkProximity = async () => {
            if (activeNotif || routingTarget) return; // Don't interrupt active routing
            try {
                const [fleetRes, statsRes] = await Promise.all([
                    fetch('/api/fleet'),
                    fetch('/api/stats')
                ]);
                const fleet = await fleetRes.json();
                const { stations } = await statsRes.json();

                const user = fleet.find((b: any) => b.code === 'USER-001')
                    || fleet.find((b: any) => b.status === 'active' && b.lat && b.lng);
                if (!user || !stations?.length) return;

                // Find nearest station
                let nearestStation: any = null;
                let minDist = Infinity;
                stations.forEach((s: any) => {
                    if (!s.lat || !s.lng) return;
                    const dist = Math.sqrt(Math.pow(user.lat - s.lat, 2) + Math.pow(user.lng - s.lng, 2));
                    if (dist < minDist) {
                        minDist = dist;
                        nearestStation = s;
                    }
                });

                // If within 3km (0.027) and SOC < 50%, trigger notification
                if (nearestStation && minDist < 0.027 && user.soc < 50) {
                    setActiveNotif({
                        id: `proximity-${Date.now()}`,
                        type: 'sms',
                        title: 'Route Optimized',
                        message: `Proceed to ${nearestStation.name}. Savings Applied.`,
                        timestamp: new Date().toISOString(),
                        metadata: {
                            targetLat: nearestStation.lat,
                            targetLng: nearestStation.lng,
                            targetName: nearestStation.name
                        }
                    } as any);
                    setIsVibrating(true);
                    setTimeout(() => setIsVibrating(false), 500);
                }
            } catch (err) {
                console.error('Proximity check error:', err);
            }
        };

        const interval = setInterval(checkProximity, 3000);
        return () => clearInterval(interval);
    }, [activeNotif, routingTarget]);

    const handleAccept = async () => {
        setIsSyncing(true);
        try {
            // Fetch fleet and stations
            const [userRes, statsRes] = await Promise.all([
                fetch('/api/fleet'),
                fetch('/api/stats')
            ]);
            const fleet = await userRes.json();
            const { stations } = await statsRes.json();

            // Try USER-001 first, fallback to any active battery
            const userBattery = fleet.find((b: any) => b.code === 'USER-001')
                || fleet.find((b: any) => b.status === 'active' && b.lat && b.lng);

            if (!userBattery || !stations?.length) {
                console.error('No user battery or stations found');
                setActiveNotif(null);
                return;
            }

            // Find nearest station based on user's GPS
            let nearestStation = stations[0];
            let minDist = Infinity;
            stations.forEach((s: any) => {
                if (!s.lat || !s.lng || !userBattery.lat || !userBattery.lng) return;
                const dist = Math.sqrt(Math.pow(userBattery.lat - s.lat, 2) + Math.pow(userBattery.lng - s.lng, 2));
                if (dist < minDist) {
                    minDist = dist;
                    nearestStation = s;
                }
            });

            // Use metadata target if available, otherwise use nearest
            const targetLat = activeNotif?.metadata?.targetLat ?? nearestStation.lat;
            const targetLng = activeNotif?.metadata?.targetLng ?? nearestStation.lng;
            const targetName = activeNotif?.metadata?.targetName ?? nearestStation.name;

            const res = await fetch('/api/battery/divert', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    batteryId: userBattery.code,
                    targetLat,
                    targetLng,
                    targetName
                })
            });

            if (res.ok) {
                setRoutingTarget(targetName || 'Nearest Hub');
                setActiveNotif(null);
            }
        } catch (err) {
            console.error('Failed to accept reroute:', err);
            setActiveNotif(null); // Clear notification on error to stop spinner
        } finally {
            setIsSyncing(false);
        }
    };

    return (
        <div className={cn(
            "relative w-[220px] h-[440px] bg-[#0a0a0a] rounded-[32px] border-[6px] border-[#1c1c1e] shadow-2xl overflow-hidden transition-all duration-300",
            isVibrating && "translate-x-1"
        )}>
            {/* Status Bar */}
            <div className="absolute top-0 w-full h-8 px-5 flex items-center justify-between z-20">
                <span className="text-[10px] font-bold text-white/80">{new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}</span>
                <div className="flex items-center gap-1.5 opacity-60">
                    <Signal className="h-2.5 w-2.5 text-white" />
                    <Wifi className="h-2.5 w-2.5 text-white" />
                    <Battery className="h-2.5 w-2.5 text-white" />
                </div>
            </div>

            {/* Content Area */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#1c1c1e] to-black z-0 flex flex-col items-center justify-center p-4">
                {routingTarget ? (
                    <div className="w-full flex flex-col items-center animate-in zoom-in duration-500">
                        <div className="h-10 w-10 rounded-full bg-emerald-500/20 flex items-center justify-center mb-4 border border-emerald-500/30">
                            <Navigation className="h-5 w-5 text-emerald-500 animate-pulse" />
                        </div>

                        <p className="text-[8px] font-black text-emerald-500 uppercase tracking-[0.2em] mb-1">Copilot Active</p>
                        <h3 className="text-[12px] font-black text-white leading-tight text-center mb-4 uppercase tracking-tighter">
                            Target: {routingTarget}
                        </h3>

                        <div className="w-full bg-white/5 rounded-xl p-3 border border-white/10 space-y-3">
                            <div className="flex flex-col gap-1">
                                <div className="flex justify-between text-[8px] font-black text-zinc-500 uppercase tracking-widest">
                                    <span>Enroute</span>
                                    <span className="text-emerald-500">ETA {Math.ceil(Math.random() * 5 + 2)}m</span>
                                </div>
                                <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                                    <div className="h-full w-1/2 bg-emerald-500 rounded-full" />
                                </div>
                            </div>

                            <p className="text-[9px] text-zinc-300 font-bold leading-normal italic">
                                "Navigating to {routingTarget}. Efficiency gain: +{(Math.random() * 10 + 10).toFixed(0)}% grid capacity."
                            </p>
                        </div>

                        <button
                            onClick={() => setRoutingTarget(null)}
                            className="mt-6 px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-[8px] font-black text-red-500 hover:bg-red-500 hover:text-white transition-all uppercase tracking-widest"
                        >
                            Abort Mission
                        </button>
                    </div>
                ) : (
                    <div className="text-center opacity-20">
                        <Bell className="h-12 w-12 text-white mb-2 mx-auto" />
                        <p className="text-[10px] font-bold uppercase tracking-widest text-white">Driver App</p>
                    </div>
                )}
            </div>

            {/* Heads-up Notification Overlay */}
            {activeNotif && (
                <div className="absolute top-5 left-2 right-2 z-30 animate-in slide-in-from-top duration-300">
                    <div className="bg-[#1c1c1e]/95 backdrop-blur-md rounded-2xl p-3 border border-white/20 shadow-2xl">
                        <div className="flex items-center gap-2 mb-1.5">
                            <div className="h-4 w-4 rounded-full bg-emerald-500 flex items-center justify-center">
                                <Navigation className="h-2 w-2 text-white" />
                            </div>
                            <span className="text-[8px] font-black text-white/60 uppercase tracking-tighter">Battery Smart</span>
                            <span className="text-[8px] text-white/30 ml-auto">now</span>
                        </div>
                        <h4 className="text-[10px] font-bold text-white leading-tight mb-0.5">{activeNotif.title}</h4>
                        <p className="text-[9px] text-emerald-400 font-bold leading-snug line-clamp-3">{activeNotif.message}</p>

                        <div className="mt-3 flex flex-col gap-1.5">
                            <button
                                onClick={handleAccept}
                                disabled={isSyncing}
                                className="w-full h-8 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 rounded-lg flex items-center justify-center transition-all active:scale-90"
                            >
                                {isSyncing ? (
                                    <div className="h-3 w-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <span className="text-[10px] font-black text-white px-2 uppercase tracking-tighter">Accept Route</span>
                                )}
                            </button>
                            <button
                                onClick={() => setActiveNotif(null)}
                                className="w-full h-8 bg-white/5 hover:bg-white/10 rounded-lg flex items-center justify-center transition-colors"
                            >
                                <span className="text-[10px] font-black text-white/60 uppercase tracking-tighter">Dismiss</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Navigation Bar Area */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-16 h-1 bg-white/20 rounded-full z-20" />

            {/* Subtle Reflection */}
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent pointer-events-none z-10" />
        </div>
    );
}
