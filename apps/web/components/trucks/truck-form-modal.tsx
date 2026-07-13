"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { FormActions } from "@/components/ui/form-actions";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { useCreateTruck, useUpdateTruck } from "@/hooks/use-trucks";
import { useToast } from "@/providers/toast-provider";
import { extractErrorMessage } from "@/services/http";
import type { Truck, TruckInput, TruckStatus } from "@/types/truck";
import { emptyToUndefined } from "@/utils/form";

const statusOptions = [
  { label: "Disponível", value: "AVAILABLE" },
  { label: "Em viagem", value: "ON_TRIP" },
  { label: "Manutenção", value: "MAINTENANCE" },
  { label: "Inativo", value: "INACTIVE" },
];

const schema = z.object({
  plateNumber: z.string().min(1, "Matrícula é obrigatória"),
  brand: z.string().optional(),
  model: z.string().optional(),
  year: z
    .string()
    .optional()
    .refine((value) => !value || /^\d{4}$/.test(value), "Ano inválido"),
  status: z.string(),
});

type FormValues = z.infer<typeof schema>;

const emptyValues: FormValues = {
  plateNumber: "",
  brand: "",
  model: "",
  year: "",
  status: "AVAILABLE",
};

function toFormValues(truck: Truck): FormValues {
  return {
    plateNumber: truck.plateNumber,
    brand: truck.brand ?? "",
    model: truck.model ?? "",
    year: truck.year ? String(truck.year) : "",
    status: truck.status,
  };
}

function toPayload(values: FormValues): TruckInput {
  return {
    plateNumber: values.plateNumber.trim(),
    brand: emptyToUndefined(values.brand),
    model: emptyToUndefined(values.model),
    year: values.year ? Number(values.year) : undefined,
    status: values.status as TruckStatus,
  };
}

type TruckFormModalProps = {
  open: boolean;
  truck: Truck | null;
  onClose: () => void;
};

export function TruckFormModal({ open, truck, onClose }: TruckFormModalProps) {
  const isEdit = truck !== null;
  const { toast } = useToast();
  const createTruck = useCreateTruck();
  const updateTruck = useUpdateTruck();

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
      reset(truck ? toFormValues(truck) : emptyValues);
    }
  }, [open, truck, reset]);

  const loading = createTruck.isPending || updateTruck.isPending;

  async function onSubmit(values: FormValues, continueAfter: boolean) {
    const payload = toPayload(values);

    try {
      if (isEdit && truck) {
        await updateTruck.mutateAsync({ id: truck.id, payload });
        toast({ title: "Horse atualizado", type: "success" });
        onClose();
      } else {
        await createTruck.mutateAsync(payload);
        toast({ title: "Horse criado", type: "success" });

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
      title={isEdit ? "Editar horse" : "Novo horse"}
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
              id="plateNumber"
              label="Matrícula *"
              error={errors.plateNumber?.message}
              {...register("plateNumber")}
            />
          </div>
          <Input id="brand" label="Marca" {...register("brand")} />
          <Input id="model" label="Modelo" {...register("model")} />
          <Input
            id="year"
            label="Ano"
            inputMode="numeric"
            error={errors.year?.message}
            {...register("year")}
          />
          <div>
            <label
              htmlFor="status"
              className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300"
            >
              Estado
            </label>
            <Select id="status" options={statusOptions} {...register("status")} />
          </div>
        </div>

        <FormActions
          onCancel={onClose}
          onReset={() => reset(truck ? toFormValues(truck) : emptyValues)}
          onSaveAndContinue={handleSubmit((values) => onSubmit(values, true))}
          loading={loading}
          showContinue={!isEdit}
        />
      </form>
    </Modal>
  );
}
