"use client";

import { usePathname } from "next/navigation";
import { ErrorState } from "@/src/shared/components/error-state";
import { PublicTrackView } from "@/src/shared/components/public-track-view";

export function StaticTrackingRoute() {
  const pathname = usePathname();
  const token = lastPathSegment(pathname, "track");

  if (!token) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-8 dark:bg-slate-950">
        <div className="mx-auto max-w-3xl">
          <ErrorState
            title="Tracking link incomplete"
            description="Open the complete link shared by LUMAC. If it was copied from a message, make sure the entire address is included."
          />
        </div>
      </main>
    );
  }

  return <PublicTrackView token={token} />;
}

function lastPathSegment(pathname: string, root: string) {
  const parts = pathname.split("/").filter(Boolean);
  const rootIndex = parts.indexOf(root);
  const value = rootIndex >= 0 ? parts.at(-1) : undefined;

  if (!value || value === root || value === "client") return null;

  try {
    return decodeURIComponent(value);
  } catch {
    return null;
  }
}
