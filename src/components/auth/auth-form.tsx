"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { credentialsSchema, registerSchema } from "@/lib/validation";
import { createClient } from "@/lib/supabase/client";
import { TX, useT } from "@/i18n";

type Mode = "login" | "registro";

export function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const t = useT();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const isLogin = mode === "login";

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const raw = Object.fromEntries(new FormData(e.currentTarget));
    const login = isLogin ? credentialsSchema.safeParse(raw) : null;
    const register = isLogin ? null : registerSchema.safeParse(raw);
    const failed =
      login?.success === false
        ? login
        : register?.success === false
          ? register
          : null;
    if (failed && !failed.success) {
      setError(failed.error.issues[0]?.message ?? "Datos no válidos");
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const { error: authError } = register?.success
        ? await supabase.auth.signUp({
            email: register.data.email,
            password: register.data.password,
            options: {
              data: {
                display_name: register.data.name,
                role: register.data.role,
              },
            },
          })
        : await supabase.auth.signInWithPassword({
            email: login?.data?.email ?? "",
            password: login?.data?.password ?? "",
          });
      if (authError) throw authError;
      const { data: auth } = await supabase.auth.getUser();
      const { data: profile } = auth.user
        ? await supabase
            .from("profiles")
            .select("role")
            .eq("id", auth.user.id)
            .maybeSingle()
        : { data: null };
      const staff = profile?.role === "teacher" || profile?.role === "admin";
      router.push(staff ? "/docente" : "/mapa");
      router.refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      setError(
        /invalid login credentials/i.test(msg)
          ? "Correo o contraseña incorrectos. Revisa los datos o recupera tu contraseña."
          : /email not confirmed/i.test(msg)
            ? "Falta confirmar tu correo. Revisa tu bandeja de entrada."
            : msg || "No se pudo completar la operación",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <h1 className="text-2xl font-extrabold">
        {isLogin ? t("auth.welcome") : t("auth.create")}
      </h1>
      <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-4" noValidate>
        {!isLogin && (
          <Input label={t("auth.name")} name="name" autoComplete="nickname" required />
        )}
        <Input
          label={t("auth.email")}
          name="email"
          type="email"
          autoComplete="email"
          required
        />
        <Input
          label={t("auth.password")}
          name="password"
          type="password"
          autoComplete={isLogin ? "current-password" : "new-password"}
          minLength={8}
          required
        />
        {!isLogin && (
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            {t("auth.iAm")}
            <select
              name="role"
              defaultValue="student"
              className="field h-11 rounded-xl border border-border bg-surface px-3 text-base"
            >
              <option value="student">{t("auth.role.student")}</option>
              <option value="teacher">{t("auth.role.teacher")}</option>
              <option value="guardian">{t("auth.role.guardian")}</option>
            </select>
          </label>
        )}
        {isLogin && (
          <Link
            href="/recuperar"
            className="-mt-2 self-end text-sm font-semibold text-brand"
          >
            {t("auth.forgot")}
          </Link>
        )}
        {error && (
          <p role="alert" className="text-sm font-medium text-danger">
            <TX text={error} />
          </p>
        )}
        <Button type="submit" disabled={loading}>
          {loading ? t("auth.wait") : isLogin ? t("auth.enter") : t("auth.createBtn")}
        </Button>
      </form>
      <p className="mt-5 text-center text-sm text-muted">
        {isLogin ? t("auth.noAccount") : t("auth.haveAccount")}
        <Link
          className="font-semibold text-brand"
          href={isLogin ? "/registro" : "/login"}
        >
          {isLogin ? t("auth.signup") : t("auth.signin")}
        </Link>
      </p>
    </Card>
  );
}
