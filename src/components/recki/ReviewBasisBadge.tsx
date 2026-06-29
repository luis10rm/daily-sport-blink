import { BookOpen, FlaskConical } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface Props {
  basis: "research" | "hands_on" | null | undefined;
  size?: "sm" | "md";
  className?: string;
}

export const ReviewBasisBadge = ({ basis, size = "md", className = "" }: Props) => {
  if (!basis) return null;

  const isHandsOn = basis === "hands_on";
  const Icon = isHandsOn ? FlaskConical : BookOpen;
  const label = isHandsOn ? "Test redakcji" : "Na podstawie researchu";
  const tip = isHandsOn
    ? "Produkt był fizycznie testowany przez redakcję Tech."
    : "Recenzja powstała na podstawie publicznie dostępnych źródeł, specyfikacji i opinii — bez fizycznego testu produktu.";

  const sizeCls = size === "sm" ? "text-[10px] px-2 py-0.5 gap-1" : "text-xs px-2.5 py-1 gap-1.5";
  const iconCls = size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5";

  const styleCls = isHandsOn
    ? "bg-emerald-600 text-white border-transparent"
    : "bg-muted text-muted-foreground border border-border";

  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={`inline-flex items-center rounded-full font-semibold uppercase tracking-wide ${sizeCls} ${styleCls} ${className}`}
          >
            <Icon className={iconCls} />
            {label}
          </span>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs text-xs">
          {tip}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
