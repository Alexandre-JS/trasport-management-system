import { http } from "@/services/http";
import type { Paginated } from "@/types/api";
import type {
  CreateUserPayload,
  ListUsersParams,
  Role,
  User,
} from "@/types/user";
import { cleanParams } from "@/utils/query-params";

export async function listUsers(
  params: ListUsersParams,
): Promise<Paginated<User>> {
  const { data } = await http.get<Paginated<User>>("/users", {
    params: cleanParams(params),
  });

  return data;
}

export async function setUserActive(
  id: string,
  active: boolean,
): Promise<User> {
  const { data } = await http.patch<User>(
    `/users/${id}/${active ? "activate" : "deactivate"}`,
  );

  return data;
}

export async function getUser(id: string): Promise<User> {
  const { data } = await http.get<User>(`/users/${id}`);

  return data;
}

export async function listRoles(): Promise<Role[]> {
  const { data } = await http.get<Role[]>("/users/roles");

  return data;
}

export async function createUser(payload: CreateUserPayload): Promise<User> {
  const { data } = await http.post<User>("/users", payload);

  return data;
}

export async function changeUserRole(
  id: string,
  roleId: string,
): Promise<User> {
  const { data } = await http.patch<User>(`/users/${id}/role`, { roleId });

  return data;
}

export async function resetUserPassword(
  id: string,
  newPassword: string,
): Promise<void> {
  await http.patch(`/users/${id}/password/reset`, { newPassword });
}
