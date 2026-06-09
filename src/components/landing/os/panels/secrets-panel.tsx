"use client";

import { OsPanelFrame } from "../os-panel-frame";
import { CollectionPanel } from "@/components/secrets/collection-panel";

export function SecretsPanel() {
  return (
    <OsPanelFrame>
      <CollectionPanel />
    </OsPanelFrame>
  );
}
