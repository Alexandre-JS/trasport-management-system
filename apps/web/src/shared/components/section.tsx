import type { ReactNode } from "react";

type SectionProps = {
  title?: string;
  description?: string;
  children: ReactNode;
};

export function Section({ title, description, children }: SectionProps) {
  return (
    <section className="flex flex-col gap-4">
      {title || description ? (
        <div>
          {title ? (
            <h2 className="text-base font-semibold text-slate-950 dark:text-white">
              {title}
            </h2>
          ) : null}
          {description ? (
            <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-400">
              {description}
            </p>
          ) : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}
