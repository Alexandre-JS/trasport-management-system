import { apiClient } from "@/src/shared/services/api-client";
import type {
  AuthResponse,
  ChangePasswordPayload,
  ChangePasswordResponse,
  LoginPayload,
} from "@/src/shared/types/auth";

export async function login(payload: LoginPayload) {
  const { data } = await apiClient.post<AuthResponse>("/auth/login", payload);

  return data;
}

export async function refresh(refreshToken: string) {
  const { data } = await apiClient.post<AuthResponse>("/auth/refresh", {
    refreshToken,
  });

  return data;
}

export async function logout() {
  await apiClient.post("/auth/logout");
}

export async function me() {
  const { data } = await apiClient.get<AuthResponse["user"]>("/auth/me");

  return data;
}

export async function changePassword(payload: ChangePasswordPayload) {
  const { data } = await apiClient.patch<ChangePasswordResponse>(
    "/auth/password",
    payload,
  );

  return data;
}
