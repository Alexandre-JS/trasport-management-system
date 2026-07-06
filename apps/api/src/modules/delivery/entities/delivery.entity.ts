export type DeliveryEntity = {
  id: string;
  tripId: string;
  receiverName: string | null;
  receiverDocument: string | null;
  deliveryPhoto: string | null;
  signature: string | null;
  deliveredAt: Date | null;
  observations: string | null;
  createdAt: Date;
  updatedAt: Date;
};
