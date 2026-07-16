"use client";

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  changeUserRole,
  createDriverAccount,
  createUser,
  deleteUser,
  getUser,
  listRoles,
  listUsers,
  provisionDriverAccess,
  regenerateAccessCode,
  resetUserPassword,
  setUserActive,
  updateUser,
} from "@/services/users-service";
import type {
  CreateDriverAccountPayload,
  CreateUserPayload,
  ListUsersParams,
  UpdateUserPayload,
} from "@/types/user";

const USERS_KEY = "users";
const ROLES_KEY = "roles";

export function useUsers(params: ListUsersParams) {
  return useQuery({
    queryKey: [USERS_KEY, params],
    queryFn: () => listUsers(params),
    placeholderData: keepPreviousData,
  });
}

export function useUser(id: string | null) {
  return useQuery({
    queryKey: [USERS_KEY, "detail", id],
    queryFn: () => getUser(id as string),
    enabled: id !== null,
  });
}

export function useRoles() {
  return useQuery({
    queryKey: [ROLES_KEY],
    queryFn: listRoles,
    staleTime: 5 * 60 * 1000,
  });
}

export function useSetUserActive() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      setUserActive(id, active),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [USERS_KEY] });
    },
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateUserPayload) => createUser(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [USERS_KEY] });
    },
  });
}

export function useCreateDriverAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateDriverAccountPayload) =>
      createDriverAccount(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [USERS_KEY] });
    },
  });
}

export function useProvisionDriverAccess() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      driverId,
      phone,
      email,
    }: {
      driverId: string;
      phone: string;
      email?: string;
    }) => provisionDriverAccess(driverId, { phone, email }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [USERS_KEY] });
      void queryClient.invalidateQueries({ queryKey: ["drivers"] });
    },
  });
}

export function useRegenerateAccessCode() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => regenerateAccessCode(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [USERS_KEY] });
    },
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateUserPayload }) =>
      updateUser(id, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [USERS_KEY] });
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteUser(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [USERS_KEY] });
    },
  });
}

export function useChangeUserRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, roleId }: { id: string; roleId: string }) =>
      changeUserRole(id, roleId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [USERS_KEY] });
    },
  });
}

export function useResetUserPassword() {
  return useMutation({
    mutationFn: ({ id, newPassword }: { id: string; newPassword: string }) =>
      resetUserPassword(id, newPassword),
  });
}
