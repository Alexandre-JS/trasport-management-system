import type { ReactNode } from "react";

type ContentAreaProps = {
  children: ReactNode;
};

export function ContentArea({ children }: ContentAreaProps) {
  return <main className="flex min-h-0 flex-1 flex-col overflow-y-auto">{children}</main>;
}
