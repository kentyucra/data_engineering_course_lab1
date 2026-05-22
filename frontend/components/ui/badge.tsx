import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

type BadgeProps = ComponentProps<"span"> & {
  tone?: "neutral" | "success" | "warning" | "danger" | "info";
};

export function Badge({ className, tone = "neutral", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium",
        tone === "neutral" && "bg-muted text-muted-foreground",
        tone === "success" && "border-emerald-200 bg-emerald-50 text-emerald-700",
        tone === "warning" && "border-amber-200 bg-amber-50 text-amber-700",
        tone === "danger" && "border-rose-200 bg-rose-50 text-rose-700",
        tone === "info" && "border-sky-200 bg-sky-50 text-sky-700",
        className
      )}
      {...props}
    />
  );
}

export function StatusBadge({ status }: { status: string }) {
  const tone =
    status === "Shipped"
      ? "success"
      : status === "Cancelled" || status === "Disputed"
        ? "danger"
        : status === "On Hold" || status === "In Process"
          ? "warning"
          : "info";

  return <Badge tone={tone}>{status}</Badge>;
}
