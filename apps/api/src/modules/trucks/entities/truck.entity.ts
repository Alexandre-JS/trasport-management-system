import { TruckStatus } from '@prisma/client';

export type TruckEntity = {
  id: string;
  plateNumber: string;
  brand: string | null;
  model: string | null;
  year: number | null;
  status: TruckStatus;
  createdAt: Date;
  updatedAt: Date;
};
