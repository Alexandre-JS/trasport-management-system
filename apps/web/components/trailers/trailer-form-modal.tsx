"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { FormActions } from "@/components/ui/form-actions";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { useTrucks } from "@/hooks/use-trucks";
import { useCreateTrailer, useUpdateTrailer } from "@/hooks/use-trailers";
import { useToast } from "@/providers/toast-provider";
import { extractErrorMessage } from "@/services/http";
import type { Trailer, TrailerInput, TrailerStatus } from "@/types/trailer";
import { emptyToUndefined } from "@/utils/form";

const statusOptions = [
  { label: "Disponível", value: "AVAILABLE" },
  { label: "Em viagem", value: "ON_TRIP" },
  { label: "Manutenção", value: "MAINTENANCE" },
  { label: "Inativo", value: "INACTIVE" },
];

const schema = z.object({
  truckId: z.string().optional(),
  plateNumber: z.string().min(1, "Matrícula é obrigatória"),
  brand: z.string().optional(),
  model: z.string().optional(),
  year: z
    .string()
    .optional()
    .refine((value) => !value || /^\d{4}$/.test(value), "Ano inválido"),
  tonnage: z
    .string()
    .optional()
    .refine(
      (value) => !value || (!Number.isNaN(Number(value)) && Number(value) >= 0),
      "Tonelagem inválida",
    ),
  status: z.string(),
});

type FormValues = z.infer<typeof schema>;

const emptyValues: FormValues = {
  truckId: "",
  plateNumber: "",
  brand: "",
  model: "",
  year: "",
  tonnage: "",
  status: "AVAILABLE",
};

function toFormValues(trailer: Trailer): FormValues {
  return {
    truckId: trailer.truckId ?? "",
    plateNumber: trailer.plateNumber,
    brand: trailer.brand ?? "",
    model: trailer.model ?? "",
    year: trailer.year ? String(trailer.year) : "",
    tonnage: trailer.tonnage !== null ? String(trailer.tonnage) : "",
    status: trailer.status,
  };
}

function toPayload(values: FormValues): TrailerInput {
  return {
    truckId: emptyToUndefined(values.truckId),
    plateNumber: values.plateNumber.trim(),
    brand: emptyToUndefined(values.brand),
    model: emptyToUndefined(values.model),
    year: values.year ? Number(values.year) : undefined,
    tonnage: values.tonnage ? Number(values.tonnage) : undefined,
    status: values.status as TrailerStatus,
  };
}

type TrailerFormModalProps = {
  open: boolean;
  trailer: Trailer | null;
  onClose: () => void;
};

export function TrailerFormModal({
  open,
  trailer,
  onClose,
}: TrailerFormModalProps) {
  const isEdit = trailer !== null;
  const { toast } = useToast();
  const trucks = useTrucks({ limit: 100, withoutTrailer: true });

  // O filtro exclui o horse já associado a este trailer; em edição
  // ele tem de continuar na lista para a associação atual ser visível.
  const truckOptions = [
    { label: "Sem horse associado", value: "" },
    ...(trailer?.truck
      ? [{ label: trailer.truck.plateNumber, value: trailer.truck.id }]
      : []),
    ...(trucks.data?.data ?? []).map((truck) => ({
      label: truck.plateNumber,
      value: truck.id,
    })),
  ];
  const createTrailer = useCreateTrailer();
  const updateTrailer = useUpdateTrailer();

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
      reset(trailer ? toFormValues(trailer) : emptyValues);
    }
  }, [open, trailer, reset]);

  const loading = createTrailer.isPending || updateTrailer.isPending;

  async function onSubmit(values: FormValues, continueAfter: boolean) {
    const payload = toPayload(values);

    try {
      if (isEdit && trailer) {
        await updateTrailer.mutateAsync({ id: trailer.id, payload });
        toast({ title: "Trailer atualizado", type: "success" });
        onClose();
      } else {
        await createTrailer.mutateAsync(payload);
        toast({ title: "Trailer criado", type: "success" });

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
      title={isEdit ? "Editar trailer" : "Novo trailer"}
      description="Os campos marcados são obrigatórios."
      onClose={onClose}
    >
      <form
        onSubmit={handleSubmit((values) => onSubmit(values, false))}
        className="flex flex-col gap-4"
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label
              htmlFor="truckId"
              className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300"
            >
              Horse associado
            </label>
            <Select
              id="truckId"
              options={truckOptions}
              {...register("truckId")}
            />
          </div>
          <div className="sm:col-span-2">
            <Input
              id="plateNumber"
              label="Matrícula *"
              error={errors.plateNumber?.message}
              {...register("plateNumber")}
            />
          </div>
          <Input id="brand" label="Marca" {...register("brand")} />
          <Input id="model" label="Modelo / tipo" {...register("model")} />
          <Input
            id="year"
            label="Ano"
            inputMode="numeric"
            error={errors.year?.message}
            {...register("year")}
          />
          <Input
            id="tonnage"
            label="Tonelagem"
            inputMode="decimal"
            error={errors.tonnage?.message}
            {...register("tonnage")}
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
          onReset={() => reset(trailer ? toFormValues(trailer) : emptyValues)}
          onSaveAndContinue={handleSubmit((values) => onSubmit(values, true))}
          loading={loading}
          showContinue={!isEdit}
        />
      </form>
    </Modal>
  );
}
