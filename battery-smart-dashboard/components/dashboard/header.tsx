'use client';

import { useState, useEffect } from 'react';
import { Zap, Activity, Radio, Menu, Globe } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { storage, type AgentStatus } from '@/lib/storage-keys';
import CopilotChat from '@/components/dashboard/copilot-chat';
import NotificationInbox from '@/components/dashboard/notification-inbox';
import { cn } from '@/lib/utils';
import { SidebarContent } from './sidebar';

export default function DashboardHeader() {
  const [agentStatus, setAgentStatus] = useState<AgentStatus>('monitoring');
  const [stats, setStats] = useState({
    totalSwapRate: 0,
    surgeStations: 0,
    avgUptime: 0,
    fleetStatus: { critical: 0, healthy: 0, total: 0 }
  });

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/stats');
      const data = await res.json();
      setStats(data);
    } catch (err) {
      console.error('Header stats sync error:', err);
    }
  };

  useEffect(() => {
    const savedStatus = storage.getAgentStatus();
    setAgentStatus(savedStatus);

    // Force dark mode for premium aesthetic
    document.documentElement.classList.add('dark');

    fetchStats();
    const interval = setInterval(fetchStats, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleStatusChange = (status: AgentStatus) => {
    setAgentStatus(status);
    storage.setAgentStatus(status);

    // Theme switching logic removed - keeping dark mode only
    document.documentElement.classList.add('dark');
    localStorage.setItem('theme', 'dark');
  };

  const headerKpis = [
    { label: 'Network Output', value: `${stats.totalSwapRate} /hr`, icon: Zap },
    { label: 'Hot Zones', value: stats.surgeStations, icon: Radio, color: stats.surgeStations > 0 ? 'text-amber-500' : 'text-zinc-500' },
    { label: 'Grid Uptime', value: stats.avgUptime.toFixed(1) + '%', icon: Activity, color: stats.avgUptime < 95 ? 'text-red-500' : 'text-emerald-500' },
  ];

  const statuses: { id: AgentStatus; label: string; dot: string }[] = [
    { id: 'idle', label: 'STANDBY', dot: 'bg-zinc-600' },
    { id: 'monitoring', label: 'RADAR', dot: 'bg-blue-500' },
    { id: 'acting', label: 'ACTIVE', dot: 'bg-emerald-500' },
  ];

  return (
    <header className="sticky top-0 z-[50] w-full px-4 pt-4 pb-2">
      <div className="mx-auto flex h-14 items-center justify-between gap-4 rounded-xl border-2 border-white/10 bg-zinc-900/90 backdrop-blur-md px-6 shadow-2xl transition-colors">
        <div className="flex items-center gap-4">
          <Sheet>
            <SheetTrigger asChild>
              <button className="flex h-9 w-9 items-center justify-center rounded-lg border-2 border-white/10 bg-zinc-950 hover:bg-zinc-800 transition-all active:scale-95">
                <Menu className="h-4 w-4 text-zinc-400" />
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-80 bg-zinc-950 border-r border-white/10">
              <SidebarContent />
            </SheetContent>
          </Sheet>

          <div className="flex flex-col">
            <h2 className="text-xs font-black text-white uppercase tracking-tight flex items-center gap-1.5">
              <Globe className="h-3.5 w-3.5 text-blue-400" />
              Live Fleet Grid
            </h2>
            <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest leading-none">Gurugram Operations</p>
          </div>
        </div>

        <div className="hidden lg:flex items-center gap-8 px-8 border-x border-black/10">
          <div className="flex flex-col">
            <span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest leading-none mb-1">Network Speed</span>
            <span className="text-xs font-black text-black dark:text-white tabular-nums">{stats.totalSwapRate} Swaps /hr</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest leading-none mb-1">Congestion</span>
            <span className={cn("text-xs font-black tabular-nums", stats.surgeStations > 0 ? "text-orange-600" : "text-black dark:text-white")}>
              {stats.surgeStations > 0 ? `${stats.surgeStations} Hot Zones` : "0 Zones Crowded"}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest leading-none mb-1">Grid Health</span>
            <span className={cn("text-xs font-black tabular-nums", stats.avgUptime < 95 ? "text-red-600" : "text-emerald-600")}>
              {stats.avgUptime.toFixed(1)}% Active
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-1 p-1 rounded-lg bg-zinc-950 border-2 border-white/10">
            {statuses.map((s) => (
              <button
                key={s.id}
                onClick={() => handleStatusChange(s.id)}
                className={cn(
                  'relative flex items-center gap-2 rounded-md px-3 py-1 text-[9px] font-black uppercase tracking-widest transition-all',
                  agentStatus === s.id
                    ? 'bg-white text-black shadow-md'
                    : 'text-zinc-500 hover:text-white'
                )}
              >
                <div className={cn("h-1.5 w-1.5 rounded-full", s.dot === 'bg-zinc-600' ? 'bg-zinc-400' : s.dot)} />
                {s.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 pl-2 border-l border-black/10">
            <NotificationInbox />
            <CopilotChat />
          </div>
        </div>
      </div>
    </header>
  );
}
