import { CargoStatus, TripStatus } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

export type CargoEntity = {
  id: string;
  clientId: string;
  code: string;
  description: string | null;
  type: string;
  containerNumber: string | null;
  weightTonnes: Decimal | null;
  volumeM3: Decimal | null;
  origin: string;
  destination: string;
  pickupDate: Date | null;
  expectedDelivery: Date | null;
  status: CargoStatus;
  observations: string | null;
  client: {
    id: string;
    companyName: string;
  };
  trips?: {
    id: string;
    currentStatus: TripStatus;
    departureDate: Date | null;
    arrivalEstimate: Date | null;
    arrivalDate: Date | null;
    loadedDate: Date | null;
    currentPosition: string | null;
    borders: {
      sequence: number;
      arrivedAt: Date | null;
      clearedAt: Date | null;
      border: {
        id: string;
        name: string;
      };
    }[];
    driver: {
      id: string;
      fullName: string;
    } | null;
    truck: {
      id: string;
      plateNumber: string;
    } | null;
    trailer: {
      id: string;
      plateNumber: string;
    } | null;
    createdAt: Date;
  }[];
  createdAt: Date;
  updatedAt: Date;
};
