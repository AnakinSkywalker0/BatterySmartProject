'use client';

import { useState, useEffect, useRef } from 'react';
import { Terminal, Cpu, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { triggerAlert } from '@/lib/hooks/use-notifications';

interface DebugLog {
    id: string;
    title: string;
    timestamp: string;
}

export default function TacticalFeed() {
    const [logs, setLogs] = useState<DebugLog[]>([]);
    const scrollRef = useRef<HTMLDivElement>(null);

    const fetchDebugLogs = async () => {
        try {
            const res = await fetch('/api/action-logs?limit=50');
            const data = await res.json();
            const debugData = (data as any[]).filter(l => l.actionId === 999);
            setLogs(debugData);
        } catch (err) {
            console.error('Tactical feed error:', err);
        }
    };

    const handleManualTrigger = () => {
        triggerAlert({
            type: 'sms',
            title: 'Route Optimization',
            message: 'Manual Override: Drive to Medicity Radar for instant swap & ₹20 bonus.',
            description: '[MANUAL] Dispatcher initiated reroute for testing.',
            metadata: {
                targetLat: 28.435,
                targetLng: 77.045,
                targetName: 'Medicity Radar'
            }
        });
    };

    useEffect(() => {
        fetchDebugLogs();
        const interval = setInterval(fetchDebugLogs, 3000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="flex flex-col h-full border-t border-border bg-black/20 backdrop-blur-sm">
            <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-muted/30">
                <div className="flex items-center gap-2">
                    <Terminal className="h-3 w-3 text-emerald-500" />
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-foreground/70">Tactical Debug Feed</span>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleManualTrigger}
                        className="px-2 py-0.5 rounded bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 transition-colors active:scale-95"
                    >
                        <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-tighter">Fire Alert</span>
                    </button>
                    <div className="h-4 w-px bg-border mx-1" />
                    <div className="flex items-center gap-1">
                        <div className="h-1 w-1 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[9px] font-medium text-emerald-500/70 lowercase tracking-tighter">live_stream</span>
                    </div>
                </div>
            </div>

            <ScrollArea className="flex-1 p-3 font-mono text-[10px]">
                <div className="space-y-1.5">
                    {logs.length === 0 ? (
                        <div className="text-muted-foreground/30 italic py-4">Awaiting system initialization...</div>
                    ) : (
                        logs.map((log) => (
                            <div key={log.id} className="flex gap-3 leading-relaxed group">
                                <span className="text-emerald-500/40 shrink-0">[{log.timestamp}]</span>
                                <span className={cn(
                                    "text-foreground/60 transition-colors group-hover:text-foreground/90",
                                    log.title.includes('[TRAFFIC]') && "text-blue-400/70",
                                    log.title.includes('[FLEET]') && "text-amber-400/70"
                                )}>
                                    {log.title}
                                </span>
                            </div>
                        ))
                    )}
                </div>
            </ScrollArea>

            <div className="px-4 py-1.5 border-t border-border/50 bg-black/40 flex justify-between items-center">
                <div className="flex items-center gap-2 text-[9px] text-muted-foreground/50 tracking-widest font-bold uppercase">
                    <Cpu className="h-2.5 w-2.5" />
                    Logic: Congestion_Repulsion_v2.2
                </div>
            </div>
        </div>
    );
}
