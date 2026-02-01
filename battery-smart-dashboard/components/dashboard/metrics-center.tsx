'use client';

import { useState, useEffect } from 'react';
import { Activity, AlertCircle, Clock, Cpu, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MetricData {
  queueLengthMins: number;
  chargerUptimePct: number;
  inventoryChargedPct: number;
}

interface AlertItem {
  id: string;
  station: string;
  message: string;
  type: string;
  time: string;
}

export default function MetricsCenter() {
  const [metrics, setMetrics] = useState<MetricData | null>(null);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetch('/api/metrics').then((r) => r.json()), fetch('/api/alerts').then((r) => r.json())])
      .then(([m, a]) => {
        setMetrics(m);
        setAlerts(Array.isArray(a) ? a : []);
      })
      .catch(() => {
        setMetrics({ queueLengthMins: 12, chargerUptimePct: 92, inventoryChargedPct: 45 });
        setAlerts([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const queueStatus = metrics && metrics.queueLengthMins > 10 ? 'critical' : metrics && metrics.queueLengthMins > 5 ? 'degraded' : 'ok';
  const uptimeStatus = metrics && metrics.chargerUptimePct < 95 ? (metrics.chargerUptimePct < 90 ? 'critical' : 'degraded') : 'ok';
  const invStatus = metrics && metrics.inventoryChargedPct < 50 ? 'critical' : metrics && metrics.inventoryChargedPct < 70 ? 'degraded' : 'ok';

  const kpis = metrics
    ? [
      { label: 'Queue length', value: `${metrics.queueLengthMins} min`, status: queueStatus, icon: Clock },
      { label: 'Charger uptime', value: `${metrics.chargerUptimePct}%`, status: uptimeStatus, icon: Cpu },
      { label: 'Inventory (charged)', value: `${metrics.inventoryChargedPct}%`, status: invStatus, icon: Activity },
    ]
    : [];

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center rounded-xl border border-border bg-card p-6 shadow-sm">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <Activity className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-foreground">Operational Metrics</h2>
            <p className="text-xs text-muted-foreground">Real-time Performance</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 mb-8">
        {kpis.map((k) => {
          const Icon = k.icon;
          return (
            <div
              key={k.label}
              className={cn(
                'group flex items-center justify-between rounded-lg border p-4 transition-all hover:shadow-md',
                k.status === 'critical' ? 'border-red-500/30 bg-red-500/5 hover:bg-red-500/10' :
                  k.status === 'degraded' ? 'border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10' :
                    'border-border bg-muted/30 hover:bg-muted/50 hover:border-primary/20'
              )}
            >
              <div className="flex items-center gap-3">
                <div className={cn("p-2 rounded-md",
                  k.status === 'critical' ? 'bg-red-500/10 text-red-500' :
                    k.status === 'degraded' ? 'bg-amber-500/10 text-amber-500' :
                      'bg-background text-muted-foreground group-hover:text-primary transition-colors'
                )}>
                  <Icon className="h-5 w-5" />
                </div>
                <span className="text-sm font-medium text-muted-foreground">{k.label}</span>
              </div>
              <span
                className={cn(
                  'text-lg font-bold tabular-nums',
                  k.status === 'critical' && 'text-red-600 dark:text-red-400',
                  k.status === 'degraded' && 'text-amber-600 dark:text-amber-400',
                  k.status === 'ok' && 'text-foreground'
                )}
              >
                {k.value}
              </span>
            </div>
          );
        })}
      </div>

      <div className="flex-1 min-h-0 flex flex-col border-t border-border pt-5">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">Recent Alerts</span>
          </div>
          <span className="text-xs rounded-full bg-muted px-2 py-0.5 text-muted-foreground">{alerts.length} Active</span>
        </div>

        <div className="space-y-3 overflow-y-auto pr-1 custom-scrollbar">
          {alerts.length === 0 ? (
            <div className="flex items-center justify-center py-6 text-sm text-muted-foreground">
              No active alerts.
            </div>
          ) : (
            alerts.map((a) => (
              <div
                key={a.id}
                className={cn(
                  'relative overflow-hidden rounded-lg border pl-4 pr-3 py-3 shadow-sm transition-all hover:shadow-md',
                  a.type === 'error' ? 'border-red-200 bg-red-50/50 dark:border-red-900/30 dark:bg-red-900/10' :
                    a.type === 'warning' ? 'border-amber-200 bg-amber-50/50 dark:border-amber-900/30 dark:bg-amber-900/10' :
                      'border-border bg-card'
                )}
              >
                <div className={cn("absolute left-0 top-0 bottom-0 w-1",
                  a.type === 'error' ? 'bg-red-500' :
                    a.type === 'warning' ? 'bg-amber-500' :
                      'bg-blue-500'
                )} />

                <div className="flex justify-between items-start gap-2 mb-1">
                  <span className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">{a.station}</span>
                  <span className="text-[10px] text-muted-foreground/70 tabular-nums">{a.time}</span>
                </div>
                <p className="text-sm font-medium text-foreground leading-snug">{a.message}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
