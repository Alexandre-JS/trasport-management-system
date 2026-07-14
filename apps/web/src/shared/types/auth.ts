export type AuthUser = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  role: string;
  permissions: string[];
  isActive: boolean;
  lastLogin: string | null;
};

export type LoginCredentials = {
  identifier: string;
  password: string;
  rememberMe: boolean;
};

export type LoginPayload = {
  identifier: string;
  password: string;
};

export type AuthResponse = {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
};

export type RefreshPayload = {
  refreshToken: string;
};

export type ChangePasswordPayload = {
  currentPassword: string;
  newPassword: string;
};

export type ChangePasswordResponse = {
  message: string;
};
