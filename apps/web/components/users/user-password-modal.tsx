"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { useResetUserPassword } from "@/hooks/use-users";
import { useToast } from "@/providers/toast-provider";
import { extractErrorMessage } from "@/services/http";
import type { User } from "@/types/user";

type UserPasswordModalProps = {
  user: User | null;
  onClose: () => void;
};

export function UserPasswordModal({ user, onClose }: UserPasswordModalProps) {
  const { toast } = useToast();
  const resetPassword = useResetUserPassword();
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setNewPassword("");
    setError(null);
  }, [user]);

  async function handleSave() {
    if (!user) {
      return;
    }

    if (newPassword.length < 8) {
      setError("Mínimo 8 caracteres");
      return;
    }

    try {
      await resetPassword.mutateAsync({ id: user.id, newPassword });
      toast({
        title: "Senha reposta",
        description: "Comunique a nova senha ao utilizador.",
        type: "success",
      });
      onClose();
    } catch (mutationError) {
      toast({
        title: "Não foi possível repor a senha",
        description: extractErrorMessage(mutationError),
        type: "error",
      });
    }
  }

  return (
    <Modal
      open={user !== null}
      title="Repor senha"
      description={
        user ? `${user.firstName} ${user.lastName} — ${user.email}` : undefined
      }
      onClose={onClose}
    >
      <div className="flex flex-col gap-4">
        <Input
          id="new-password"
          label="Nova senha provisória"
          type="password"
          autoComplete="new-password"
          value={newPassword}
          error={error ?? undefined}
          onChange={(event) => {
            setNewPassword(event.target.value);
            setError(null);
          }}
        />
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave} loading={resetPassword.isPending}>
            Repor senha
          </Button>
        </div>
      </div>
    </Modal>
  );
}
