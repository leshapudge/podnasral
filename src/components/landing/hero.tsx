"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronRight, Play, Trophy, Users, Zap } from "lucide-react";
import { EVENT_BRAND, EVENT_TAGLINE } from "@/lib/event/event-brand";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface HeroProps {
  isAuthenticated: boolean;
}

const floatingBlocks = [
  { color: "bg-mc-grass", size: "h-12 w-12", x: "10%", y: "20%", delay: 0 },
  { color: "bg-mc-dirt", size: "h-8 w-8", x: "85%", y: "15%", delay: 0.5 },
  { color: "bg-hypixel-gold", size: "h-10 w-10", x: "75%", y: "65%", delay: 1 },
  { color: "bg-mc-diamond/80", size: "h-6 w-6", x: "15%", y: "70%", delay: 1.5 },
  { color: "bg-mc-redstone/80", size: "h-14 w-14", x: "90%", y: "40%", delay: 0.8 },
];

export function Hero({ isAuthenticated }: HeroProps) {
  return (
    <section className="relative min-h-screen overflow-hidden grid-pattern noise-overlay">
      {/* Ambient glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/3 h-[500px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute right-0 top-0 h-[400px] w-[400px] rounded-full bg-hypixel-gold/8 blur-[100px]" />
      </div>

      {/* Floating blocks */}
      {floatingBlocks.map((block, i) => (
        <motion.div
          key={i}
          className={`absolute ${block.size} ${block.color} rounded-sm mc-border opacity-60`}
          style={{ left: block.x, top: block.y }}
          animate={{ y: [0, -16, 0], rotate: [0, 5, 0] }}
          transition={{
            duration: 4 + i * 0.5,
            repeat: Infinity,
            delay: block.delay,
            ease: "easeInOut",
          }}
        />
      ))}

      <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col items-center justify-center px-4 pt-24 pb-16 text-center sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Badge variant="gold" className="mb-6 px-4 py-1.5 text-sm">
            <Zap className="mr-1.5 h-3.5 w-3.5" />
            {EVENT_BRAND} · Season I
          </Badge>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="font-display text-5xl font-bold leading-tight tracking-wider sm:text-7xl lg:text-8xl"
        >
          <span className="text-gradient-emerald">POD</span>
          <span className="text-gradient-gold">NASRAL</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.25 }}
          className="mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl"
        >
          {EVENT_TAGLINE}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-10 flex flex-col items-center gap-4 sm:flex-row"
        >
          <Button asChild variant="gold" size="xl" className="min-w-[200px]">
            <Link href={isAuthenticated ? "/dashboard" : "/login"}>
              <Play className="h-5 w-5 fill-current" />
              {isAuthenticated ? "В игру" : "Начать играть"}
            </Link>
          </Button>
          <Button asChild variant="outline" size="xl" className="min-w-[200px]">
            <Link href="#leaderboard">
              <Trophy className="h-5 w-5" />
              Рейтинг
              <ChevronRight className="h-4 w-4" />
            </Link>
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-16 grid w-full max-w-3xl grid-cols-3 gap-4"
        >
          {[
            { icon: Users, value: "2,847", label: "Онлайн" },
            { icon: Trophy, value: "48K", label: "Макс. сила" },
            { icon: Zap, value: "67%", label: "Сезон" },
          ].map((stat, i) => (
            <div
              key={i}
              className="glass-panel rounded-xl p-4 mc-border"
            >
              <stat.icon className="mx-auto mb-2 h-5 w-5 text-hypixel-gold" />
              <div className="font-display text-2xl font-bold text-foreground">{stat.value}</div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <div className="h-10 w-6 rounded-full border-2 border-white/20 p-1">
          <div className="h-2 w-1.5 mx-auto rounded-full bg-primary" />
        </div>
      </motion.div>
    </section>
  );
}
