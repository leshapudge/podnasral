"use client";

import { useRouter } from "next/navigation";

interface McPageShellProps {
  title: string;
  children: React.ReactNode;
  /** Куда перейти по «Закрыть». По умолчанию — главная. */
  closeHref?: string;
  onClose?: () => void;
}

export function McPageShell({
  title,
  children,
  closeHref = "/",
  onClose,
}: McPageShellProps) {
  const router = useRouter();

  function handleClose() {
    if (onClose) {
      onClose();
      return;
    }
    router.push(closeHref);
  }

  return (
    <div className="mc-os-scene min-h-screen">
      <div className="mc-os-backdrop" />
      <div className="mc-os-wrap">
        <div className="mc-os-monitor" style={{ height: "auto", minHeight: "calc(100vh - 2rem)" }}>
          <div className="mc-os-bezel">
            <span className="mc-os-bezel-title flex-1 text-center">{title}</span>
            <button
              type="button"
              onClick={handleClose}
              className="mc-os-btn shrink-0 px-3 py-1 text-[10px]"
            >
              Закрыть
            </button>
          </div>
          <div className="os-scrollbar">
            <div className="mx-auto max-w-4xl space-y-6 p-4 sm:p-6">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
