const dateFormatter = new Intl.DateTimeFormat("pt-PT", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

const dateTimeFormatter = new Intl.DateTimeFormat("pt-PT", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

function toDate(value: string | Date | null | undefined): Date | null {
  if (!value) {
    return null;
  }

  const date = typeof value === "string" ? new Date(value) : value;

  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatDate(value: string | Date | null | undefined): string {
  const date = toDate(value);

  return date ? dateFormatter.format(date) : "—";
}

export function formatDateTime(
  value: string | Date | null | undefined,
): string {
  const date = toDate(value);

  return date ? dateTimeFormatter.format(date) : "—";
}

export function shortCode(id: string, prefix = ""): string {
  return `${prefix}${id.replace(/-/g, "").slice(0, 8).toUpperCase()}`;
}

const numberFormatter = new Intl.NumberFormat("pt-PT");

export function formatWeight(
  tonnes: number | null | undefined,
): string {
  if (tonnes === null || tonnes === undefined) {
    return "—";
  }

  return `${numberFormatter.format(tonnes)} t`;
}
