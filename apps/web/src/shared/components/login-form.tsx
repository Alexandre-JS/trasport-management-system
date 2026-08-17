"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { z } from "zod";
import { PrimaryButton } from "@/src/shared/components/action-button";
import { useAuth } from "@/src/shared/hooks/use-auth";
import { extractErrorMessage } from "@/src/shared/services/api-client";
import { useToast } from "@/providers/toast-provider";

const loginSchema = z.object({
  identifier: z.string().min(1, "Enter your email or phone number"),
  password: z.string().min(8, "Password must contain at least 8 characters"),
  rememberMe: z.boolean(),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
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
      identifier: "",
      password: "",
      rememberMe: true,
    },
  });

  async function onSubmit(values: LoginFormValues) {
    try {
      const user = await login(values);
      toast({ title: "Signed in successfully", type: "success" });
      // Clients always land on their portal (never on admin routes, even if a
      // `next` pointed there); staff go to the requested/admin destination.
      const destination = user.role === "CLIENT" ? "/portal" : next;
      router.replace(destination);
    } catch (error) {
      const message = extractErrorMessage(error, "Invalid credentials.");

      setError("root", { message });
      toast({
        title: "Authentication failed",
        description: message,
        type: "error",
      });
    }
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="w-full rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-7"
    >
      <div className="mb-6">
        {/* <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1.5 text-xs font-medium text-brand-700 ring-1 ring-brand-100 dark:bg-brand-950/50 dark:text-brand-200 dark:ring-brand-900">
          <ShieldCheck className="size-4" aria-hidden />
          Acesso seguro
        </div> */}
        <h1 className="text-xl font-semibold text-slate-950 dark:text-white">
          Sign in
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
          Use the credentials provided by the administration team.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
            Email or phone
          </span>
          <span className="flex h-10 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 focus-within:border-brand-500 dark:border-slate-700 dark:bg-slate-950">
            <Mail className="size-4 text-slate-400" aria-hidden />
            <input
              type="text"
              autoComplete="username"
              // Password managers rewrite autocomplete/attributes before React
              // hydrates, causing a benign SSR/client mismatch — suppress it.
              suppressHydrationWarning
              className="w-full bg-transparent text-sm text-slate-950 outline-none placeholder:text-slate-400 dark:text-white"
              placeholder="Email or phone number"
              {...register("identifier")}
            />
          </span>
          {errors.identifier ? (
            <span className="text-xs text-rose-600 dark:text-rose-400">
              {errors.identifier.message}
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
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              // Password managers rewrite autocomplete/attributes before React
              // hydrates, causing a benign SSR/client mismatch — suppress it.
              suppressHydrationWarning
              className="w-full bg-transparent text-sm text-slate-950 outline-none placeholder:text-slate-400 dark:text-white"
              placeholder="••••••••"
              {...register("password")}
            />
            <button
              type="button"
              onClick={() => setShowPassword((visible) => !visible)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              aria-pressed={showPassword}
              className="grid size-7 shrink-0 place-items-center rounded text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
            >
              {showPassword ? (
                <EyeOff className="size-4" aria-hidden />
              ) : (
                <Eye className="size-4" aria-hidden />
              )}
            </button>
          </span>
          {errors.password ? (
            <span className="text-xs text-rose-600 dark:text-rose-400">
              {errors.password.message}
            </span>
          ) : null}
        </label>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
          <input
            type="checkbox"
            className="size-4 rounded border-slate-300 accent-brand-600 dark:border-slate-700"
            {...register("rememberMe")}
          />
          Keep me signed in
        </label>
        <span className="text-xs text-slate-500 dark:text-slate-400">
          Forgot your password? Contact an administrator.
        </span>
      </div>

      {errors.root ? (
        <p className="mt-4 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">
          {errors.root.message}
        </p>
      ) : null}

      <PrimaryButton type="submit" loading={isSubmitting} className="mt-6 w-full">
        Sign in
      </PrimaryButton>
    </form>
  );
}
