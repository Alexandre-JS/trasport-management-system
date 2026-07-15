import Image from "next/image";

type PrintRow = { label: string; value: string };
type PrintEvent = { date: string; description: string; note?: string };

export function PrintShipmentDocument({
  title,
  reference,
  status,
  route,
  sections,
  events = [],
  signatures = [],
  informational = false,
}: {
  title: string;
  reference: string;
  status: string;
  route: string;
  sections: Array<{ title: string; rows: PrintRow[] }>;
  events?: PrintEvent[];
  signatures?: string[];
  informational?: boolean;
}) {
  const phone = process.env.NEXT_PUBLIC_SUPPORT_PHONE?.trim();
  const email = process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim();

  return (
    <article className="print-document" data-print-document>
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
          <p>Referência: {reference}</p>
        </div>
      </header>

      <div className="print-document-summary">
        <div><span>Estado</span><strong>{status}</strong></div>
        <div><span>Rota</span><strong>{route}</strong></div>
      </div>

      {sections.map((section) => (
        <section key={section.title} className="print-document-section">
          <h2>{section.title}</h2>
          <table>
            <tbody>
              {section.rows.map((row) => (
                <tr key={`${section.title}-${row.label}`}>
                  <th>{row.label}</th>
                  <td>{row.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ))}

      {events.length > 0 ? (
        <section className="print-document-section">
          <h2>Acompanhamento</h2>
          <table>
            <thead><tr><th>Data/hora</th><th>Evento</th><th>Observação</th></tr></thead>
            <tbody>
              {events.map((event, index) => (
                <tr key={`${event.date}-${index}`}>
                  <td>{event.date}</td>
                  <td>{event.description}</td>
                  <td>{event.note || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ) : null}

      {signatures.length > 0 ? (
        <section className="print-signatures" aria-label="Assinaturas">
          {signatures.map((signature) => (
            <div key={signature}><span /><p>{signature}</p></div>
          ))}
        </section>
      ) : null}

      <footer className="print-document-footer">
        <p>
          {informational
            ? "Documento informativo processado por computador; não requer assinatura."
            : "Documento processado por computador. As assinaturas confirmam os dados operacionais acima."}
        </p>
        {phone || email ? <p>Contacto: {[phone, email].filter(Boolean).join(" · ")}</p> : null}
      </footer>
    </article>
  );
}
