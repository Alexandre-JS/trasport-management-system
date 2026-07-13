import {
  DriverStatus,
  PrismaClient,
  TrailerStatus,
  TripEventType,
  TripStatus,
  TruckStatus,
} from '@prisma/client';

const prisma = new PrismaClient();

// Fixed ids so the demo seed is idempotent (re-running updates, never duplicates).
const CLIENT_ID = 'c1c1c1c1-0000-4000-8000-000000000001';
const id = (prefix: string, n: number) =>
  `${prefix}-0000-4000-8000-${String(n).padStart(12, '0')}`;

const SEQ: TripStatus[] = [
  TripStatus.WAITING_APPOINTMENT,
  TripStatus.APPOINTMENT_DONE,
  TripStatus.LOADED,
  TripStatus.DISPATCHED_ORIGIN,
  TripStatus.AT_BORDER,
  TripStatus.BORDER_CLEARED,
  TripStatus.ARRIVED,
  TripStatus.DISCHARGED,
];

const MILESTONE: Partial<Record<TripStatus, TripEventType>> = {
  [TripStatus.DISPATCHED_ORIGIN]: TripEventType.DISPATCHED_ORIGIN,
  [TripStatus.AT_BORDER]: TripEventType.AT_BORDER,
  [TripStatus.BORDER_CLEARED]: TripEventType.BORDER_CLEARED,
  [TripStatus.ARRIVED]: TripEventType.ARRIVED,
  [TripStatus.DISCHARGED]: TripEventType.DISCHARGED,
};

type DemoTrip = {
  n: number;
  driver: { name: string; license: string; passport: string };
  plate: string;
  trailerPlate: string;
  cargo: { code: string; description: string; weightKg: number };
  status: TripStatus;
  // Border names (must exist in `borders`, seeded by the main seed), in route order.
  borders: string[];
  tonnage: number;
  position: string;
};

const DEMO: DemoTrip[] = [
  {
    n: 1,
    driver: { name: 'António Nhaca', license: 'MZ-DRV-1001', passport: 'PA0100001' },
    plate: 'MMT-210-MC',
    trailerPlate: 'TRL-210-MC',
    cargo: { code: 'LUMAC-2026-0001', description: 'Cobre catódico', weightKg: 30000 },
    status: TripStatus.WAITING_APPOINTMENT,
    borders: [],
    tonnage: 30,
    position: 'Porto da Beira — aguardando marcação',
  },
  {
    n: 2,
    driver: { name: 'Salvador Uane', license: 'MZ-DRV-1002', passport: 'PA0100002' },
    plate: 'BEI-455-MP',
    trailerPlate: 'TRL-455-MP',
    cargo: { code: 'LUMAC-2026-0002', description: 'Fertilizante granulado', weightKg: 32000 },
    status: TripStatus.LOADED,
    borders: ['Chirundu'],
    tonnage: 32,
    position: 'Porto da Beira — carregado',
  },
  {
    n: 3,
    driver: { name: 'Ernesto Chongo', license: 'MZ-DRV-1003', passport: 'PA0100003' },
    plate: 'TETE-330-MP',
    trailerPlate: 'TRL-330-MP',
    cargo: { code: 'LUMAC-2026-0003', description: 'Cimento ensacado', weightKg: 28000 },
    status: TripStatus.DISPATCHED_ORIGIN,
    borders: ['Machipanda / Forbes', 'Chirundu'],
    tonnage: 28,
    position: 'EN6 — Inchope',
  },
  {
    n: 4,
    driver: { name: 'Fernando Come', license: 'MZ-DRV-1004', passport: 'PA0100004' },
    plate: 'CHM-780-MP',
    trailerPlate: 'TRL-780-MP',
    cargo: { code: 'LUMAC-2026-0004', description: 'Trigo a granel', weightKg: 34000 },
    status: TripStatus.AT_BORDER,
    borders: ['Chirundu'],
    tonnage: 34,
    position: 'Fronteira de Chirundu — fila',
  },
  {
    n: 5,
    driver: { name: 'Adélio Tembe', license: 'MZ-DRV-1005', passport: 'PA0100005' },
    plate: 'NAC-612-MP',
    trailerPlate: 'TRL-612-MP',
    cargo: { code: 'LUMAC-2026-0005', description: 'Máquinas industriais', weightKg: 26000 },
    status: TripStatus.BORDER_CLEARED,
    borders: ['Chanida'],
    tonnage: 26,
    position: 'Chanida — lado Zâmbia',
  },
  {
    n: 6,
    driver: { name: 'Rachid Ismael', license: 'MZ-DRV-1006', passport: 'PA0100006' },
    plate: 'SOF-908-MP',
    trailerPlate: 'TRL-908-MP',
    cargo: { code: 'LUMAC-2026-0006', description: 'Peças automóveis', weightKg: 22000 },
    status: TripStatus.ARRIVED,
    borders: ['Chanida'],
    tonnage: 22,
    position: 'Lusaka — armazém do cliente',
  },
];

function stepDate(base: Date, step: number): Date {
  return new Date(base.getTime() + step * 6 * 60 * 60 * 1000);
}

