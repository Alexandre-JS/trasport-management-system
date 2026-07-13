"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Lock, Mail } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { PrimaryButton } from "@/src/shared/components/action-button";
import { useAuth } from "@/src/shared/hooks/use-auth";
import { extractErrorMessage } from "@/src/shared/services/api-client";
import { useToast } from "@/providers/toast-provider";

const loginSchema = z.object({
  email: z.string().min(1, "Email obrigatório").email("Email inválido"),
  password: z.string().min(8, "A password deve ter pelo menos 8 caracteres"),
  rememberMe: z.boolean(),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const { toast } = useToast();
  const next = searchParams.get("next") || "/";
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: true,
    },
  });

  async function onSubmit(values: LoginFormValues) {
    try {
      const user = await login(values);
      toast({ title: "Sessão iniciada", type: "success" });
      // Clients always land on their portal (never on admin routes, even if a
      // `next` pointed there); staff go to the requested/admin destination.
      const destination = user.role === "CLIENT" ? "/portal" : next;
      router.replace(destination);
    } catch (error) {
      const message = extractErrorMessage(error, "Credenciais inválidas.");

      setError("root", { message });
      toast({
        title: "Falha na autenticação",
        description: message,
        type: "error",
      });
    }
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="w-full rounded-md border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900"
    >
      <div className="mb-6">
        {/* <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1.5 text-xs font-medium text-brand-700 ring-1 ring-brand-100 dark:bg-brand-950/50 dark:text-brand-200 dark:ring-brand-900">
          <ShieldCheck className="size-4" aria-hidden />
          Acesso seguro
        </div> */}
        <h1 className="text-xl font-semibold text-slate-950 dark:text-white">
          Iniciar sessão
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
          Entre com as credenciais atribuídas pela administração.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
            Email
          </span>
          <span className="flex h-10 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 focus-within:border-brand-500 dark:border-slate-700 dark:bg-slate-950">
            <Mail className="size-4 text-slate-400" aria-hidden />
            <input
              type="email"
              autoComplete="email"
              // Password managers rewrite autocomplete/attributes before React
              // hydrates, causing a benign SSR/client mismatch — suppress it.
              suppressHydrationWarning
              className="w-full bg-transparent text-sm text-slate-950 outline-none placeholder:text-slate-400 dark:text-white"
              placeholder="nome@empresa.com"
              {...register("email")}
            />
          </span>
          {errors.email ? (
            <span className="text-xs text-rose-600 dark:text-rose-400">
              {errors.email.message}
            </span>
          ) : null}
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
            Password
          </span>
          <span className="flex h-10 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 focus-within:border-brand-500 dark:border-slate-700 dark:bg-slate-950">
            <Lock className="size-4 text-slate-400" aria-hidden />
            <input
              type="password"
              autoComplete="current-password"
              // Password managers rewrite autocomplete/attributes before React
              // hydrates, causing a benign SSR/client mismatch — suppress it.
              suppressHydrationWarning
              className="w-full bg-transparent text-sm text-slate-950 outline-none placeholder:text-slate-400 dark:text-white"
              placeholder="••••••••"
              {...register("password")}
            />
          </span>
          {errors.password ? (
            <span className="text-xs text-rose-600 dark:text-rose-400">
              {errors.password.message}
            </span>
          ) : null}
        </label>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
          <input
            type="checkbox"
            className="size-4 rounded border-slate-300 accent-brand-600 dark:border-slate-700"
            {...register("rememberMe")}
          />
          Remember me
        </label>
        <Link
          href="/login"
          className="text-sm font-medium text-brand-700 hover:text-brand-800 dark:text-brand-300 dark:hover:text-brand-200"
        >
          Esqueci a password
        </Link>
      </div>

      {errors.root ? (
        <p className="mt-4 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">
          {errors.root.message}
        </p>
      ) : null}

      <PrimaryButton type="submit" loading={isSubmitting} className="mt-6 w-full">
        Entrar
      </PrimaryButton>
    </form>
  );
}
