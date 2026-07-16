import { IncidentType } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

export type IncidentEntity = {
  id: string;
  tripId: string;
  type: IncidentType;
  description: string | null;
  latitude: Decimal | null;
  longitude: Decimal | null;
  photo: string | null;
  reportedAt: Date;
  resolvedAt: Date | null;
  trip: {
    id: string;
    cargo: { code: string };
    driver: { fullName: string } | null;
  };
  createdAt: Date;
  updatedAt: Date;
};
