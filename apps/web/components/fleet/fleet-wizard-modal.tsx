"use client";

import { Check, ChevronRight, SkipForward } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { useCreateDriver } from "@/hooks/use-drivers";
import { useCreateTrailer } from "@/hooks/use-trailers";
import { useCreateTruck } from "@/hooks/use-trucks";
import { useCreateUser, useRoles } from "@/hooks/use-users";
import { useToast } from "@/providers/toast-provider";
import { extractErrorMessage } from "@/services/http";
import type { Driver } from "@/types/driver";
import type { Trailer } from "@/types/trailer";
import type { Truck } from "@/types/truck";
import { emptyToUndefined } from "@/utils/form";
import { optionalPhoneSchema, passwordSchema } from "@/utils/validation";

// Cadastro guiado de uma "unidade de transporte": horse, trailer e motorista
// são criados como registos INDEPENDENTES (combinam-se por viagem) — o
// assistente só junta a entrada de dados. O trailer liga-se opcionalmente
// ao horse acabado de criar; cada passo é saltável.

type FleetWizardModalProps = {
  open: boolean;
  onClose: () => void;
};

type StepId = 0 | 1 | 2 | 3;

const steps = [
  { id: 0, label: "Horse" },
  { id: 1, label: "Trailer" },
  { id: 2, label: "Motorista" },
] as const;

const statusOptions = [
  { label: "Disponível", value: "AVAILABLE" },
  { label: "Em viagem", value: "ON_TRIP" },
  { label: "Manutenção", value: "MAINTENANCE" },
  { label: "Inativo", value: "INACTIVE" },
];

const yearOk = (v: string) => !v || /^\d{4}$/.test(v);

