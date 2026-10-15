"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { credentialsSchema, registerSchema } from "@/lib/validation";
import { createClient } from "@/lib/supabase/client";

type Mode = "login" | "registro";

export function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const isLogin = mode === "login";

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const raw = Object.fromEntries(new FormData(e.currentTarget));
    const login = isLogin ? credentialsSchema.safeParse(raw) : null;
    const register = isLogin ? null : registerSchema.safeParse(raw);
    const failed = login?.success === false ? login : register?.success === false ? register : null;
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
            options: { data: { display_name: register.data.name, role: register.data.role } },
          })
        : await supabase.auth.signInWithPassword({
            email: login?.data?.email ?? "",
            password: login?.data?.password ?? "",
          });
      if (authError) throw authError;
      const { data: auth } = await supabase.auth.getUser();
      const { data: profile } = auth.user
        ? await supabase.from("profiles").select("role").eq("id", auth.user.id).maybeSingle()
        : { data: null };
      const staff = profile?.role === "teacher" || profile?.role === "admin";
      router.push(staff ? "/docente" : "/mapa");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo completar la operación");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <h1 className="text-2xl font-extrabold">{isLogin ? "Bienvenido de nuevo" : "Crea tu cuenta"}</h1>
      <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-4" noValidate>
        {!isLogin && <Input label="Nombre" name="name" autoComplete="nickname" required />}
        <Input label="Correo" name="email" type="email" autoComplete="email" required />
        <Input
          label="Contraseña"
          name="password"
          type="password"
          autoComplete={isLogin ? "current-password" : "new-password"}
          minLength={8}
          required
        />
        {!isLogin && (
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            Soy
            <select
              name="role"
              defaultValue="student"
              className="h-11 rounded-xl border border-border bg-surface px-3 text-base"
            >
              <option value="student">Estudiante</option>
              <option value="teacher">Docente</option>
              <option value="guardian">Madre, padre o tutor</option>
            </select>
          </label>
        )}
        {error && (
          <p role="alert" className="text-sm font-medium text-danger">
            {error}
          </p>
        )}
        <Button type="submit" disabled={loading}>
          {loading ? "Un momento…" : isLogin ? "Entrar" : "Crear cuenta"}
        </Button>
      </form>
      <p className="mt-5 text-center text-sm text-muted">
        {isLogin ? "¿No tienes cuenta? " : "¿Ya tienes cuenta? "}
        <Link className="font-semibold text-brand" href={isLogin ? "/registro" : "/login"}>
          {isLogin ? "Regístrate" : "Entra"}
        </Link>
      </p>
    </Card>
  );
}
