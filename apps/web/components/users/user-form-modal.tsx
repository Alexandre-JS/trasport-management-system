"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { FormActions } from "@/components/ui/form-actions";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Modal } from "@/components/ui/modal";
import {
  useCreateDriverAccount,
  useCreateUser,
  useRoles,
  useUpdateUser,
} from "@/hooks/use-users";
import { useToast } from "@/providers/toast-provider";
import { extractErrorMessage } from "@/services/http";
import type { User } from "@/types/user";
import { emptyToUndefined } from "@/utils/form";
import { optionalPhoneSchema, passwordSchema } from "@/utils/validation";
import { roleLabelMap } from "@/utils/role-permissions";
import {
  AccessDeliveryPanel,
  type AccessDelivery,
} from "@/src/shared/components/access-delivery-panel";

// Na edição a senha não é alterada aqui (ação "Repor senha" nos detalhes)
// e o perfil muda pela ação dedicada "Mudar perfil".
const baseSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string(),
  phone: optionalPhoneSchema,
  password: z.string(),
  roleId: z.string(),
  licenseNumber: z.string(),
  passportNumber: z.string(),
});

type FormValues = z.infer<typeof baseSchema>;

const emptyValues: FormValues = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  password: "",
  roleId: "",
  licenseNumber: "",
  passportNumber: "",
};

