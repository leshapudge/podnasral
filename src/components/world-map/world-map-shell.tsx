"use client";

import Link from "next/link";
import { ArrowLeft, Map } from "lucide-react";
import { SecretLogoLink } from "@/components/secrets/secret-logo-link";
import { Button } from "@/components/ui/button";
import { WorldMapCanvas } from "./world-map-canvas";
import type { WorldMapData } from "@/lib/world-map/types";

interface WorldMapShellProps {
  data: WorldMapData;
}

export function WorldMapShell({ data }: WorldMapShellProps) {
  return (
    <div className="min-h-screen grid-pattern">
      <header className="sticky top-0 z-40 border-b border-white/5 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
          <SecretLogoLink className="font-display text-sm font-bold" />
          <Button asChild variant="ghost" size="sm">
            <Link href="/dashboard">
              <ArrowLeft className="h-4 w-4" />
              Dashboard
            </Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="mb-8">
          <p className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-primary">
            <Map className="h-3.5 w-3.5" />
            Исследование
          </p>
          <h1 className="font-display text-2xl font-bold sm:text-3xl">Карта мира</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            6 биомов · игроки, данжи и ивенты в реальном времени
          </p>
        </div>

        <WorldMapCanvas data={data} />
      </main>
    </div>
  );
}
