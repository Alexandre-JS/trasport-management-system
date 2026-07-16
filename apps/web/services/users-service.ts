import { http } from "@/services/http";
import type { Paginated } from "@/types/api";
import type {
  AccessCodeResult,
  CreateDriverAccountPayload,
  CreateUserPayload,
  DriverAccountResult,
  ListUsersParams,
  ProvisionDriverAccessPayload,
  Role,
  UpdateUserPayload,
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

export async function createDriverAccount(
  payload: CreateDriverAccountPayload,
): Promise<DriverAccountResult> {
  const { data } = await http.post<DriverAccountResult>(
    "/users/drivers",
    payload,
  );

  return data;
}

export async function provisionDriverAccess(
  driverId: string,
  payload: ProvisionDriverAccessPayload,
): Promise<DriverAccountResult> {
  const { data } = await http.post<DriverAccountResult>(
    `/users/drivers/${driverId}/access`,
    payload,
  );
  return data;
}

export async function regenerateAccessCode(
  id: string,
): Promise<AccessCodeResult> {
  const { data } = await http.post<AccessCodeResult>(
    `/users/${id}/access-code`,
  );

  return data;
}

export async function updateUser(
  id: string,
  payload: UpdateUserPayload,
): Promise<User> {
  const { data } = await http.patch<User>(`/users/${id}`, payload);

  return data;
}

export async function deleteUser(id: string): Promise<void> {
  await http.delete(`/users/${id}`);
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
