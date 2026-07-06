export type ClientEntity = {
  id: string;
  companyName: string;
  contactName: string | null;
  nuit: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  province: string | null;
  country: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};
