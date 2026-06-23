"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { SecretLogoLink } from "@/components/secrets/secret-logo-link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface NavbarProps {
  isAuthenticated: boolean;
}

const navLinks = [
  { href: "#season", label: "Сезон" },
  { href: "#leaderboard", label: "Рейтинг" },
  { href: "#activity", label: "Активность" },
];

export function Navbar({ isAuthenticated }: NavbarProps) {
  const [open, setOpen] = useState(false);

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="fixed inset-x-0 top-0 z-50 border-b border-white/5 bg-background/80 backdrop-blur-xl"
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <SecretLogoLink />

        <nav className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Badge variant="live" className="hidden lg:flex">
            <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-red-400" />
            LIVE
          </Badge>
          {isAuthenticated ? (
            <Button asChild variant="gold" size="sm">
              <Link href="/dashboard">Dashboard</Link>
            </Button>
          ) : (
            <Button asChild variant="gold" size="sm">
              <Link href="/login">Играть</Link>
            </Button>
          )}
        </div>

        <button
          type="button"
          className="md:hidden rounded-lg p-2 text-muted-foreground hover:bg-white/5"
          onClick={() => setOpen(!open)}
          aria-label="Меню"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="border-t border-white/5 bg-background/95 md:hidden"
        >
          <div className="flex flex-col gap-1 p-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-4 py-3 text-sm font-medium hover:bg-white/5"
              >
                {link.label}
              </Link>
            ))}
            <Button asChild variant="gold" className="mt-2">
              <Link href={isAuthenticated ? "/dashboard" : "/login"}>
                {isAuthenticated ? "Dashboard" : "Играть"}
              </Link>
            </Button>
          </div>
        </motion.div>
      )}
    </motion.header>
  );
}
