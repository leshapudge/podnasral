"use client";

import Link from "next/link";
import { Pickaxe } from "lucide-react";
import { useSecretsOptional } from "./secret-context";

interface SecretLogoLinkProps {
  className?: string;
  showText?: boolean;
  href?: string;
}

export function SecretLogoLink({
  className = "",
  showText = true,
  href = "/",
}: SecretLogoLinkProps) {
  const secrets = useSecretsOptional();

  return (
    <Link
      href={href}
      className={`flex items-center gap-2.5 group ${className}`}
      onClick={() => secrets?.recordLogoClick()}
    >
      <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-primary/30 bg-primary/20 mc-border transition-colors group-hover:bg-primary/30">
        <Pickaxe className="h-5 w-5 text-primary" />
      </div>
      {showText && (
        <span className="font-display text-lg font-bold tracking-wider text-gradient-emerald">
          MINESEASON
        </span>
      )}
    </Link>
  );
}
