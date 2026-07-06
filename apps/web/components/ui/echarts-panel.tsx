"use client";

import * as echarts from "echarts";
import type { EChartsOption } from "echarts";
import { useEffect, useRef } from "react";

type EChartsPanelProps = {
  title: string;
  description?: string;
  option: EChartsOption;
  height?: string;
};

export function EChartsPanel({
  title,
  description,
  option,
  height = "20rem",
}: EChartsPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    const chart = echarts.init(containerRef.current);
    const observer = new ResizeObserver(() => chart.resize());

    chart.setOption(option);
    observer.observe(containerRef.current);

    return () => {
      observer.disconnect();
      chart.dispose();
    };
  }, [option]);

  return (
    <section className="rounded-md border border-brand-100 bg-white shadow-sm dark:border-brand-950 dark:bg-slate-950">
      <div className="border-b border-brand-100 px-4 py-3 dark:border-brand-950">
        <h3 className="text-sm font-semibold text-slate-950 dark:text-white">
          {title}
        </h3>
        {description ? (
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {description}
          </p>
        ) : null}
      </div>
      <div ref={containerRef} className="w-full" style={{ height }} />
    </section>
  );
}
