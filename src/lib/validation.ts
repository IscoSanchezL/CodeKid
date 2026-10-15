import { z } from "zod";

export const ROLES = ["student", "teacher", "guardian"] as const;

export const credentialsSchema = z.object({
  email: z.string().trim().email("Escribe un correo válido"),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
});

export const registerSchema = credentialsSchema.extend({
  name: z.string().trim().min(2, "Escribe tu nombre").max(40, "Nombre demasiado largo"),
  role: z.enum(ROLES, { message: "Elige un rol" }),
});

export type RegisterInput = z.infer<typeof registerSchema>;
