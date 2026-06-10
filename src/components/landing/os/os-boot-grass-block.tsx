"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

const GRASS_BLOCK_SRC = "/assets/mc/grass-block-3d.png";

interface OsBootGrassBlockProps {
  className?: string;
  size?: number;
}

export function OsBootGrassBlock({ className, size = 128 }: OsBootGrassBlockProps) {
  return (
    <Image
      src={GRASS_BLOCK_SRC}
      alt="Grass block"
      width={size}
      height={size}
      priority
      className={cn(
        "mc-pixel-image object-contain",
        className,
      )}
    />
  );
}
