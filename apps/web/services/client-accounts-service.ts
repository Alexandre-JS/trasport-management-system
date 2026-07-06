import { http } from "@/services/http";

export type CreateClientAccountPayload = {
  clientId: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
};

export async function createClientAccount(
  payload: CreateClientAccountPayload,
): Promise<{ id: string }> {
  const { data } = await http.post<{ id: string }>(
    "/users/client-accounts",
    payload,
  );

  return data;
}
