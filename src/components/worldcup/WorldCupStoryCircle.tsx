import { Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  onClick: () => void;
  className?: string;
}

export const WorldCupStoryCircle = ({ onClick, className }: Props) => (
  <button
    type="button"
    onClick={onClick}
    onTouchEnd={(e) => { e.preventDefault(); onClick(); }}
    aria-label="Strefa MŚ 2026"
    className={cn("flex flex-col items-center gap-1.5 group flex-shrink-0 touch-manipulation", className)}
  >
    <div className="relative p-[3px] rounded-full stories-circle-hover wc-gold-ring">
      <div className="bg-background rounded-full p-[2px]">
        <div className="w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center bg-gradient-to-br from-amber-500 via-amber-400 to-emerald-700">
          <Trophy className="w-6 h-6 md:w-7 md:h-7 text-white drop-shadow" />
        </div>
      </div>
    </div>
    <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 truncate max-w-[70px]">
      Strefa MŚ
    </span>
  </button>
);
