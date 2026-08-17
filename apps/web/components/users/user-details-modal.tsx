"use client";

import { KeyRound, Pencil, Power, ShieldCheck, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import type { User } from "@/types/user";
import { formatDateTime } from "@/utils/format";
import { roleLabelMap, roleToneMap } from "@/utils/role-permissions";

type UserDetailsModalProps = {
  user: User | null;
  onClose: () => void;
  onEdit: (user: User) => void;
  onChangeRole: (user: User) => void;
  onResetPassword: (user: User) => void;
  onToggleActive: (user: User) => void;
  onDelete: (user: User) => void;
};

export function UserDetailsModal({
  user,
  onClose,
  onEdit,
  onChangeRole,
  onResetPassword,
  onToggleActive,
  onDelete,
}: UserDetailsModalProps) {
  return (
    <Modal
      open={user !== null}
      size="lg"
      title={user ? `${user.firstName} ${user.lastName}` : "User"}
      description={user?.email}
      onClose={onClose}
    >
      {user ? (
        <div className="flex flex-col gap-5">
          <dl className="overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            <DetailRow label="Full name">
              {user.firstName} {user.lastName}
            </DetailRow>
            <DetailRow label="Email">{user.email}</DetailRow>
            <DetailRow label="Phone">{user.phone ?? "—"}</DetailRow>
            <DetailRow label="Role">
              <Badge tone={roleToneMap[user.role.name] ?? "slate"}>
                {roleLabelMap[user.role.name] ?? user.role.name}
              </Badge>
            </DetailRow>
            <DetailRow label="Status">
              <Badge tone={user.isActive ? "green" : "red"}>
                {user.isActive ? "Active" : "Inactive"}
              </Badge>
            </DetailRow>
            <DetailRow label="Last login">
              {user.lastLogin ? formatDateTime(user.lastLogin) : "Never"}
            </DetailRow>
            <DetailRow label="Created at">
              {formatDateTime(user.createdAt)}
            </DetailRow>
            <DetailRow label="Last updated">
              {formatDateTime(user.updatedAt)}
            </DetailRow>
          </dl>

          <div className="flex flex-col gap-2 border-t border-slate-200 pt-4 dark:border-slate-800">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Actions
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                icon={<Pencil className="size-4" />}
                onClick={() => onEdit(user)}
              >
                Edit details
              </Button>
              <Button
                variant="outline"
                size="sm"
                icon={<ShieldCheck className="size-4" />}
                onClick={() => onChangeRole(user)}
              >
                Change role
              </Button>
              <Button
                variant="outline"
                size="sm"
                icon={<KeyRound className="size-4" />}
                onClick={() => onResetPassword(user)}
              >
                Reset password
              </Button>
              <Button
                variant="outline"
                size="sm"
                icon={<Power className="size-4" />}
                onClick={() => onToggleActive(user)}
              >
                {user.isActive ? "Deactivate" : "Activate"}
              </Button>
              <Button
                variant="danger"
                size="sm"
                icon={<Trash2 className="size-4" />}
                onClick={() => onDelete(user)}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </Modal>
  );
}

function DetailRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid border-b border-slate-100 last:border-b-0 sm:grid-cols-[minmax(9rem,38%)_1fr] dark:border-slate-800">
      <dt className="bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
        {label}
      </dt>
      <dd className="min-w-0 break-words px-4 py-3 text-sm text-slate-900 dark:text-white">
        {children}
      </dd>
    </div>
  );
}
