"use client";

import Image from "next/image";
import { signInWithProvider } from "@/features/auth/actions";
import type { OAuthProviderId } from "@/lib/auth/providers";
import { cn } from "@/lib/utils";

const providers: {
  id: OAuthProviderId;
  label: string;
}[] = [
  {
    id: "twitch",
    label: "Войти через Twitch",
  },
];

interface LoginButtonsProps {
  callbackUrl?: string;
  disabled?: boolean;
}

export function LoginButtons({ callbackUrl = "/?tab=kazik", disabled }: LoginButtonsProps) {
  return (
    <div className="flex w-full flex-col gap-3">
      {providers.map((provider) => (
        <button
          key={provider.id}
          type="button"
          disabled={disabled}
          onClick={() => signInWithProvider(provider.id, callbackUrl)}
          className={cn(
            "group flex w-full items-center justify-center gap-3 rounded-md border-2 px-5 py-3.5",
            "border-[#1a1208] bg-[#9146FF] font-display text-sm uppercase tracking-wider text-white",
            "shadow-[0_4px_0_#5c2d99,inset_0_1px_0_rgba(255,255,255,0.2)]",
            "transition-[transform,filter] hover:brightness-110 active:translate-y-0.5 active:shadow-[0_2px_0_#5c2d99]",
            disabled && "cursor-not-allowed opacity-50 grayscale",
          )}
        >
          <Image
            src="/assets/mc/social/twitch.svg"
            alt=""
            width={22}
            height={22}
            className="mc-pixel-image shrink-0 brightness-0 invert"
          />
          <span>{provider.label}</span>
        </button>
      ))}
    </div>
  );
}
