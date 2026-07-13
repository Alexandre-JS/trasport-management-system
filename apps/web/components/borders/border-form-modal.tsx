"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { FormActions } from "@/components/ui/form-actions";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { useCreateBorder, useUpdateBorder } from "@/hooks/use-borders";
import { useToast } from "@/providers/toast-provider";
import { extractErrorMessage } from "@/services/http";
import type { Border, BorderInput } from "@/types/border";

const activeOptions = [
  { label: "Ativa", value: "true" },
  { label: "Inativa", value: "false" },
];

const coordinate = (min: number, max: number) =>
  z
    .string()
    .optional()
    .refine(
      (value) =>
        !value ||
        (!Number.isNaN(Number(value)) &&
          Number(value) >= min &&
          Number(value) <= max),
      "Coordenada inválida",
    );

const schema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  countryA: z.string().min(1, "País é obrigatório"),
  countryB: z.string().min(1, "País é obrigatório"),
  lat: coordinate(-90, 90),
  lng: coordinate(-180, 180),
  isActive: z.string(),
});

type FormValues = z.infer<typeof schema>;

const emptyValues: FormValues = {
  name: "",
  countryA: "",
  countryB: "",
  lat: "",
  lng: "",
  isActive: "true",
};

function toFormValues(border: Border): FormValues {
  return {
    name: border.name,
    countryA: border.countryA,
    countryB: border.countryB,
    lat: border.lat ?? "",
    lng: border.lng ?? "",
    isActive: border.isActive ? "true" : "false",
  };
}

function toPayload(values: FormValues): BorderInput {
  return {
    name: values.name.trim(),
    countryA: values.countryA.trim(),
    countryB: values.countryB.trim(),
    lat: values.lat ? Number(values.lat) : undefined,
    lng: values.lng ? Number(values.lng) : undefined,
    isActive: values.isActive === "true",
  };
}

type BorderFormModalProps = {
  open: boolean;
  border: Border | null;
  onClose: () => void;
};

export function BorderFormModal({
  open,
  border,
  onClose,
}: BorderFormModalProps) {
  const isEdit = border !== null;
  const { toast } = useToast();
  const createBorder = useCreateBorder();
  const updateBorder = useUpdateBorder();

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
      reset(border ? toFormValues(border) : emptyValues);
    }
  }, [open, border, reset]);

  const loading = createBorder.isPending || updateBorder.isPending;

  async function onSubmit(values: FormValues, continueAfter: boolean) {
    const payload = toPayload(values);

    try {
      if (isEdit && border) {
        await updateBorder.mutateAsync({ id: border.id, payload });
        toast({ title: "Fronteira atualizada", type: "success" });
        onClose();
      } else {
        await createBorder.mutateAsync(payload);
        toast({ title: "Fronteira criada", type: "success" });

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
      title={isEdit ? "Editar fronteira" : "Nova fronteira"}
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
              id="name"
              label="Nome do posto *"
              placeholder="Ex.: Machipanda / Forbes"
              error={errors.name?.message}
              {...register("name")}
            />
          </div>
          <Input
            id="countryA"
            label="País A *"
            placeholder="Ex.: Moçambique"
            error={errors.countryA?.message}
            {...register("countryA")}
          />
          <Input
            id="countryB"
            label="País B *"
            placeholder="Ex.: Zimbabué"
            error={errors.countryB?.message}
            {...register("countryB")}
          />
          <Input
            id="lat"
            label="Latitude"
            inputMode="decimal"
            placeholder="Ex.: -18.94"
            error={errors.lat?.message}
            {...register("lat")}
          />
          <Input
            id="lng"
            label="Longitude"
            inputMode="decimal"
            placeholder="Ex.: 32.70"
            error={errors.lng?.message}
            {...register("lng")}
          />
          <div>
            <label
              htmlFor="isActive"
              className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300"
            >
              Estado
            </label>
            <Select
              id="isActive"
              options={activeOptions}
              {...register("isActive")}
            />
          </div>
        </div>

        <FormActions
          onCancel={onClose}
          onReset={() => reset(border ? toFormValues(border) : emptyValues)}
          onSaveAndContinue={handleSubmit((values) => onSubmit(values, true))}
          loading={loading}
          showContinue={!isEdit}
        />
      </form>
    </Modal>
  );
}
