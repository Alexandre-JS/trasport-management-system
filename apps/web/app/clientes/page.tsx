import { redirect } from "next/navigation";

export default function ClientesPage() {
  redirect("/contas-cliente?tab=clientes");
}
