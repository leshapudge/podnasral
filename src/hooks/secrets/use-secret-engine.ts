import { useEffect } from "react";
import { secretEngine, type SecretEventHandler } from "@/lib/secrets/secret.engine";
import type { SecretEventType } from "@/lib/secrets/types";

/** Subscribe to the global secret event bus */
export function useSecretEngine(handler: SecretEventHandler) {
  useEffect(() => {
    const unsubscribe = secretEngine.subscribe(handler);
    return () => {
      unsubscribe();
    };
  }, [handler]);
}

export function useEmitSecret() {
  return (event: SecretEventType, payload?: Record<string, unknown>) => {
    secretEngine.emit(event, payload);
  };
}