function toFormValues(user: User): FormValues {
  return {
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phone: user.phone ?? "",
    password: "",
    roleId: user.roleId,
    licenseNumber: "",
    passportNumber: "",
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
  const createDriverAccount = useCreateDriverAccount();
  const updateUser = useUpdateUser();
  const { data: roles } = useRoles();
  const [createdAccess, setCreatedAccess] = useState<AccessDelivery | null>(
    null,
  );
  const [showPassword, setShowPassword] = useState(false);

  const isDriverRole = (roleId: string) =>
    roles?.find((role) => role.id === roleId)?.name === "DRIVER";

  const schema = baseSchema.superRefine((values, ctx) => {
    if (isEdit) return;

    if (!values.roleId) {
      ctx.addIssue({
        code: "custom",
        path: ["roleId"],
        message: "Role is required",
      });
      return;
    }

    const driver = isDriverRole(values.roleId);
    const email = values.email.trim();

    if (email && !/^\S+@\S+\.\S+$/.test(email)) {
      ctx.addIssue({ code: "custom", path: ["email"], message: "Invalid email" });
    } else if (!email && !driver) {
      ctx.addIssue({
        code: "custom",
        path: ["email"],
        message: "Email is required",
      });
    }

    if (driver) {
      if (!values.phone?.trim()) {
        ctx.addIssue({
          code: "custom",
          path: ["phone"],
          message: "Phone number is required for mobile access",
        });
      }
      if (!values.licenseNumber.trim()) {
        ctx.addIssue({
          code: "custom",
          path: ["licenseNumber"],
          message: "Driving licence number is required",
        });
      }
    } else {
      const result = passwordSchema.safeParse(values.password);
      if (!result.success) {
        ctx.addIssue({
          code: "custom",
          path: ["password"],
          message: result.error.issues[0]?.message ?? "Invalid password",
        });
      }
    }
  });

  const {
    register,
    handleSubmit,
    reset,
    control,
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

  function handleClose() {
    setCreatedAccess(null);
    setShowPassword(false);
    onClose();
  }

  const selectedRoleId = useWatch({ control, name: "roleId" });
  const driverSelected = !isEdit && isDriverRole(selectedRoleId);

  // Motoristas podem agora ser criados aqui: além da conta, o sistema cria o
  // registo do motorista (com carta) e gera o código de acesso mobile.
  const roleOptions = [
    { label: "Select role...", value: "" },
    ...(roles ?? []).map((role) => ({
      label: roleLabelMap[role.name] ?? role.name,
      value: role.id,
    })),
  ];

  const loading =
    createUser.isPending ||
    createDriverAccount.isPending ||
    updateUser.isPending;

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
        toast({ title: "User updated", type: "success" });
        onClose();
        return;
      }

      if (isDriverRole(values.roleId)) {
        const result = await createDriverAccount.mutateAsync({
          firstName: values.firstName.trim(),
          lastName: values.lastName.trim(),
          phone: values.phone!.trim(),
          licenseNumber: values.licenseNumber.trim(),
          email: emptyToUndefined(values.email?.trim()),
          passportNumber: emptyToUndefined(values.passportNumber?.trim()),
        });
        toast({
          title: "Driver account created",
          description:
            "Provide the driver with the phone number and app access code.",
          type: "success",
        });
        setCreatedAccess({
          recipientName: `${result.firstName} ${result.lastName}`.trim(),
          email: result.phone ?? values.phone!.trim(),
          identifierLabel: "Phone",
          password: result.accessCode,
          secretLabel: "Access code",
          changeableSecret: false,
          destinationUrl:
            process.env.NEXT_PUBLIC_DRIVER_APP_URL?.trim() ||
            "https://play.google.com/store/apps",
          destinationLabel: "Driver app (Play Store)",
          documentTitle: "Driver access details",
        });
        reset(emptyValues);
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
      toast({ title: "User created", type: "success" });

      if (continueAfter) {
        reset(emptyValues);
      } else {
        onClose();
      }
    } catch (error) {
      toast({
        title: "Could not save the user",
        description: extractErrorMessage(error),
        type: "error",
      });
    }
  }

  return (
    <Modal
      open={open}
      size="lg"
      title={isEdit ? "Edit User" : "New User"}
      description={
        isEdit
          ? "Use the dedicated actions in user details to change the role or password."
          : "This password is temporary and must be changed on first sign-in. Driver access codes are generated automatically."
      }
      onClose={handleClose}
    >
      <form
        onSubmit={handleSubmit((values) => onSubmit(values, false))}
        className="flex flex-col gap-4"
      >
        {createdAccess ? <AccessDeliveryPanel access={createdAccess} /> : null}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            id="firstName"
            label="First name *"
            error={errors.firstName?.message}
            {...register("firstName")}
          />
          <Input
            id="lastName"
            label="Last name *"
            error={errors.lastName?.message}
            {...register("lastName")}
          />
          <Input
            id="email"
            label={driverSelected ? "Email (optional)" : "Email *"}
            type="email"
            error={errors.email?.message}
            {...register("email")}
          />
          <Input
            id="phone"
            label={driverSelected ? "Phone *" : "Phone"}
            error={errors.phone?.message}
            {...register("phone")}
          />
          {isEdit ? null : (
            <>
              {driverSelected ? (
                <>
                  <Input
                    id="licenseNumber"
                    label="Driving licence number *"
                    error={errors.licenseNumber?.message}
                    {...register("licenseNumber")}
                  />
                  <Input
                    id="passportNumber"
                    label="Passport number"
                    error={errors.passportNumber?.message}
                    {...register("passportNumber")}
                  />
                </>
              ) : (
                <Input
                  id="password"
                  label="Temporary password *"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  error={errors.password?.message}
                  endElement={
                    <button
                      type="button"
                      onClick={() => setShowPassword((visible) => !visible)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      aria-pressed={showPassword}
                      className="grid size-7 place-items-center rounded text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
                    >
                      {showPassword ? (
                        <EyeOff className="size-4" aria-hidden />
                      ) : (
                        <Eye className="size-4" aria-hidden />
                      )}
                    </button>
                  }
                  {...register("password")}
                />
              )}
              <div>
                <label
                  htmlFor="roleId"
                  className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300"
                >
                  Role *
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
                  {driverSelected
                    ? "App sign-in: phone number and an access code generated when the account is created."
                    : "Drivers sign in to the app with their phone number and a system-generated code."}
                </p>
              </div>
            </>
          )}
        </div>

        <FormActions
          onCancel={handleClose}
          onReset={() => reset(user ? toFormValues(user) : emptyValues)}
          onSaveAndContinue={handleSubmit((values) => onSubmit(values, true))}
          loading={loading}
          showContinue={!isEdit && !driverSelected}
          submitLabel={driverSelected ? "Create and generate code" : undefined}
        />
      </form>
    </Modal>
  );
}
