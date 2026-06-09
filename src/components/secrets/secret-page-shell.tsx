import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { McItemSlot } from "@/components/landing/os/mc-item-slot";
import { Button } from "@/components/ui/button";

interface SecretPageShellProps {
  title: string;
  subtitle: string;
  texture: string;
  enchanted?: boolean;
  children?: React.ReactNode;
}

export function SecretPageShell({
  title,
  subtitle,
  texture,
  enchanted = true,
  children,
}: SecretPageShellProps) {
  return (
    <div className="min-h-screen grid-pattern flex flex-col items-center justify-center px-4 py-20">
      <div className="glass-panel max-w-lg rounded-2xl border border-white/10 p-10 text-center">
        <div className="flex justify-center">
          <McItemSlot
            src={texture}
            alt={title}
            size="md"
            className="h-20 w-20 scale-[1.6]"
            enchanted={enchanted}
          />
        </div>
        <h1 className="mt-6 font-display text-3xl font-bold">{title}</h1>
        <p className="mt-3 text-muted-foreground">{subtitle}</p>
        {children}
        <Button asChild variant="ghost" size="sm" className="mt-8">
          <Link href="/">
            <ArrowLeft className="h-4 w-4" />
            Вернуться
          </Link>
        </Button>
      </div>
      <p className="mt-6 text-xs text-muted-foreground/50">
        §kСекретная зона§r — не для навигации
      </p>
    </div>
  );
}
