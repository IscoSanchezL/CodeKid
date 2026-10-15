import { createClient } from "@/lib/supabase/client";

export type Student = { id: string; name: string; avatar: Record<string, string>; hasPin: boolean; coins?: number };
export type CreatedStudent = { id: string; name: string; pin?: string };

/** Qué dato falta o es incorrecto en el acceso de un alumno. */
export type Needs = "password" | "pin";

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public needs?: Needs,
  ) {
    super(message);
  }
}

/** Llama a la Edge Function `class-access` con la sesión actual (si la hay). */
export async function callClassAccess<T>(body: Record<string, unknown>): Promise<T> {
  const supabase = createClient();
  const { data } = await supabase.auth.getSession();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

  let res: Response;
  try {
    res = await fetch(`${url}/functions/v1/class-access`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: key,
        Authorization: `Bearer ${data.session?.access_token ?? key}`,
      },
      body: JSON.stringify(body),
    });
  } catch {
    throw new ApiError("No hay conexión. Revisa tu internet e inténtalo de nuevo.", 0);
  }

  const payload = (await res.json().catch(() => ({}))) as { error?: string; needs?: Needs };
  if (!res.ok) throw new ApiError(payload.error ?? "Algo salió mal", res.status, payload.needs);
  return payload as T;
}
