import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// Guarda anti-acidente: dados de seed/demo nunca entram em produção por
// engano. Para semear de propósito (ex.: primeira instalação), correr com
// FORCE_SEED=1.
if (process.env.NODE_ENV === 'production' && process.env.FORCE_SEED !== '1') {
  console.error(
    'Seed bloqueado: NODE_ENV=production. Se for mesmo intencional, corre com FORCE_SEED=1.',
  );
  process.exit(1);
}


async function main() {
  const [adminRole, dispatcherRole, driverRole, clientRole] =
    await Promise.all([
      prisma.role.upsert({
        where: { name: 'ADMIN' },
        update: {},
        create: {
          name: 'ADMIN',
          description: 'Administrador do sistema',
        },
      }),
      prisma.role.upsert({
        where: { name: 'DISPATCHER' },
        update: {},
        create: {
          name: 'DISPATCHER',
          description: 'Operador responsável pela expedição',
        },
      }),
      prisma.role.upsert({
        where: { name: 'DRIVER' },
        update: {},
        create: {
          name: 'DRIVER',
          description: 'Motorista',
        },
      }),
      prisma.role.upsert({
        where: { name: 'CLIENT' },
        update: {},
        create: {
          name: 'CLIENT',
          description: 'Cliente',
        },
      }),
    ]);

  await prisma.user.upsert({
    where: { email: 'admin@sgrtc.local' },
    update: {},
    create: {
      roleId: adminRole.id,
      firstName: 'Administrador',
      lastName: 'SGRTC',
      email: 'admin@sgrtc.local',
      password: await bcrypt.hash('Admin@12345', 12),
      phone: '+258840000000',
      isActive: true,
    },
  });

  await prisma.user.upsert({
    where: { email: 'dispatcher@sgrtc.local' },
    update: {},
    create: {
      roleId: dispatcherRole.id,
      firstName: 'Operador',
      lastName: 'Logístico',
      email: 'dispatcher@sgrtc.local',
      password: await bcrypt.hash('Dispatcher@12345', 12),
      phone: '+258840000001',
      isActive: true,
    },
  });

  const driverUser = await prisma.user.upsert({
    where: { email: 'driver@sgrtc.local' },
    update: {},
    create: {
      roleId: driverRole.id,
      firstName: 'Carlos',
      lastName: 'Mabunda',
      email: 'driver@sgrtc.local',
      password: await bcrypt.hash('Driver@12345', 12),
      phone: '+258840000002',
      isActive: true,
    },
  });

  await prisma.user.upsert({
    where: { email: 'client@sgrtc.local' },
    update: {},
    create: {
      roleId: clientRole.id,
      firstName: 'Cliente',
      lastName: 'Exemplo',
      email: 'client@sgrtc.local',
      password: await bcrypt.hash('Client@12345', 12),
      phone: '+258840000003',
      isActive: true,
    },
  });

  // Principais postos fronteiriços rodoviários dos corredores da África
  // Austral. Coordenadas indicativas (posto de travessia).
  const borders: Array<{
    name: string;
    countryA: string;
    countryB: string;
    lat: number;
    lng: number;
  }> = [
    { name: 'Chanida', countryA: 'Moçambique', countryB: 'Zâmbia', lat: -14.05, lng: 32.75 },
    { name: 'Cassacatiza', countryA: 'Moçambique', countryB: 'Zâmbia', lat: -14.4046, lng: 32.5333 },
    { name: 'Chirundu', countryA: 'Zâmbia', countryB: 'Zimbabué', lat: -16.0333, lng: 28.85 },
    { name: 'Machipanda / Forbes', countryA: 'Moçambique', countryB: 'Zimbabué', lat: -18.94, lng: 32.7 },
    { name: 'Nyamapanda / Cuchamano', countryA: 'Moçambique', countryB: 'Zimbabué', lat: -16.66, lng: 32.75 },
    { name: 'Zóbuè / Mwanza', countryA: 'Moçambique', countryB: 'Malawi', lat: -15.593, lng: 34.438 },
    { name: 'Milange / Muloza', countryA: 'Moçambique', countryB: 'Malawi', lat: -16.1033, lng: 35.7654 },
    { name: 'Mandimba / Chiponde', countryA: 'Moçambique', countryB: 'Malawi', lat: -14.353, lng: 35.654 },
    { name: 'Calómuè / Dedza', countryA: 'Moçambique', countryB: 'Malawi', lat: -14.375, lng: 34.333 },
    { name: 'Ressano Garcia / Lebombo', countryA: 'Moçambique', countryB: 'África do Sul', lat: -25.4432, lng: 31.9872 },
    { name: 'Goba / Mhlumeni', countryA: 'Moçambique', countryB: 'eSwatini', lat: -26.201, lng: 32.13 },
    { name: 'Namaacha / Lomahasha', countryA: 'Moçambique', countryB: 'eSwatini', lat: -25.98, lng: 32.02 },
    { name: 'Beitbridge', countryA: 'Zimbabué', countryB: 'África do Sul', lat: -22.216, lng: 29.988 },
    { name: 'Mchinji / Mwami', countryA: 'Malawi', countryB: 'Zâmbia', lat: -13.79, lng: 32.9 },
    { name: 'Kasumbalesa', countryA: 'Zâmbia', countryB: 'RD Congo', lat: -12.25, lng: 27.8 },
    { name: 'Nakonde / Tunduma', countryA: 'Zâmbia', countryB: 'Tanzânia', lat: -9.34, lng: 32.76 },
    { name: 'Kazungula', countryA: 'Zâmbia', countryB: 'Botsuana', lat: -17.79, lng: 25.26 },
  ];

  for (const border of borders) {
    await prisma.border.upsert({
      where: { name: border.name },
      update: {},
      create: border,
    });
  }

  const client = await prisma.client.upsert({
    where: { id: '11111111-1111-4111-8111-111111111111' },
    update: {},
    create: {
      id: '11111111-1111-4111-8111-111111111111',
      companyName: 'Moz Freight Cliente Exemplo',
      contactName: 'Ana Chissano',
      nuit: '400000001',
      phone: '+258850000001',
      email: 'contacto@mozfreight.local',
      address: 'Av. 25 de Setembro',
      city: 'Maputo',
      province: 'Maputo',
      country: 'Moçambique',
    },
  });

  const driver = await prisma.driver.upsert({
    where: { licenseNumber: 'MZ-DRV-0001' },
    update: {},
    create: {
      userId: driverUser.id,
      fullName: 'Carlos Mabunda',
      licenseNumber: 'MZ-DRV-0001',
      phone: '+258840000002',
      email: 'driver@sgrtc.local',
      status: 'AVAILABLE',
    },
  });

  const truck = await prisma.truck.upsert({
    where: { plateNumber: 'AAA-001-MP' },
    update: {},
    create: {
      plateNumber: 'AAA-001-MP',
      brand: 'Mercedes-Benz',
      model: 'Actros',
      year: 2022,
      status: 'AVAILABLE',
    },
  });

  const trailer = await prisma.trailer.upsert({
    where: { plateNumber: 'TRL-001-MP' },
    update: {},
    create: {
      truckId: truck.id,
      plateNumber: 'TRL-001-MP',
      brand: 'Randon',
      model: 'Semirreboque carga seca',
      year: 2021,
      tonnage: 32,
      status: 'AVAILABLE',
    },
  });

  const cargo = await prisma.cargo.upsert({
    where: { code: 'SGRTC-0001' },
    update: {},
    create: {
      clientId: client.id,
      code: 'SGRTC-0001',
      description: 'Carga de exemplo para validação inicial',
      weightTonnes: 1.2,
      volumeM3: 8.5,
      origin: 'Maputo',
      destination: 'Beira',
      pickupDate: new Date('2026-07-02T08:00:00.000Z'),
      expectedDelivery: new Date('2026-07-04T17:00:00.000Z'),
      status: 'WAITING_PICKUP',
      observations: 'Seed inicial do SGRTC',
    },
  });

  const existingTrip = await prisma.trip.findFirst({
    where: {
      cargoId: cargo.id,
      truckId: truck.id,
      trailerId: trailer.id,
      driverId: driver.id,
    },
  });

  if (!existingTrip) {
    await prisma.trip.create({
      data: {
        cargoId: cargo.id,
        truckId: truck.id,
        trailerId: trailer.id,
        driverId: driver.id,
        departureDate: new Date('2026-07-02T09:00:00.000Z'),
        arrivalEstimate: new Date('2026-07-04T17:00:00.000Z'),
        currentStatus: 'WAITING_APPOINTMENT',
      },
    });
  }
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
