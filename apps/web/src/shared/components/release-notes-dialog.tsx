"use client";

import { CheckCircle2, Sparkles } from "lucide-react";
import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { currentReleaseNote } from "@/src/shared/data/release-notes";
import { systemIdentity } from "@/src/shared/navigation/navigation";

export function ReleaseNotesDialog() {
  const [open, setOpen] = useState(false);
  const release = currentReleaseNote;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group inline-flex items-center gap-1.5 rounded-md px-1.5 py-1 text-left font-medium text-slate-600 transition-colors hover:bg-brand-50 hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:text-slate-300 dark:hover:bg-brand-950 dark:hover:text-brand-200"
        aria-label={`View what's new in ${systemIdentity.name} version ${systemIdentity.version}`}
      >
        <Sparkles
          className="size-3.5 text-brand-500 transition-transform group-hover:scale-110"
          aria-hidden
        />
        <span>
          {systemIdentity.name} v{systemIdentity.version}
        </span>
        <span className="rounded-full bg-brand-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand-700 dark:bg-brand-950 dark:text-brand-200">
          What&apos;s new
        </span>
      </button>

      <Modal
        open={open}
        size="lg"
        title={`What's new in v${systemIdentity.version}`}
        description={
          release
            ? `${release.title} · ${release.releasedAt}`
            : `Latest updates for ${systemIdentity.name}`
        }
        onClose={() => setOpen(false)}
      >
        {release ? (
          <div className="space-y-5">
            <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
              {release.summary}
            </p>
            <ul className="space-y-4">
              {release.highlights.map((highlight) => (
                <li key={highlight.title} className="flex gap-3">
                  <CheckCircle2
                    className="mt-0.5 size-4 shrink-0 text-brand-600 dark:text-brand-400"
                    aria-hidden
                  />
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {highlight.title}
                    </h3>
                    <p className="mt-1 text-sm leading-5 text-slate-600 dark:text-slate-400">
                      {highlight.description}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Release details will be available soon.
          </p>
        )}
      </Modal>
    </>
  );
}
