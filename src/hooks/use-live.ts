"use client";

import { useEffect, useRef } from "react";
import { connectLive } from "@/lib/api/client";

export function useLive(onEvent: (data: { type: string; data?: unknown }) => void) {
  const callbackRef = useRef(onEvent);
  callbackRef.current = onEvent;

  useEffect(() => {
    return connectLive((event) => callbackRef.current(event));
  }, []);
}
