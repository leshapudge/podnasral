"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { secretEngine } from "@/lib/secrets/secret.engine";
import { loadGuestState, patchGuestState, saveGuestState } from "@/lib/secrets/guest-storage";
import type { GuestSecretState } from "@/lib/secrets/types";
import { buildCollectionFromGuest } from "@/lib/secrets/collection.service";
import type { CollectionState, UnlockResult } from "@/lib/secrets/types";
import { executeSecretCommand, type CommandResult } from "@/lib/secrets/commands";
import { rollWindowCloseEasterEgg } from "@/lib/secrets/window-close-easter-egg";
import { emitAudioEvent } from "@/lib/audio/event-bus";
import { buildSecretRouteKey } from "@/lib/secrets/route-key";

interface ToastMessage {
  id: string;
  title: string;
  body?: string;
  icon?: string;
  texture?: string;
}

interface SecretContextValue {
  state: GuestSecretState;
  collection: CollectionState;
  unlockAchievement: (slug: string) => Promise<UnlockResult>;
  collectArtifact: (slug: string) => Promise<UnlockResult>;
  recordLogoClick: () => void;
  recordHerobrineSeen: () => void;
  recordCornerHit: () => void;
  triggerWindowCloseEasterEgg: () => void;
  runCommand: (input: string) => CommandResult | null;
  toasts: ToastMessage[];
  dismissToast: (id: string) => void;
  showHerobrine: boolean;
  setShowHerobrine: (v: boolean) => void;
  showCreeperExplosion: boolean;
  commandOpen: boolean;
  setCommandOpen: (v: boolean) => void;
  commandOutput: string | null;
  setCommandOutput: (v: string | null) => void;
  pendingArtifact: { slug: string; name: string; icon: string } | null;
  setPendingArtifact: (v: { slug: string; name: string; icon: string } | null) => void;
}

const SecretContext = createContext<SecretContextValue | null>(null);

async function syncUnlock(type: "achievement" | "artifact", slug: string) {
  const endpoint =
    type === "achievement"
      ? "/api/secrets/achievements/unlock"
      : "/api/secrets/artifacts/collect";
  try {
    await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ slug }),
    });
  } catch {
    /* guest or offline */
  }
}

