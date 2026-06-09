"use client";

import { useEffect, useState } from "react";
import { MC_ASSETS } from "@/lib/landing/assets";
import { cn } from "@/lib/utils";

interface McItemSlotProps {
  src: string;
  alt: string;
  size?: "sm" | "md" | "lg";
  active?: boolean;
  enchanted?: boolean;
  className?: string;
}

const sizes = {
  sm: { box: "h-10 w-10", img: 24 },
  md: { box: "h-[52px] w-[52px]", img: 36 },
  lg: { box: "h-[72px] w-[72px]", img: 48 },
};

const FALLBACK = MC_ASSETS.items.enderPearl;

export function McItemSlot({
  src,
  alt,
  size = "md",
  active = true,
  enchanted = false,
  className,
}: McItemSlotProps) {
  const s = sizes[size];
  const [imgSrc, setImgSrc] = useState(src);

  useEffect(() => {
    setImgSrc(src);
  }, [src]);

  return (
    <div
      className={cn(
        "mc-slot relative flex shrink-0 items-center justify-center",
        s.box,
        active && "mc-slot-active",
        !active && "opacity-45 grayscale",
        enchanted && active && "mc-enchanted",
        className,
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imgSrc}
        alt={alt}
        width={s.img}
        height={s.img}
        className="mc-pixel-image object-contain drop-shadow-[2px_2px_0_rgba(0,0,0,0.8)]"
        onError={() => {
          if (imgSrc !== FALLBACK) setImgSrc(FALLBACK);
        }}
      />
    </div>
  );
}
