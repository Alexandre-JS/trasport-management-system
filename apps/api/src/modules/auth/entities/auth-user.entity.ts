export type AuthUserEntity = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone: string | null;
  isActive: boolean;
  lastLogin: Date | null;
  role: {
    name: string;
  };
};
