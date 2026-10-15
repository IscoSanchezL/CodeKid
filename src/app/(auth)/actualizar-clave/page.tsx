import type { Metadata } from "next";
import { RecoverForm } from "@/components/auth/recover-form";

export const metadata: Metadata = { title: "Nueva contraseña" };

export default function ActualizarClavePage() {
  return <RecoverForm mode="update" />;
}
