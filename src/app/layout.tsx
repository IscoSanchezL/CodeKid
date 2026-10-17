import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { SoundToggle } from "@/components/brand/sound-toggle";
import { LangSwitch } from "@/i18n/lang-switch";
import { PageEffects } from "@/i18n/page-effects";

const sans = localFont({ src: "./fonts/GeistVF.woff", variable: "--font-sans", weight: "100 900" });
const mono = localFont({ src: "./fonts/GeistMonoVF.woff", variable: "--font-mono", weight: "100 900" });

export const metadata: Metadata = {
  title: { default: "CodeKid — aprende a programar jugando", template: "%s · CodeKid" },
  description:
    "Plataforma de programación para 9 a 16 años: de bloques visuales a JavaScript y Python reales.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f9ff" },
    { media: "(prefers-color-scheme: dark)", color: "#050b2a" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning className={`${sans.variable} ${mono.variable}`}>
      <body className="min-h-dvh">
        {children}
        <SoundToggle />
        <LangSwitch />
        <PageEffects />
      </body>
    </html>
  );
}
