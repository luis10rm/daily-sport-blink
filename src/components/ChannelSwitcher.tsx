import { Link, useLocation } from "react-router-dom";
import { Cpu, Trophy, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

type ChannelKey = "sport" | "tech" | "positive";

const CHANNELS: Record<
  ChannelKey,
  {
    label: string;
    shortLabel: string;
    href: string;
    Icon: typeof Trophy;
    activeClasses: string;
    idleClasses: string;
  }
> = {
  sport: {
    label: "Sport",
    shortLabel: "Sport",
    href: "/",
    Icon: Trophy,
    activeClasses: "bg-primary text-primary-foreground",
    idleClasses: "text-muted-foreground hover:text-foreground hover:bg-muted",
  },
  tech: {
    label: "Tech",
    shortLabel: "Tech",
    href: "/tech",
    Icon: Cpu,
    activeClasses: "bg-primary text-primary-foreground",
    idleClasses: "text-muted-foreground hover:text-foreground hover:bg-muted",
  },
  positive: {
    label: "Pozytywne",
    shortLabel: "Poz.",
    href: "/pozytywne",
    Icon: Sun,
    activeClasses: "bg-primary text-primary-foreground",
    idleClasses: "text-muted-foreground hover:text-foreground hover:bg-muted",
  },
};

const detectChannel = (pathname: string): ChannelKey => {
  if (pathname.startsWith("/tech") || pathname.startsWith("/recki")) return "tech";
  if (pathname.startsWith("/pozytywne")) return "positive";
  return "sport";
};

/**
 * Segmented three-tab channel switcher: Sport · Tech · Pozytywne.
 * Renders all three channels visibly so users are always aware of the other
 * sections. The active channel gets its channel color; idle tabs are muted.
 */
export const ChannelSwitcher = ({ className }: { className?: string }) => {
  const location = useLocation();
  const active = detectChannel(location.pathname);

  return (
    <nav
      aria-label="Wybór kanału"
      className={cn("inline-flex items-center gap-1 rounded-full border border-border bg-background p-1", className)}
    >
      {(Object.keys(CHANNELS) as ChannelKey[]).map((key) => {
        const c = CHANNELS[key];
        const isActive = key === active;
        return (
          <Link
            key={key}
            to={c.href}
            aria-current={isActive ? "page" : undefined}
            aria-label={c.label}
            className={cn(
              "inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-full px-3 text-sm font-semibold transition-colors touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 lg:flex-none",
              isActive ? c.activeClasses : c.idleClasses,
            )}
          >
            <c.Icon className="h-3.5 w-3.5 shrink-0" />
            <span>{c.label}</span>
          </Link>
        );
      })}

    </nav>
  );
};
