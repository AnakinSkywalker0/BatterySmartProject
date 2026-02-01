'use client';

import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import { Activity, Shield, Zap } from 'lucide-react';
import 'maplibre-gl/dist/maplibre-gl.css';

const cn = (...classes: (string | boolean | undefined | null)[]) => classes.filter(Boolean).join(' ');

interface Station {
    id: string;
    code: string;
    name: string;
    lat: number;
    lng: number;
    loadPct: number;
    surgePrice: number;
}

interface Battery {
    id: string;
    code: string;
    soc: number;
    lat: number;
    lng: number;
    status: string;
    voltage?: number;
    speed?: number;
}

const ZONES = [
    { id: 'zone-north', name: 'Cyber City Radar', center: [77.090, 28.500], radius: 0.04 },
    { id: 'zone-central-1', name: 'Sector 14 Grid', center: [77.045, 28.475], radius: 0.04 },
    { id: 'zone-central-2', name: 'Sector 31 Grid', center: [77.040, 28.445], radius: 0.04 },
    { id: 'zone-east', name: 'Sector 45 Hub', center: [77.070, 28.435], radius: 0.04 },
    { id: 'zone-south-east', name: 'Sector 56 Metro', center: [77.105, 28.420], radius: 0.04 },
    { id: 'zone-south-west', name: 'Sector 10 Hub', center: [76.990, 28.480], radius: 0.04 },
    { id: 'zone-deep-south', name: 'Golf Course Radar', center: [77.080, 28.395], radius: 0.04 },
    { id: 'zone-udyog', name: 'Udyog Vihar Grid', center: [77.075, 28.515], radius: 0.04 },
    { id: 'zone-dlf3', name: 'DLF Phase 3 Hub', center: [77.100, 28.490], radius: 0.04 },
    { id: 'zone-medicity', name: 'Medicity Radar', center: [77.045, 28.435], radius: 0.04 },
    { id: 'zone-sohna', name: 'Sohna Road Grid', center: [77.035, 28.400], radius: 0.04 },
    { id: 'zone-mgroad', name: 'MG Road Metro', center: [77.085, 28.475], radius: 0.04 },
];

