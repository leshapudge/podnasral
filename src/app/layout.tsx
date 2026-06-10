import type { Metadata } from "next";
import { AuthSessionProvider } from "@/components/providers/session-provider";
import { AudioProvider } from "@/components/audio/audio-provider";
import { AudioEffects } from "@/components/audio/audio-effects";
import { SecretProvider } from "@/components/secrets/secret-context";
import { SecretEffects } from "@/components/secrets/secret-effects";
import {
  EVENT_BRAND,
  EVENT_META_TITLE,
  EVENT_TAGLINE,
} from "@/lib/event/event-brand";
import "./globals.css";
import { CRITICAL_OS_CSS } from "./critical-os.css";

export const metadata: Metadata = {
  title: EVENT_META_TITLE,
  description: EVENT_TAGLINE,
  icons: {
    icon: "/assets/mc/grass-block-3d.png",
    apple: "/assets/mc/grass-block-3d.png",
  },
  openGraph: {
    title: EVENT_BRAND,
    description: EVENT_TAGLINE,
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className="dark">
      <head>
        <link
          rel="preload"
          href="/fonts/Monocraft.ttf"
          as="font"
          type="font/ttf"
          crossOrigin="anonymous"
        />
        <style dangerouslySetInnerHTML={{ __html: CRITICAL_OS_CSS }} />
      </head>
      <body className="font-sans min-h-screen bg-[#0a1628] text-[#e8d5b0]">
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
