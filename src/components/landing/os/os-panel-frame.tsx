import { cn } from "@/lib/utils";

interface OsPanelFrameProps {
  children: React.ReactNode;
  className?: string;
}

export function OsPanelFrame({ children, className }: OsPanelFrameProps) {
  return (
    <div
      className={cn(
        "os-scrollbar flex min-h-0 flex-1 flex-col overflow-y-auto bg-[#14100c] p-4 sm:p-5",
        className,
      )}
    >
      {children}
    </div>
  );
}