export default function MapView() {
    const mapContainer = useRef<HTMLDivElement>(null);
    const map = useRef<maplibregl.Map | null>(null);
    const [stations, setStations] = useState<Station[]>([]);
    const [fleet, setFleet] = useState<Battery[]>([]);
    const markers = useRef<Record<string, maplibregl.Marker>>({});

    const [loadingMap, setLoadingMap] = useState(true);
    const [trackingId, setTrackingId] = useState<string | null>(null);

    useEffect(() => {
        if (!mapContainer.current || map.current) return;

        const initMap = async () => {
            try {
                map.current = new maplibregl.Map({
                    container: mapContainer.current!,
                    style: 'https://tiles.basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
                    center: [77.05, 28.45],
                    zoom: 12.0,
                    pitch: 0,
                    attributionControl: false
                });

                map.current.on('load', () => {
                    setLoadingMap(false);

                    ZONES.forEach(zone => {
                        if (map.current?.getSource(zone.id)) return;
                        map.current?.addSource(zone.id, {
                            type: 'geojson',
                            data: {
                                type: 'Feature',
                                geometry: { type: 'Point', coordinates: zone.center as [number, number] },
                                properties: { name: zone.name }
                            } as any
                        });

                        map.current?.addLayer({
                            id: `${zone.id}-fill`,
                            type: 'circle',
                            source: zone.id,
                            paint: {
                                'circle-radius': ['interpolate', ['linear'], ['zoom'], 11, 20, 14, 60],
                                'circle-color': '#000000',
                                'circle-opacity': 0.1,
                                'circle-stroke-width': 2,
                                'circle-stroke-color': '#ffffff',
                                'circle-stroke-opacity': 0.2
                            }
                        });
                    });

                    map.current?.resize();
                });

                map.current.addControl(new maplibregl.NavigationControl(), 'top-right');

            } catch (err) {
                console.error('Fatal Map Init Error:', err);
                setLoadingMap(false);
            }
        };

        initMap();

        const loaderTimeout = setTimeout(() => setLoadingMap(false), 8000);

        const fetchData = async () => {
            try {
                const [sRes, fRes] = await Promise.all([
                    fetch('/api/stations'),
                    fetch('/api/fleet')
                ]);
                const sData = await sRes.json();
                const fData = await fRes.json();
                setStations(sData);
                setFleet(fData);
            } catch (err) {
                console.error('Map fetch error:', err);
            }
        };

        fetchData();
        const interval = setInterval(fetchData, 1000);

        return () => {
            clearInterval(interval);
            clearTimeout(loaderTimeout);
            map.current?.remove();
            map.current = null;
        };
    }, []);

    useEffect(() => {
        if (!map.current || !map.current.loaded()) return;

        ZONES.forEach((zone) => {
            const linkedStation = stations.find(s =>
                Math.sqrt(Math.pow(s.lat - zone.center[1], 2) + Math.pow(s.lng - zone.center[0], 2)) < 0.05
            );

            const load = linkedStation?.loadPct || 0;
            let statusColor = '#666';

            if (load > 80) statusColor = '#ef4444';
            else if (load > 50) statusColor = '#f59e0b';
            else if (load > 0) statusColor = '#10b981';

            if (map.current?.getLayer(`${zone.id}-fill`)) {
                map.current.setPaintProperty(`${zone.id}-fill`, 'circle-stroke-color', statusColor);
                map.current.setPaintProperty(`${zone.id}-fill`, 'circle-stroke-opacity', 0.8);
            }
        });

        if (trackingId) {
            const target = fleet.find(b => b.id === trackingId || b.code === trackingId);
            if (target?.lat && target?.lng) {
                map.current.easeTo({
                    center: [target.lng, target.lat],
                    zoom: 14.5,
                    duration: 500
                });
            }
        }

        stations.forEach((s) => {
            if (!s.lat || !s.lng) return;
            const key = `station-${s.id}`;
            const ringKey = `ring-${s.id}`;

            // Add Zone Ring
            if (!markers.current[ringKey]) {
                const ring = document.createElement('div');
                ring.style.width = '180px';
                ring.style.height = '180px';
                ring.style.borderRadius = '50%';
                ring.style.border = '1px dashed rgba(255,255,255,0.15)';
                ring.style.backgroundColor = 'rgba(255,255,255,0.02)';
                ring.style.pointerEvents = 'none';

                markers.current[ringKey] = new maplibregl.Marker({ element: ring })
                    .setLngLat([s.lng, s.lat])
                    .addTo(map.current!);
            }

            const ringEl = markers.current[ringKey].getElement();
            const ringColor = s.loadPct > 80 ? 'rgba(239, 68, 68, 0.1)' : s.loadPct > 50 ? 'rgba(245, 158, 11, 0.1)' : 'rgba(16, 185, 129, 0.05)';
            const ringBorder = s.loadPct > 80 ? 'rgba(239, 68, 68, 0.3)' : s.loadPct > 50 ? 'rgba(245, 158, 11, 0.3)' : 'rgba(16, 185, 129, 0.15)';
            ringEl.style.backgroundColor = ringColor;
            ringEl.style.border = `1px dashed ${ringBorder}`;

            if (!markers.current[key]) {
                const el = document.createElement('div');
                el.className = 'station-marker';
                el.style.width = '20px';
                el.style.height = '20px';
                el.style.display = 'flex';
                el.style.alignItems = 'center';
                el.style.justifyContent = 'center';
                el.style.borderRadius = '6px';
                el.style.backgroundColor = '#18181b'; // zinc-900
                el.style.border = '2px solid rgba(255,255,255,0.2)';
                el.style.cursor = 'pointer';
                el.style.boxShadow = '0 4px 12px rgba(0,0,0,0.5)';
                el.innerHTML = '<span style="color:#60a5fa; font-size:10px; font-weight:900;">⚡</span>';

                markers.current[key] = new maplibregl.Marker({ element: el })
                    .setLngLat([s.lng, s.lat])
                    .addTo(map.current!);
            }

            const el = markers.current[key].getElement();
            if (s.surgePrice > 1.0) {
                el.style.backgroundColor = '#f59e0b';
                el.style.border = '2px solid #000';
            } else {
                el.style.backgroundColor = '#18181b';
                el.style.border = '2px solid rgba(255,255,255,0.2)';
            }
        });

        fleet.forEach((b) => {
            if (!b.lat || !b.lng) return;
            const key = `battery-${b.id}`;
            if (!markers.current[key]) {
                const container = document.createElement('div');
                container.style.width = '24px';
                container.style.height = '14px';
                container.style.border = '1.5px solid rgba(255,255,255,0.2)';
                container.style.borderRadius = '3px';
                container.style.backgroundColor = '#111';
                container.style.overflow = 'hidden';
                container.style.boxShadow = '0 2px 8px rgba(0,0,0,0.4)';

                const fill = document.createElement('div');
                fill.className = 'battery-fill';
                fill.style.height = '100%';
                fill.style.backgroundColor = b.soc < 20 ? '#ef4444' : '#10b981';
                container.appendChild(fill);

                markers.current[key] = new maplibregl.Marker({ element: container })
                    .setLngLat([b.lng, b.lat])
                    .addTo(map.current!);
            }

            const container = markers.current[key].getElement();
            const fill = container.querySelector('.battery-fill') as HTMLElement;
            if (fill) {
                fill.style.width = `${Math.max(2, b.soc)}%`;
                fill.style.backgroundColor = b.soc < 20 ? '#ef4444' : b.soc < 50 ? '#f59e0b' : '#10b981';
            }
            markers.current[key].setLngLat([b.lng, b.lat]);
        });
    }, [stations, fleet, trackingId]);

    return (
        <div className="relative h-full w-full overflow-hidden rounded-xl border-2 border-black bg-[#0a0a0a]">
            <div ref={mapContainer} className="h-full w-full" style={{ minHeight: '600px' }} />

            {loadingMap && (
                <div className="absolute inset-0 z-20 flex items-center justify-center bg-zinc-950/95 backdrop-blur-md">
                    <div className="flex flex-col items-center gap-4">
                        <Loader2 className="h-10 w-10 animate-spin text-blue-400" />
                        <p className="text-sm font-black text-white uppercase tracking-widest">Warming Grid Sensors...</p>
                    </div>
                </div>
            )}

            <div className="absolute top-6 left-6 z-10 flex flex-col gap-3">

                <div className="relative group">
                    <select
                        value={trackingId || ''}
                        onChange={(e) => setTrackingId(e.target.value || null)}
                        className="appearance-none w-[200px] rounded-xl border-2 border-white/20 bg-zinc-900/90 backdrop-blur-md px-4 py-3 pr-10 text-[10px] font-black uppercase tracking-widest text-white shadow-2xl outline-none focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer"
                    >
                        <option value="" className="bg-zinc-900 text-white">-- No Tracking --</option>
                        {fleet.map(b => (
                            <option key={b.id} value={b.id} className="bg-zinc-900 text-white">
                                Track: {b.code} ({b.soc.toFixed(0)}%)
                            </option>
                        ))}
                    </select>
                    <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2">
                        <Shield className={cn("h-4 w-4", trackingId ? "text-blue-400 animate-pulse" : "text-zinc-500")} />
                    </div>
                </div>

                {trackingId && (
                    <div className="flex flex-col gap-2 rounded-xl border-2 border-white/20 bg-zinc-900/95 backdrop-blur-xl p-4 text-white shadow-2xl animate-in fade-in slide-in-from-left-4 duration-300">
                        <div className="flex items-center justify-between border-b border-white/10 pb-2">
                            <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Live Telemetry</span>
                            <div className="flex h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        </div>

                        {(() => {
                            const b = fleet.find(f => f.id === trackingId || f.code === trackingId);
                            if (!b) return null;
                            return (
                                <div className="grid grid-cols-2 gap-3 mt-1">
                                    <div className="flex flex-col">
                                        <span className="text-[14px] font-black tabular-nums">{(b.voltage || 0).toFixed(1)}V</span>
                                        <span className="text-[8px] font-bold text-zinc-500 uppercase">Voltage</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[14px] font-black tabular-nums">{(b.speed || 0).toFixed(1)} km/h</span>
                                        <span className="text-[8px] font-bold text-zinc-500 uppercase">Velocity</span>
                                    </div>
                                    <div className="flex flex-col col-span-2 pt-1 border-t border-white/5">
                                        <span className="text-[9px] font-bold text-zinc-400 tabular-nums truncate">
                                            GPS: {b.lat?.toFixed(4)}, {b.lng?.toFixed(4)}
                                        </span>
                                    </div>
                                </div>
                            );
                        })()}
                    </div>
                )}
            </div>

            <div className="absolute bottom-6 right-6 z-10 flex flex-col gap-3 rounded-xl border-2 border-white/20 bg-zinc-900/90 backdrop-blur-md p-4 shadow-2xl min-w-[180px]">
                <div className="flex items-center justify-between gap-3 border-b-2 border-white/10 pb-2 mb-1">
                    <span className="text-[10px] font-black text-white uppercase tracking-widest">Active Fleet</span>
                    <span className="text-xs font-black text-blue-400 tabular-nums">{fleet.length} Units</span>
                </div>
                <div className="space-y-2 mt-1">
                    <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full border border-white/20 bg-red-600" />
                        <span className="text-[9px] font-black text-zinc-300 uppercase tracking-[0.1em]">Critical Grid</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full border border-white/20 bg-orange-500" />
                        <span className="text-[9px] font-black text-zinc-300 uppercase tracking-[0.1em]">Warning Load</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full border border-white/20 bg-emerald-500" />
                        <span className="text-[9px] font-black text-zinc-300 uppercase tracking-[0.1em]">Nominal Area</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

function Loader2({ className }: { className?: string }) {
    return <Zap className={cn("animate-pulse", className)} />;
}
