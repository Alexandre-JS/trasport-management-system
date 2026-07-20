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

/** "há 5 min", "há 2 h", "há 3 dias" — tempo relativo em português. */
export function formatRelativeTime(
  value: string | Date | null | undefined,
): string {
  const date = toDate(value);
  if (!date) return "—";

  const seconds = Math.round((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "agora mesmo";

  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `há ${minutes} min`;

  const hours = Math.round(minutes / 60);
  if (hours < 24) return `há ${hours} h`;

  const days = Math.round(hours / 24);
  return days === 1 ? "há 1 dia" : `há ${days} dias`;
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
