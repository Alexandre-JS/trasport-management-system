import { DriverStatus } from '@prisma/client';

export type DriverEntity = {
  id: string;
  userId: string | null;
  fullName: string;
  licenseNumber: string;
  phone: string | null;
  email: string | null;
  status: DriverStatus;
  createdAt: Date;
  updatedAt: Date;
};
