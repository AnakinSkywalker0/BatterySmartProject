import { useState, useEffect } from 'react';

export function useDashboardStats(intervalMs: number = 3000) {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const updateDashboard = async () => {
        try {
            // Trigger simulation
            await fetch('/api/simulate', { method: 'POST' });
            // Fetch stats
            const res = await fetch('/api/stats');
            const data = await res.json();
            setStats(data);
        } catch (err) {
            console.error('Dashboard Sync Error:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        updateDashboard();
        const interval = setInterval(updateDashboard, intervalMs);
        return () => clearInterval(interval);
    }, [intervalMs]);

    return { stats, loading };
}
