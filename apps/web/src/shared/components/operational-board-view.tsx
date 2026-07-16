"use client";

import {
  AlertTriangle,
  FileSpreadsheet,
  Plus,
  Save,
  Sheet,
  Trash2,
  Upload,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  ActionButton,
  PrimaryButton,
} from "@/src/shared/components/action-button";
import { PageHeader } from "@/src/shared/components/page-header";
import { useBorders } from "@/hooks/use-borders";
import { useClients, useCreateClient } from "@/hooks/use-clients";
import { useDrivers } from "@/hooks/use-drivers";
import { useResourcesInUse } from "@/hooks/use-resources-in-use";
import { useTrailers } from "@/hooks/use-trailers";
import { useTrucks } from "@/hooks/use-trucks";
import { useToast } from "@/providers/toast-provider";
import { createCargo } from "@/services/cargo-service";
import { createDriver } from "@/services/drivers-service";
import { createTrailer } from "@/services/trailers-service";
import { createTrip } from "@/services/trips-service";
import { createTruck } from "@/services/trucks-service";
import { exportToCsv } from "@/utils/export-csv";
import { parseBoardExcel } from "@/utils/import-board-excel";

type BoardRow = {
  key: string;
  tripId?: string;
  cargoId?: string;
  clientId: string;
  booking: string;
  origin: string;
  destination: string;
  transporter: string;
  subcontracted: boolean;
  cargoType: string;
  cargoDetail: string;
  horse: string;
  trailer: string;
  driver: string;
  passport: string;
  license: string;
  phone: string;
  borderId: string;
  tonnage: string;
  dispatchedBy: string;
  departureDate: string;
  arrivalDate: string;
  dischargeDate: string;
  currentPosition: string;
  remarks: string;
  dirty: boolean;
};

const EMPTY_ROWS = 5;

