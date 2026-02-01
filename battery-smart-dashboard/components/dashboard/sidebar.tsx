'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Battery, LogOut, Shield, Zap, Activity, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const NAV_ITEMS = [
  { label: 'Tactical Grid', icon: LayoutDashboard, href: '/' },
  { label: 'Fleet Health', icon: Activity, href: '#' },
  { label: 'Energy Load', icon: Zap, href: '#' },
  { label: 'Security Hub', icon: Shield, href: '#' },
];

export function SidebarContent() {
  const pathname = usePathname();

  return (
    <div className="flex h-full w-full flex-col bg-zinc-950 text-white border-r-2 border-black">
      <div className="flex h-20 items-center px-8 border-b-2 border-black bg-zinc-900">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg border-2 border-black bg-blue-600 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <Battery className="h-6 w-6 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-black tracking-tight uppercase leading-none">Battery Smart</span>
            <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-[0.2em] mt-1">Grid OS v2.4</span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-8 bg-zinc-950">
        <nav className="space-y-4 px-4">
          <div className="px-4 mb-2">
            <p className="text-[8px] font-black text-zinc-600 uppercase tracking-[0.3em]">Main Menu</p>
          </div>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.label}
                href={item.href}
                className={cn(
                  'flex items-center gap-4 rounded-lg px-4 py-3 text-[11px] font-black uppercase tracking-[0.1em] transition-all group border-2',
                  isActive
                    ? 'bg-blue-600 text-white border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
                    : 'text-zinc-500 hover:text-white hover:bg-zinc-900 border-transparent'
                )}
              >
                <Icon className={cn("h-4 w-4", isActive ? "text-white" : "text-zinc-600 group-hover:text-blue-500")} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-10 px-8">
          <div className="p-4 rounded-lg border-2 border-zinc-800 bg-zinc-900/50">
            <div className="flex items-center gap-2 mb-2">
              <Info className="h-3 w-3 text-blue-500" />
              <span className="text-[9px] font-black uppercase tracking-tight text-white">Grid Status</span>
            </div>
            <p className="text-[9px] text-zinc-500 leading-relaxed font-bold">
              All Sector Hubs in Gurugram are syncing with Autonomous Command.
            </p>
          </div>
        </div>
      </div>

      <div className="p-6 border-t-2 border-black bg-zinc-900">
        <Button
          variant="ghost"
          className="w-full justify-start gap-4 rounded-lg px-4 py-6 text-[11px] font-black uppercase tracking-widest text-zinc-500 hover:text-white hover:bg-red-600 border-2 border-transparent hover:border-black transition-all hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
        >
          <LogOut className="h-4 w-4" />
          Terminal Exit
        </Button>
      </div>
    </div>
  );
}

export default function Sidebar() {
  return null;
}
