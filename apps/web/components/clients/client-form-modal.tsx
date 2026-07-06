"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { FormActions } from "@/components/ui/form-actions";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { useCreateClient, useUpdateClient } from "@/hooks/use-clients";
import { useToast } from "@/providers/toast-provider";
import { extractErrorMessage } from "@/services/http";
import type { Client, ClientInput } from "@/types/client";
import { emptyToUndefined } from "@/utils/form";

const schema = z.object({
  companyName: z.string().min(1, "Nome da empresa é obrigatório"),
  contactName: z.string().optional(),
  nuit: z.string().optional(),
  phone: z.string().optional(),
  email: z.union([z.literal(""), z.string().email("Email inválido")]),
  address: z.string().optional(),
  city: z.string().optional(),
  province: z.string().optional(),
  country: z.string().optional(),
  isActive: z.string(),
});

type FormValues = z.infer<typeof schema>;

const emptyValues: FormValues = {
  companyName: "",
  contactName: "",
  nuit: "",
  phone: "",
  email: "",
  address: "",
  city: "",
  province: "",
  country: "Moçambique",
  isActive: "true",
};

function toFormValues(client: Client): FormValues {
  return {
    companyName: client.companyName,
    contactName: client.contactName ?? "",
    nuit: client.nuit ?? "",
    phone: client.phone ?? "",
    email: client.email ?? "",
    address: client.address ?? "",
    city: client.city ?? "",
    province: client.province ?? "",
    country: client.country ?? "Moçambique",
    isActive: client.isActive ? "true" : "false",
  };
}

function toPayload(values: FormValues): ClientInput {
  return {
    companyName: values.companyName.trim(),
    contactName: emptyToUndefined(values.contactName),
    nuit: emptyToUndefined(values.nuit),
    phone: emptyToUndefined(values.phone),
    email: emptyToUndefined(values.email),
    address: emptyToUndefined(values.address),
    city: emptyToUndefined(values.city),
    province: emptyToUndefined(values.province),
    country: emptyToUndefined(values.country),
    isActive: values.isActive === "true",
  };
}

type ClientFormModalProps = {
  open: boolean;
  client: Client | null;
  onClose: () => void;
};

export function ClientFormModal({
  open,
  client,
  onClose,
}: ClientFormModalProps) {
  const isEdit = client !== null;
  const { toast } = useToast();
  const createClient = useCreateClient();
  const updateClient = useUpdateClient();

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
      reset(client ? toFormValues(client) : emptyValues);
    }
  }, [open, client, reset]);

  const loading = createClient.isPending || updateClient.isPending;

  async function onSubmit(values: FormValues, continueAfter: boolean) {
    const payload = toPayload(values);

    try {
      if (isEdit && client) {
        await updateClient.mutateAsync({ id: client.id, payload });
        toast({ title: "Cliente atualizado", type: "success" });
        onClose();
      } else {
        await createClient.mutateAsync(payload);
        toast({ title: "Cliente criado", type: "success" });

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
      title={isEdit ? "Editar cliente" : "Novo cliente"}
      description="Os campos marcados são obrigatórios."
      onClose={onClose}
    >
      <form
        onSubmit={handleSubmit((values) => onSubmit(values, false))}
        className="flex flex-col gap-4"
      >
        <div className="grid max-h-[60vh] grid-cols-1 gap-4 overflow-y-auto pr-1 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Input
              id="companyName"
              label="Empresa *"
              placeholder="Nome da empresa"
              error={errors.companyName?.message}
              {...register("companyName")}
            />
          </div>
          <Input
            id="contactName"
            label="Contacto"
            error={errors.contactName?.message}
            {...register("contactName")}
          />
          <Input id="nuit" label="NUIT" {...register("nuit")} />
          <Input id="phone" label="Telefone" {...register("phone")} />
          <Input
            id="email"
            label="Email"
            type="email"
            error={errors.email?.message}
            {...register("email")}
          />
          <div className="sm:col-span-2">
            <Input id="address" label="Endereço" {...register("address")} />
          </div>
          <Input id="city" label="Cidade" {...register("city")} />
          <Input id="province" label="Província" {...register("province")} />
          <Input id="country" label="País" {...register("country")} />
          <div>
            <label
              htmlFor="isActive"
              className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300"
            >
              Estado
            </label>
            <Select
              id="isActive"
              options={[
                { label: "Ativo", value: "true" },
                { label: "Inativo", value: "false" },
              ]}
              {...register("isActive")}
            />
          </div>
        </div>

        <FormActions
          onCancel={onClose}
          onReset={() => reset(client ? toFormValues(client) : emptyValues)}
          onSaveAndContinue={handleSubmit((values) => onSubmit(values, true))}
          loading={loading}
          showContinue={!isEdit}
        />
      </form>
    </Modal>
  );
}
