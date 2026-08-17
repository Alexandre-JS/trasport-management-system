"use client";

import { CloudOff, WifiOff } from "lucide-react";
import { useEffect, useState } from "react";
import {
  type ConnectionStatus,
  onConnectionStatus,
} from "@/src/shared/services/api-client";

/**
 * Faixa global no topo quando a app perde contacto com a API: distingue
 * "sem internet" (rede do utilizador) de "servidor indisponível" (nosso lado).
 * Repõe-se sozinha assim que um pedido volta a ter sucesso.
 */
export function ConnectionBanner() {
  const [status, setStatus] = useState<ConnectionStatus>("online");

  useEffect(() => {
    const unsubscribe = onConnectionStatus(setStatus);

    function handleOffline() {
      setStatus("offline");
    }

    window.addEventListener("offline", handleOffline);

    return () => {
      unsubscribe();
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (status === "online") {
    return null;
  }

  const offline = status === "offline";

  return (
    <div
      role="status"
      className={`fixed inset-x-0 top-0 z-[130] flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white ${
        offline ? "bg-slate-700" : "bg-amber-600"
      }`}
    >
      {offline ? (
        <WifiOff className="size-4 shrink-0" />
      ) : (
        <CloudOff className="size-4 shrink-0" />
      )}
      {offline
        ? "No internet connection. Check your network; data will reload when the connection is restored."
        : "Connection interrupted. The system will reconnect automatically."}
    </div>
  );
}
