"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";

/** Recuperar la contraseña de un docente: pedir el enlace por correo y elegir una nueva. */
export function RecoverForm({ mode }: { mode: "request" | "update" }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(mode === "request");
  const [account, setAccount] = useState<string | null>(null);

  // Al llegar desde el enlace del correo, Supabase abre una sesión de recuperación
  useEffect(() => {
    if (mode !== "update") return;
    const supabase = createClient();
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN")
        setReady(true);
    });
    void supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        setReady(true);
        setAccount(data.session.user.email ?? null);
      }
    });
    const t = window.setTimeout(() => setReady((r) => r), 4000);
    return () => {
      sub.subscription.unsubscribe();
      window.clearTimeout(t);
    };
  }, [mode]);

  async function onRequest(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const email = String(
      new FormData(e.currentTarget).get("email") ?? "",
    ).trim();
    if (!/^\S+@\S+\.\S+$/.test(email))
      return setError("Escribe un correo válido");
    setLoading(true);
    const { error: err } = await createClient().auth.resetPasswordForEmail(
      email,
      {
        redirectTo: `${window.location.origin}/actualizar-clave`,
      },
    );
    setLoading(false);
    if (err && err.status === 429)
      return setError(
        "Ya pediste varios enlaces. Espera unos minutos e inténtalo de nuevo.",
      );
    setSent(true); // misma respuesta exista o no el correo
  }

  async function onUpdate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const data = new FormData(e.currentTarget);
    const pass = String(data.get("password") ?? "");
    if (pass.length < 8)
      return setError("La contraseña debe tener al menos 8 caracteres");
    if (pass !== String(data.get("again") ?? ""))
      return setError("Las contraseñas no coinciden");
    setLoading(true);
    const supabase = createClient();
    const { error: err } = await supabase.auth.updateUser({ password: pass });
    if (err) {
      setLoading(false);
      return setError(
        "El enlace venció. Pide uno nuevo desde «¿Olvidaste tu contraseña?».",
      );
    }
    const { data: auth } = await supabase.auth.getUser();
    const { data: profile } = auth.user
      ? await supabase
          .from("profiles")
          .select("role")
          .eq("id", auth.user.id)
          .maybeSingle()
      : { data: null };
    router.push(
      profile?.role === "teacher" || profile?.role === "admin"
        ? "/docente"
        : "/mapa",
    );
    router.refresh();
  }

  if (mode === "request") {
    return (
      <Card>
        <h1 className="text-2xl font-extrabold">Recupera tu contraseña</h1>
        <p className="mt-1 text-muted">
          Te enviamos un enlace al correo de tu cuenta de docente.
        </p>
        {sent ? (
          <p
            role="status"
            className="mt-6 rounded-xl bg-success/10 p-3 text-sm font-medium text-success"
          >
            Si ese correo tiene cuenta, te llegará un enlace en unos minutos.
            Revisa también la carpeta de spam.
          </p>
        ) : (
          <form
            onSubmit={onRequest}
            className="mt-6 flex flex-col gap-4"
            noValidate
          >
            <Input
              label="Correo"
              name="email"
              type="email"
              autoComplete="email"
              required
            />
            {error && (
              <p role="alert" className="text-sm font-medium text-danger">
                {error}
              </p>
            )}
            <Button type="submit" disabled={loading}>
              {loading ? "Enviando…" : "Enviar enlace"}
            </Button>
          </form>
        )}
        <p className="mt-5 text-center text-sm text-muted">
          <Link className="font-semibold text-brand" href="/login">
            ← Volver a entrar
          </Link>
        </p>
      </Card>
    );
  }

  return (
    <Card>
      <h1 className="text-2xl font-extrabold">Elige una contraseña nueva</h1>
      {!ready ? (
        <p className="mt-4 text-muted">Comprobando el enlace…</p>
      ) : (
        <form
          onSubmit={onUpdate}
          className="mt-6 flex flex-col gap-4"
          noValidate
        >
          <Input
            label="Contraseña nueva"
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
          />
          <Input
            label="Repite la contraseña"
            name="again"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
          />
          {error && (
            <p role="alert" className="text-sm font-medium text-danger">
              {error}
            </p>
          )}
          <Button type="submit" disabled={loading}>
            {loading ? "Guardando…" : "Guardar y entrar"}
          </Button>
        </form>
      )}
      <p className="mt-5 text-center text-sm text-muted">
        <Link className="font-semibold text-brand" href="/recuperar">
          Pedir otro enlace
        </Link>
      </p>
    </Card>
  );
}
