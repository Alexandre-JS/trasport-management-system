"use client";

import { Eye, Pencil, Plus, Power, RefreshCw } from "lucide-react";
import { useMemo, useState } from "react";
import { ActionMenu, type ActionItem } from "@/components/ui/action-menu";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { UserDetailsModal } from "@/components/users/user-details-modal";
import { UserFormModal } from "@/components/users/user-form-modal";
import { UserPasswordModal } from "@/components/users/user-password-modal";
import { UserRoleModal } from "@/components/users/user-role-modal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { type Column, DataTable } from "@/components/ui/data-table";
import { Pagination } from "@/components/ui/pagination";
import { SearchBar } from "@/components/ui/search-bar";
import { Select } from "@/components/ui/select";
import { useDeleteUser, useSetUserActive, useUsers } from "@/hooks/use-users";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useToast } from "@/providers/toast-provider";
import { extractErrorMessage } from "@/services/http";
import type { SortOrder } from "@/types/api";
import type { ListUsersParams, User, UserSortBy } from "@/types/user";
import { formatDate, formatDateTime } from "@/utils/format";
import { roleLabelMap, roleToneMap } from "@/utils/role-permissions";

const roleOptions = [
  { label: "Todos os perfis", value: "all" },
  { label: "Administrador", value: "ADMIN" },
  { label: "Operador logístico", value: "DISPATCHER" },
  { label: "Motorista", value: "DRIVER" },
  { label: "Cliente", value: "CLIENT" },
];

const statusOptions = [
  { label: "Todos os estados", value: "all" },
  { label: "Ativos", value: "active" },
  { label: "Inativos", value: "inactive" },
];

type StatusFilter = "all" | "active" | "inactive";

