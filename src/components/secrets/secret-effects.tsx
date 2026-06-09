"use client";

import { HerobrineFlash } from "./herobrine-flash";
import { CommandPalette } from "./command-palette";
import { ArtifactSpawner } from "./artifact-spawner";
import { AfkDirtBlock } from "./afk-dirt-block";
import { ConsoleEasterEgg } from "./console-easter-egg";
import { SecretToasts } from "./secret-toasts";
import { ArtifactPickupModal } from "./artifact-pickup-modal";
import { CommandOutputBanner } from "./command-output-banner";

export function SecretEffects() {
  return (
    <>
      <HerobrineFlash />
      <CommandPalette />
      <CommandOutputBanner />
      <ArtifactSpawner />
      <AfkDirtBlock />
      <ConsoleEasterEgg />
      <SecretToasts />
      <ArtifactPickupModal />
    </>
  );
}
