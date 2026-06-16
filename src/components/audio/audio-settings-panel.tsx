"use client";

import { motion } from "framer-motion";
import { Volume2, VolumeX, Wind, Sparkles, Music } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAudio } from "@/hooks/use-audio";

export function AudioSettingsPanel() {
  const { settings, updateSettings, playSound, mute, unmute, isMuted } = useAudio();

  const masterEnabled = settings.enabled && !isMuted;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto max-w-xl space-y-6"
    >
      <Card className="glass-panel border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-display">
            <Music className="h-5 w-5 text-primary" />
            Звук и атмосфера
          </CardTitle>
          <CardDescription>
            Настройте отклик интерфейса, эмбиент и пасхалки. Настройки сохраняются в браузере.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-wrap gap-3">
            <Button
              variant={masterEnabled ? "default" : "outline"}
              onClick={() => {
                if (isMuted) unmute();
                updateSettings({ enabled: true });
              }}
            >
              <Volume2 className="h-4 w-4" />
              Включить звуки
            </Button>
            <Button
              variant={!masterEnabled ? "destructive" : "outline"}
              onClick={() => {
                updateSettings({ enabled: false });
                mute();
              }}
            >
              <VolumeX className="h-4 w-4" />
              Выключить
            </Button>
            <Button
              variant="secondary"
              onClick={() => void playSound("ui.click")}
            >
              Тест UI
            </Button>
          </div>

          <label className="block space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Громкость</span>
              <span className="text-muted-foreground">{settings.volume}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={settings.volume}
              onChange={(e) => updateSettings({ volume: Number(e.target.value) })}
              className="h-2 w-full cursor-pointer accent-primary"
            />
          </label>

          <ToggleRow
            icon={<Wind className="h-4 w-4 text-sky-400" />}
            label="Атмосферные звуки"
            description="Ветер, пещеры, шаги и сезонный эмбиент на главной"
            checked={settings.ambienceEnabled}
            onChange={(v) => updateSettings({ ambienceEnabled: v })}
          />

          <ToggleRow
            icon={<Sparkles className="h-4 w-4 text-hypixel-gold" />}
            label="Звуки пасхалок"
            description="Крипер, Эндермен и секретные страницы"
            checked={settings.easterEggsEnabled}
            onChange={(v) => updateSettings({ easterEggsEnabled: v })}
          />
        </CardContent>
      </Card>
    </motion.div>
  );
}

function ToggleRow({
  icon,
  label,
  description,
  checked,
  onChange,
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border/60 bg-muted/20 p-4">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1 h-4 w-4 accent-primary"
      />
      <div className="flex-1">
        <div className="flex items-center gap-2 font-medium">
          {icon}
          {label}
        </div>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
    </label>
  );
}
