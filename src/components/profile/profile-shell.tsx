"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { SecretLogoLink } from "@/components/secrets/secret-logo-link";
import { Button } from "@/components/ui/button";
import { ProfileHeader } from "./profile-header";
import { ProfileTabs } from "./profile-tabs";

interface ProfileShellProps {
  nickname?: string | null;
  avatar?: string | null;
}

export function ProfileShell({ nickname, avatar }: ProfileShellProps) {
  return (
    <div className="min-h-screen grid-pattern">
      <header className="sticky top-0 z-40 border-b border-white/5 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6">
          <SecretLogoLink className="font-display text-sm font-bold" />
          <Button asChild variant="ghost" size="sm">
            <Link href="/dashboard">
              <ArrowLeft className="h-4 w-4" />
              Dashboard
            </Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
        <ProfileHeader nickname={nickname} avatar={avatar} />
        <div className="mt-8">
          <ProfileTabs />
        </div>
      </main>
    </div>
  );
}
