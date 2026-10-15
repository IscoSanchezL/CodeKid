import type { Metadata } from "next";
import { ClassLogin } from "@/components/class/class-login";

export const metadata: Metadata = { title: "Entrar con mi clase" };

export default function ClasePage() {
  return <ClassLogin />;
}
