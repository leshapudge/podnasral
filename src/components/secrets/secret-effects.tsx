"use client";

import { CommandPalette } from "./command-palette";
import { AfkDirtBlock } from "./afk-dirt-block";
import { ConsoleEasterEgg } from "./console-easter-egg";
import { SecretToasts } from "./secret-toasts";
import { CommandOutputBanner } from "./command-output-banner";

export function SecretEffects() {
  return (
    <>
      <CommandPalette />
      <CommandOutputBanner />
      <AfkDirtBlock />
      <ConsoleEasterEgg />
      <SecretToasts />
    </>
  );
}
