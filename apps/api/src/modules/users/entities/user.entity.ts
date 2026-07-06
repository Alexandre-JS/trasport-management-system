export type UserEntity = {
  id: string;
  roleId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  isActive: boolean;
  lastLogin: Date | null;
  role: {
    id: string;
    name: string;
    description: string | null;
  };
  createdAt: Date;
  updatedAt: Date;
};
