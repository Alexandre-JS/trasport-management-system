import Image from "next/image";

export function PrintOperationalTableDocument({
  title,
  subtitle,
  columns,
  rows,
}: {
  title: string;
  subtitle: string;
  columns: string[];
  rows: string[][];
}) {
  return (
    <article className="print-document print-document-landscape" data-print-document>
      <header className="print-document-header">
        <Image
          src="/lumac-logo.png"
          alt="LUMAC Transportes & Logística"
          width={876}
          height={284}
          priority
          className="print-document-logo"
        />
        <div className="text-right">
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </div>
      </header>

      <table className="print-operational-table">
        <thead>
          <tr>{columns.map((column) => <th key={column}>{column}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={`${row[1] ?? "linha"}-${rowIndex}`}>
              {row.map((cell, cellIndex) => <td key={`${cellIndex}-${cell}`}>{cell}</td>)}
            </tr>
          ))}
        </tbody>
      </table>

      <footer className="print-document-footer">
        <p>{rows.length} registos · documento processado por computador.</p>
        <p>LUMAC Transportes &amp; Logística</p>
      </footer>
    </article>
  );
}
