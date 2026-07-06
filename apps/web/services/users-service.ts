import { http } from "@/services/http";
import type { Paginated } from "@/types/api";
import type { ListUsersParams, User } from "@/types/user";
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
