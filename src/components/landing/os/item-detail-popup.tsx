"use client";

import { createPortal } from "react-dom";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { McItemSlot } from "./mc-item-slot";
import {
  describeItemEffects,
  getItemFlavorText,
  ITEM_KIND_LABELS,
  type ItemEffects,
} from "@/lib/inventory/item-effects";
import { resolveItemIcon } from "@/lib/inventory/item-assets";
import { rarityConfig } from "@/lib/inventory/rarity";
import { cn } from "@/lib/utils";

export interface ItemDetailData {
  id: string;
  slug: string;
  name: string;
  rarity: string;
  kind: string;
  quantity?: number;
  effects: ItemEffects;
  description?: string | null;
  iconUrl?: string | null;
  active?: boolean;
  appliedToRun?: boolean;
  participantStatus?: string;
  effectLinesOverride?: string[];
}

interface ItemDetailPopupProps {
  item: ItemDetailData;
  anchorRect?: DOMRect | null;
  visible: boolean;
  onClose?: () => void;
  withBackdrop?: boolean;
  onPopupMouseEnter?: () => void;
  onPopupMouseLeave?: () => void;
}

const POPUP_WIDTH = 300;

function computePosition(anchorRect: DOMRect | null | undefined, popupHeight: number) {
  const margin = 12;
  const vw = typeof window !== "undefined" ? window.innerWidth : 800;
  const vh = typeof window !== "undefined" ? window.innerHeight : 600;

  if (!anchorRect) {
    return {
      left: Math.max(margin, (vw - POPUP_WIDTH) / 2),
      top: Math.max(margin, (vh - popupHeight) / 2),
    };
  }

  let left = anchorRect.left + anchorRect.width / 2 - POPUP_WIDTH / 2;
  left = Math.max(margin, Math.min(left, vw - POPUP_WIDTH - margin));

  let top = anchorRect.bottom + margin;
  if (top + popupHeight > vh - margin) {
    top = anchorRect.top - popupHeight - margin;
  }
  top = Math.max(margin, Math.min(top, vh - popupHeight - margin));

  return { left, top };
}

export function ItemDetailPopup({
  item,
  anchorRect,
  visible,
  onClose,
  withBackdrop = true,
  onPopupMouseEnter,
  onPopupMouseLeave,
}: ItemDetailPopupProps) {
  const [mounted, setMounted] = useState(false);
  const popupRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ left: 12, top: 12 });

  const rarity = rarityConfig[item.rarity as keyof typeof rarityConfig];
  const effectLines = item.effectLinesOverride ?? describeItemEffects(item.effects);
  const flavor = getItemFlavorText(item.slug, item.description);
  const texture = resolveItemIcon(item.slug, item.iconUrl);

  useEffect(() => setMounted(true), []);

  useLayoutEffect(() => {
    if (!visible) return;
    const height = popupRef.current?.offsetHeight ?? 280;
    setPos(computePosition(anchorRect, height));
  }, [visible, anchorRect, item.id]);

  if (!mounted || !visible) return null;

  return createPortal(
    <>
      {onClose && withBackdrop && (
        <div className="fixed inset-0 z-[9998] bg-black/40" onClick={onClose} aria-hidden />
      )}
      <div
        ref={popupRef}
        className={cn(
          "pointer-events-auto fixed z-[9999] box-border overflow-hidden rounded border-2 bg-[#14100c] p-4 shadow-2xl",
          rarity?.tooltipBorder ?? "border-[#373737]",
        )}
        style={{ left: pos.left, top: pos.top, width: POPUP_WIDTH }}
        role="dialog"
        aria-label={item.name}
        onMouseEnter={onPopupMouseEnter}
        onMouseLeave={() => {
          onPopupMouseLeave?.();
          onClose?.();
        }}
      >
        <div className="flex flex-col items-center text-center">
          <McItemSlot
            slug={item.slug}
            src={texture}
            alt={item.name}
            size="lg"
            active={item.active !== false}
            enchanted={
              item.rarity === "EPIC" ||
              item.rarity === "LEGENDARY" ||
              item.rarity === "RARE"
            }
          />
          <p className={cn("mt-3 font-display text-base leading-tight", rarity?.text)}>
            {item.name}
          </p>
          <p className={cn("mt-1 text-xs font-semibold uppercase tracking-wide", rarity?.text)}>
            {rarity?.label ?? item.rarity}
          </p>
          <p className="mt-0.5 text-[10px] uppercase text-[#7a6a52]">
            {ITEM_KIND_LABELS[item.kind] ?? item.kind}
            {item.quantity != null && item.quantity > 1 ? ` · ×${item.quantity}` : ""}
          </p>
        </div>

        {effectLines.length > 0 && (
          <div className="mt-3 w-full border-t border-dashed border-[#373737] pt-3 text-left">
            <p className="text-center text-[10px] font-semibold uppercase tracking-widest text-[#a89070]">
              Эффекты
            </p>
            <ul className="mt-2 space-y-1.5">
              {effectLines.map((line) => (
                <li key={line} className="flex items-start gap-2 text-sm leading-snug text-[#e8d5b0]">
                  <span
                    className={cn(
                      "mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full",
                      item.kind === "MODIFIER" &&
                        item.participantStatus !== "AUCTIONING" &&
                        item.appliedToRun
                        ? "bg-emerald-400"
                        : item.kind === "MODIFIER" &&
                            item.participantStatus !== "AUCTIONING"
                          ? "bg-red-500"
                          : "bg-primary",
                    )}
                  />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {flavor && (
          <p className="mt-3 w-full border-t border-dashed border-[#373737] pt-3 text-center text-xs leading-relaxed text-[#7a6a52]">
            {flavor}
          </p>
        )}
      </div>
    </>,
    document.body,
  );
}
