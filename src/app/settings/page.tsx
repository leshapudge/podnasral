import { McPageShell } from "@/components/landing/mc-page-shell";
import { AudioSettingsPanel } from "@/components/audio/audio-settings-panel";

export default function SettingsPage() {
  return (
    <McPageShell title="Настройки">
      <div className="mx-auto max-w-lg">
        <AudioSettingsPanel />
      </div>
    </McPageShell>
  );
}
