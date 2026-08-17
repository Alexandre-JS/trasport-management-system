"use client";

import { Button } from "@/components/ui/button";

type FormActionsProps = {
  onCancel: () => void;
  onReset: () => void;
  onSaveAndContinue?: () => void;
  loading?: boolean;
  showContinue?: boolean;
  submitLabel?: string;
};

export function FormActions({
  onCancel,
  onReset,
  onSaveAndContinue,
  loading = false,
  showContinue = true,
  submitLabel = "Save",
}: FormActionsProps) {
  return (
    <div className="flex flex-wrap items-center justify-end gap-2 border-t border-slate-200 pt-4 dark:border-slate-800">
      <Button type="button" variant="ghost" onClick={onReset} disabled={loading}>
        Clear
      </Button>
      <Button
        type="button"
        variant="outline"
        onClick={onCancel}
        disabled={loading}
      >
        Cancel
      </Button>
      {showContinue && onSaveAndContinue ? (
        <Button
          type="button"
          variant="secondary"
          onClick={onSaveAndContinue}
          loading={loading}
        >
          Save and Continue
        </Button>
      ) : null}
      <Button type="submit" loading={loading}>
        {submitLabel}
      </Button>
    </div>
  );
}
