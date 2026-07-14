"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { useChangeUserRole, useRoles } from "@/hooks/use-users";
import { useToast } from "@/providers/toast-provider";
import { extractErrorMessage } from "@/services/http";
import type { User } from "@/types/user";
import { roleLabelMap } from "@/utils/role-permissions";

type UserRoleModalProps = {
  user: User | null;
  onClose: () => void;
};

export function UserRoleModal({ user, onClose }: UserRoleModalProps) {
  const { toast } = useToast();
  const changeRole = useChangeUserRole();
  const { data: roles } = useRoles();
  const [roleId, setRoleId] = useState("");

  useEffect(() => {
    setRoleId(user?.roleId ?? "");
  }, [user]);

  const roleOptions = (roles ?? []).map((role) => ({
    label: roleLabelMap[role.name] ?? role.name,
    value: role.id,
  }));

  async function handleSave() {
    if (!user || !roleId || roleId === user.roleId) {
      onClose();
      return;
    }

    try {
      await changeRole.mutateAsync({ id: user.id, roleId });
      toast({ title: "Perfil atualizado", type: "success" });
      onClose();
    } catch (error) {
      toast({
        title: "Não foi possível mudar o perfil",
        description: extractErrorMessage(error),
        type: "error",
      });
    }
  }

  return (
    <Modal
      open={user !== null}
      title="Mudar perfil"
      description={
        user ? `${user.firstName} ${user.lastName} — ${user.email}` : undefined
      }
      onClose={onClose}
    >
      <div className="flex flex-col gap-4">
        <div>
          <label
            htmlFor="user-role"
            className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300"
          >
            Perfil
          </label>
          <Select
            id="user-role"
            options={roleOptions}
            value={roleId}
            onChange={(event) => setRoleId(event.target.value)}
          />
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            O perfil define as permissões — por exemplo, só o perfil Motorista
            dá acesso à app mobile.
          </p>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave} loading={changeRole.isPending}>
            Guardar
          </Button>
        </div>
      </div>
    </Modal>
  );
}
