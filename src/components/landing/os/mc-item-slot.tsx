"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  getItemIconFallbackChain,
  getItemTexture,
  ITEM_ICON_UNKNOWN,
} from "@/lib/inventory/item-assets";
import { cn } from "@/lib/utils";

interface McItemSlotProps {
  slug?: string;
  src?: string;
  alt: string;
  size?: "sm" | "md" | "lg" | "xl";
  active?: boolean;
  enchanted?: boolean;
  className?: string;
}

const sizes = {
  sm: { box: "h-10 w-10", img: 24 },
  md: { box: "h-[52px] w-[52px]", img: 36 },
  lg: { box: "h-[72px] w-[72px]", img: 48 },
  xl: { box: "h-[88px] w-[88px]", img: 64 },
};

export function McItemSlot({
  slug,
  src,
  alt,
  size = "md",
  active = true,
  enchanted = false,
  className,
}: McItemSlotProps) {
  const s = sizes[size];
  const primary = slug ? getItemTexture(slug) : (src ?? ITEM_ICON_UNKNOWN);
  const fallbackChain = useMemo(
    () => (slug ? getItemIconFallbackChain(slug) : [primary, ITEM_ICON_UNKNOWN]),
    [slug, primary],
  );
  const [imgSrc, setImgSrc] = useState(primary);
  const fallbackIndex = useRef(0);

  useEffect(() => {
    fallbackIndex.current = 0;
    setImgSrc(primary);
  }, [primary]);

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
          const nextIdx = fallbackIndex.current + 1;
          const next = fallbackChain[nextIdx];
          if (next && next !== imgSrc) {
            fallbackIndex.current = nextIdx;
            setImgSrc(next);
          }
        }}
      />
    </div>
  );
}
