import { cn } from "@/lib/utils";

export function OsSectionTitle({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mc-section-title", className)}>
      <span>{children}</span>
    </div>
  );
}
