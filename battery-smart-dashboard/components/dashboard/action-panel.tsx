'use client';

import { useState, useEffect } from 'react';
import { Zap, ArrowRight, Activity, ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { triggerAlert } from '@/lib/hooks/use-notifications';

const EXECUTE_API = '/api/actions/execute';

interface ActionLog {
  id: string;
  actionId: number;
  title: string;
  runId?: string;
  timestamp: string;
}

export default function ActionPanel() {
  const [logs, setLogs] = useState<ActionLog[]>([]);
  const [executingId, setExecutingId] = useState<string | null>(null);
  const [proactiveHints, setProactiveHints] = useState<{ battery: string; recommendation: string; reason: string }[]>([]);

  const fetchLogs = () => {
    fetch('/api/action-logs?limit=10')
      .then((r) => r.json())
      .then((data) => setLogs(Array.isArray(data) ? data : []))
      .catch(() => setLogs([]));
  };

  const fetchProactiveHints = async () => {
    try {
      const [fRes, sRes] = await Promise.all([fetch('/api/fleet'), fetch('/api/stats')]);
      const fleet = await fRes.json();
      const statsData = await sRes.json();
      const stations = statsData.stations || [];

      const criticalB = fleet.filter((b: any) => b.soc < 20);
      const hints = criticalB.map((b: any) => {
        const optimalStation = stations
          .filter((s: any) => s.loadPct < 40)
          .sort((a: any, b_st: any) => {
            const da = Math.sqrt(Math.pow(b.lat - a.lat, 2) + Math.pow(b.lng - a.lng, 2));
            const db = Math.sqrt(Math.pow(b.lat - b_st.lat, 2) + Math.pow(b.lng - b_st.lng, 2));
            return da - db;
          })[0] || stations[0] || { name: 'Nearest Hub', loadPct: 0 };

        return {
          battery: b.code,
          recommendation: `Reroute to ${optimalStation.name}`,
          reason: `SOC ${b.soc.toFixed(0)}% — Est. ₹${Math.ceil((optimalStation.surgePrice || 1) * 30)} Saved`
        };
      });
      setProactiveHints(hints.slice(0, 3));
    } catch (err) {
      console.error('Proactive hints error:', err);
    }
  };

  useEffect(() => {
    fetchLogs();
    fetchProactiveHints();
    const interval = setInterval(fetchProactiveHints, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleAction = async (hintId: string, title: string) => {
    if (executingId !== null) return;
    setExecutingId(hintId);
    try {
      const targetName = title.split('to ')[1] || 'Optimized Hub';
      const [fRes, sRes] = await Promise.all([fetch('/api/fleet'), fetch('/api/stats')]);
      const fleet = await fRes.json();
      const statsData = await sRes.json();
      const stations = statsData.stations || [];
      const battery = fleet.find((b: any) => b.code === hintId);
      const station = stations.find((s: any) => s.name === targetName);

      if (battery && station) {
        await fetch('/api/battery/divert', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            batteryId: battery.id,
            targetLat: station.lat,
            targetLng: station.lng,
            targetName: station.name
          })
        });
      }

      await fetch(EXECUTE_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actionId: 1, title, payload: { source: 'Autonomous Engine' } }),
      });

      triggerAlert({
        type: 'sms',
        title: 'Route Optimized',
        message: `Proceed to ${targetName}. Savings Applied.`,
        description: `Manual diversion for unit ${hintId} to ${targetName} successful.`,
        metadata: { targetName }
      });
      fetchLogs();
    } finally {
      setExecutingId(null);
    }
  };

  return (
    <div className="flex h-full flex-col rounded-xl border-2 border-white/10 bg-zinc-900 shadow-2xl p-6 overflow-hidden">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg border-2 border-white/10 bg-zinc-950 shadow-lg">
            <Zap className="h-5 w-5 text-orange-400" />
          </div>
          <div>
            <h2 className="text-sm font-black text-white uppercase tracking-tight leading-none mb-1">Action Registry</h2>
            <div className="flex items-center gap-1.5">
              <div className="h-1.5 w-1.5 rounded-full bg-blue-600 animate-pulse" />
              <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest">Autonomous Sync</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto scrollbar-hide">
        {proactiveHints.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 rounded-xl border-2 border-dashed border-zinc-200">
            <Activity className="h-8 w-8 text-zinc-200 mb-2" />
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Optimization Stable</p>
          </div>
        ) : (
          proactiveHints.map((hint, i) => (
            <button
              key={i}
              onClick={() => handleAction(hint.battery, hint.recommendation)}
              disabled={executingId !== null}
              className="group relative flex w-full items-center gap-4 rounded-xl border-2 border-white/5 bg-zinc-900/50 p-4 text-left transition-all hover:bg-zinc-800 active:scale-[0.98] shadow-lg"
            >
              <div className="flex h-10 w-10 min-w-[40px] items-center justify-center rounded-lg border-2 border-white/10 bg-zinc-950 group-hover:bg-blue-600 group-hover:text-white transition-all">
                <ArrowUpRight className="h-5 w-5" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-black text-blue-400 uppercase tracking-tight">{hint.battery}</span>
                  <div className="h-1 w-1 rounded-full bg-blue-600/40" />
                  <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">PRIORITY DISPATCH</span>
                </div>
                <p className="text-xs font-black text-white truncate uppercase tracking-tight leading-none">{hint.recommendation}</p>
                <p className="text-[10px] text-zinc-500 font-bold truncate tracking-tight mt-1">{hint.reason}</p>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
