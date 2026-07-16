import { Suspense } from "react";
import { LoginCarousel } from "@/src/shared/components/login-carousel";
import { LoginForm } from "@/src/shared/components/login-form";
import { systemIdentity } from "@/src/shared/navigation/navigation";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Entrar",
};

export default function LoginPage() {
  return (
    <main className="grid min-h-screen bg-slate-950 lg:grid-cols-[minmax(0,1.35fr)_minmax(26rem,0.65fr)]">
      <LoginCarousel />

      <section className="relative flex min-h-screen flex-col bg-slate-50 px-5 py-6 dark:bg-slate-950 sm:px-10 lg:px-12">
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-8">
          <Suspense>
            <LoginForm />
          </Suspense>
        </div>

        <footer className="mx-auto flex w-full max-w-md flex-wrap items-center justify-between gap-2 border-t border-slate-200 pt-4 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
          <span>{systemIdentity.name} v{systemIdentity.version}</span>
          <span>{systemIdentity.fullName}</span>
        </footer>
      </section>
    </main>
  );
}
