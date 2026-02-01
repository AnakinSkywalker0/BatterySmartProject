'use client';

import { useState, useEffect } from 'react';
import { Clock, Navigation, CheckCircle2, AlertCircle, Timer, Zap, Loader2 } from 'lucide-react';
import MapView from './map-view';
import { cn } from '@/lib/utils';

interface Station {
  id: string;
  code: string;
  name: string;
  lat: number;
  lng: number;
  loadPct: number;
  status: string;
  surgePrice: number;
  thermal?: number;
  queueCount?: number;
}

interface StationOverviewProps {
  stations: Station[];
}

export default function StationOverview({ stations }: StationOverviewProps) {
  const [userPos, setUserPos] = useState<{ lat: number; lng: number } | null>(null);
  const [routingId, setRoutingId] = useState<string | null>(null);

  // Fetch user's live GPS position every 1s (USER-001 or any active battery)
  useEffect(() => {
    const fetchUserPos = async () => {
      try {
        const res = await fetch('/api/fleet');
        const fleet = await res.json();
        // Try USER-001 first, fallback to any active battery
        const user = fleet.find((b: any) => b.code === 'USER-001')
          || fleet.find((b: any) => b.status === 'active' && b.lat && b.lng);
        if (user?.lat && user?.lng) {
          setUserPos({ lat: user.lat, lng: user.lng });
        }
      } catch (err) {
        console.error('Failed to fetch user position:', err);
      }
    };
    fetchUserPos();
    const interval = setInterval(fetchUserPos, 3000);
    return () => clearInterval(interval);
  }, []);

  // Calculate real distance in km (1 GPS unit ≈ 111km at equator)
  const calculateDistanceKm = (lat1: number, lng1: number, lat2: number, lng2: number) => {
    const dLat = (lat2 - lat1) * 111;
    const dLng = (lng2 - lng1) * 111 * Math.cos((lat1 * Math.PI) / 180);
    return Math.sqrt(dLat * dLat + dLng * dLng);
  };

  // Convert distance to travel time (30 km/h urban speed)
  const getReachTime = (station: Station): number => {
    if (!userPos || !station.lat || !station.lng) {
      // Fallback: estimate based on load (higher load = further away assumption)
      return Math.ceil(3 + (station.loadPct * 0.1));
    }
    const distKm = calculateDistanceKm(userPos.lat, userPos.lng, station.lat, station.lng);
    const timeMin = Math.max(1, Math.ceil((distKm / 30) * 60)); // Minimum 1 minute
    return timeMin;
  };

  // Wait Time based on load percentage (shorter times for faster optimal choice)
  // 0-30% = 0min, 30-50% = 1min, 50-80% = 2-3min, 80%+ = 4-6min
  const calculateWaitTime = (count: number, load: number) => {
    if (load < 30) return 0; // No wait
    if (load < 50) return 1; // 1 min
    if (load < 80) return Math.ceil(1 + (load - 50) * 0.07); // 2-3 min
    return Math.ceil(3 + (load - 80) * 0.15); // 4-6 min for critical
  };

  // Focused View: Top 3 HUBs by queue (congestion)
  const top3Stations = [...(stations || [])]
    .sort((a, b) => (b.queueCount || 0) - (a.queueCount || 0))
    .slice(0, 3);

  const handleRouteFleet = async (stationId: string) => {
    setRoutingId(stationId);
    try {
      const res = await fetch('/api/station/route-fleet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stationId })
      });
      const data = await res.json();
      if (data.success) {
        setTimeout(() => setRoutingId(null), 1500);
      }
    } catch (err) {
      console.error('Routing failed:', err);
      setRoutingId(null);
    }
  };

  return (
    <div className="h-full flex flex-col rounded-xl border-2 border-white/10 bg-zinc-900 shadow-2xl overflow-hidden transition-all duration-500">
      {/* Utility Header */}
      <div className="p-6 flex items-center justify-between border-b-2 border-white/5 bg-zinc-900/50">
        <div className="flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg border-2 border-white/10 bg-zinc-950 shadow-lg">
            <Clock className="h-5 w-5 text-blue-400" />
          </div>
          <div>
            <h2 className="text-sm font-black text-white uppercase tracking-tight">Time-to-Swap Radar</h2>
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Wait Time vs Reach Time</p>
          </div>
        </div>
      </div>

      {/* Stable Medium Map - Fixed height 500px */}
      <div className="relative h-[500px] border-b-2 border-white/5 bg-black">
        <MapView />
      </div>

      {/* Top 3 Critical Feed - Focused on Time */}
      <div className="flex-1 p-6 space-y-4 bg-zinc-950 overflow-y-auto scrollbar-hide min-h-0">
        <div className="flex items-center justify-between">
          <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Current Wait Intelligence</h3>
          <div className="flex items-center gap-2">
            <Timer className="h-3 w-3 text-zinc-500" />
            <span className="text-[9px] font-bold text-zinc-500 uppercase">Est. 4m / Vehicle</span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {top3Stations.map((s) => {
            const reachTime = getReachTime(s);
            const waitTime = calculateWaitTime(s.queueCount || 0, s.loadPct || 0);
            // Efficient if wait time is low (< 3 min), regardless of distance
            const isEfficient = waitTime < 3;

            return (
              <div
                key={s.id}
                className={cn(
                  "group flex items-center justify-between rounded-xl border-2 p-5 transition-all shadow-xl bg-zinc-900",
                  !isEfficient ? "border-red-900 bg-red-950/20" : "border-white/10"
                )}
              >
                <div className="flex flex-col gap-1 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-white text-base uppercase leading-none">{s.name}</span>
                    <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-tight">{s.code}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-1.5">
                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-zinc-800 border border-white/5">
                      <Navigation className="h-3 w-3 text-zinc-400" />
                      <span className="text-[10px] font-black text-zinc-400">{getReachTime(s)}m reach</span>
                    </div>
                    {isEfficient ? (
                      <div className="flex items-center gap-1 text-emerald-400">
                        <CheckCircle2 className="h-3 w-3" />
                        <span className="text-[9px] font-black uppercase tracking-tight">Efficient Choice</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-red-500">
                        <AlertCircle className="h-3 w-3" />
                        <span className="text-[9px] font-black uppercase tracking-tight">Congested</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-6 pl-6 border-l border-white/10">
                  <div className="flex flex-col items-end">
                    <span className={cn("text-2xl font-black tabular-nums leading-none", !isEfficient ? "text-red-500" : "text-white")}>
                      {waitTime}m
                    </span>
                    <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest mt-1 text-right">EXPECTED<br />WAIT</span>
                  </div>

                  <button
                    onClick={() => handleRouteFleet(s.id)}
                    disabled={routingId === s.id}
                    className={cn(
                      "flex flex-col items-center justify-center h-16 w-12 rounded-xl border-2 transition-all active:scale-95 shadow-lg",
                      routingId === s.id
                        ? "bg-emerald-500/20 border-emerald-500 text-emerald-500"
                        : "bg-zinc-950 border-white/10 text-zinc-500 hover:border-white/20 hover:text-white"
                    )}
                  >
                    {routingId === s.id ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <>
                        <Zap className="h-5 w-5 fill-current" />
                        <span className="text-[8px] font-black mt-1">ROUTE</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
