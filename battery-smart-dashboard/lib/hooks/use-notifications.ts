'use client';

import { useState, useEffect, useCallback } from 'react';

export interface AlertEvent {
    id: string;
    type: 'critical' | 'warning' | 'info' | 'sms';
    title: string;
    message: string;
    description: string;
    timestamp: Date;
    read: boolean;
    metadata?: {
        targetLat?: number;
        targetLng?: number;
        targetName?: string;
    };
}

// Global alert bus for simplicity in this proto
let alertListeners: ((alert: AlertEvent) => void)[] = [];

export const useNotifications = () => {
    const [alerts, setAlerts] = useState<AlertEvent[]>([]);

    useEffect(() => {
        const handler = (newAlert: AlertEvent) => {
            setAlerts(prev => [newAlert, ...prev].slice(0, 50));
        };
        alertListeners.push(handler);
        return () => { alertListeners = alertListeners.filter(l => l !== handler); };
    }, []);

    const markAsRead = useCallback((id: string) => {
        setAlerts(prev => prev.map(a => a.id === id ? { ...a, read: true } : a));
    }, []);

    const clearAll = useCallback(() => setAlerts([]), []);

    return { alerts, markAsRead, clearAll };
};

export const triggerAlert = (alert: Omit<AlertEvent, 'id' | 'timestamp' | 'read'>) => {
    const fullAlert: AlertEvent = {
        ...alert,
        id: Math.random().toString(36).substr(2, 9),
        timestamp: new Date(),
        read: false
    };
    alertListeners.forEach(listener => listener(fullAlert));
};
