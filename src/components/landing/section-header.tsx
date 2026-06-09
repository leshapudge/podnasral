"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface SectionHeaderProps {
  label: string;
  title: string;
  description?: string;
  className?: string;
  align?: "left" | "center";
}

export function SectionHeader({
  label,
  title,
  description,
  className,
  align = "left",
}: SectionHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "mb-10",
        align === "center" && "text-center",
        className,
      )}
    >
      <span className="font-display text-xs uppercase tracking-[0.3em] text-hypixel-gold">
        {label}
      </span>
      <h2 className="mt-2 font-display text-3xl font-bold tracking-wide text-foreground md:text-4xl lg:text-5xl">
        {title}
      </h2>
      {description && (
        <p className={cn(
          "mt-3 max-w-2xl text-muted-foreground text-lg",
          align === "center" && "mx-auto",
        )}>
          {description}
        </p>
      )}
    </motion.div>
  );
}
