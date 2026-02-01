require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3');

const url = process.env.DATABASE_URL || 'file:./prisma/dev.db';
const adapter = new PrismaBetterSqlite3({ url });
const prisma = new PrismaClient({ adapter });

async function main() {
  await prisma.station.deleteMany();
  await prisma.alert.deleteMany();
  await prisma.actionLog.deleteMany();
  await prisma.battery.deleteMany();
  await prisma.metricSnapshot.deleteMany();

  await prisma.station.createMany({
    data: [
      { code: 'GUR-SEC10', name: 'Sector 10 Hub', region: 'Gurugram', loadPct: 25, swapRate: 40, surgePrice: 1.0, chargerHealth: 99, status: 'ok', lat: 28.480, lng: 76.990 },
      { code: 'GUR-SEC14', name: 'Sector 14 Grid', region: 'Gurugram', loadPct: 45, swapRate: 70, surgePrice: 1.1, chargerHealth: 94, status: 'ok', lat: 28.475, lng: 77.045 },
      { code: 'GUR-CYBER', name: 'Cyber City Hub', region: 'Gurugram', loadPct: 75, swapRate: 120, surgePrice: 1.8, chargerHealth: 85, status: 'degraded', lat: 28.500, lng: 77.090 },
      { code: 'GUR-SEC31', name: 'Sector 31 SmartStation', region: 'Gurugram', loadPct: 35, swapRate: 50, surgePrice: 1.0, chargerHealth: 98, status: 'ok', lat: 28.445, lng: 77.040 },
      { code: 'GUR-SEC45', name: 'Sector 45 MegaHub', region: 'Gurugram', loadPct: 92, swapRate: 160, surgePrice: 2.5, chargerHealth: 72, status: 'critical', lat: 28.435, lng: 77.070 },
      { code: 'GUR-SEC56', name: 'Sector 56 Metro Station', region: 'Gurugram', loadPct: 65, swapRate: 90, surgePrice: 1.4, chargerHealth: 88, status: 'degraded', lat: 28.420, lng: 77.105 },
      { code: 'GUR-GOLF', name: 'Golf Course Extension', region: 'Gurugram', loadPct: 30, swapRate: 35, surgePrice: 1.0, chargerHealth: 100, status: 'ok', lat: 28.395, lng: 77.080 },
      { code: 'GUR-UDYOG', name: 'Udyog Vihar Grid', region: 'Gurugram', loadPct: 20, swapRate: 30, surgePrice: 1.0, chargerHealth: 96, status: 'ok', lat: 28.515, lng: 77.075 },
      { code: 'GUR-DLF3', name: 'DLF Phase 3 Hub', region: 'Gurugram', loadPct: 55, swapRate: 80, surgePrice: 1.2, chargerHealth: 91, status: 'ok', lat: 28.490, lng: 77.100 },
      { code: 'GUR-MEDIC', name: 'Medicity Radar', region: 'Gurugram', loadPct: 15, swapRate: 25, surgePrice: 1.0, chargerHealth: 99, status: 'ok', lat: 28.435, lng: 77.045 },
      { code: 'GUR-SOHNA', name: 'Sohna Road Grid', region: 'Gurugram', loadPct: 40, swapRate: 55, surgePrice: 1.1, chargerHealth: 93, status: 'ok', lat: 28.400, lng: 77.035 },
      { code: 'GUR-MGROAD', name: 'MG Road Metro', region: 'Gurugram', loadPct: 50, swapRate: 75, surgePrice: 1.1, chargerHealth: 95, status: 'ok', lat: 28.475, lng: 77.085 },
      { code: 'NOI-01', name: 'Noida Central', region: 'Noida', loadPct: 88, swapRate: 125, surgePrice: 1.9, chargerHealth: 82, status: 'critical', lat: 28.580, lng: 77.330 },
      { code: 'FAR-01', name: 'Faridabad North', region: 'Faridabad', loadPct: 28, swapRate: 35, surgePrice: 1.0, chargerHealth: 97, status: 'ok', lat: 28.400, lng: 77.310 },
    ],
  });

  // Cluster batteries around the primary Gurugram sectors
  const gurugramSectors = [
    { name: 'Cyber City', lat: 28.500, lng: 77.090 },
    { name: 'Sector 14', lat: 28.475, lng: 77.045 },
    { name: 'Sector 31', lat: 28.445, lng: 77.040 },
    { name: 'Sector 45', lat: 28.435, lng: 77.070 },
    { name: 'Sector 56', lat: 28.420, lng: 77.105 },
    { name: 'Sector 10', lat: 28.480, lng: 76.990 },
    { name: 'Golf Course', lat: 28.395, lng: 77.080 },
  ];

  // 2. Create Batteries (Reduced to 40 for better visual density/traffic management)
  const batteries = [];
  const statusOptions = ['active', 'charging', 'faulty'];
  for (let i = 1; i <= 40; i++) {
    const sector = gurugramSectors[i % gurugramSectors.length];
    const statusIdx = Math.random() < 0.8 ? 0 : Math.random() < 0.9 ? 1 : 2;

    // Add small random noise around the sector center (approx 500m-1km)
    const latOffset = (Math.random() - 0.5) * 0.012;
    const lngOffset = (Math.random() - 0.5) * 0.012;

    batteries.push({
      code: `BAT-${String(i).padStart(3, '0')}`,
      soc: 20 + Math.floor(Math.random() * 80), // Start with healthy charge mostly
      soh: 85 + Math.random() * 15,
      temp: 25 + Math.random() * 20,
      status: statusOptions[statusIdx],
      lat: sector.lat + latOffset,
      lng: sector.lng + lngOffset,
    });
  }

  await prisma.battery.createMany({
    data: batteries,
  });

  // Create the dedicated POV "Test User" battery
  await prisma.battery.create({
    data: {
      code: 'USER-001',
      soc: 35, // Start with low-ish SOC to trigger suggestions
      soh: 98,
      temp: 28,
      status: 'active',
      lat: 28.470, // Near Sector 14
      lng: 77.050,
    }
  });

  const stations = await prisma.station.findMany({ select: { id: true, code: true } });

  await prisma.alert.createMany({
    data: [
      { stationId: stations.find(s => s.code === 'DEL-05')?.id, stationCode: 'DEL-05', type: 'warning', message: 'Surge detected. Rerouted 3 drivers.' },
      { stationId: stations.find(s => s.code === 'DEL-05')?.id, stationCode: 'DEL-05', type: 'error', message: 'Overheating detected. Maintenance ticket raised.' },
      { stationId: stations.find(s => s.code === 'GUR-02')?.id, stationCode: 'GUR-02', type: 'info', message: 'Inventory rebalancing triggered.' },
      { stationId: stations.find(s => s.code === 'NOI-01')?.id, stationCode: 'NOI-01', type: 'info', message: 'Demand forecast: Peak expected in 2hrs.' },
    ],
  });

  await prisma.metricSnapshot.create({
    data: {
      queueLengthMins: 12,
      chargerUptimePct: 92,
      inventoryChargedPct: 45,
    },
  });

  await prisma.actionLog.createMany({
    data: [
      { actionId: 1, title: 'Reroute to DEL-03', payload: '{"subtitle":"Low load (25%)"}', source: 'dashboard' },
      { actionId: 2, title: 'Raise Maintenance Ticket', payload: '{"subtitle":"Root cause: Overheat"}', source: 'dashboard' },
    ],
  });

  console.log('Seed completed.');
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
