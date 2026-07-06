"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Shield, UserRound, type LucideIcon } from "lucide-react";
import type { InputHTMLAttributes } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { PrimaryButton } from "@/src/shared/components/action-button";
import { Card } from "@/src/shared/components/card";
import { ErrorState } from "@/src/shared/components/error-state";
import { PageHeader } from "@/src/shared/components/page-header";
import { PageLoader } from "@/src/shared/components/page-loader";
import { StatusBadge } from "@/src/shared/components/status-badge";
import { UserAvatar } from "@/src/shared/components/user-avatar";
import { useAuth } from "@/src/shared/hooks/use-auth";
import { extractErrorMessage } from "@/src/shared/services/api-client";
import { me } from "@/src/shared/services/auth.service";
import { useToast } from "@/providers/toast-provider";

const passwordSchema = z
  .object({
    currentPassword: z
      .string()
      .min(8, "A password atual deve ter pelo menos 8 caracteres"),
    newPassword: z
      .string()
      .min(8, "A nova password deve ter pelo menos 8 caracteres"),
    confirmPassword: z.string().min(8, "Confirme a nova password"),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    path: ["confirmPassword"],
    message: "As passwords não coincidem",
  });

type PasswordFormValues = z.infer<typeof passwordSchema>;

export function ProfileView() {
  const { changePassword } = useAuth();
  const { toast } = useToast();
  const profileQuery = useQuery({
    queryKey: ["auth", "me"],
    queryFn: me,
  });
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(values: PasswordFormValues) {
    try {
      await changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      reset();
      toast({
        title: "Password alterada",
        description: "A sua password foi atualizada com sucesso.",
        type: "success",
      });
    } catch (error) {
      const message = extractErrorMessage(error);

      setError("root", { message });
      toast({
        title: "Não foi possível alterar a password",
        description: message,
        type: "error",
      });
    }
  }

  if (profileQuery.isLoading) {
    return <PageLoader />;
  }

  if (profileQuery.isError || !profileQuery.data) {
    return (
      <ErrorState
        title="Não foi possível carregar o perfil"
        description={extractErrorMessage(profileQuery.error)}
        onAction={() => void profileQuery.refetch()}
      />
    );
  }

  const user = profileQuery.data;
  const fullName = `${user.firstName} ${user.lastName}`.trim();

  return (
    <>
      <PageHeader
        title="Perfil"
        description="Dados da conta autenticada, permissões e segurança de acesso."
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_420px]">
        <Card className="p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
            <UserAvatar user={user} size="lg" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-lg font-semibold text-slate-950 dark:text-white">
                  {fullName}
                </h2>
                <StatusBadge tone={user.isActive ? "success" : "warning"}>
                  {user.isActive ? "Ativo" : "Inativo"}
                </StatusBadge>
              </div>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {user.email}
              </p>
            </div>
          </div>

          <dl className="mt-8 grid gap-4 sm:grid-cols-2">
            <ProfileField label="Nome" value={fullName} icon={UserRound} />
            <ProfileField label="Email" value={user.email} icon={Shield} />
            <ProfileField label="Perfil" value={user.role} icon={Shield} />
            <ProfileField
              label="Último login"
              value={
                user.lastLogin
                  ? new Intl.DateTimeFormat("pt-MZ", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    }).format(new Date(user.lastLogin))
                  : "Sem registo"
              }
              icon={CheckCircle2}
            />
          </dl>

          <div className="mt-8">
            <h3 className="text-sm font-semibold text-slate-950 dark:text-white">
              Permissões
            </h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {user.permissions.map((permission) => (
                <StatusBadge key={permission}>{permission}</StatusBadge>
              ))}
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-base font-semibold text-slate-950 dark:text-white">
            Alterar password
          </h2>
          <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-400">
            Defina uma nova password usando a password atual como validação.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-5 space-y-4">
            <PasswordField
              label="Password atual"
              error={errors.currentPassword?.message}
              {...register("currentPassword")}
            />
            <PasswordField
              label="Nova password"
              error={errors.newPassword?.message}
              {...register("newPassword")}
            />
            <PasswordField
              label="Confirmar nova password"
              error={errors.confirmPassword?.message}
              {...register("confirmPassword")}
            />

            {errors.root ? (
              <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">
                {errors.root.message}
              </p>
            ) : null}

            <PrimaryButton type="submit" loading={isSubmitting}>
              Guardar password
            </PrimaryButton>
          </form>
        </Card>
      </div>
    </>
  );
}

type ProfileFieldProps = {
  label: string;
  value: string;
  icon: LucideIcon;
};

function ProfileField({ label, value, icon: Icon }: ProfileFieldProps) {
  return (
    <div className="rounded-md border border-slate-200 p-4 dark:border-slate-800">
      <dt className="flex items-center gap-2 text-xs font-medium uppercase text-slate-500 dark:text-slate-400">
        <Icon className="size-4" aria-hidden />
        {label}
      </dt>
      <dd className="mt-2 break-words text-sm font-medium text-slate-950 dark:text-white">
        {value}
      </dd>
    </div>
  );
}

type PasswordFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
};

function PasswordField({ label, error, ...props }: PasswordFieldProps) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
        {label}
      </span>
      <input
        type="password"
        className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-950 outline-none focus:border-brand-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
        {...props}
      />
      {error ? (
        <span className="text-xs text-rose-600 dark:text-rose-400">
          {error}
        </span>
      ) : null}
    </label>
  );
}