export function FleetWizardModal({ open, onClose }: FleetWizardModalProps) {
  const { toast } = useToast();
  const createTruck = useCreateTruck();
  const createTrailer = useCreateTrailer();
  const createDriver = useCreateDriver();
  const createUser = useCreateUser();
  const { data: roles } = useRoles();

  const [step, setStep] = useState<StepId>(0);
  const [error, setError] = useState<string | null>(null);

  // resultados acumulados para o resumo final e para ligar o trailer ao horse
  const [createdTruck, setCreatedTruck] = useState<Truck | null>(null);
  const [createdTrailer, setCreatedTrailer] = useState<Trailer | null>(null);
  const [createdDriver, setCreatedDriver] = useState<Driver | null>(null);

  // passo 1 — horse
  const [truck, setTruck] = useState({
    plateNumber: "",
    brand: "",
    model: "",
    year: "",
    status: "AVAILABLE",
  });

  // passo 2 — trailer
  const [trailer, setTrailer] = useState({
    plateNumber: "",
    brand: "",
    model: "",
    year: "",
    tonnage: "",
    status: "AVAILABLE",
    linkToTruck: true,
  });

  // passo 3 — motorista
  const [driver, setDriver] = useState({
    fullName: "",
    licenseNumber: "",
    passportNumber: "",
    phone: "",
    email: "",
    withAccess: false,
    accessEmail: "",
    accessPassword: "",
  });

  function resetAll() {
    setStep(0);
    setError(null);
    setCreatedTruck(null);
    setCreatedTrailer(null);
    setCreatedDriver(null);
    setTruck({ plateNumber: "", brand: "", model: "", year: "", status: "AVAILABLE" });
    setTrailer({
      plateNumber: "",
      brand: "",
      model: "",
      year: "",
      tonnage: "",
      status: "AVAILABLE",
      linkToTruck: true,
    });
    setDriver({
      fullName: "",
      licenseNumber: "",
      passportNumber: "",
      phone: "",
      email: "",
      withAccess: false,
      accessEmail: "",
      accessPassword: "",
    });
  }

  function handleClose() {
    resetAll();
    onClose();
  }

  const busy =
    createTruck.isPending ||
    createTrailer.isPending ||
    createDriver.isPending ||
    createUser.isPending;

  function fail(err: unknown) {
    setError(extractErrorMessage(err));
  }

  async function saveTruck(): Promise<boolean> {
    if (!truck.plateNumber.trim()) {
      setError("A matrícula do horse é obrigatória.");
      return false;
    }
    if (!yearOk(truck.year)) {
      setError("Ano do horse inválido.");
      return false;
    }
    try {
      const created = await createTruck.mutateAsync({
        plateNumber: truck.plateNumber.trim(),
        brand: emptyToUndefined(truck.brand),
        model: emptyToUndefined(truck.model),
        year: truck.year ? Number(truck.year) : undefined,
        status: truck.status as Truck["status"],
      });
      setCreatedTruck(created);
      toast({ title: "Horse criado", type: "success" });
      return true;
    } catch (err) {
      fail(err);
      return false;
    }
  }

  async function saveTrailer(): Promise<boolean> {
    if (!trailer.plateNumber.trim()) {
      setError("A matrícula do trailer é obrigatória.");
      return false;
    }
    if (!yearOk(trailer.year)) {
      setError("Ano do trailer inválido.");
      return false;
    }
    if (trailer.tonnage && Number.isNaN(Number(trailer.tonnage))) {
      setError("Tonelagem inválida.");
      return false;
    }
    try {
      const created = await createTrailer.mutateAsync({
        truckId:
          trailer.linkToTruck && createdTruck ? createdTruck.id : undefined,
        plateNumber: trailer.plateNumber.trim(),
        brand: emptyToUndefined(trailer.brand),
        model: emptyToUndefined(trailer.model),
        year: trailer.year ? Number(trailer.year) : undefined,
        tonnage: trailer.tonnage ? Number(trailer.tonnage) : undefined,
        status: trailer.status as Trailer["status"],
      });
      setCreatedTrailer(created);
      toast({ title: "Trailer criado", type: "success" });
      return true;
    } catch (err) {
      fail(err);
      return false;
    }
  }

  async function saveDriver(): Promise<boolean> {
    if (!driver.fullName.trim() || !driver.licenseNumber.trim()) {
      setError("Nome e carta de condução do motorista são obrigatórios.");
      return false;
    }
    if (driver.phone && !optionalPhoneSchema.safeParse(driver.phone).success) {
      setError("Telefone do motorista inválido.");
      return false;
    }
    if (driver.withAccess) {
      if (!/^\S+@\S+\.\S+$/.test(driver.accessEmail.trim())) {
        setError("Email de acesso inválido.");
        return false;
      }
      if (!passwordSchema.safeParse(driver.accessPassword).success) {
        setError("Senha de acesso: mín. 8 caracteres com maiúsc., minúsc. e número.");
        return false;
      }
    }
    try {
      let userId: string | undefined;
      if (driver.withAccess) {
        const driverRoleId = roles?.find((r) => r.name === "DRIVER")?.id;
        if (!driverRoleId) {
          setError("Perfil DRIVER não encontrado — recarregue a página.");
          return false;
        }
        const [firstName, ...rest] = driver.fullName.trim().split(/\s+/);
        const user = await createUser.mutateAsync({
          roleId: driverRoleId,
          firstName,
          lastName: rest.join(" ") || firstName,
          email: driver.accessEmail.trim(),
          password: driver.accessPassword,
          phone: emptyToUndefined(driver.phone),
        });
        userId = user.id;
      }

      const created = await createDriver.mutateAsync({
        fullName: driver.fullName.trim(),
        licenseNumber: driver.licenseNumber.trim(),
        passportNumber: emptyToUndefined(driver.passportNumber),
        phone: emptyToUndefined(driver.phone),
        email: emptyToUndefined(driver.email),
        userId,
      });
      setCreatedDriver(created);
      toast({ title: "Motorista cadastrado", type: "success" });
      return true;
    } catch (err) {
      fail(err);
      return false;
    }
  }

  // avança guardando o passo atual só se tiver dados; salta se estiver vazio
  async function handleNext() {
    setError(null);
    if (step === 0) {
      if (truck.plateNumber.trim() && !(await saveTruck())) return;
      setStep(1);
    } else if (step === 1) {
      if (trailer.plateNumber.trim() && !(await saveTrailer())) return;
      setStep(2);
    } else if (step === 2) {
      if (driver.fullName.trim() && !(await saveDriver())) return;
      setStep(3);
    }
  }

  function handleSkip() {
    setError(null);
    setStep((s) => (s + 1) as StepId);
  }

  const nothingCreated = !createdTruck && !createdTrailer && !createdDriver;

  return (
    <Modal
      open={open}
      size="lg"
      title="Registar unidade"
      description="Horse, trailer e motorista numa só passagem. Cada passo é opcional."
      onClose={handleClose}
    >
      <div className="flex flex-col gap-5">
        {/* indicador de passos */}
        <ol className="flex items-center gap-2 text-xs">
          {steps.map((s, index) => {
            const done = step > s.id;
            const active = step === s.id;
            return (
              <li key={s.id} className="flex items-center gap-2">
                <span
                  className={[
                    "flex size-6 items-center justify-center rounded-full font-semibold",
                    done
                      ? "bg-emerald-600 text-white"
                      : active
                        ? "bg-brand-600 text-white"
                        : "bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-400",
                  ].join(" ")}
                >
                  {done ? <Check className="size-3.5" /> : s.id + 1}
                </span>
                <span
                  className={
                    active
                      ? "font-medium text-slate-900 dark:text-white"
                      : "text-slate-500 dark:text-slate-400"
                  }
                >
                  {s.label}
                </span>
                {index < steps.length - 1 ? (
                  <ChevronRight className="size-4 text-slate-300 dark:text-slate-600" />
                ) : null}
              </li>
            );
          })}
        </ol>

        {error ? (
          <p className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
            {error}
          </p>
        ) : null}

        {/* PASSO 1 — HORSE */}
        {step === 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Input
                id="t-plate"
                label="Matrícula do horse *"
                value={truck.plateNumber}
                onChange={(e) =>
                  setTruck({ ...truck, plateNumber: e.target.value })
                }
              />
            </div>
            <Input
              id="t-brand"
              label="Marca"
              value={truck.brand}
              onChange={(e) => setTruck({ ...truck, brand: e.target.value })}
            />
            <Input
              id="t-model"
              label="Modelo"
              value={truck.model}
              onChange={(e) => setTruck({ ...truck, model: e.target.value })}
            />
            <Input
              id="t-year"
              label="Ano"
              inputMode="numeric"
              value={truck.year}
              onChange={(e) => setTruck({ ...truck, year: e.target.value })}
            />
            <div>
              <label
                htmlFor="t-status"
                className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300"
              >
                Estado
              </label>
              <Select
                id="t-status"
                options={statusOptions}
                value={truck.status}
                onChange={(e) => setTruck({ ...truck, status: e.target.value })}
              />
            </div>
          </div>
        ) : null}

        {/* PASSO 2 — TRAILER */}
        {step === 1 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {createdTruck ? (
              <label className="flex items-center gap-2 rounded-md border border-slate-200 p-3 text-sm sm:col-span-2 dark:border-slate-800">
                <input
                  type="checkbox"
                  checked={trailer.linkToTruck}
                  onChange={(e) =>
                    setTrailer({ ...trailer, linkToTruck: e.target.checked })
                  }
                />
                Associar ao horse{" "}
                <strong>{createdTruck.plateNumber}</strong> criado no passo
                anterior
              </label>
            ) : null}
            <div className="sm:col-span-2">
              <Input
                id="tr-plate"
                label="Matrícula do trailer *"
                value={trailer.plateNumber}
                onChange={(e) =>
                  setTrailer({ ...trailer, plateNumber: e.target.value })
                }
              />
            </div>
            <Input
              id="tr-brand"
              label="Marca"
              value={trailer.brand}
              onChange={(e) => setTrailer({ ...trailer, brand: e.target.value })}
            />
            <Input
              id="tr-model"
              label="Modelo / tipo"
              value={trailer.model}
              onChange={(e) => setTrailer({ ...trailer, model: e.target.value })}
            />
            <Input
              id="tr-year"
              label="Ano"
              inputMode="numeric"
              value={trailer.year}
              onChange={(e) => setTrailer({ ...trailer, year: e.target.value })}
            />
            <Input
              id="tr-tonnage"
              label="Tonelagem"
              inputMode="decimal"
              value={trailer.tonnage}
              onChange={(e) =>
                setTrailer({ ...trailer, tonnage: e.target.value })
              }
            />
            <div>
              <label
                htmlFor="tr-status"
                className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300"
              >
                Estado
              </label>
              <Select
                id="tr-status"
                options={statusOptions}
                value={trailer.status}
                onChange={(e) =>
                  setTrailer({ ...trailer, status: e.target.value })
                }
              />
            </div>
          </div>
        ) : null}

        {/* PASSO 3 — MOTORISTA */}
        {step === 2 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Input
                id="d-name"
                label="Nome completo *"
                value={driver.fullName}
                onChange={(e) =>
                  setDriver({ ...driver, fullName: e.target.value })
                }
              />
            </div>
            <Input
              id="d-license"
              label="Carta de condução *"
              value={driver.licenseNumber}
              onChange={(e) =>
                setDriver({ ...driver, licenseNumber: e.target.value })
              }
            />
            <Input
              id="d-passport"
              label="Passaporte"
              value={driver.passportNumber}
              onChange={(e) =>
                setDriver({ ...driver, passportNumber: e.target.value })
              }
            />
            <Input
              id="d-phone"
              label="Telefone"
              value={driver.phone}
              onChange={(e) => setDriver({ ...driver, phone: e.target.value })}
            />
            <Input
              id="d-email"
              label="Email"
              type="email"
              value={driver.email}
              onChange={(e) => setDriver({ ...driver, email: e.target.value })}
            />

            <label className="flex items-center gap-2 rounded-md border border-slate-200 p-3 text-sm sm:col-span-2 dark:border-slate-800">
              <input
                type="checkbox"
                checked={driver.withAccess}
                onChange={(e) =>
                  setDriver({
                    ...driver,
                    withAccess: e.target.checked,
                    accessEmail: driver.accessEmail || driver.email,
                  })
                }
              />
              Criar já a conta de acesso à app do motorista
            </label>

            {driver.withAccess ? (
              <>
                <Input
                  id="d-access-email"
                  label="Email de acesso *"
                  type="email"
                  value={driver.accessEmail}
                  onChange={(e) =>
                    setDriver({ ...driver, accessEmail: e.target.value })
                  }
                />
                <Input
                  id="d-access-pass"
                  label="Senha provisória *"
                  type="password"
                  autoComplete="new-password"
                  value={driver.accessPassword}
                  onChange={(e) =>
                    setDriver({ ...driver, accessPassword: e.target.value })
                  }
                />
              </>
            ) : null}
          </div>
        ) : null}

        {/* RESUMO FINAL */}
        {step === 3 ? (
          <div className="flex flex-col gap-3">
            {nothingCreated ? (
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Nenhum registo foi criado.
              </p>
            ) : (
              <ul className="flex flex-col gap-2 text-sm">
                {createdTruck ? (
                  <SummaryRow
                    label="Horse"
                    value={createdTruck.plateNumber}
                  />
                ) : null}
                {createdTrailer ? (
                  <SummaryRow
                    label="Trailer"
                    value={
                      createdTrailer.plateNumber +
                      (trailer.linkToTruck && createdTruck
                        ? ` · ligado a ${createdTruck.plateNumber}`
                        : "")
                    }
                  />
                ) : null}
                {createdDriver ? (
                  <SummaryRow
                    label="Motorista"
                    value={
                      createdDriver.fullName +
                      (createdDriver.userId ? " · com acesso mobile" : "")
                    }
                  />
                ) : null}
              </ul>
            )}
          </div>
        ) : null}

        {/* AÇÕES */}
        <div className="flex items-center justify-between gap-2 border-t border-slate-200 pt-4 dark:border-slate-800">
          {step < 3 ? (
            <>
              <Button
                variant="ghost"
                size="sm"
                icon={<SkipForward className="size-4" />}
                onClick={handleSkip}
                disabled={busy}
              >
                Saltar
              </Button>
              <Button size="sm" onClick={handleNext} loading={busy}>
                {step === 2 ? "Concluir" : "Próximo"}
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={resetAll}
                disabled={busy}
              >
                Registar outra unidade
              </Button>
              <Button size="sm" onClick={handleClose}>
                Fechar
              </Button>
            </>
          )}
        </div>
      </div>
    </Modal>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <li className="flex items-center gap-2 rounded-md bg-emerald-50 px-3 py-2 dark:bg-emerald-950/30">
      <Check className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
      <span className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {label}
      </span>
      <span className="text-slate-900 dark:text-white">{value}</span>
    </li>
  );
}
