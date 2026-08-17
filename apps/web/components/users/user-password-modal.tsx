"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { useResetUserPassword } from "@/hooks/use-users";
import { useToast } from "@/providers/toast-provider";
import { extractErrorMessage } from "@/services/http";
import type { User } from "@/types/user";
import { passwordSchema } from "@/utils/validation";

type UserPasswordModalProps = {
  user: User | null;
  onClose: () => void;
};

export function UserPasswordModal({ user, onClose }: UserPasswordModalProps) {
  const { toast } = useToast();
  const resetPassword = useResetUserPassword();
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    if (!user) {
      return;
    }

    const result = passwordSchema.safeParse(newPassword);
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? "Invalid password");
      return;
    }

    try {
      await resetPassword.mutateAsync({ id: user.id, newPassword });
      toast({
        title: "Password reset",
        description: "Provide the new password to the user.",
        type: "success",
      });
      onClose();
    } catch (mutationError) {
      toast({
        title: "Could not reset the password",
        description: extractErrorMessage(mutationError),
        type: "error",
      });
    }
  }

  return (
    <Modal
      open={user !== null}
      title="Reset Password"
      description={
        user ? `${user.firstName} ${user.lastName} — ${user.email}` : undefined
      }
      onClose={onClose}
    >
      <div className="flex flex-col gap-4">
        <Input
          id="new-password"
          label="New temporary password"
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
            Cancel
          </Button>
          <Button onClick={handleSave} loading={resetPassword.isPending}>
            Reset password
          </Button>
        </div>
      </div>
    </Modal>
  );
}
