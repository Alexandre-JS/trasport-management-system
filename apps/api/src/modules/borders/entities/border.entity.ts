import { Prisma } from '@prisma/client';

export type BorderEntity = {
  id: string;
  name: string;
  countryA: string;
  countryB: string;
  lat: Prisma.Decimal | null;
  lng: Prisma.Decimal | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};
