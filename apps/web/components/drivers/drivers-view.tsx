"use client";

import {
  CircleSlash,
  FileSpreadsheet,
  Eye,
  Pencil,
  Plus,
  Power,
  RefreshCw,
  Smartphone,
  Trash2,
} from "lucide-react";
import { useMemo, useState } from "react";
import { DriverAccountModal } from "@/components/drivers/driver-account-modal";
import { DriverFormModal } from "@/components/drivers/driver-form-modal";
import { ActionMenu, type ActionItem } from "@/components/ui/action-menu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ColumnsMenu } from "@/components/ui/columns-menu";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { type Column, DataTable } from "@/components/ui/data-table";
import { Modal } from "@/components/ui/modal";
import { PageHeader } from "@/components/ui/page-header";
import { Pagination } from "@/components/ui/pagination";
import { SearchBar } from "@/components/ui/search-bar";
import { Select } from "@/components/ui/select";
import {
  useDeleteDriver,
  useDriverStatusAction,
  useDrivers,
} from "@/hooks/use-drivers";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useSetUserActive, useUser } from "@/hooks/use-users";
import { useToast } from "@/providers/toast-provider";
import { extractErrorMessage } from "@/services/http";
import type { SortOrder } from "@/types/api";
import type {
  Driver,
  DriverSortBy,
  DriverStatus,
  ListDriversParams,
} from "@/types/driver";
import { driverStatusMeta, driverStatusOptions } from "@/utils/driver-status";
import { exportToCsv } from "@/utils/export-csv";
import { formatDate, formatDateTime, shortCode } from "@/utils/format";

type StatusFilter = "all" | DriverStatus;

const initialHiddenColumns = new Set<string>(["updatedAt"]);

type DriversViewProps = {
  showHeader?: boolean;
};

