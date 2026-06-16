"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Terminal } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useSecrets } from "./secret-context";

export function CommandPalette() {
  const router = useRouter();
  const {
    commandOpen,
    setCommandOpen,
    runCommand,
    setCommandOutput,
  } = useSecrets();
  const [input, setInput] = useState("");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "/" && !e.ctrlKey && !e.metaKey) {
        const target = e.target as HTMLElement;
        if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return;
        e.preventDefault();
        setCommandOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setCommandOpen]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const result = runCommand(input);
    if (!result) return;

    setCommandOutput(result.message);

    if (result.action === "navigate" && result.href) {
      router.push(result.href);
    }

    setInput("");
    setCommandOpen(false);
  }

  return (
    <Dialog open={commandOpen} onOpenChange={setCommandOpen}>
      <DialogContent className="sm:max-w-md border-primary/30">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display">
            <Terminal className="h-5 w-5 text-primary" />
            Секретная консоль
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <Input
            autoFocus
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="/help"
            className="font-mono"
          />
          <p className="mt-2 text-xs text-muted-foreground">
            Нажмите <kbd className="rounded bg-muted px-1">/</kbd> в любой момент
          </p>
        </form>
      </DialogContent>
    </Dialog>
  );
}
