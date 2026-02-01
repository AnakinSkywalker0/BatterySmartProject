export interface Station {
    id: string;
    code: string;
    name: string;
    lat: number;
    lng: number;
    loadPct: number;
    swapRate: number;
    surgePrice: number;
    chargerHealth: number;
    status: string;
    thermal?: number; // Added: Thermal Load in °C
    queueCount?: number; // Added: Active Routing Inbound
}

export interface Battery {
    id: string;
    code: string;
    soc: number;
    lat: number | null;
    lng: number | null;
    status: string;
    targetLat?: number | null;
    targetLng?: number | null;
    targetName?: string | null;
    voltage?: number;
    speed?: number;
    cycles?: number;
}

export const GUR_BOUNDS = { latMin: 28.38, latMax: 28.52, lngMin: 76.97, lngMax: 77.13 };

export function calculateRepulsion(battery: Battery, fleet: Battery[]) {
    let latForce = 0;
    let lngForce = 0;
    const bLat = battery.lat as number;
    const bLng = battery.lng as number;

    for (const peer of fleet) {
        if (peer.id === battery.id || !peer.lat || !peer.lng) continue;
        const dist = Math.sqrt(Math.pow(bLat - peer.lat, 2) + Math.pow(bLng - peer.lng, 2));
        if (dist < 0.008) {
            const pushMagnitude = (0.008 - dist) * 0.15;
            latForce += (bLat - peer.lat) * pushMagnitude;
            lngForce += (bLng - peer.lng) * pushMagnitude;
        }
    }
    return { latForce, lngForce };
}

export function getNearestStation(lat: number, lng: number, stations: Station[]) {
    let nearest = stations[0];
    let minDistSq = Infinity;
    for (const s of stations) {
        const dSq = Math.pow(lat - s.lat, 2) + Math.pow(lng - s.lng, 2);
        if (dSq < minDistSq) {
            minDistSq = dSq;
            nearest = s;
        }
    }
    return nearest;
}

export function calculateAutonomousLogic(battery: Battery, stations: Station[], fleet: Battery[]) {
    let latForce = 0;
    let lngForce = 0;
    const bLat = battery.lat as number;
    const bLng = battery.lng as number;

    // 1. Repulsion
    const repulsion = calculateRepulsion(battery, fleet);
    latForce += repulsion.latForce;
    lngForce += repulsion.lngForce;

    // 2. State-Based Decision
    if (battery.soc < 20) {
        const nearest = getNearestStation(bLat, bLng, stations);
        latForce += (nearest.lat - bLat) * 0.25;
        lngForce += (nearest.lng - bLng) * 0.25;
    } else if (battery.targetLat && battery.targetLng) {
        latForce = (battery.targetLat - bLat) * 0.18;
        lngForce = (battery.targetLng - bLng) * 0.18;
    } else {
        const nearest = getNearestStation(bLat, bLng, stations);
        // Economic bias
        if (nearest.surgePrice > 1.25) {
            const budget = stations.filter(s => s.surgePrice <= 1.0).sort(() => Math.random() - 0.5)[0];
            if (budget) {
                latForce += (budget.lat - bLat) * 0.1;
                lngForce += (budget.lng - bLng) * 0.1;
            }
        }
    }

    return { latForce, lngForce };
}
