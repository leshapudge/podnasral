"use client";

import { useEffect, useRef, useState } from "react";
import { McTexture } from "@/components/landing/os/mc-texture";
import { MC_ASSETS } from "@/lib/landing/assets";
import { useSecrets } from "./secret-context";

const AFK_THRESHOLD_MS = 5 * 60 * 1000;
const BLOCK_SIZE = 48;

export function AfkDirtBlock() {
  const { recordCornerHit } = useSecrets();
  const [visible, setVisible] = useState(false);
  const [pos, setPos] = useState({ x: 100, y: 100 });
  const vel = useRef({ dx: 2, dy: 1.5 });
  const lastMove = useRef(Date.now());
  const raf = useRef<number>(0);

  useEffect(() => {
    const onMove = () => {
      lastMove.current = Date.now();
      setVisible(false);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("keydown", onMove);

    const check = setInterval(() => {
      if (Date.now() - lastMove.current >= AFK_THRESHOLD_MS) {
        setVisible(true);
      }
    }, 5000);

    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("keydown", onMove);
      clearInterval(check);
    };
  }, []);

  useEffect(() => {
    if (!visible) {
      cancelAnimationFrame(raf.current);
      return;
    }

    const animate = () => {
      setPos((p) => {
        const maxX = window.innerWidth - BLOCK_SIZE;
        const maxY = window.innerHeight - BLOCK_SIZE;
        let { x, y } = p;
        let { dx, dy } = vel.current;

        x += dx;
        y += dy;

        if (x <= 0 || x >= maxX) {
          dx = -dx;
          x = Math.max(0, Math.min(maxX, x));
        }
        if (y <= 0 || y >= maxY) {
          dy = -dy;
          y = Math.max(0, Math.min(maxY, y));
        }

        const atCorner =
          (x <= 0 || x >= maxX) && (y <= 0 || y >= maxY);
        if (atCorner) recordCornerHit();

        vel.current = { dx, dy };
        return { x, y };
      });
      raf.current = requestAnimationFrame(animate);
    };

    raf.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf.current);
  }, [visible, recordCornerHit]);

  if (!visible) return null;

  return (
    <div
      className="mc-slot pointer-events-none fixed z-[80] flex h-12 w-12 items-center justify-center"
      style={{ left: pos.x, top: pos.y }}
      title="AFK"
    >
      <McTexture src={MC_ASSETS.blocks.dirt} alt="Dirt" size={32} />
    </div>
  );
}
