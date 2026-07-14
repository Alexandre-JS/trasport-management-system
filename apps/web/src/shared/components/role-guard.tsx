"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useAuth } from "@/src/shared/hooks/use-auth";

type RoleGuardProps = {
  /** Perfis autorizados a ver a página (ex.: ["ADMIN"]). */
  allow: string[];
  children: ReactNode;
};

/**
 * Guarda de rota por perfil: quem não estiver na lista é reencaminhado para
 * o dashboard. A API já recusa os pedidos (403) — isto evita mostrar uma
 * página inteira de erros a quem chegou aqui por URL direto.
 */
export function RoleGuard({ allow, children }: RoleGuardProps) {
  const { role, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  const allowed = role !== null && allow.includes(role);

  useEffect(() => {
    if (!isLoading && isAuthenticated && !allowed) {
      router.replace("/");
    }
  }, [isLoading, isAuthenticated, allowed, router]);

  if (!allowed) {
    return null;
  }

  return <>{children}</>;
}
