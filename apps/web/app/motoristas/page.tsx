import { redirect } from "next/navigation";

export default function MotoristasPage() {
  redirect("/contas-cliente?tab=motoristas");
}
