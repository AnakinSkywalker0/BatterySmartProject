'use client';

import Sidebar from '@/components/dashboard/sidebar';
import DashboardHeader from '@/components/dashboard/header';
import StationOverview from '@/components/dashboard/station-overview';
import FleetSegmentation from '@/components/dashboard/fleet-segmentation';
import BatmanMonitor from '@/components/dashboard/batman-monitor';
import ActionPanel from '@/components/dashboard/action-panel';
import SurgeAlert from '@/components/dashboard/surge-alert';
import VirtualPhone from '@/components/dashboard/virtual-phone';
import { useDashboardStats } from '@/lib/hooks/use-dashboard-stats';
import { useState } from 'react';
import { Smartphone, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function Dashboard() {
  const { stats } = useDashboardStats(1000);
  const [showPhone, setShowPhone] = useState(false);

  return (
    <div className="flex min-h-screen bg-background text-foreground selection:bg-emerald-500/30">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        <DashboardHeader />

        <main className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-6">
          <FleetSegmentation />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 space-y-6">
              <StationOverview stations={stats?.stations || []} />
            </div>

            <div className="lg:col-span-4 flex flex-col gap-6">
              <div className="h-[400px]">
                <BatmanMonitor />
              </div>
              <div className="flex-1">
                <ActionPanel />
              </div>
            </div>
          </div>
        </main>

        <div className="fixed bottom-6 right-6 z-50">
          <div className="flex flex-col items-end gap-3">
            {showPhone && (
              <div className="animate-in slide-in-from-bottom-10 fade-in duration-300 mb-2">
                <div className="relative group">
                  <button
                    onClick={() => setShowPhone(false)}
                    className="absolute -top-3 -right-3 z-[60] h-8 w-8 rounded-full bg-red-500 text-white flex items-center justify-center border-2 border-black shadow-lg hover:scale-110 transition-all opacity-0 group-hover:opacity-100"
                  >
                    <X className="h-4 w-4" />
                  </button>
                  <VirtualPhone />
                </div>
              </div>
            )}

            <button
              onClick={() => setShowPhone(!showPhone)}
              className={cn(
                "h-14 w-14 rounded-full border-2 border-white/20 shadow-2xl transition-all flex items-center justify-center",
                showPhone ? "bg-zinc-800 text-white" : "bg-zinc-900 text-emerald-500 hover:bg-zinc-800 hover:text-emerald-400"
              )}
            >
              <Smartphone className={cn("h-6 w-6", showPhone ? "rotate-90" : "animate-pulse")} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
