import { Mail, PhoneCall } from "lucide-react";

const supportPhone = process.env.NEXT_PUBLIC_SUPPORT_PHONE?.trim();
const supportEmail = process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim();

export function ClientSupportCard() {
  if (!supportPhone && !supportEmail) return null;

  return (
    <section className="rounded-lg border border-rose-200 bg-rose-50/70 p-4 dark:border-rose-900 dark:bg-rose-950/20">
      <h2 className="text-sm font-semibold text-rose-900 dark:text-rose-100">
        Contacto em caso de urgência
      </h2>
      <p className="mt-1 text-xs text-rose-700 dark:text-rose-300">
        Identifique o código da carga ao contactar a equipa LUMAC.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {supportPhone ? (
          <a
            href={`tel:${supportPhone.replace(/\s/g, "")}`}
            className="inline-flex h-9 items-center gap-2 rounded-md bg-rose-600 px-3 text-sm font-medium text-white hover:bg-rose-700"
          >
            <PhoneCall className="size-4" aria-hidden />
            {supportPhone}
          </a>
        ) : null}
        {supportEmail ? (
          <a
            href={`mailto:${supportEmail}`}
            className="inline-flex h-9 items-center gap-2 rounded-md border border-rose-200 bg-white px-3 text-sm font-medium text-rose-700 hover:bg-rose-100 dark:border-rose-800 dark:bg-slate-900 dark:text-rose-200"
          >
            <Mail className="size-4" aria-hidden />
            {supportEmail}
          </a>
        ) : null}
      </div>
    </section>
  );
}
