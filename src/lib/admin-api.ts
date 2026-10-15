import { createClient } from "@/lib/supabase/client";

export type AdminUser = {
  id: string;
  email: string;
  name: string;
  role: "student" | "teacher" | "guardian" | "admin";
  createdAt: string;
  lastSignIn: string | null;
  banned: boolean;
  classes: number;
  students: number;
};
export type AdminClass = {
  id: string;
  name: string;
  code: string;
  password: string | null;
  createdAt: string;
  teacherId: string;
  teacher: string;
  teacherEmail: string;
  students: number;
};
export type Overview = {
  students: number;
  teachers: number;
  guardians: number;
  admins: number;
  classes: number;
  totalStars: number;
  completed: number;
  activeWeek: number;
  totalFails: number;
};
export type AuditEntry = {
  id: number;
  actor_name: string;
  action: string;
  target: string;
  detail: string;
  created_at: string;
};

export const ROLE_LABEL: Record<AdminUser["role"], string> = {
  student: "Estudiante",
  teacher: "Docente",
  guardian: "Tutor",
  admin: "Super admin",
};

/** Llama a la Edge Function `admin-api` (solo funciona con la sesión del super administrador). */
export async function callAdmin<T>(body: Record<string, unknown>): Promise<T> {
  const { data } = await createClient().auth.getSession();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;
  let res: Response;
  try {
    res = await fetch(`${url}/functions/v1/admin-api`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: key,
        Authorization: `Bearer ${data.session?.access_token ?? key}`,
      },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error(
      "No hay conexión. Revisa tu internet e inténtalo de nuevo.",
    );
  }
  const payload = (await res.json().catch(() => ({}))) as { error?: string };
  if (!res.ok) throw new Error(payload.error ?? "Algo salió mal");
  return payload as T;
}
