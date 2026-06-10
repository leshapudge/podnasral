"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import {
  getItemIconFallbackChain,
  getItemTexture,
  ITEM_ICON_UNKNOWN,
} from "@/lib/inventory/item-assets";
import { cn } from "@/lib/utils";

interface McTextureProps {
  slug?: string;
  src?: string;
  alt: string;
  size?: number;
  className?: string;
  pixelated?: boolean;
}

/** Пиксельная текстура предмета/блока без рамки слота */
export function McTexture({
  slug,
  src,
  alt,
  size = 32,
  className,
  pixelated = true,
}: McTextureProps) {
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
    <Image
      src={imgSrc}
      alt={alt}
      width={size}
      height={size}
      className={cn(
        "object-contain drop-shadow-[2px_2px_0_rgba(0,0,0,0.8)]",
        pixelated && "mc-pixel-image",
        className,
      )}
      unoptimized
      onError={() => {
        const nextIdx = fallbackIndex.current + 1;
        const next = fallbackChain[nextIdx];
        if (next && next !== imgSrc) {
          fallbackIndex.current = nextIdx;
          setImgSrc(next);
        }
      }}
    />
  );
}
