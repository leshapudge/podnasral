import type { Metadata } from "next";
import { Inter, Silkscreen } from "next/font/google";
import { AuthSessionProvider } from "@/components/providers/session-provider";
import { AudioProvider } from "@/components/audio/audio-provider";
import { AudioEffects } from "@/components/audio/audio-effects";
import { SecretProvider } from "@/components/secrets/secret-context";
import { SecretEffects } from "@/components/secrets/secret-effects";
import "./globals.css";
import { CRITICAL_OS_CSS } from "./critical-os.css";

const inter = Inter({
  subsets: ["latin", "cyrillic"],
  variable: "--font-inter",
});

const silkscreen = Silkscreen({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-silkscreen",
});

export const metadata: Metadata = {
  title: "MINESEASON — Стримерский игровой ивент",
  description:
    "Minecraft-стиль ивент для стримеров. Играй, крафти, побеждай боссов и поднимайся в рейтинге.",
  icons: {
    icon: "/assets/mc/grass-block-3d.png",
    apple: "/assets/mc/grass-block-3d.png",
  },
  openGraph: {
    title: "MINESEASON",
    description: "Стримерский игровой ивент в стиле Minecraft",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className="dark">
      <head>
        <style dangerouslySetInnerHTML={{ __html: CRITICAL_OS_CSS }} />
      </head>
      <body
        className={`${inter.variable} ${silkscreen.variable} font-sans min-h-screen bg-[#0a1628] text-[#e8d5b0]`}
      >
        <AuthSessionProvider>
          <AudioProvider>
            <SecretProvider>
              {children}
              <AudioEffects />
              <SecretEffects />
            </SecretProvider>
          </AudioProvider>
        </AuthSessionProvider>
      </body>
    </html>
  );
}
