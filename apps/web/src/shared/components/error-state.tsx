import { AlertCircle } from "lucide-react";
import { SecondaryButton } from "@/src/shared/components/action-button";
import { getErrorPresentation } from "@/src/shared/services/api-client";

type ErrorStateProps = {
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  error?: unknown;
};

export function ErrorState({
  title,
  description,
  actionLabel = "Try again",
  onAction,
  error,
}: ErrorStateProps) {
  const presentation = getErrorPresentation(error);
  const resolvedTitle = title ?? presentation.title;
  const resolvedDescription = description ?? presentation.description;

  return (
    <div className="rounded-md border border-rose-200 bg-rose-50 px-6 py-10 text-center dark:border-rose-900/60 dark:bg-rose-950/30">
      <AlertCircle className="mx-auto size-7 text-rose-500" aria-hidden />
      <h2 className="mt-3 text-base font-semibold text-rose-950 dark:text-rose-100">
        {resolvedTitle}
      </h2>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-rose-700 dark:text-rose-300">
        {resolvedDescription}
      </p>
      {presentation.code ? (
        <p className="mt-2 text-xs font-medium text-rose-600/80 dark:text-rose-400/80">
          Error code: {presentation.code}
        </p>
      ) : null}
      {onAction ? (
        <div className="mt-5">
          <SecondaryButton onClick={onAction}>{actionLabel}</SecondaryButton>
        </div>
      ) : null}
    </div>
  );
}
