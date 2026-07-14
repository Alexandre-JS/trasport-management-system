"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { useUpdateDriver } from "@/hooks/use-drivers";
import { useCreateUser, useRoles, useUsers } from "@/hooks/use-users";
import { useToast } from "@/providers/toast-provider";
import { extractErrorMessage } from "@/services/http";
import type { Driver } from "@/types/driver";

type DriverAccountModalProps = {
  driver: Driver | null;
  onClose: () => void;
};

type Mode = "create" | "existing";

/**
 * Dá acesso à app mobile a um motorista: cria um utilizador com perfil
 * DRIVER (email + senha provisória) e associa-o ao registo do motorista,
 * ou associa uma conta DRIVER já existente.
 */
export function DriverAccountModal({ driver, onClose }: DriverAccountModalProps) {
  const { toast } = useToast();
  const { data: roles } = useRoles();
  const createUser = useCreateUser();
  const updateDriver = useUpdateDriver();

  const [mode, setMode] = useState<Mode>("create");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [existingUserId, setExistingUserId] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  // contas com perfil DRIVER para o modo "associar existente"
  const driverUsers = useUsers({ role: "DRIVER", limit: 100, isActive: true });

  useEffect(() => {
    if (driver) {
      setMode("create");
      setEmail(driver.email ?? "");
      setPassword("");
      setExistingUserId("");
      setFormError(null);
    }
  }, [driver]);

  const driverRoleId = useMemo(
    () => roles?.find((role) => role.name === "DRIVER")?.id ?? null,
    [roles],
  );

  const existingOptions = [
    { label: "Selecionar conta...", value: "" },
    ...(driverUsers.data?.data ?? []).map((user) => ({
      label: `${user.firstName} ${user.lastName} — ${user.email}`,
      value: user.id,
    })),
  ];

  const loading = createUser.isPending || updateDriver.isPending;

  async function handleSubmit() {
    if (!driver) {
      return;
    }

    setFormError(null);

    try {
      if (mode === "create") {
        if (!email.trim() || !/^\S+@\S+\.\S+$/.test(email.trim())) {
          setFormError("Email inválido");
          return;
        }
        if (password.length < 8) {
          setFormError("A senha precisa de pelo menos 8 caracteres");
          return;
        }
        if (!driverRoleId) {
          setFormError("Perfil DRIVER não encontrado — recarregue a página");
          return;
        }

        const [firstName, ...rest] = driver.fullName.trim().split(/\s+/);
        const user = await createUser.mutateAsync({
          roleId: driverRoleId,
          firstName,
          lastName: rest.join(" ") || firstName,
          email: email.trim(),
          password,
          phone: driver.phone ?? undefined,
        });

        await updateDriver.mutateAsync({
          id: driver.id,
          payload: { userId: user.id },
        });

        toast({
          title: "Conta de acesso criada",
          description: `O motorista já pode entrar na app mobile com ${user.email}. Comunique-lhe a senha provisória.`,
          type: "success",
        });
      } else {
        if (!existingUserId) {
          setFormError("Escolha a conta a associar");
          return;
        }

        await updateDriver.mutateAsync({
          id: driver.id,
          payload: { userId: existingUserId },
        });

        toast({ title: "Conta associada ao motorista", type: "success" });
      }

      onClose();
    } catch (error) {
      toast({
        title: "Não foi possível concluir",
        description: extractErrorMessage(error),
        type: "error",
      });
    }
  }

  return (
    <Modal
      open={driver !== null}
      title="Conta de acesso mobile"
      description={
        driver
          ? `Dar acesso à app do motorista a “${driver.fullName}”.`
          : undefined
      }
      onClose={onClose}
    >
      <div className="flex flex-col gap-4">
        <div className="flex gap-2">
          <Button
            variant={mode === "create" ? "primary" : "outline"}
            size="sm"
            onClick={() => setMode("create")}
          >
            Criar conta nova
          </Button>
          <Button
            variant={mode === "existing" ? "primary" : "outline"}
            size="sm"
            onClick={() => setMode("existing")}
          >
            Associar existente
          </Button>
        </div>

        {mode === "create" ? (
          <div className="flex flex-col gap-4">
            <Input
              id="account-email"
              label="Email de acesso *"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
            <Input
              id="account-password"
              label="Senha provisória *"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
            <p className="text-xs text-slate-500 dark:text-slate-400">
              A conta é criada com o perfil Motorista (acesso apenas à app
              mobile). Comunique a senha ao motorista — ele deve alterá-la no
              primeiro acesso.
            </p>
          </div>
        ) : (
          <div>
            <label
              htmlFor="existing-user"
              className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300"
            >
              Conta com perfil Motorista
            </label>
            <Select
              id="existing-user"
              options={existingOptions}
              value={existingUserId}
              onChange={(event) => setExistingUserId(event.target.value)}
            />
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              Só é possível associar contas que ainda não estejam ligadas a
              outro motorista.
            </p>
          </div>
        )}

        {formError ? (
          <p className="text-sm text-rose-600 dark:text-rose-400">{formError}</p>
        ) : null}

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} loading={loading}>
            {mode === "create" ? "Criar e associar" : "Associar"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