export function DriversView({ showHeader = true }: DriversViewProps = {}) {
  const { toast } = useToast();

  const [searchInput, setSearchInput] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [sortBy, setSortBy] = useState<DriverSortBy>("createdAt");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [hiddenColumns, setHiddenColumns] =
    useState<Set<string>>(initialHiddenColumns);
  const [detailsDriver, setDetailsDriver] = useState<Driver | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Driver | null>(null);
  const [formDriver, setFormDriver] = useState<Driver | null>(null);
  const [accountDriver, setAccountDriver] = useState<Driver | null>(null);
  const linkedAccount = useUser(detailsDriver?.userId ?? null);
  const setUserActive = useSetUserActive();
  const [formOpen, setFormOpen] = useState(false);

  function openCreate() {
    setFormDriver(null);
    setFormOpen(true);
  }

  function openEdit(driver: Driver) {
    setFormDriver(driver);
    setFormOpen(true);
  }

  const search = useDebouncedValue(searchInput, 350);

  const params = useMemo<ListDriversParams>(
    () => ({
      page,
      limit,
      sortBy,
      sortOrder,
      search: search.trim() || undefined,
      status: status === "all" ? undefined : status,
    }),
    [page, limit, sortBy, sortOrder, search, status],
  );

  const { data, isLoading, isError, error, isFetching, refetch } =
    useDrivers(params);
  const deleteDriver = useDeleteDriver();
  const statusAction = useDriverStatusAction();

  const rows = data?.data ?? [];
  const meta = data?.meta;

  function resetToFirstPage() {
    setPage(1);
    setSelectedKeys(new Set());
  }

  function handleSort(sortKey: string) {
    const key = sortKey as DriverSortBy;

    if (sortBy === key) {
      setSortOrder((current) => (current === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(key);
      setSortOrder("asc");
    }

    resetToFirstPage();
  }

  function toggleRow(key: string) {
    setSelectedKeys((current) => {
      const next = new Set(current);

      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }

      return next;
    });
  }

  function toggleAll(checked: boolean) {
    setSelectedKeys(() =>
      checked ? new Set(rows.map((row) => row.id)) : new Set(),
    );
  }

  function toggleColumn(id: string) {
    setHiddenColumns((current) => {
      const next = new Set(current);

      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }

      return next;
    });
  }

  function handleExport() {
    if (rows.length === 0) {
      toast({ title: "Nothing to export", type: "warning" });
      return;
    }

    exportToCsv("drivers.csv", rows, [
      { header: "Code", value: (row) => shortCode(row.id) },
      { header: "Name", value: (row) => row.fullName },
      { header: "Driving Licence", value: (row) => row.licenseNumber },
      { header: "Passport", value: (row) => row.passportNumber ?? "" },
      { header: "Phone", value: (row) => row.phone ?? "" },
      { header: "Email", value: (row) => row.email ?? "" },
      {
        header: "Availability",
        value: (row) => driverStatusMeta[row.status].label,
      },
      {
        header: "Status",
        value: (row) => (row.status === "INACTIVE" ? "Inactive" : "Active"),
      },
      { header: "Created at", value: (row) => formatDate(row.createdAt) },
    ]);

    toast({ title: "Export completed", type: "success" });
  }

  function runStatusAction(
    driver: Driver,
    action: "available" | "offline" | "deactivate",
    successMessage: string,
  ) {
    statusAction.mutate(
      { id: driver.id, action },
      {
        onSuccess: () => toast({ title: successMessage, type: "success" }),
        onError: (mutationError) =>
          toast({
            title: "Could not update the driver",
            description: extractErrorMessage(mutationError),
            type: "error",
          }),
      },
    );
  }

  function confirmDelete() {
    if (!deleteTarget) {
      return;
    }

    deleteDriver.mutate(deleteTarget.id, {
      onSuccess: () => {
        toast({ title: "Driver deleted", type: "success" });
        setDeleteTarget(null);
      },
      onError: (mutationError) =>
        toast({
          title: "Could not delete the driver",
          description: extractErrorMessage(mutationError),
          type: "error",
        }),
    });
  }

  const columns: Column<Driver>[] = [
    {
      id: "code",
      header: "Code",
      cell: (driver) => (
        <span className="font-mono text-xs font-medium text-slate-500 dark:text-slate-400">
          {shortCode(driver.id)}
        </span>
      ),
    },
    {
      id: "fullName",
      header: "Name",
      sortable: true,
      sortKey: "fullName",
      cell: (driver) => (
        <div className="flex flex-col">
          <span className="font-medium text-slate-900 dark:text-white">
            {driver.fullName}
          </span>
          {driver.email ? (
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {driver.email}
            </span>
          ) : null}
        </div>
      ),
    },
    {
      id: "licenseNumber",
      header: "Driving Licence",
      sortable: true,
      sortKey: "licenseNumber",
      cell: (driver) => (
        <span className="font-mono text-xs text-slate-600 dark:text-slate-300">
          {driver.licenseNumber}
        </span>
      ),
    },
    {
      id: "phone",
      header: "Phone",
      cell: (driver) => driver.phone ?? "—",
    },
    {
      id: "estado",
      header: "Status",
      cell: (driver) => (
        <Badge tone={driver.status === "INACTIVE" ? "red" : "green"}>
          {driver.status === "INACTIVE" ? "Inactive" : "Active"}
        </Badge>
      ),
    },
    {
      id: "status",
      header: "Availability",
      sortable: true,
      sortKey: "status",
      cell: (driver) => {
        const meta = driverStatusMeta[driver.status];
        return <Badge tone={meta.tone}>{meta.label}</Badge>;
      },
    },
    {
      id: "lastTrip",
      header: "Last Trip",
      cell: () => <span className="text-slate-400 dark:text-slate-500">—</span>,
    },
    {
      id: "updatedAt",
      header: "Last Updated",
      cell: (driver) => formatDateTime(driver.updatedAt),
    },
  ];

  const hideableColumns = [
    { id: "phone", label: "Phone" },
    { id: "lastTrip", label: "Last Trip" },
    { id: "updatedAt", label: "Last Updated" },
  ];

  function buildActions(driver: Driver): ActionItem[] {
    const items: ActionItem[] = [
      {
        label: "Details",
        icon: Eye,
        tone: "info",
        onSelect: () => setDetailsDriver(driver),
      },
      {
        label: "Edit",
        icon: Pencil,
        tone: "warning",
        onSelect: () => openEdit(driver),
      },
    ];

    if (!driver.userId) {
      items.push({
        label: "Grant mobile access",
        icon: Smartphone,
        tone: "default",
        onSelect: () => setAccountDriver(driver),
      });
    }

    if (driver.status !== "AVAILABLE" && driver.status !== "INACTIVE") {
      items.push({
        label: "Mark available",
        icon: Power,
        tone: "success",
        onSelect: () =>
          runStatusAction(driver, "available", "Driver available"),
      });
    }

    if (driver.status === "AVAILABLE") {
      items.push({
        label: "Mark offline",
        icon: CircleSlash,
        tone: "muted",
        onSelect: () => runStatusAction(driver, "offline", "Driver offline"),
      });
    }

    if (driver.status !== "INACTIVE") {
      items.push({
        label: "Deactivate",
        icon: CircleSlash,
        tone: "muted",
        onSelect: () =>
          runStatusAction(driver, "deactivate", "Driver deactivated"),
      });
    }

    items.push({
      label: "Delete",
      icon: Trash2,
      tone: "danger",
      separatorBefore: true,
      onSelect: () => setDeleteTarget(driver),
    });

    return items;
  }

  return (
    <>
      {showHeader ? (
        <PageHeader
          title="Drivers"
          description="Manage drivers, availability, and operational status."
          actions={
            <>
              <Button
                variant="outline"
                size="sm"
                className="h-9"
                icon={<RefreshCw className="size-4" />}
                onClick={() => refetch()}
                loading={isFetching}
              >
                Refresh
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-9"
                icon={<FileSpreadsheet className="size-4" />}
                onClick={handleExport}
              >
                Export to Excel
              </Button>
              <Button
                size="sm"
                className="h-9"
                icon={<Plus className="size-4" />}
                onClick={openCreate}
              >
                New Driver
              </Button>
            </>
          }
        />
      ) : null}

      {!showHeader ? (
        <div className="flex flex-wrap items-center justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-9"
            icon={<RefreshCw className="size-4" />}
            onClick={() => refetch()}
            loading={isFetching}
          >
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-9"
            icon={<FileSpreadsheet className="size-4" />}
            onClick={handleExport}
          >
            Export to Excel
          </Button>
          <Button
            size="sm"
            className="h-9"
            icon={<Plus className="size-4" />}
            onClick={openCreate}
          >
            New Driver
          </Button>
        </div>
      ) : null}

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 rounded-md border border-slate-200 bg-white p-3 sm:flex-row sm:items-center dark:border-slate-800 dark:bg-slate-900">
          <SearchBar
            value={searchInput}
            onChange={(value) => {
              setSearchInput(value);
              resetToFirstPage();
            }}
            placeholder="Search by name, licence, or email..."
            className="sm:max-w-sm sm:flex-1"
          />
          <div className="flex flex-wrap items-center gap-3">
            <Select
              aria-label="Filter by availability"
              value={status}
              onChange={(event) => {
                setStatus(event.target.value as StatusFilter);
                resetToFirstPage();
              }}
              options={driverStatusOptions}
              className="w-52"
            />
            <ColumnsMenu
              columns={hideableColumns.map((column) => ({
                ...column,
                visible: !hiddenColumns.has(column.id),
              }))}
              onToggle={toggleColumn}
            />
          </div>
        </div>

        {isError ? (
          <div className="flex flex-col items-start gap-3 rounded-md border border-rose-200 bg-rose-50 p-4 dark:border-rose-900 dark:bg-rose-950/40">
            <p className="text-sm text-rose-700 dark:text-rose-300">
              {extractErrorMessage(error)}
            </p>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Try again
            </Button>
          </div>
        ) : null}

        {selectedKeys.size > 0 ? (
          <div className="flex items-center justify-between rounded-md border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-300">
            <span>{selectedKeys.size} selected</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedKeys(new Set())}
            >
              Clear selection
            </Button>
          </div>
        ) : null}

        <DataTable<Driver>
          columns={columns}
          rows={rows}
          getRowKey={(driver) => driver.id}
          loading={isLoading}
          hiddenColumns={hiddenColumns}
          selectable
          selectedKeys={selectedKeys}
          onToggleRow={toggleRow}
          onToggleAll={toggleAll}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSort={handleSort}
          footer={
            meta ? (
              <Pagination
                page={meta.page}
                limit={meta.limit}
                total={meta.total}
                totalPages={meta.totalPages}
                onPageChange={setPage}
                onLimitChange={(nextLimit) => {
                  setLimit(nextLimit);
                  resetToFirstPage();
                }}
              />
            ) : null
          }
          renderActions={(driver) => (
            <ActionMenu items={buildActions(driver)} />
          )}
        />
      </div>

      <Modal
        open={detailsDriver !== null}
        size="lg"
        title={detailsDriver?.fullName ?? "Driver"}
        description={detailsDriver ? shortCode(detailsDriver.id) : undefined}
        onClose={() => setDetailsDriver(null)}
      >
        {detailsDriver ? (
          <dl className="overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            <DetailRow
              label="Driving Licence"
              value={detailsDriver.licenseNumber}
            />
            <DetailRow
              label="Passport"
              value={detailsDriver.passportNumber}
            />
            <DetailRow label="Phone" value={detailsDriver.phone} />
            <DetailRow label="Email" value={detailsDriver.email} />
            <DetailRow
              label="Availability"
              value={driverStatusMeta[detailsDriver.status].label}
            />
            <DetailRow
              label="Status"
              value={detailsDriver.status === "INACTIVE" ? "Inactive" : "Active"}
            />
            <DetailRow
              label="Mobile access account"
              value={
                detailsDriver.userId
                  ? (linkedAccount.data?.email ?? "Linked")
                  : "No account"
              }
            />
            <DetailRow
              label="Created at"
              value={formatDateTime(detailsDriver.createdAt)}
            />
            <DetailRow
              label="Last updated"
              value={formatDateTime(detailsDriver.updatedAt)}
            />
          </dl>
        ) : null}
        {detailsDriver && !detailsDriver.userId ? (
          <div className="mt-4 flex justify-end">
            <Button
              size="sm"
              icon={<Smartphone className="size-4" />}
              onClick={() => {
                setAccountDriver(detailsDriver);
                setDetailsDriver(null);
              }}
            >
              Grant mobile access
            </Button>
          </div>
        ) : null}
        {detailsDriver?.userId && linkedAccount.data ? (
          <div className="mt-4 flex items-center justify-between gap-3 rounded-md border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950">
            <div>
              <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                Mobile access{" "}
                {linkedAccount.data.isActive ? "active" : "inactive"}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {linkedAccount.data.email}
              </p>
            </div>
            <Button
              size="sm"
              variant={linkedAccount.data.isActive ? "outline" : "primary"}
              loading={setUserActive.isPending}
              onClick={() =>
                setUserActive.mutate(
                  {
                    id: linkedAccount.data.id,
                    active: !linkedAccount.data.isActive,
                  },
                  {
                    onSuccess: () =>
                      toast({
                        title: linkedAccount.data.isActive
                          ? "Mobile access deactivated"
                          : "Mobile access activated",
                        type: "success",
                      }),
                    onError: (error) =>
                      toast({
                        title: "Could not change mobile access",
                        description: extractErrorMessage(error),
                        type: "error",
                      }),
                  },
                )
              }
            >
              {linkedAccount.data.isActive
                ? "Deactivate access"
                : "Activate access"}
            </Button>
          </div>
        ) : null}
      </Modal>

      <DriverAccountModal
        driver={accountDriver}
        onClose={() => setAccountDriver(null)}
      />

      <DriverFormModal
        open={formOpen}
        driver={formDriver}
        onClose={() => setFormOpen(false)}
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete driver"
        description={
          deleteTarget
            ? `Are you sure you want to delete “${deleteTarget.fullName}”? This action deactivates the record.`
            : undefined
        }
        confirmLabel="Delete"
        tone="danger"
        loading={deleteDriver.isPending}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div className="grid border-b border-slate-100 last:border-b-0 sm:grid-cols-[minmax(9rem,38%)_1fr] dark:border-slate-800">
      <dt className="bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
        {label}
      </dt>
      <dd className="min-w-0 break-words px-4 py-3 text-sm text-slate-800 dark:text-slate-200">
        {value && value.length > 0 ? value : "—"}
      </dd>
    </div>
  );
}
