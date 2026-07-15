import type { DashboardMetric } from "@/types/dashboard";
import Link from "next/link";

const toneClasses: Record<DashboardMetric["tone"], string> = {
  blue: "border-blue-200 bg-blue-50 text-blue-950 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-100",
  green:
    "border-emerald-200 bg-emerald-50 text-emerald-950 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-100",
  amber:
    "border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-100",
  slate:
    "border-slate-200 bg-white text-slate-950 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100",
};

type StatCardProps = {
  metric: DashboardMetric;
};

export function StatCard({ metric }: StatCardProps) {
  const content = (
    <article className={`rounded-md border p-5 shadow-sm ${toneClasses[metric.tone]}`}>
      <p className="text-sm font-medium opacity-75">{metric.label}</p>
      <p className="mt-3 text-3xl font-semibold tracking-normal">
        {metric.value}
      </p>
    </article>
  );

  return metric.href ? (
    <Link
      href={metric.href}
      className="rounded-md transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
      aria-label={`${metric.label}: ${metric.value}. Abrir detalhes`}
    >
      {content}
    </Link>
  ) : content;
}
