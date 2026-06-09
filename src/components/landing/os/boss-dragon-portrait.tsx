"use client";

import Image from "next/image";
import { useMemo } from "react";
import { motion } from "framer-motion";
import { getBossPortrait, isDragonBoss } from "@/lib/bosses/boss-assets";
import { cn } from "@/lib/utils";

interface BossDragonPortraitProps {
  slug: string;
  name: string;
  className?: string;
}

export function BossDragonPortrait({ slug, name, className }: BossDragonPortraitProps) {
  const src = getBossPortrait(slug);
  const particles = useMemo(
    () =>
      Array.from({ length: 40 }, (_, i) => ({
        id: i,
        left: `${20 + Math.random() * 60}%`,
        top: `${25 + Math.random() * 45}%`,
        delay: `${Math.random() * 3}s`,
        duration: `${1.4 + Math.random() * 2}s`,
        driftX: `${(Math.random() - 0.5) * 40}px`,
        driftY: `${-16 - Math.random() * 48}px`,
        size: 3 + Math.floor(Math.random() * 3),
      })),
    [],
  );

  const dragon = isDragonBoss(slug);

  return (
    <div className={cn("boss-dragon-portrait", className)}>
      {dragon && (
        <>
          <div className="boss-dragon-glow" aria-hidden />
          <div className="boss-dragon-particles" aria-hidden>
            {particles.map((p) => (
              <span
                key={p.id}
                className="boss-dragon-particle"
                style={
                  {
                    left: p.left,
                    top: p.top,
                    width: p.size,
                    height: p.size,
                    "--delay": p.delay,
                    "--dur": p.duration,
                    "--drift-x": p.driftX,
                    "--drift-y": p.driftY,
                  } as React.CSSProperties
                }
              />
            ))}
          </div>
        </>
      )}

      <motion.div
        className="boss-dragon-image-wrap"
        animate={{ y: [0, -16, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      >
        <Image
          src={src}
          alt={name}
          width={320}
          height={200}
          priority
          unoptimized
          className="boss-dragon-image mc-pixel-image object-contain"
        />
      </motion.div>
    </div>
  );
}
