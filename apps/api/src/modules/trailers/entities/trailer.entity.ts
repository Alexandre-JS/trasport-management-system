import { TrailerStatus } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

export type TrailerEntity = {
  id: string;
  truckId: string | null;
  plateNumber: string;
  brand: string | null;
  model: string | null;
  year: number | null;
  tonnage: Decimal | null;
  status: TrailerStatus;
  truck: {
    id: string;
    plateNumber: string;
  } | null;
  createdAt: Date;
  updatedAt: Date;
};
