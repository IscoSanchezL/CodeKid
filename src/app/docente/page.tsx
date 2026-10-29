import type { Metadata } from "next";
import { Logo } from "@/components/brand/logo";
import { TeacherDashboard } from "@/components/teacher/dashboard";
import { T } from "@/i18n/t";

export const metadata: Metadata = { title: "Panel docente" };

export default function DocentePage() {
  return (
    <>
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Logo href="/docente" />
      </header>
      <main className="mx-auto max-w-6xl px-4 pb-16">
        <h1 className="mb-6 text-3xl font-extrabold"><T k="title.teacher" /></h1>
        <TeacherDashboard />
      </main>
    </>
  );
}
