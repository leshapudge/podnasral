"use client";

import { signInWithProvider } from "@/features/auth/actions";
import type { OAuthProviderId } from "@/lib/auth/providers";

const providers: {
  id: OAuthProviderId;
  label: string;
  color: string;
  icon: string;
}[] = [
  {
    id: "twitch",
    label: "Войти через Twitch",
    color: "#9146FF",
    icon: "🟣",
  },
];

interface LoginButtonsProps {
  callbackUrl?: string;
}

export function LoginButtons({ callbackUrl = "/dashboard" }: LoginButtonsProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px", width: "100%" }}>
      {providers.map((provider) => (
        <button
          key={provider.id}
          type="button"
          onClick={() => signInWithProvider(provider.id, callbackUrl)}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "10px",
            width: "100%",
            padding: "14px 20px",
            border: "none",
            borderRadius: "4px",
            backgroundColor: provider.color,
            color: "#fff",
            fontSize: "16px",
            fontWeight: 600,
            cursor: "pointer",
            boxShadow: "0 4px 0 rgba(0,0,0,0.3)",
          }}
        >
          <span>{provider.icon}</span>
          <span>{provider.label}</span>
        </button>
      ))}
    </div>
  );
}
