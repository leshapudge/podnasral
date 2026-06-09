"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Code2, Pickaxe, Tv } from "lucide-react";
import { Separator } from "@/components/ui/separator";

const footerLinks = {
  Ивент: [
    { label: "Сезон", href: "#season" },
    { label: "Рейтинг", href: "#leaderboard" },
    { label: "Босс", href: "#boss" },
    { label: "Активность", href: "#activity" },
  ],
  Игра: [
    { label: "Мини-игры", href: "/login" },
    { label: "Крафт", href: "/login" },
    { label: "Гильдии", href: "/login" },
    { label: "Коллекция секретов", href: "/collection" },
    { label: "Звук", href: "/settings" },
  ],
  Сообщество: [
    { label: "Discord", href: "#" },
    { label: "Twitch", href: "#" },
    { label: "Правила", href: "#" },
    { label: "FAQ", href: "#" },
  ],
};

export function Footer() {
  return (
    <footer className="relative border-t border-white/5 bg-card/50">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-5">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="lg:col-span-2"
          >
            <Link href="/" className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/20 border border-primary/30">
                <Pickaxe className="h-5 w-5 text-primary" />
              </div>
              <span className="font-display text-lg font-bold tracking-wider text-gradient-emerald">
                MINESEASON
              </span>
            </Link>
            <p className="mt-4 max-w-sm text-sm text-muted-foreground leading-relaxed">
              Стримерский игровой ивент в стиле Minecraft. Создан для стримеров
              и их комьюнити. Вдохновлено Hypixel и лучшими игровыми платформами.
            </p>
            <div className="mt-6 flex gap-3">
              <a
                href="#"
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-muted/50 text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
                aria-label="Twitch"
              >
                <Tv className="h-5 w-5" />
              </a>
              <a
                href="#"
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-muted/50 text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
                aria-label="GitHub"
              >
                <Code2 className="h-5 w-5" />
              </a>
            </div>
          </motion.div>

          {Object.entries(footerLinks).map(([title, links], colIndex) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: colIndex * 0.1 }}
            >
              <h4 className="font-display text-sm font-bold uppercase tracking-wider text-hypixel-gold">
                {title}
              </h4>
              <ul className="mt-4 space-y-2.5">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        <Separator className="my-10 bg-border" />

        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} MINESEASON. Not affiliated with Mojang or Microsoft.
          </p>
          <p className="text-xs text-muted-foreground">
            Made with ⛏️ for the streaming community
          </p>
        </div>
      </div>
    </footer>
  );
}
