"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

interface McTextureProps {
  src: string;
  alt: string;
  size?: number;
  className?: string;
  pixelated?: boolean;
}

/** Пиксельная текстура предмета/блока без рамки слота */
export function McTexture({
  src,
  alt,
  size = 32,
  className,
  pixelated = true,
}: McTextureProps) {
  return (
    <Image
      src={src}
      alt={alt}
      width={size}
      height={size}
      className={cn(
        "object-contain drop-shadow-[2px_2px_0_rgba(0,0,0,0.8)]",
        pixelated && "mc-pixel-image",
        className,
      )}
      unoptimized
    />
  );
}
