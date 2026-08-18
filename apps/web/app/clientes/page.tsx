import { StaticRedirect } from "@/src/shared/components/static-redirect";

export default function ClientesPage() {
  return <StaticRedirect to="/contas-cliente/?tab=clientes" />;
}
