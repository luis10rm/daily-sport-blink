import { useLocation, useNavigate } from "react-router-dom";
import { Cpu, Trophy, Sun, ChevronDown, Check } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

type ChannelKey = "sport" | "tech" | "positive";

const CHANNELS: Record<
  ChannelKey,
  { label: string; href: string; Icon: typeof Trophy; classes: string; dot: string }
> = {
  sport: {
    label: "Sport",
    href: "/",
    Icon: Trophy,
    classes: "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300",
    dot: "bg-emerald-500",
  },
  tech: {
    label: "Tech",
    href: "/tech",
    Icon: Cpu,
    classes: "border-fuchsia-600/40 bg-fuchsia-600/10 text-fuchsia-600 dark:text-fuchsia-300",
    dot: "bg-fuchsia-500",
  },
  positive: {
    label: "Pozytywne",
    href: "/pozytywne",
    Icon: Sun,
    classes: "border-lime-500/50 bg-lime-500/10 text-lime-700 dark:text-lime-300",
    dot: "bg-lime-500",
  },
};

const detectChannel = (pathname: string): ChannelKey => {
  if (pathname.startsWith("/tech") || pathname.startsWith("/recki")) return "tech";
  if (pathname.startsWith("/pozytywne")) return "positive";
  return "sport";
};

/**
 * Three-state channel switcher. Renders as a small pill with the current channel
 * label + icon; clicking opens a dropdown to switch between Sport / Tech / Pozytywne.
 */
export const ChannelSwitcher = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const active = detectChannel(location.pathname);
  const { Icon: ActiveIcon, label: activeLabel, classes: activeClasses } = CHANNELS[active];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
            activeClasses,
          )}
          aria-label={`Aktywny kanał: ${activeLabel}. Zmień kanał`}
        >
          <ActiveIcon className="h-3.5 w-3.5" />
          <span>{activeLabel}</span>
          <ChevronDown className="h-3 w-3 opacity-70" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        {(Object.keys(CHANNELS) as ChannelKey[]).map((key) => {
          const c = CHANNELS[key];
          const isActive = key === active;
          return (
            <DropdownMenuItem
              key={key}
              onClick={() => !isActive && navigate(c.href)}
              className="flex items-center gap-2 cursor-pointer"
            >
              <span className={cn("h-2 w-2 rounded-full", c.dot)} />
              <c.Icon className="h-4 w-4" />
              <span className="flex-1">{c.label}</span>
              {isActive && <Check className="h-3.5 w-3.5 opacity-70" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
