export type CsvColumn<T> = {
  header: string;
  value: (row: T) => string | number | null | undefined;
};

function escapeCell(value: string | number | null | undefined): string {
  const text = value === null || value === undefined ? "" : String(value);
  const needsQuotes = /["\n;,]/.test(text);
  const escaped = text.replace(/"/g, '""');

  return needsQuotes ? `"${escaped}"` : escaped;
}

export function exportToCsv<T>(
  filename: string,
  rows: T[],
  columns: CsvColumn<T>[],
): void {
  const header = columns.map((column) => escapeCell(column.header)).join(";");
  const body = rows
    .map((row) =>
      columns.map((column) => escapeCell(column.value(row))).join(";"),
    )
    .join("\n");
  const csv = `﻿${header}\n${body}`;

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
