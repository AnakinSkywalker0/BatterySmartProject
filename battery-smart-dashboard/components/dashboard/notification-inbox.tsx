'use client';

import { useState } from 'react';
import { Bell, X, Check, Trash2, Smartphone } from 'lucide-react';
import { useNotifications } from '@/lib/hooks/use-notifications';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function NotificationInbox() {
    const { alerts, markAsRead, clearAll } = useNotifications();
    const unreadCount = alerts.filter(a => !a.read).length;

    return (
        <Popover>
            <PopoverTrigger asChild>
                <button className="relative p-2 rounded-full hover:bg-muted/50 transition-colors group">
                    <Bell className={cn(
                        "h-5 w-5 transition-colors",
                        unreadCount > 0 ? "text-amber-500 fill-amber-500/20" : "text-muted-foreground group-hover:text-foreground"
                    )} />
                    {unreadCount > 0 && (
                        <span className="absolute top-1.5 right-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-red-600 border-2 border-background text-[8px] font-black text-white animate-in zoom-in">
                            {unreadCount}
                        </span>
                    )}
                </button>
            </PopoverTrigger>
            <PopoverContent className="w-[380px] p-0 mr-4 bg-zinc-950 border-zinc-800 shadow-2xl" align="end">
                <div className="flex items-center justify-between border-b border-zinc-800 p-4">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-black uppercase tracking-widest text-white">Inbox</span>
                        {unreadCount > 0 && (
                            <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-extrabold text-amber-500">
                                {unreadCount} NEW
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-500 hover:text-white" onClick={clearAll}>
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                <ScrollArea className="h-[450px]">
                    {alerts.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 opacity-30">
                            <Bell className="h-10 w-10 mb-2" />
                            <p className="text-xs font-bold uppercase tracking-widest">Awaiting Alerts</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-zinc-900">
                            {alerts.map((alert) => (
                                <div
                                    key={alert.id}
                                    onClick={() => markAsRead(alert.id)}
                                    className={cn(
                                        "group relative flex flex-col gap-1 p-4 transition-colors cursor-pointer",
                                        alert.read ? "bg-transparent opacity-60" : "bg-white/[0.02] hover:bg-white/[0.04]"
                                    )}
                                >
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-2">
                                            {alert.type === 'sms' && <Smartphone className="h-3 w-3 text-blue-400" />}
                                            <span className={cn(
                                                "text-[9px] font-black uppercase tracking-widest",
                                                alert.type === 'critical' ? "text-red-500" :
                                                    alert.type === 'sms' ? "text-blue-400" : "text-amber-500"
                                            )}>
                                                {alert.title}
                                            </span>
                                        </div>
                                        <span className="text-[9px] text-zinc-600 font-mono">
                                            {alert.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                    <p className="text-xs font-bold text-zinc-100">{alert.message}</p>
                                    <p className="text-[10px] text-zinc-500 leading-relaxed italic">{alert.description}</p>

                                    {!alert.read && (
                                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-500" />
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>
                <div className="border-t border-zinc-800 p-3 bg-zinc-900/50">
                    <p className="text-center text-[9px] font-bold text-zinc-600 uppercase tracking-[0.2em]">End of Transmission</p>
                </div>
            </PopoverContent>
        </Popover>
    );
}