export function SecretProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [routeTab, setRouteTab] = useState<string | null>(null);
  const routeKey = buildSecretRouteKey(pathname, routeTab);
  const { data: session } = useSession();
  const [state, setState] = useState<GuestSecretState>(() => loadGuestState());
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [showHerobrine, setShowHerobrine] = useState(false);
  const [showCreeperExplosion, setShowCreeperExplosion] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [commandOutput, setCommandOutput] = useState<string | null>(null);
  const [pendingArtifact, setPendingArtifact] = useState<{
    slug: string;
    name: string;
    icon: string;
  } | null>(null);

  const stateRef = useRef(state);
  stateRef.current = state;

  const TOAST_AUTO_DISMISS_MS = 4500;

  useEffect(() => {
    if (typeof window === "undefined") return;

    const readTab = () => new URLSearchParams(window.location.search).get("tab");
    setRouteTab(readTab());

    const pollId = window.setInterval(() => {
      const nextTab = readTab();
      setRouteTab((prevTab) => (prevTab === nextTab ? prevTab : nextTab));
    }, 400);

    return () => {
      window.clearInterval(pollId);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setRouteTab(new URLSearchParams(window.location.search).get("tab"));
  }, [pathname]);

  const addToast = useCallback(
    (title: string, body?: string, icon?: string, texture?: string) => {
      const id = `${Date.now()}-${Math.random()}`;
      setToasts((prev) => [...prev, { id, title, body, icon, texture }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, TOAST_AUTO_DISMISS_MS);
    },
    [],
  );

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const applyUnlocks = useCallback(
    async (slugs: string[]) => {
      if (!slugs.length) return;
      let next = stateRef.current;
      for (const slug of slugs) {
        if (next.achievements.includes(slug)) continue;
        next = { ...next, achievements: [...next.achievements, slug] };
        saveGuestState(next);
        setState(next);
        const def = await import("@/lib/secrets/definitions").then((m) =>
          m.getAchievementDef(slug),
        );
        const { getAchievementTexture } = await import("@/lib/secrets/achievement-assets");
        addToast("Достижение разблокировано!", def?.name, def?.icon, getAchievementTexture(slug));
        emitAudioEvent("achievement:secretUnlock", { secret: true });
        if (session?.user) await syncUnlock("achievement", slug);
      }
    },
    [addToast, session?.user],
  );

  const evaluate = useCallback(
    (nextState: GuestSecretState, path: string) => {
      const slugs = secretEngine.evaluateUnlocks(nextState, path);
      void applyUnlocks(slugs);
    },
    [applyUnlocks],
  );

  const unlockAchievement = useCallback(
    async (slug: string): Promise<UnlockResult> => {
      if (stateRef.current.achievements.includes(slug)) {
        return { unlocked: false, slug, alreadyHad: true };
      }
      const next = {
        ...stateRef.current,
        achievements: [...stateRef.current.achievements, slug],
      };
      saveGuestState(next);
      setState(next);
      const defs = await import("@/lib/secrets/definitions");
      const def = defs.getAchievementDef(slug);
      const { getAchievementTexture } = await import("@/lib/secrets/achievement-assets");
      if (session?.user) await syncUnlock("achievement", slug);
      addToast("Достижение разблокировано!", def?.name, def?.icon, getAchievementTexture(slug));
      emitAudioEvent("achievement:secretUnlock", { secret: true });
      return { unlocked: true, slug, name: def?.name, icon: def?.icon };
    },
    [addToast, session?.user],
  );

  const collectArtifact = useCallback(
    async (slug: string): Promise<UnlockResult> => {
      if (stateRef.current.artifacts.includes(slug)) {
        return { unlocked: false, slug, alreadyHad: true };
      }
      const next = {
        ...stateRef.current,
        artifacts: [...stateRef.current.artifacts, slug],
      };
      saveGuestState(next);
      setState(next);
      const def = (await import("@/lib/secrets/definitions")).getArtifactDef(slug);
      if (session?.user) await syncUnlock("artifact", slug);
      setPendingArtifact({ slug, name: def?.name ?? slug, icon: def?.icon ?? "✨" });
      return { unlocked: true, slug, name: def?.name, icon: def?.icon };
    },
    [session?.user],
  );

  const recordLogoClick = useCallback(() => {
    const clicks = stateRef.current.logoClicks + 1;
    const next = patchGuestState({ logoClicks: clicks });
    setState(next);
    if (clicks === 10) {
      setShowCreeperExplosion(true);
      void unlockAchievement("creeper-fan");
    }
    evaluate(next, routeKey);
  }, [evaluate, routeKey, unlockAchievement]);

  const recordHerobrineSeen = useCallback(() => {
    const next = patchGuestState({ herobrineSeen: true });
    setState(next);
    evaluate(next, routeKey);
  }, [evaluate, routeKey]);

  const recordCornerHit = useCallback(() => {
    const next = patchGuestState({ cornerHit: true });
    setState(next);
    evaluate(next, routeKey);
  }, [evaluate, routeKey]);

  const triggerWindowCloseEasterEgg = useCallback(() => {
    const roll = rollWindowCloseEasterEgg();
    if (!roll) return;

    if (roll === "herobrine") {
      setShowHerobrine(true);
      emitAudioEvent("easter:herobrine");
      setTimeout(() => {
        setShowHerobrine(false);
        recordHerobrineSeen();
      }, 500);
      return;
    }

    if (roll === "creeper") {
      setShowCreeperExplosion(true);
      return;
    }

    emitAudioEvent("easter:enderman");
  }, [recordHerobrineSeen]);

  const runCommand = useCallback(
    (input: string): CommandResult | null => {
      const result = executeSecretCommand(input);
      if (!result) return null;
      const next = patchGuestState({
        commandsRun: [...new Set([...stateRef.current.commandsRun, input.trim().toLowerCase()])],
      });
      setState(next);
      evaluate(next, routeKey);
      return result;
    },
    [evaluate, routeKey],
  );

  // Sync guest progress to DB after login + hydrate from server
  useEffect(() => {
    if (!session?.user) return;
    const guest = loadGuestState();
    const sync = async () => {
      for (const slug of guest.achievements) {
        await syncUnlock("achievement", slug);
      }
      for (const slug of guest.artifacts) {
        await syncUnlock("artifact", slug);
      }

      try {
        const res = await fetch("/api/secrets/collection", { credentials: "include" });
        if (!res.ok) return;
        const json = await res.json();
        const collection = json.data;
        if (!collection) return;

        const serverAchievements = collection.achievements
          .filter((a: { unlocked: boolean; slug: string }) => a.unlocked)
          .map((a: { slug: string }) => a.slug);
        const serverArtifacts = collection.artifacts
          .filter((a: { found: boolean; slug: string }) => a.found)
          .map((a: { slug: string }) => a.slug);

        const merged: GuestSecretState = {
          ...guest,
          achievements: [...new Set([...guest.achievements, ...serverAchievements])],
          artifacts: [...new Set([...guest.artifacts, ...serverArtifacts])],
        };
        saveGuestState(merged);
        setState(merged);
      } catch {
        /* offline */
      }
    };
    void sync();
  }, [session?.user?.id]);

  // Page visit tracking
  useEffect(() => {
    if (!routeKey) return;
    const visited = new Set(stateRef.current.visitedPages);
    if (!visited.has(routeKey)) {
      visited.add(routeKey);
      const next = patchGuestState({ visitedPages: [...visited] });
      setState(next);
      evaluate(next, routeKey);
    } else {
      evaluate(stateRef.current, routeKey);
    }
  }, [routeKey, evaluate]);

  // Night owl check on mount + hourly
  useEffect(() => {
    const check = () => {
      const hour = new Date().getHours();
      if (hour === 3) {
        evaluate(stateRef.current, routeKey);
      }
    };
    check();
    const id = setInterval(check, 60_000);
    return () => clearInterval(id);
  }, [routeKey, evaluate]);

  // Active time tracker (AFK 1 hour)
  useEffect(() => {
    const onActivity = () => {
      const now = Date.now();
      const prev = stateRef.current;
      const delta = now - prev.lastActiveAt;
      const activeMs =
        delta < 120_000 ? prev.activeMs + delta : prev.activeMs;
      const next = { ...prev, activeMs, lastActiveAt: now };
      saveGuestState(next);
      setState(next);
      evaluate(next, routeKey);
    };

    window.addEventListener("mousemove", onActivity);
    window.addEventListener("keydown", onActivity);
    window.addEventListener("scroll", onActivity);
    window.addEventListener("click", onActivity);
    const tick = setInterval(onActivity, 30_000);
    return () => {
      window.removeEventListener("mousemove", onActivity);
      window.removeEventListener("keydown", onActivity);
      window.removeEventListener("scroll", onActivity);
      window.removeEventListener("click", onActivity);
      clearInterval(tick);
    };
  }, [routeKey, evaluate]);

  const collection = useMemo(() => buildCollectionFromGuest(state), [state]);

  const value: SecretContextValue = {
    state,
    collection,
    unlockAchievement,
    collectArtifact,
    recordLogoClick,
    recordHerobrineSeen,
    recordCornerHit,
    triggerWindowCloseEasterEgg,
    runCommand,
    toasts,
    dismissToast,
    showHerobrine,
    setShowHerobrine,
    showCreeperExplosion,
    commandOpen,
    setCommandOpen,
    commandOutput,
    setCommandOutput,
    pendingArtifact,
    setPendingArtifact,
  };

  return (
    <SecretContext.Provider value={value}>
      {children}
      {showCreeperExplosion && (
        <CreeperExplosionOverlay onDone={() => setShowCreeperExplosion(false)} />
      )}
    </SecretContext.Provider>
  );
}

function CreeperExplosionOverlay({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    import("@/lib/audio").then(({ audioManager, emitAudioEvent }) => {
      void audioManager.playSound("easter.creeperHiss");
      setTimeout(() => emitAudioEvent("easter:creeper"), 400);
    });
    const t = setTimeout(onDone, 2200);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div className="pointer-events-none fixed inset-0 z-[200] flex items-center justify-center bg-black/80">
      <div className="animate-ping text-8xl">💥</div>
      <p className="absolute bottom-1/3 font-display text-2xl text-primary">Aww man...</p>
    </div>
  );
}

export function useSecrets() {
  const ctx = useContext(SecretContext);
  if (!ctx) throw new Error("useSecrets must be used within SecretProvider");
  return ctx;
}

export function useSecretsOptional() {
  return useContext(SecretContext);
}
