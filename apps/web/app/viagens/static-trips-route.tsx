"use client";

import { usePathname } from "next/navigation";
import { ActivitiesView } from "@/src/shared/components/activities-view";
import { TripDetailView } from "@/src/shared/components/trip-detail-view";
import { ProtectedLayout } from "@/src/shared/layout/protected-layout";

export function StaticTripsRoute() {
  const id = childSegment(usePathname(), "viagens");

  return (
    <ProtectedLayout>
      {id ? <TripDetailView id={id} /> : <ActivitiesView />}
    </ProtectedLayout>
  );
}

function childSegment(pathname: string, root: string) {
  const parts = pathname.split("/").filter(Boolean);
  const rootIndex = parts.indexOf(root);
  const value = rootIndex >= 0 ? parts[rootIndex + 1] : undefined;
  if (!value) return null;
  try {
    return decodeURIComponent(value);
  } catch {
    return null;
  }
}