export function OperationalBoardView() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const clientsQuery = useClients({ limit: 100, isActive: true });
  const driversQuery = useDrivers({ limit: 100 });
  const resourcesInUseQuery = useResourcesInUse();
  const trucksQuery = useTrucks({ limit: 100 });
  const trailersQuery = useTrailers({ limit: 100 });
  const bordersQuery = useBorders({ limit: 100, active: true });
  const [rows, setRows] = useState<BoardRow[]>([]);
  const [saving, setSaving] = useState(false);
  const initialized = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Contexto da folha (como o título do Excel: cliente / rota). Aplica-se às
  // linhas novas; a origem é Beira por defeito (a operação parte de Beira).
  const [sheetClientId, setSheetClientId] = useState("");
  const [sheetOrigin, setSheetOrigin] = useState("Beira");
  const [sheetDestination, setSheetDestination] = useState("");
  const [newClientName, setNewClientName] = useState("");
  const [addingClient, setAddingClient] = useState(false);
  const createClientMutation = useCreateClient();
  // Cliente efetivo da folha: o escolhido, ou o primeiro por defeito.

  const clients = useMemo(
    () => clientsQuery.data?.data ?? [],
    [clientsQuery.data],
  );
  const drivers = useMemo(
    () => driversQuery.data?.data ?? [],
    [driversQuery.data],
  );
  const trucks = useMemo(
    () => trucksQuery.data?.data ?? [],
    [trucksQuery.data],
  );
  const trailers = useMemo(
    () => trailersQuery.data?.data ?? [],
    [trailersQuery.data],
  );
  const borders = useMemo(
    () => bordersQuery.data?.data ?? [],
    [bordersQuery.data],
  );

  // O quadro é só para INSERÇÃO: arranca com 5 linhas em branco. As viagens
  // já registadas vivem na página de Atividades, não aqui.
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    setRows(
      Array.from({ length: EMPTY_ROWS }, () =>
        blankRow({ clientId: "", origin: "Beira", destination: "" }),
      ),
    );
  }, []);

  const inUse = useMemo(
    () => ({
      horses: new Set(resourcesInUseQuery.data?.horses ?? []),
      trailers: new Set(resourcesInUseQuery.data?.trailers ?? []),
      drivers: new Set(resourcesInUseQuery.data?.drivers ?? []),
    }),
    [resourcesInUseQuery.data],
  );

  // Erro por CAMPO de uma linha (para pintar a célula certa a vermelho e dar
  // uma mensagem clara): campo obrigatório em falta, recurso já numa viagem
  // em curso, ou recurso repetido noutra linha da mesma folha.
  type FieldKey = "horse" | "trailer" | "driver" | "license" | "cargoDetail";
  function rowFieldErrors(row: BoardRow): Partial<Record<FieldKey, string>> {
    const e: Partial<Record<FieldKey, string>> = {};
    const nh = normalize(row.horse);
    const nt = normalize(row.trailer);
    const nl = normalize(row.license);
    const dup = (get: (r: BoardRow) => string, value: string) =>
      Boolean(value) &&
      rows.filter((r) => hasContent(r) && normalize(get(r)) === value).length >
        1;

    if (!row.horse.trim()) e.horse = "Preencha o Horse";
    else if (inUse.horses.has(nh))
      e.horse = "Este Horse já está numa viagem em curso — use outro";
    else if (dup((r) => r.horse, nh))
      e.horse = "Horse repetido noutra linha desta folha";

    if (!row.trailer.trim()) e.trailer = "Preencha o Trailer";
    else if (inUse.trailers.has(nt))
      e.trailer = "Este Trailer já está numa viagem em curso — use outro";
    else if (dup((r) => r.trailer, nt))
      e.trailer = "Trailer repetido noutra linha desta folha";

    if (!row.driver.trim()) e.driver = "Preencha o motorista";
    if (row.cargoType === "CONTAINER" && !row.cargoDetail.trim())
      e.cargoDetail = "Indique o nº do container";
    if (!row.license.trim()) e.license = "Preencha a carta de condução";
    else if (inUse.drivers.has(nl)) {
      e.license = "Este motorista já está numa viagem em curso — use outro";
      if (row.driver.trim()) e.driver = e.license;
    } else if (dup((r) => r.license, nl)) {
      e.license = "Carta repetida noutra linha desta folha";
      if (row.driver.trim()) e.driver = e.license;
    }
    return e;
  }

  function rowProblems(row: BoardRow): string[] {
    return Object.values(rowFieldErrors(row));
  }

  const sheetCtx = () => ({
    clientId: sheetClientId || clients[0]?.id || "",
    origin: sheetOrigin.trim(),
    destination: sheetDestination.trim(),
  });

  // Estilo Excel: assim que a última linha ganha conteúdo, abre-se logo uma
  // linha vazia por baixo — há sempre uma pronta para a próxima viagem.
  function withTrailingBlank(list: BoardRow[]): BoardRow[] {
    const last = list[list.length - 1];
    return last && hasContent(last) ? [...list, blankRow(sheetCtx())] : list;
  }

  function change(key: string, field: keyof BoardRow, value: string | boolean) {
    setRows((current) =>
      withTrailingBlank(
        current.map((row) =>
          row.key === key ? { ...row, [field]: value, dirty: true } : row,
        ),
      ),
    );
  }

  function addRows(count = 1) {
    setRows((current) => [
      ...current,
      ...Array.from({ length: count }, () => blankRow(sheetCtx())),
    ]);
  }

  function changeDriver(key: string, value: string) {
    const match = drivers.find(
      (driver) =>
        driver.fullName.toLocaleLowerCase() === value.toLocaleLowerCase(),
    );
    setRows((current) =>
      withTrailingBlank(
        current.map((row) =>
          row.key === key
            ? {
                ...row,
                driver: value,
                passport: match?.passportNumber ?? row.passport,
                license: match?.licenseNumber ?? row.license,
                phone: match?.phone ?? row.phone,
                dirty: true,
              }
            : row,
        ),
      ),
    );
  }

  async function saveAll() {
    const ctx = sheetCtx();
    if (!ctx.clientId || !ctx.origin || !ctx.destination) {
      toast({
        title: "Defina o cliente e a rota no topo da folha",
        type: "warning",
      });
      return;
    }
    const pending = rows.filter(hasContent);
    if (!pending.length) return;

    setSaving(true);
    const savedKeys = new Set<string>();
    const errors: string[] = [];
    for (const row of pending) {
      const lineNo = pending.indexOf(row) + 1;
      const problems = rowProblems(row);
      if (problems.length > 0) {
        errors.push(`Linha ${lineNo}: ${problems.join("; ")}`);
        continue;
      }
      try {
        await createFromRow(row, ctx);
        savedKeys.add(row.key);
      } catch (error) {
        // Rede de segurança: se o backend recusar (recurso ocupado entretanto),
        // dá uma mensagem clara em vez do 409 cru.
        errors.push(`Linha ${lineNo}: ${translateSaveError(error, row)}`);
      }
    }
    void resourcesInUseQuery.refetch();

    // As linhas guardadas SAEM do quadro (passam a estar em Atividades).
    // Ficam apenas as que falharam; repõe-se sempre 5 linhas de entrada.
    setRows((current) => {
      const failed = current.filter(
        (row) => hasContent(row) && !savedKeys.has(row.key),
      );
      const blanksNeeded = Math.max(EMPTY_ROWS - failed.length, 1);
      return [
        ...failed,
        ...Array.from({ length: blanksNeeded }, () => blankRow(ctx)),
      ];
    });

    await queryClient.invalidateQueries({ queryKey: ["trips"] });
    await queryClient.invalidateQueries({ queryKey: ["activities"] });
    setSaving(false);

    const savedCount = savedKeys.size;
    const s = savedCount === 1 ? "" : "s";
    if (errors.length === 0) {
      toast({
        title: `✓ ${savedCount} viagem${s} guardada${s}`,
        description:
          "Já aparecem na página de Atividades. Pode continuar a inserir.",
        type: "success",
      });
    } else if (savedCount === 0) {
      toast({
        title: "Nenhuma viagem guardada",
        description: `Corrija as células a vermelho: ${errors.slice(0, 2).join(" · ")}`,
        type: "error",
      });
    } else {
      toast({
        title: `${savedCount} guardada${s} · ${errors.length} por corrigir`,
        description: `As linhas a vermelho ficaram no quadro. ${errors.slice(0, 2).join(" · ")}`,
        type: "warning",
      });
    }
  }

  async function createFromRow(
    row: BoardRow,
    ctx: { clientId: string; origin: string; destination: string },
  ) {
    // Todos os recursos alimentam os cadastros operacionais, mesmo quando são
    // externos. `isSubcontracted` distingue a propriedade; uma conta de login
    // só é criada depois, explicitamente, em Gestão de Utilizadores.
    const existingTruck = trucks.find(
      (item) => normalize(item.plateNumber) === normalize(row.horse),
    );
    const existingTrailer = trailers.find(
      (item) => normalize(item.plateNumber) === normalize(row.trailer),
    );
    const existingDriver = drivers.find(
      (item) => normalize(item.licenseNumber) === normalize(row.license),
    );

    const detail = row.cargoDetail.trim();
    const cargo = await createCargo({
      clientId: ctx.clientId,
      origin: ctx.origin,
      destination: ctx.destination,
      type: row.cargoType as "GRANEL" | "CONTAINER" | "GERAL",
      containerNumber:
        row.cargoType === "CONTAINER" ? detail || undefined : undefined,
      description:
        row.cargoType === "GERAL"
          ? detail || undefined
          : row.booking.trim() || undefined,
      weightTonnes: numberOrUndefined(row.tonnage),
    });

    const [truck, trailer, driver] = await Promise.all([
      existingTruck
        ? Promise.resolve(existingTruck)
        : createTruck({ plateNumber: row.horse.trim() }),
      existingTrailer
        ? Promise.resolve(existingTrailer)
        : createTrailer({
            plateNumber: row.trailer.trim(),
            tonnage: numberOrUndefined(row.tonnage),
          }),
      existingDriver
        ? Promise.resolve(existingDriver)
        : createDriver({
            fullName: row.driver.trim(),
            licenseNumber: row.license.trim(),
            passportNumber: row.passport.trim() || undefined,
            phone: row.phone.trim() || undefined,
          }),
    ]);

    return createTrip({
      cargoId: cargo.id,
      truckId: truck.id,
      trailerId: trailer.id,
      driverId: driver.id,
      ...operationalPayload(row),
    });
  }

  function removeBlank(key: string) {
    setRows((current) =>
      current.filter((row) => row.key !== key || row.tripId),
    );
  }

  const pendingCount = rows.filter(hasContent).length;

  async function addClient() {
    const name = newClientName.trim();
    if (!name) return;
    try {
      const client = await createClientMutation.mutateAsync({
        companyName: name,
      });
      await queryClient.invalidateQueries({ queryKey: ["clients"] });
      setSheetClientId(client.id);
      setNewClientName("");
      setAddingClient(false);
      toast({ title: "Cliente criado", type: "success" });
    } catch (error) {
      toast({
        title: "Não foi possível criar o cliente",
        description: error instanceof Error ? error.message : "erro",
        type: "error",
      });
    }
  }

  function matchBorderId(text: string): string {
    if (!text.trim()) return "";
    const n = normalize(text);
    const exact = borders.find((b) => normalize(b.name) === n);
    if (exact) return exact.id;
    const prefix = borders.find(
      (b) => normalize(b.name).startsWith(n) || n.startsWith(normalize(b.name)),
    );
    return prefix?.id ?? "";
  }

  async function importExcel(file: File) {
    try {
      const imported = await parseBoardExcel(await file.arrayBuffer());
      if (imported.length === 0) {
        toast({
          title: "Nenhuma linha encontrada no ficheiro",
          type: "warning",
        });
        return;
      }
      const ctx = sheetCtx();
      const newRows: BoardRow[] = imported.map((r) => ({
        ...blankRow(ctx),
        transporter: r.transporter || "LUMAC",
        horse: r.horse,
        trailer: r.trailer,
        driver: r.driver,
        passport: r.passport,
        license: r.license,
        phone: r.phone,
        borderId: matchBorderId(r.border),
        tonnage: r.tonnage,
        dispatchedBy: r.dispatchedBy,
        departureDate: r.departureDate,
        arrivalDate: r.arrivalDate,
        dischargeDate: r.dischargeDate,
        currentPosition: r.currentPosition,
        remarks: r.remarks,
        dirty: true,
      }));
      // Substitui as linhas em branco iniciais pelas importadas + uma vazia.
      setRows((current) => {
        const withContent = current.filter(hasContent);
        return [...withContent, ...newRows, blankRow(ctx)];
      });
      toast({
        title: `${newRows.length} linha(s) importada(s)`,
        description: "Reveja os dados (fronteira e datas) e clique em Guardar.",
        type: "success",
      });
    } catch (error) {
      toast({
        title: "Não foi possível importar o Excel",
        description:
          error instanceof Error ? error.message : "erro ao ler o ficheiro",
        type: "error",
      });
    }
  }

  function exportBoard() {
    const borderName = (id: string) =>
      borders.find((item) => item.id === id)?.name ?? "";
    const visible = rows
      .filter(hasContent)
      .map((row, index) => ({ ...row, nu: index + 1 }));
    exportToCsv("quadro-operacional.csv", visible, [
      { header: "Nu.", value: (row) => String(row.nu) },
      { header: "Transporter", value: (row) => row.transporter },
      { header: "Horse", value: (row) => row.horse },
      { header: "Trailer", value: (row) => row.trailer },
      { header: "Driver Name", value: (row) => row.driver },
      { header: "Passport Number", value: (row) => row.passport },
      { header: "Driving License", value: (row) => row.license },
      { header: "Phone Number", value: (row) => row.phone },
      { header: "Border", value: (row) => borderName(row.borderId) },
      { header: "Ton - Beira", value: (row) => row.tonnage },
      {
        header: "Tipo",
        value: (row) =>
          row.cargoType === "CONTAINER"
            ? "Container"
            : row.cargoType === "GERAL"
              ? "Carga Geral"
              : "Granel",
      },
      { header: "Container / Descrição", value: (row) => row.cargoDetail },
      { header: "Dispatched From Beira", value: (row) => row.dispatchedBy },
      { header: "GMS Dispatch Date", value: (row) => row.departureDate },
      { header: "Arrive Date", value: (row) => row.arrivalDate },
      { header: "Discharge Date", value: (row) => row.dischargeDate },
      { header: "Current Position", value: (row) => row.currentPosition },
      { header: "Remark", value: (row) => row.remarks },
    ]);
  }

  return (
    <div className="flex min-h-0 flex-col gap-4">
      <PageHeader
        title="Quadro operacional"
        description="Preencha várias viagens diretamente na grelha. Desloque horizontalmente para ver todas as colunas."
        secondaryActions={
          <div className="flex gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void importExcel(file);
                event.target.value = "";
              }}
            />
            <ActionButton
              icon={<Upload className="size-4" />}
              onClick={() => fileInputRef.current?.click()}
            >
              Importar Excel
            </ActionButton>
            <ActionButton
              icon={<FileSpreadsheet className="size-4" />}
              onClick={exportBoard}
            >
              Exportar
            </ActionButton>
            <PrimaryButton
              icon={<Save className="size-4" />}
              onClick={() => void saveAll()}
              loading={saving}
              disabled={!pendingCount}
            >
              Guardar{pendingCount ? ` ${pendingCount}` : ""}
            </PrimaryButton>
          </div>
        }
      />
      {/* Contexto da folha, como o título do Excel (cliente / rota). */}
      <div className="flex flex-wrap items-end gap-3 rounded-md border border-slate-300 bg-slate-50 px-3 py-3 dark:border-slate-700 dark:bg-slate-800/50">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
            Cliente
          </span>
          {addingClient ? (
            <div className="flex items-center gap-1">
              <input
                autoFocus
                value={newClientName}
                onChange={(event) => setNewClientName(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") void addClient();
                  if (event.key === "Escape") setAddingClient(false);
                }}
                placeholder="Nome da empresa"
                className="h-9 min-w-44 rounded-md border border-slate-300 bg-white px-2 text-sm dark:border-slate-600 dark:bg-slate-900"
              />
              <button
                type="button"
                onClick={() => void addClient()}
                disabled={createClientMutation.isPending}
                className="h-9 rounded-md bg-brand-600 px-3 text-sm font-medium text-white disabled:opacity-60"
              >
                Criar
              </button>
              <button
                type="button"
                onClick={() => {
                  setAddingClient(false);
                  setNewClientName("");
                }}
                className="h-9 px-2 text-sm text-slate-500"
              >
                ✕
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <select
                value={sheetClientId || clients[0]?.id || ""}
                onChange={(event) => setSheetClientId(event.target.value)}
                className="h-9 min-w-44 rounded-md border border-slate-300 bg-white px-2 text-sm dark:border-slate-600 dark:bg-slate-900"
              >
                <option value="">Selecionar cliente…</option>
                {clients.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.companyName}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setAddingClient(true)}
                title="Novo cliente"
                className="h-9 rounded-md border border-slate-300 px-2 text-sm font-medium text-brand-700 hover:bg-brand-50 dark:border-slate-600 dark:text-brand-300"
              >
                ＋
              </button>
            </div>
          )}
        </div>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
            Origem
          </span>
          <input
            value={sheetOrigin}
            onChange={(event) => setSheetOrigin(event.target.value)}
            className="h-9 w-32 rounded-md border border-slate-300 bg-white px-2 text-sm dark:border-slate-600 dark:bg-slate-900"
          />
        </label>
        <span className="pb-2 text-slate-400">→</span>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
            Destino
          </span>
          <input
            value={sheetDestination}
            onChange={(event) => setSheetDestination(event.target.value)}
            placeholder="Ex.: Lusaka"
            className="h-9 w-40 rounded-md border border-slate-300 bg-white px-2 text-sm dark:border-slate-600 dark:bg-slate-900"
          />
        </label>
        <p className="flex items-center gap-1.5 pb-2 text-xs text-slate-500 dark:text-slate-400">
          <Sheet className="size-3.5" aria-hidden /> Aplica-se às linhas novas.
          Células azuis = alteradas por gravar.
        </p>
      </div>
      <datalist id="board-horses">
        {trucks.map((item) => (
          <option key={item.id} value={item.plateNumber} />
        ))}
      </datalist>
      <datalist id="board-trailers">
        {trailers.map((item) => (
          <option key={item.id} value={item.plateNumber} />
        ))}
      </datalist>
      <datalist id="board-drivers">
        {drivers.map((item) => (
          <option key={item.id} value={item.fullName} />
        ))}
      </datalist>
      <div className="max-h-[calc(100vh-15rem)] overflow-auto rounded-md border border-slate-300 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <table className="min-w-[2700px] border-separate border-spacing-0 text-xs">
          <thead className="sticky top-0 z-30 bg-slate-100 text-left font-semibold uppercase tracking-wide text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            <tr>
              {GROUPS.map((group, index) => (
                <th
                  key={`${group.label}-${index}`}
                  colSpan={group.span}
                  className="border-b border-r border-slate-300 bg-slate-200 px-2 py-1.5 text-center text-[11px] dark:border-slate-700 dark:bg-slate-700"
                >
                  {group.label}
                </th>
              ))}
            </tr>
            <tr>
              {HEADERS.map((header, index) => (
                <th
                  key={`${header}-${index}`}
                  className={`whitespace-nowrap border-b border-r border-slate-300 px-2 py-2 dark:border-slate-700 ${index === 0 ? "sticky left-0 z-40 w-12 bg-slate-100 dark:bg-slate-800" : ""}`}
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => {
              const fieldErrors = hasContent(row) ? rowFieldErrors(row) : {};
              const problems = Object.values(fieldErrors);
              return (
                <tr
                  key={row.key}
                  className={
                    problems.length > 0
                      ? "bg-rose-50/70 dark:bg-rose-950/20"
                      : row.dirty
                        ? "bg-brand-50/70 dark:bg-brand-950/20"
                        : "odd:bg-white even:bg-slate-50/60 dark:odd:bg-slate-900 dark:even:bg-slate-900/70"
                  }
                >
                  <Cell
                    sticky="left-0 w-12"
                    className="text-center font-semibold"
                  >
                    {index + 1}
                  </Cell>
                  <Cell>
                    <Input
                      value={row.transporter}
                      onChange={(v) => change(row.key, "transporter", v)}
                    />
                  </Cell>
                  <Cell>
                    <Input
                      value={row.horse}
                      onChange={(v) => change(row.key, "horse", v)}
                      list="board-horses"
                      invalid={Boolean(fieldErrors.horse)}
                      title={fieldErrors.horse}
                    />
                  </Cell>
                  <Cell>
                    <Input
                      value={row.trailer}
                      onChange={(v) => change(row.key, "trailer", v)}
                      list="board-trailers"
                      invalid={Boolean(fieldErrors.trailer)}
                      title={fieldErrors.trailer}
                    />
                  </Cell>
                  <Cell>
                    <Input
                      value={row.driver}
                      onChange={(v) => changeDriver(row.key, v)}
                      list="board-drivers"
                      invalid={Boolean(fieldErrors.driver)}
                      title={fieldErrors.driver}
                    />
                  </Cell>
                  <Cell>
                    <Input
                      value={row.passport}
                      onChange={(v) => change(row.key, "passport", v)}
                    />
                  </Cell>
                  <Cell>
                    <Input
                      value={row.license}
                      onChange={(v) => change(row.key, "license", v)}
                      invalid={Boolean(fieldErrors.license)}
                      title={fieldErrors.license}
                    />
                  </Cell>
                  <Cell>
                    <Input
                      value={row.phone}
                      onChange={(v) => change(row.key, "phone", v)}
                    />
                  </Cell>
                  <Cell>
                    <Select
                      value={row.borderId}
                      onChange={(v) => change(row.key, "borderId", v)}
                      options={borders.map((item) => [item.id, item.name])}
                      empty="—"
                    />
                  </Cell>
                  <Cell>
                    <Input
                      value={row.tonnage}
                      onChange={(v) => change(row.key, "tonnage", v)}
                      type="number"
                    />
                  </Cell>
                  <Cell>
                    <Select
                      value={row.cargoType}
                      onChange={(v) => change(row.key, "cargoType", v)}
                      options={[
                        ["GRANEL", "Granel"],
                        ["CONTAINER", "Container"],
                        ["GERAL", "Carga Geral"],
                      ]}
                    />
                  </Cell>
                  <Cell>
                    {row.cargoType === "GRANEL" ? (
                      <span className="px-2 text-slate-300 dark:text-slate-600">
                        —
                      </span>
                    ) : (
                      <Input
                        value={row.cargoDetail}
                        onChange={(v) => change(row.key, "cargoDetail", v)}
                        placeholder={
                          row.cargoType === "CONTAINER"
                            ? "Nº do container"
                            : "O que transporta"
                        }
                        invalid={Boolean(fieldErrors.cargoDetail)}
                        title={fieldErrors.cargoDetail}
                      />
                    )}
                  </Cell>
                  <Cell>
                    <Input
                      value={row.dispatchedBy}
                      onChange={(v) => change(row.key, "dispatchedBy", v)}
                    />
                  </Cell>
                  <Cell>
                    <Input
                      value={row.departureDate}
                      onChange={(v) => change(row.key, "departureDate", v)}
                      type="date"
                    />
                  </Cell>
                  <Cell>
                    <Input
                      value={row.arrivalDate}
                      onChange={(v) => change(row.key, "arrivalDate", v)}
                      type="date"
                    />
                  </Cell>
                  <Cell>
                    <Input
                      value={row.dischargeDate}
                      onChange={(v) => change(row.key, "dischargeDate", v)}
                      type="date"
                    />
                  </Cell>
                  <Cell>
                    <Input
                      value={row.currentPosition}
                      onChange={(v) => change(row.key, "currentPosition", v)}
                    />
                  </Cell>
                  <Cell>
                    <Input
                      value={row.remarks}
                      onChange={(v) => change(row.key, "remarks", v)}
                    />
                  </Cell>
                  <Cell className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      {problems.length > 0 ? (
                        <span title={problems.join("\n")}>
                          <AlertTriangle className="size-4 text-rose-500" />
                        </span>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => removeBlank(row.key)}
                        title="Remover linha"
                      >
                        <Trash2 className="size-4 text-slate-400 hover:text-rose-600" />
                      </button>
                    </div>
                  </Cell>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Botão flutuante: adiciona 1 linha de cada vez (estilo Excel). */}
      <button
        type="button"
        onClick={() => addRows(1)}
        title="Adicionar linha"
        aria-label="Adicionar linha"
        className="fixed bottom-6 right-6 z-40 flex size-14 items-center justify-center rounded-full bg-brand-600 text-white shadow-lg transition hover:bg-brand-700 active:scale-95"
      >
        <Plus className="size-6" aria-hidden />
      </button>
    </div>
  );
}

// Colunas exatamente como a folha do cliente (PDF LUMAC), na mesma ordem.
const HEADERS = [
  "Nu.",
  "Transporter",
  "Horse",
  "Trailer",
  "Driver Name",
  "Passport Number",
  "Driving License",
  "Phone Number",
  "Border",
  "Ton - Beira",
  "Tipo",
  "Container / Descrição",
  "Dispatched From Beira",
  "GMS Dispatch Date",
  "Arrive Date",
  "Discharge Date",
  "Current Position",
  "Remark",
  "",
];

// Cabeçalhos-grupo do PDF (BOOKING / TRACKING / REMARK) com o nº de colunas
// que cada um cobre (incluindo a coluna Nu. dentro de BOOKING).
const GROUPS: { label: string; span: number }[] = [
  { label: "BOOKING", span: 13 },
  { label: "TRACKING", span: 4 },
  { label: "REMARK", span: 1 },
  { label: "", span: 1 },
];

function operationalPayload(row: BoardRow, subcontracted?: boolean) {
  return {
    transporterName: row.transporter.trim() || undefined,
    isSubcontracted: subcontracted ?? row.subcontracted,
    horsePlate: row.horse.trim() || undefined,
    trailerPlate: row.trailer.trim() || undefined,
    driverName: row.driver.trim() || undefined,
    driverPassport: row.passport.trim() || undefined,
    driverLicense: row.license.trim() || undefined,
    driverPhone: row.phone.trim() || undefined,
    bookingReference: row.booking.trim() || undefined,
    borderIds: row.borderId ? [row.borderId] : undefined,
    tonnage: numberOrUndefined(row.tonnage),
    dispatchedBy: row.dispatchedBy.trim() || undefined,
    departureDate: row.departureDate || undefined,
    arrivalDate: row.arrivalDate || undefined,
    dischargeDate: row.dischargeDate || undefined,
    currentPosition: row.currentPosition.trim() || undefined,
    remarks: row.remarks.trim() || undefined,
  };
}

function blankRow(ctx: {
  clientId: string;
  origin: string;
  destination: string;
}): BoardRow {
  return {
    key: crypto.randomUUID(),
    clientId: ctx.clientId,
    booking: "",
    origin: ctx.origin,
    destination: ctx.destination,
    transporter: "LUMAC",
    subcontracted: false,
    cargoType: "GRANEL",
    cargoDetail: "",
    horse: "",
    trailer: "",
    driver: "",
    passport: "",
    license: "",
    phone: "",
    borderId: "",
    tonnage: "",
    dispatchedBy: "",
    departureDate: "",
    arrivalDate: "",
    dischargeDate: "",
    currentPosition: "",
    remarks: "",
    dirty: false,
  };
}
function hasContent(row: BoardRow) {
  // Origem/destino vêm do contexto da folha; uma linha só "tem conteúdo"
  // quando o operador digita dados próprios da viagem.
  return Boolean(
    row.tripId ||
    row.horse.trim() ||
    row.driver.trim() ||
    row.trailer.trim() ||
    row.tonnage.trim() ||
    row.currentPosition.trim(),
  );
}
function translateSaveError(error: unknown, row: BoardRow): string {
  const status = (error as { response?: { status?: number } })?.response
    ?.status;
  if (status === 409) {
    return `um recurso (Horse ${row.horse || "?"} / motorista ${row.driver || "?"}) já está numa viagem ativa`;
  }
  return error instanceof Error ? error.message : "erro ao guardar";
}

function normalize(value: string) {
  return value.replace(/\s+/g, "").toUpperCase();
}
function numberOrUndefined(value: string) {
  const number = Number(value);
  return value && Number.isFinite(number) ? number : undefined;
}

function Cell({
  children,
  sticky,
  className = "",
}: {
  children: ReactNode;
  sticky?: string;
  className?: string;
}) {
  return (
    <td
      className={`border-b border-r border-slate-200 p-1 dark:border-slate-800 ${sticky ? `sticky z-20 ${sticky} bg-inherit` : ""} ${className}`}
    >
      {children}
    </td>
  );
}
function Input({
  value,
  onChange,
  type = "text",
  list,
  placeholder,
  invalid,
  title,
}: {
  value: string;
  onChange: (value: string) => void;
  type?: string;
  list?: string;
  placeholder?: string;
  invalid?: boolean;
  title?: string;
}) {
  return (
    <input
      value={value}
      onChange={(event) => onChange(event.target.value)}
      type={type}
      list={list}
      placeholder={placeholder}
      title={title}
      className={`h-8 min-w-28 w-full rounded-sm px-2 outline-none ${
        invalid
          ? "border border-rose-400 bg-rose-50 focus:border-rose-500 dark:border-rose-500 dark:bg-rose-950/40"
          : "border border-transparent bg-transparent hover:border-slate-300 focus:border-brand-500 focus:bg-white dark:focus:bg-slate-950"
      }`}
    />
  );
}
function Select({
  value,
  onChange,
  options,
  empty,
}: {
  value: string;
  onChange: (value: string) => void;
  options: Array<[string, string]>;
  empty?: string;
}) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="h-8 min-w-36 w-full rounded-sm border border-transparent bg-transparent px-1 outline-none hover:border-slate-300 focus:border-brand-500 focus:bg-white dark:focus:bg-slate-950"
    >
      {empty !== undefined ? <option value="">{empty}</option> : null}
      {options.map(([id, label]) => (
        <option key={id} value={id}>
          {label}
        </option>
      ))}
    </select>
  );
}
