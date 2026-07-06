import { Loader2 } from "lucide-react";
import { cn } from "@/utils/cn";

type SpinnerProps = {
  className?: string;
  label?: string;
};

export function Spinner({ className, label }: SpinnerProps) {
  return (
    <span className="inline-flex items-center gap-2">
      <Loader2 className={cn("size-4 animate-spin", className)} aria-hidden />
      {label ? <span className="text-sm">{label}</span> : null}
    </span>
  );
}
