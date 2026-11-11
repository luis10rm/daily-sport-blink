import { icons, Sun } from "lucide-react";
import { cn } from "@/lib/utils";
import { positiveCategoryIconName } from "@/lib/positiveCategoryIcons";
import type { PositiveCategoryRef } from "@/hooks/usePositivePosts";

export function PositiveCategoryIcon({ category, className }: {
  category?: Partial<PositiveCategoryRef> | null;
  className?: string;
}) {
  const name = positiveCategoryIconName(category);
  const Icon = icons[name as keyof typeof icons] || Sun;
  return (
    <span
      data-category-icon={name}
      className={cn("inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-control bg-primary text-primary-foreground", className)}
      style={category?.bg_color ? { backgroundColor: category.bg_color } : undefined}
      aria-hidden="true"
    >
      <Icon className="h-5 w-5" />
    </span>
  );
}