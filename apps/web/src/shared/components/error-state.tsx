import { AlertCircle } from "lucide-react";
import { SecondaryButton } from "@/src/shared/components/action-button";

type ErrorStateProps = {
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function ErrorState({
  title = "Não foi possível carregar esta área",
  description = "Tente novamente ou contacte o administrador do sistema.",
  actionLabel = "Tentar novamente",
  onAction,
}: ErrorStateProps) {
  return (
    <div className="rounded-md border border-rose-200 bg-rose-50 px-6 py-10 text-center dark:border-rose-900/60 dark:bg-rose-950/30">
      <AlertCircle className="mx-auto size-7 text-rose-500" aria-hidden />
      <h2 className="mt-3 text-base font-semibold text-rose-950 dark:text-rose-100">
        {title}
      </h2>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-rose-700 dark:text-rose-300">
        {description}
      </p>
      {onAction ? (
        <div className="mt-5">
          <SecondaryButton onClick={onAction}>{actionLabel}</SecondaryButton>
        </div>
      ) : null}
    </div>
  );
}
