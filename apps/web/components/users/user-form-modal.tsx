"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { FormActions } from "@/components/ui/form-actions";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Modal } from "@/components/ui/modal";
import { useCreateUser, useRoles } from "@/hooks/use-users";
import { useToast } from "@/providers/toast-provider";
import { extractErrorMessage } from "@/services/http";
import { emptyToUndefined } from "@/utils/form";
import { roleLabelMap } from "@/utils/role-permissions";

const schema = z.object({
  firstName: z.string().min(1, "Nome é obrigatório"),
  lastName: z.string().min(1, "Apelido é obrigatório"),
  email: z.string().email("Email inválido"),
  phone: z.string().optional(),
  password: z.string().min(8, "Mínimo 8 caracteres"),
  roleId: z.string().min(1, "Perfil é obrigatório"),
});

type FormValues = z.infer<typeof schema>;

const emptyValues: FormValues = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  password: "",
  roleId: "",
};

type UserFormModalProps = {
  open: boolean;
  onClose: () => void;
};

export function UserFormModal({ open, onClose }: UserFormModalProps) {
  const { toast } = useToast();
  const createUser = useCreateUser();
  const { data: roles } = useRoles();

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
      reset(emptyValues);
    }
  }, [open, reset]);

  const roleOptions = [
    { label: "Selecionar perfil...", value: "" },
    ...(roles ?? []).map((role) => ({
      label: roleLabelMap[role.name] ?? role.name,
      value: role.id,
    })),
  ];

  async function onSubmit(values: FormValues, continueAfter: boolean) {
    try {
      await createUser.mutateAsync({
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
        email: values.email.trim(),
        phone: emptyToUndefined(values.phone?.trim()),
        password: values.password,
        roleId: values.roleId,
      });
      toast({ title: "Utilizador criado", type: "success" });

      if (continueAfter) {
        reset(emptyValues);
      } else {
        onClose();
      }
    } catch (error) {
      toast({
        title: "Não foi possível criar o utilizador",
        description: extractErrorMessage(error),
        type: "error",
      });
    }
  }

  return (
    <Modal
      open={open}
      size="lg"
      title="Novo utilizador"
      description="A senha definida aqui é provisória — o utilizador deve alterá-la no primeiro acesso."
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
          <Input id="phone" label="Telefone" {...register("phone")} />
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
            <Select id="roleId" options={roleOptions} {...register("roleId")} />
            {errors.roleId ? (
              <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">
                {errors.roleId.message}
              </p>
            ) : null}
          </div>
        </div>

        <FormActions
          onCancel={onClose}
          onReset={() => reset(emptyValues)}
          onSaveAndContinue={handleSubmit((values) => onSubmit(values, true))}
          loading={createUser.isPending}
          showContinue
        />
      </form>
    </Modal>
  );
}
