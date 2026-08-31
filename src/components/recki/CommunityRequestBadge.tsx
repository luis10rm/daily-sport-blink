import { Megaphone } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface Props {
  active: boolean | null | undefined;
  votes?: number | null;
  size?: "sm" | "md";
  className?: string;
}

/**
 * Plakietka informująca, że temat recenzji wybrali czytelnicy w ankiecie
 * („Jakiej recenzji szukasz?” na /tech).
 */
export const CommunityRequestBadge = ({ active, votes, size = "md", className = "" }: Props) => {
  if (!active) return null;

  const label = votes && votes > 0 ? `Na Wasze życzenie · ${votes}` : "Na Wasze życzenie";
  const sizeCls = size === "sm" ? "text-[10px] px-2 py-0.5 gap-1" : "text-xs px-2.5 py-1 gap-1.5";
  const iconCls = size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5";

  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={`inline-flex items-center rounded-full border border-transparent bg-gradient-to-r from-emerald-600 to-teal-600 font-semibold uppercase tracking-wide text-white shadow-sm ${sizeCls} ${className}`}
          >
            <Megaphone className={iconCls} />
            {label}
          </span>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs text-xs">
          Ten temat wybraliście w ankiecie „Jakiej recenzji szukasz?”
          {votes && votes > 0 ? ` — zebrał ${votes} głosów.` : "."}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
