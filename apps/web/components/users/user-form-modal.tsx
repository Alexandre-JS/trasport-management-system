"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { FormActions } from "@/components/ui/form-actions";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Modal } from "@/components/ui/modal";
import { useCreateUser, useRoles, useUpdateUser } from "@/hooks/use-users";
import { useToast } from "@/providers/toast-provider";
import { extractErrorMessage } from "@/services/http";
import type { User } from "@/types/user";
import { emptyToUndefined } from "@/utils/form";
import { optionalPhoneSchema, passwordSchema } from "@/utils/validation";
import { roleLabelMap } from "@/utils/role-permissions";

// Na edição a senha não é alterada aqui (ação "Repor senha" nos detalhes)
// e o perfil muda pela ação dedicada "Mudar perfil".
const baseSchema = z.object({
  firstName: z.string().min(1, "Nome é obrigatório"),
  lastName: z.string().min(1, "Apelido é obrigatório"),
  email: z.string().email("Email inválido"),
  phone: optionalPhoneSchema,
  password: z.string(),
  roleId: z.string(),
});

type FormValues = z.infer<typeof baseSchema>;

const emptyValues: FormValues = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  password: "",
  roleId: "",
};

function toFormValues(user: User): FormValues {
  return {
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phone: user.phone ?? "",
    password: "",
    roleId: user.roleId,
  };
}

type UserFormModalProps = {
  open: boolean;
  user: User | null;
  onClose: () => void;
};

export function UserFormModal({ open, user, onClose }: UserFormModalProps) {
  const isEdit = user !== null;
  const { toast } = useToast();
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const { data: roles } = useRoles();

  const schema = baseSchema.superRefine((values, ctx) => {
    if (!isEdit) {
      const result = passwordSchema.safeParse(values.password);
      if (!result.success) {
        ctx.addIssue({
          code: "custom",
          path: ["password"],
          message: result.error.issues[0]?.message ?? "Senha inválida",
        });
      }
    }
    if (!isEdit && !values.roleId) {
      ctx.addIssue({
        code: "custom",
        path: ["roleId"],
        message: "Perfil é obrigatório",
      });
    }
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: emptyValues,
  });

  useEffect(() => {
    if (open) {
      reset(user ? toFormValues(user) : emptyValues);
    }
  }, [open, user, reset]);

  // Contas de motorista criam-se em Motoristas → "Dar acesso mobile", que
  // cria a conta E o registo operacional (com carta de condução) ligados.
  // Criar aqui um usuário DRIVER deixaria uma conta órfã, invisível na
  // tabela de Motoristas e sem acesso à app.
  const roleOptions = [
    { label: "Selecionar perfil...", value: "" },
    ...(roles ?? [])
      .filter((role) => role.name !== "DRIVER")
      .map((role) => ({
        label: roleLabelMap[role.name] ?? role.name,
        value: role.id,
      })),
  ];

  const loading = createUser.isPending || updateUser.isPending;

  async function onSubmit(values: FormValues, continueAfter: boolean) {
    try {
      if (isEdit && user) {
        await updateUser.mutateAsync({
          id: user.id,
          payload: {
            firstName: values.firstName.trim(),
            lastName: values.lastName.trim(),
            email: values.email.trim(),
            phone: emptyToUndefined(values.phone?.trim()),
          },
        });
        toast({ title: "Usuário atualizado", type: "success" });
        onClose();
        return;
      }

      await createUser.mutateAsync({
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
        email: values.email.trim(),
        phone: emptyToUndefined(values.phone?.trim()),
        password: values.password,
        roleId: values.roleId,
      });
      toast({ title: "Usuário criado", type: "success" });

      if (continueAfter) {
        reset(emptyValues);
      } else {
        onClose();
      }
    } catch (error) {
      toast({
        title: "Não foi possível guardar",
        description: extractErrorMessage(error),
        type: "error",
      });
    }
  }

  return (
    <Modal
      open={open}
      size="lg"
      title={isEdit ? "Editar usuário" : "Novo usuário"}
      description={
        isEdit
          ? "O perfil e a senha mudam pelas ações dedicadas nos detalhes."
          : "A senha definida aqui é provisória — o usuário deve alterá-la no primeiro acesso."
      }
      onClose={onClose}
    >
      <form
        onSubmit={handleSubmit((values) => onSubmit(values, false))}
        className="flex flex-col gap-4"
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            id="firstName"
            label="Nome *"
            error={errors.firstName?.message}
            {...register("firstName")}
          />
          <Input
            id="lastName"
            label="Apelido *"
            error={errors.lastName?.message}
            {...register("lastName")}
          />
          <Input
            id="email"
            label="Email *"
            type="email"
            error={errors.email?.message}
            {...register("email")}
          />
          <Input
            id="phone"
            label="Telefone"
            error={errors.phone?.message}
            {...register("phone")}
          />
          {isEdit ? null : (
            <>
              <Input
                id="password"
                label="Senha provisória *"
                type="password"
                autoComplete="new-password"
                error={errors.password?.message}
                {...register("password")}
              />
              <div>
                <label
                  htmlFor="roleId"
                  className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300"
                >
                  Perfil *
                </label>
                <Select
                  id="roleId"
                  options={roleOptions}
                  {...register("roleId")}
                />
                {errors.roleId ? (
                  <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">
                    {errors.roleId.message}
                  </p>
                ) : null}
                <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                  Contas de <strong>motorista</strong> criam-se na página
                  Motoristas → ação “Dar acesso mobile”, já ligadas ao registo
                  do motorista.
                </p>
              </div>
            </>
          )}
        </div>

        <FormActions
          onCancel={onClose}
          onReset={() => reset(user ? toFormValues(user) : emptyValues)}
          onSaveAndContinue={handleSubmit((values) => onSubmit(values, true))}
          loading={loading}
          showContinue={!isEdit}
        />
      </form>
    </Modal>
  );
}