async function main() {
  await prisma.client.upsert({
    where: { id: CLIENT_ID },
    update: {},
    create: {
      id: CLIENT_ID,
      companyName: 'Zambia Copper Traders Ltd',
      contactName: 'Mwansa Banda',
      nuit: '500100200',
      phone: '+260970000001',
      email: 'ops@zctraders.zm',
      address: 'Great East Road',
      city: 'Lusaka',
      province: 'Lusaka',
      country: 'Zâmbia',
    },
  });

  // Link the demo client user to this client so the portal is scoped to it.
  await prisma.user.updateMany({
    where: { email: 'client@sgrtc.local' },
    data: { clientId: CLIENT_ID },
  });

  // Enrich the two existing seed drivers with passports, if present.
  await prisma.driver.updateMany({
    where: { licenseNumber: 'MZ-DRV-0001' },
    data: { passportNumber: 'PA0000001' },
  });
  await prisma.driver.updateMany({
    where: { licenseNumber: 'CASD-3456543' },
    data: { passportNumber: 'PA0000002' },
  });

  let step0 = new Date('2026-06-28T06:00:00.000Z').getTime();

  for (const t of DEMO) {
    const targetIndex = SEQ.indexOf(t.status);
    const base = new Date(step0 + (t.n - 1) * 24 * 60 * 60 * 1000);

    const driver = await prisma.driver.upsert({
      where: { licenseNumber: t.driver.license },
      update: { status: DriverStatus.ON_TRIP, passportNumber: t.driver.passport },
      create: {
        id: id('d1a1a1a1', t.n),
        fullName: t.driver.name,
        licenseNumber: t.driver.license,
        passportNumber: t.driver.passport,
        phone: `+2588410000${String(t.n).padStart(2, '0')}`,
        status: DriverStatus.ON_TRIP,
      },
    });

    const truck = await prisma.truck.upsert({
      where: { plateNumber: t.plate },
      update: { status: TruckStatus.ON_TRIP },
      create: {
        id: id('71a1a1a1', t.n),
        plateNumber: t.plate,
        brand: 'Scania',
        model: 'R450',
        year: 2021,
        status: TruckStatus.ON_TRIP,
      },
    });

    const trailer = await prisma.trailer.upsert({
      where: { plateNumber: t.trailerPlate },
      update: { truckId: truck.id, status: TrailerStatus.ON_TRIP },
      create: {
        id: id('7a2a2a2a', t.n),
        truckId: truck.id,
        plateNumber: t.trailerPlate,
        brand: 'Randon',
        model: 'Semirreboque carga pesada',
        year: 2021,
        tonnage: 36,
        status: TrailerStatus.ON_TRIP,
      },
    });

    const cargo = await prisma.cargo.upsert({
      where: { code: t.cargo.code },
      update: {},
      create: {
        id: id('ca1a1a1a', t.n),
        clientId: CLIENT_ID,
        code: t.cargo.code,
        description: t.cargo.description,
        weightKg: t.cargo.weightKg,
        origin: 'Beira',
        destination: 'Lusaka',
      },
    });

    const loadedDate = targetIndex >= 2 ? stepDate(base, 2) : null;
    const departureDate = targetIndex >= 3 ? stepDate(base, 3) : null;
    const arrivalDate = targetIndex >= 6 ? stepDate(base, 6) : null;

    const tripId = id('791a1a1a', t.n);
    const tripData = {
      cargoId: cargo.id,
      truckId: truck.id,
      trailerId: trailer.id,
      driverId: driver.id,
      currentStatus: t.status,
      tonnage: t.tonnage,
      currentPosition: t.position,
      loadedDate,
      departureDate,
      arrivalEstimate: stepDate(base, 8),
      arrivalDate,
    };

    await prisma.trip.upsert({
      where: { id: tripId },
      update: tripData,
      create: { id: tripId, ...tripData },
    });

    // Rebuild the trip's border crossings, stamping arrival/clearance to
    // mirror how far the lifecycle has progressed.
    await prisma.tripBorder.deleteMany({ where: { tripId } });
    const borderRecords = await prisma.border.findMany({
      where: { name: { in: t.borders } },
      select: { id: true, name: true },
    });
    const borderIdByName = new Map(borderRecords.map((b) => [b.name, b.id]));
    const atBorderIndex = SEQ.indexOf(TripStatus.AT_BORDER);
    const clearedIndex = SEQ.indexOf(TripStatus.BORDER_CLEARED);
    for (let i = 0; i < t.borders.length; i++) {
      const borderId = borderIdByName.get(t.borders[i]);
      if (!borderId) {
        throw new Error(
          `Border "${t.borders[i]}" not seeded — run the main seed first`,
        );
      }
      const isLast = i === t.borders.length - 1;
      const cleared =
        targetIndex >= clearedIndex || (targetIndex === atBorderIndex && !isLast);
      const arrived = cleared || targetIndex >= atBorderIndex;
      await prisma.tripBorder.create({
        data: {
          tripId,
          borderId,
          sequence: i + 1,
          arrivedAt: arrived ? stepDate(base, 4) : null,
          clearedAt: cleared ? stepDate(base, 5) : null,
        },
      });
    }

    // Rebuild the event history so it mirrors the lifecycle up to the current state.
    await prisma.tripEvent.deleteMany({ where: { tripId } });
    for (let k = 1; k <= targetIndex; k++) {
      const from = SEQ[k - 1];
      const to = SEQ[k];
      await prisma.tripEvent.create({
        data: {
          tripId,
          type: MILESTONE[to] ?? TripEventType.STATUS_CHANGE,
          occurredAt: stepDate(base, k),
          fromStatus: from,
          toStatus: to,
        },
      });
    }
  }

  // Give the pre-existing terminal trips some values too (so no "—" in the demo).
  const demoTripIds = DEMO.map((t) => id('791a1a1a', t.n));
  await prisma.trip.updateMany({
    where: { tonnage: null, id: { notIn: demoTripIds } },
    data: {
      tonnage: 31,
      currentPosition: 'Concluída',
      loadedDate: new Date('2026-06-20T06:00:00.000Z'),
    },
  });

  const [trips, events] = await Promise.all([
    prisma.trip.count(),
    prisma.tripEvent.count(),
  ]);
  console.log(`Demo seed done. trips=${trips} events=${events}`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
