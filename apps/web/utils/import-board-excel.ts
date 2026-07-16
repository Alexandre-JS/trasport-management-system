// Lê um ficheiro Excel (.xlsx/.xls/.csv) no formato da folha operacional do
// cliente (LUMAC) e devolve as linhas mapeadas para os campos do quadro.
// A biblioteca xlsx é carregada dinamicamente (só quando se importa).

export type ImportedRow = {
  transporter: string;
  horse: string;
  trailer: string;
  driver: string;
  passport: string;
  license: string;
  phone: string;
  border: string;
  tonnage: string;
  dispatchedBy: string;
  departureDate: string;
  arrivalDate: string;
  dischargeDate: string;
  currentPosition: string;
  remarks: string;
};

const MONTHS: Record<string, number> = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
};

function pad(n: number) {
  return String(n).padStart(2, "0");
}

/** Converte várias formas de data ("26/Jun/2026", "6/7/2026", Date) para YYYY-MM-DD. */
function toISODate(value: unknown): string {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`;
  }
  const text = String(value ?? "").trim();
  if (!text) return "";

  let m = text.match(/^(\d{1,2})[/\-\s]([A-Za-z]{3,})[/\-\s](\d{4})$/);
  if (m) {
    const mm = MONTHS[m[2].slice(0, 3).toLowerCase()];
    if (mm !== undefined) return `${m[3]}-${pad(mm + 1)}-${pad(Number(m[1]))}`;
  }
  m = text.match(/^(\d{1,2})[/\-](\d{1,2})[/\-](\d{4})$/);
  if (m) return `${m[3]}-${pad(Number(m[2]))}-${pad(Number(m[1]))}`;
  m = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;

  const d = new Date(text);
  return Number.isNaN(d.getTime())
    ? ""
    : `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// Coluna → padrões possíveis no cabeçalho (folha do cliente em EN/PT).
const COLUMN_PATTERNS: Record<keyof ImportedRow, RegExp[]> = {
  transporter: [/transpo?rter/i, /transportador/i],
  horse: [/horse/i],
  trailer: [/trailer/i, /reboque/i],
  driver: [/driver/i, /motorista/i, /\bnome\b/i],
  passport: [/passport/i, /passaporte/i],
  license: [/licen[cs]e/i, /carta/i],
  phone: [/phone/i, /telefone/i, /contacto/i],
  border: [/bo?rder/i, /fronteira/i],
  tonnage: [/\bton/i, /tonelagem/i],
  dispatchedBy: [/dispatched/i, /despach/i],
  departureDate: [/dispatch\s*date/i, /gms/i, /sa[íi]da/i, /partida/i],
  arrivalDate: [/arrive/i, /arrival/i, /chegada/i],
  dischargeDate: [/discharge/i, /descarga/i],
  currentPosition: [/current\s*position/i, /posi[çc][ãa]o/i],
  remarks: [/remark/i, /observ/i],
};

const DATE_FIELDS = new Set<keyof ImportedRow>([
  "departureDate",
  "arrivalDate",
  "dischargeDate",
]);

export async function parseBoardExcel(
  buffer: ArrayBuffer,
): Promise<ImportedRow[]> {
  const XLSX = await import("xlsx");
  const wb = XLSX.read(buffer, { type: "array", cellDates: true });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  if (!sheet) return [];

  const grid = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    raw: false,
    defval: "",
  });

  // Linha de cabeçalho = a que tem "HORSE" e um campo de motorista.
  const headerIdx = grid.findIndex(
    (row) =>
      Array.isArray(row) &&
      row.some((c) => /horse/i.test(String(c))) &&
      row.some((c) => /driver|motorista/i.test(String(c))),
  );
  if (headerIdx < 0) {
    throw new Error(
      "Não reconheci as colunas. Confirme que o Excel tem cabeçalhos como HORSE, DRIVER NAME, etc.",
    );
  }

  const headers = (grid[headerIdx] as unknown[]).map((c) => String(c).trim());
  const colIndex = {} as Record<keyof ImportedRow, number>;
  (Object.keys(COLUMN_PATTERNS) as (keyof ImportedRow)[]).forEach((field) => {
    colIndex[field] = headers.findIndex((h) =>
      COLUMN_PATTERNS[field].some((p) => p.test(h)),
    );
  });

  const rows: ImportedRow[] = [];
  for (let r = headerIdx + 1; r < grid.length; r++) {
    const raw = grid[r];
    if (!Array.isArray(raw)) continue;
    const cell = (field: keyof ImportedRow) => {
      const i = colIndex[field];
      const v = i >= 0 ? raw[i] : "";
      if (DATE_FIELDS.has(field)) return toISODate(v);
      return String(v ?? "").trim();
    };

    const horse = cell("horse");
    const driver = cell("driver");
    // Ignora linhas vazias e possíveis linhas de total/rodapé.
    if (!horse && !driver) continue;

    rows.push({
      transporter: cell("transporter"),
      horse,
      trailer: cell("trailer"),
      driver,
      passport: cell("passport"),
      license: cell("license"),
      phone: cell("phone"),
      border: cell("border"),
      tonnage: cell("tonnage"),
      dispatchedBy: cell("dispatchedBy"),
      departureDate: cell("departureDate"),
      arrivalDate: cell("arrivalDate"),
      dischargeDate: cell("dischargeDate"),
      currentPosition: cell("currentPosition"),
      remarks: cell("remarks"),
    });
  }
  return rows;
}
