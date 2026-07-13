import Image from "next/image";
import { Suspense } from "react";
import { LoginForm } from "@/src/shared/components/login-form";
import {
  companyIdentity,
  systemIdentity,
} from "@/src/shared/navigation/navigation";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Entrar",
};

export default function LoginPage() {
  return (
    <div className="relative grid min-h-screen place-items-center px-4 py-10">
      <Image
        src="/login-bg.jpg"
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover"
      />
      <div className="absolute inset-0 bg-slate-950/70" />

      <div className="relative w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <Image
            src={companyIdentity.logoSrc}
            alt={`${companyIdentity.shortName} ${companyIdentity.name}`}
            width={876}
            height={284}
            priority
            className="h-auto w-56 rounded-md bg-white p-2 shadow-lg"
          />
        </div>
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>

      <div className="absolute inset-x-4 bottom-4 flex flex-col gap-1 text-center text-xs text-white/65 sm:flex-row sm:items-center sm:justify-between">
        <span>
          {systemIdentity.name} v{systemIdentity.version}
        </span>
        <span>{systemIdentity.fullName}</span>
      </div>
    </div>
  );
}