export function UsersPanel() {
  const { toast } = useToast();

  const [searchInput, setSearchInput] = useState("");
  const [role, setRole] = useState("all");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [sortBy, setSortBy] = useState<UserSortBy>("createdAt");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [formOpen, setFormOpen] = useState(false);
  const [formUser, setFormUser] = useState<User | null>(null);
  const [detailsUser, setDetailsUser] = useState<User | null>(null);
  const [roleUser, setRoleUser] = useState<User | null>(null);
  const [passwordUser, setPasswordUser] = useState<User | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);

  const search = useDebouncedValue(searchInput, 350);

  const params = useMemo<ListUsersParams>(
    () => ({
      page,
      limit,
      sortBy,
      sortOrder,
      search: search.trim() || undefined,
      role: role === "all" ? undefined : role,
      isActive: status === "all" ? undefined : status === "active",
    }),
    [page, limit, sortBy, sortOrder, search, role, status],
  );

  const { data, isLoading, isError, error, isFetching, refetch } =
    useUsers(params);
  const setUserActive = useSetUserActive();
  const deleteUser = useDeleteUser();

  const rows = data?.data ?? [];
  const meta = data?.meta;

  function resetToFirstPage() {
    setPage(1);
  }

  function handleSort(sortKey: string) {
    const key = sortKey as UserSortBy;

    if (sortBy === key) {
      setSortOrder((current) => (current === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(key);
      setSortOrder("asc");
    }

    resetToFirstPage();
  }

  function handleToggleActive(user: User) {
    setUserActive.mutate(
      { id: user.id, active: !user.isActive },
      {
        onSuccess: () =>
          toast({
            title: user.isActive ? "Utilizador desativado" : "Utilizador ativado",
            type: "success",
          }),
        onError: (mutationError) =>
          toast({
            title: "Não foi possível atualizar",
            description: extractErrorMessage(mutationError),
            type: "error",
          }),
      },
    );
  }

  const columns: Column<User>[] = [
    {
      id: "firstName",
      header: "Nome",
      sortable: true,
      sortKey: "firstName",
      cell: (user) => (
        <div className="flex flex-col">
          <span className="font-medium text-slate-900 dark:text-white">
            {user.firstName} {user.lastName}
          </span>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {user.email}
          </span>
        </div>
      ),
    },
    {
      id: "role",
      header: "Perfil",
      cell: (user) => (
        <Badge tone={roleToneMap[user.role.name] ?? "slate"}>
          {roleLabelMap[user.role.name] ?? user.role.name}
        </Badge>
      ),
    },
    {
      id: "isActive",
      header: "Estado",
      cell: (user) => (
        <Badge tone={user.isActive ? "green" : "red"}>
          {user.isActive ? "Ativo" : "Inativo"}
        </Badge>
      ),
    },
    {
      id: "lastLogin",
      header: "Último acesso",
      cell: (user) =>
        user.lastLogin ? formatDateTime(user.lastLogin) : "Nunca",
    },
    {
      id: "createdAt",
      header: "Criado em",
      sortable: true,
      sortKey: "createdAt",
      cell: (user) => formatDate(user.createdAt),
    },
  ];

  // Ações rápidas na tabela; as restantes (mudar perfil, repor senha,
  // apagar) vivem no modal de detalhes.
  function buildActions(user: User): ActionItem[] {
    return [
      {
        label: "Ver",
        icon: Eye,
        onSelect: () => setDetailsUser(user),
      },
      {
        label: "Editar",
        icon: Pencil,
        onSelect: () => openEdit(user),
      },
      {
        label: user.isActive ? "Desativar" : "Ativar",
        icon: Power,
        onSelect: () => handleToggleActive(user),
      },
    ];
  }

  function openEdit(user: User) {
    setDetailsUser(null);
    setFormUser(user);
    setFormOpen(true);
  }

  function confirmDelete() {
    if (!deleteTarget) {
      return;
    }

    deleteUser.mutate(deleteTarget.id, {
      onSuccess: () => {
        toast({ title: "Usuário apagado", type: "success" });
        setDeleteTarget(null);
      },
      onError: (mutationError) => {
        toast({
          title: "Não foi possível apagar",
          description: extractErrorMessage(mutationError),
          type: "error",
        });
        setDeleteTarget(null);
      },
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 rounded-md border border-slate-200 bg-white p-3 sm:flex-row sm:items-center dark:border-slate-800 dark:bg-slate-900">
        <SearchBar
          value={searchInput}
          onChange={(value) => {
            setSearchInput(value);
            resetToFirstPage();
          }}
          placeholder="Pesquisar por nome ou email..."
          className="sm:max-w-sm sm:flex-1"
        />
        <div className="flex flex-wrap items-center gap-3">
          <Select
            aria-label="Filtrar por perfil"
            value={role}
            onChange={(event) => {
              setRole(event.target.value);
              resetToFirstPage();
            }}
            options={roleOptions}
            className="w-44"
          />
          <Select
            aria-label="Filtrar por estado"
            value={status}
            onChange={(event) => {
              setStatus(event.target.value as StatusFilter);
              resetToFirstPage();
            }}
            options={statusOptions}
            className="w-40"
          />
          <Button
            variant="outline"
            size="sm"
            icon={<RefreshCw className="size-4" />}
            onClick={() => refetch()}
            loading={isFetching}
          >
            Atualizar
          </Button>
          <Button
            size="sm"
            icon={<Plus className="size-4" />}
            onClick={() => {
              setFormUser(null);
              setFormOpen(true);
            }}
          >
            Novo usuário
          </Button>
        </div>
      </div>

      {isError ? (
        <div className="flex flex-col items-start gap-3 rounded-md border border-rose-200 bg-rose-50 p-4 dark:border-rose-900 dark:bg-rose-950/40">
          <p className="text-sm text-rose-700 dark:text-rose-300">
            {extractErrorMessage(error)}
          </p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Tentar novamente
          </Button>
        </div>
      ) : null}

      <DataTable<User>
        columns={columns}
        rows={rows}
        getRowKey={(user) => user.id}
        loading={isLoading}
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
        renderActions={(user) => <ActionMenu items={buildActions(user)} />}
      />

      <UserDetailsModal
        user={detailsUser}
        onClose={() => setDetailsUser(null)}
        onEdit={openEdit}
        onChangeRole={(user) => {
          setDetailsUser(null);
          setRoleUser(user);
        }}
        onResetPassword={(user) => {
          setDetailsUser(null);
          setPasswordUser(user);
        }}
        onToggleActive={(user) => {
          setDetailsUser(null);
          handleToggleActive(user);
        }}
        onDelete={(user) => {
          setDetailsUser(null);
          setDeleteTarget(user);
        }}
      />
      <UserFormModal
        open={formOpen}
        user={formUser}
        onClose={() => setFormOpen(false)}
      />
      <UserRoleModal user={roleUser} onClose={() => setRoleUser(null)} />
      <UserPasswordModal
        user={passwordUser}
        onClose={() => setPasswordUser(null)}
      />
      <ConfirmDialog
        open={deleteTarget !== null}
        title="Apagar usuário"
        description={
          deleteTarget
            ? `Tem a certeza que pretende apagar “${deleteTarget.firstName} ${deleteTarget.lastName}” (${deleteTarget.email})? A conta deixa de poder iniciar sessão.`
            : undefined
        }
        confirmLabel="Apagar"
        tone="danger"
        loading={deleteUser.isPending}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
