"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { FormActions } from "@/components/ui/form-actions";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { useCreateDriver, useUpdateDriver } from "@/hooks/use-drivers";
import { useToast } from "@/providers/toast-provider";
import { extractErrorMessage } from "@/services/http";
import type { Driver, DriverInput, DriverStatus } from "@/types/driver";
import { emptyToUndefined } from "@/utils/form";

const statusOptions = [
  { label: "Disponível", value: "AVAILABLE" },
  { label: "Em viagem", value: "ON_TRIP" },
  { label: "Offline", value: "OFFLINE" },
  { label: "Inativo", value: "INACTIVE" },
];

const schema = z.object({
  fullName: z.string().min(1, "Nome é obrigatório"),
  licenseNumber: z.string().min(1, "Carta de condução é obrigatória"),
  phone: z.string().optional(),
  email: z.union([z.literal(""), z.string().email("Email inválido")]),
  status: z.string(),
});

type FormValues = z.infer<typeof schema>;

const emptyValues: FormValues = {
  fullName: "",
  licenseNumber: "",
  phone: "",
  email: "",
  status: "AVAILABLE",
};

function toFormValues(driver: Driver): FormValues {
  return {
    fullName: driver.fullName,
    licenseNumber: driver.licenseNumber,
    phone: driver.phone ?? "",
    email: driver.email ?? "",
    status: driver.status,
  };
}

function toPayload(values: FormValues): DriverInput {
  return {
    fullName: values.fullName.trim(),
    licenseNumber: values.licenseNumber.trim(),
    phone: emptyToUndefined(values.phone),
    email: emptyToUndefined(values.email),
    status: values.status as DriverStatus,
  };
}

type DriverFormModalProps = {
  open: boolean;
  driver: Driver | null;
  onClose: () => void;
};

export function DriverFormModal({
  open,
  driver,
  onClose,
}: DriverFormModalProps) {
  const isEdit = driver !== null;
  const { toast } = useToast();
  const createDriver = useCreateDriver();
  const updateDriver = useUpdateDriver();

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
      reset(driver ? toFormValues(driver) : emptyValues);
    }
  }, [open, driver, reset]);

  const loading = createDriver.isPending || updateDriver.isPending;

  async function onSubmit(values: FormValues, continueAfter: boolean) {
    const payload = toPayload(values);

    try {
      if (isEdit && driver) {
        await updateDriver.mutateAsync({ id: driver.id, payload });
        toast({ title: "Motorista atualizado", type: "success" });
        onClose();
      } else {
        await createDriver.mutateAsync(payload);
        toast({ title: "Motorista criado", type: "success" });

        if (continueAfter) {
          reset(emptyValues);
        } else {
          onClose();
        }
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
      title={isEdit ? "Editar motorista" : "Novo motorista"}
      description="Os campos marcados são obrigatórios."
      onClose={onClose}
    >
      <form
        onSubmit={handleSubmit((values) => onSubmit(values, false))}
        className="flex flex-col gap-4"
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Input
              id="fullName"
              label="Nome completo *"
              error={errors.fullName?.message}
              {...register("fullName")}
            />
          </div>
          <Input
            id="licenseNumber"
            label="Carta de condução *"
            error={errors.licenseNumber?.message}
            {...register("licenseNumber")}
          />
          <Input id="phone" label="Telefone" {...register("phone")} />
          <Input
            id="email"
            label="Email"
            type="email"
            error={errors.email?.message}
            {...register("email")}
          />
          <div>
            <label
              htmlFor="status"
              className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300"
            >
              Disponibilidade
            </label>
            <Select id="status" options={statusOptions} {...register("status")} />
          </div>
        </div>

        <FormActions
          onCancel={onClose}
          onReset={() => reset(driver ? toFormValues(driver) : emptyValues)}
          onSaveAndContinue={handleSubmit((values) => onSubmit(values, true))}
          loading={loading}
          showContinue={!isEdit}
        />
      </form>
    </Modal>
  );
}
