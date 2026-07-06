import { Decimal } from '@prisma/client/runtime/library';

export type TrackingPointEntity = {
  id: string;
  tripId: string;
  latitude: Decimal;
  longitude: Decimal;
  speed: Decimal | null;
  heading: Decimal | null;
  accuracy: Decimal | null;
  recordedAt: Date;
  createdAt: Date;
  updatedAt: Date;
};
