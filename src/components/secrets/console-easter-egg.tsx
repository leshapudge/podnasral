"use client";

import { useEffect, useRef } from "react";

export function ConsoleEasterEgg() {
  const logged = useRef(false);

  useEffect(() => {
    if (logged.current) return;

    const threshold = 160;
    const check = () => {
      const open =
        window.outerWidth - window.innerWidth > threshold ||
        window.outerHeight - window.innerHeight > threshold;

      if (open && !logged.current) {
        logged.current = true;
        console.log(
          "%cSecret console unlocked",
          "color: #55c57a; font-size: 16px; font-weight: bold;",
        );
        console.log("%cLooking for secrets?", "color: #ffaa00; font-size: 12px;");
        console.log("%cTry /chunk", "color: #7a8ba3; font-size: 11px;");
      }
    };

    const id = setInterval(check, 1000);
    return () => clearInterval(id);
  }, []);

  return null;
}
