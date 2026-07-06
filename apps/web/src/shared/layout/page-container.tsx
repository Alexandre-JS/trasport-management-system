import type { ReactNode } from "react";

type PageContainerProps = {
  children: ReactNode;
};

export function PageContainer({ children }: PageContainerProps) {
  return (
    <div className="mx-auto flex w-full max-w-[1800px] flex-1 flex-col gap-5 px-3 py-4 sm:px-4 lg:px-5 xl:px-6">
      {children}
    </div>
  );
}
