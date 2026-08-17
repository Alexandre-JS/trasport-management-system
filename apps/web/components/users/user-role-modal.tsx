"use client";

import { useState } from "react";
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
  const [roleId, setRoleId] = useState(user?.roleId ?? "");

  // Não é possível transformar uma conta em Motorista por aqui — esse
  // vínculo cria-se em Motoristas → "Dar acesso mobile". A conta atual de
  // um motorista pode, no entanto, ser promovida a outro perfil.
  const roleOptions = (roles ?? [])
    .filter((role) => role.name !== "DRIVER" || role.id === user?.roleId)
    .map((role) => ({
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
      toast({ title: "Role updated", type: "success" });
      onClose();
    } catch (error) {
      toast({
        title: "Could not change the role",
        description: extractErrorMessage(error),
        type: "error",
      });
    }
  }

  return (
    <Modal
      open={user !== null}
      title="Change Role"
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
            Role
          </label>
          <Select
            id="user-role"
            options={roleOptions}
            value={roleId}
            onChange={(event) => setRoleId(event.target.value)}
          />
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            {user?.role.name === "DRIVER"
              ? "Warning: changing the role removes this account's access to the driver app."
              : "The role defines permissions. Create driver accounts under Driver Access."}
          </p>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} loading={changeRole.isPending}>
            Save
          </Button>
        </div>
      </div>
    </Modal>
  );
}
