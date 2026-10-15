"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Me = { name: string; avatar: string; role: string };

/** Muestra quién juega y permite cambiar de alumno (equipos compartidos del aula). */
export function UserBar() {
  const router = useRouter();
  const [me, setMe] = useState<Me | null | undefined>(undefined);

  useEffect(() => {
    (async () => {
      try {
        const supabase = createClient();
        const { data: auth } = await supabase.auth.getUser();
        if (!auth.user) return setMe(null);
        const { data } = await supabase
          .from("profiles")
          .select("display_name, avatar, role")
          .eq("id", auth.user.id)
          .maybeSingle();
        setMe(
          data
            ? { name: data.display_name, avatar: (data.avatar as { emoji?: string } | null)?.emoji ?? "🙂", role: data.role }
            : null,
        );
      } catch {
        setMe(null);
      }
    })();
  }, []);

  async function leave() {
    await createClient().auth.signOut();
    router.push("/clase");
    router.refresh();
  }

  if (me === undefined) return null;
  if (me === null) {
    return (
      <Link href="/clase" className="text-sm font-semibold text-brand">
        Entrar con mi clase
      </Link>
    );
  }
  const staff = me.role === "teacher" || me.role === "admin";
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="flex items-center gap-2 font-semibold">
        <span className="text-2xl" aria-hidden>
          {me.avatar}
        </span>
        {me.name}
      </span>
      {staff && (
        <Link href="/docente" className="font-medium text-brand">
          Panel
        </Link>
      )}
      <button type="button" onClick={leave} className="font-medium text-muted hover:text-fg">
        {staff ? "Salir" : "Cambiar de alumno"}
      </button>
    </div>
  );
}
