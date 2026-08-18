import { Link, useLocation } from "@/lib/router-compat";
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
    activeClasses:
      "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 ring-1 ring-inset ring-emerald-500/40",
    idleClasses:
      "text-muted-foreground hover:text-emerald-700 dark:hover:text-emerald-300 hover:bg-emerald-500/10",
  },
  tech: {
    label: "Tech",
    shortLabel: "Tech",
    href: "/tech",
    Icon: Cpu,
    activeClasses:
      "bg-fuchsia-600/15 text-fuchsia-700 dark:text-fuchsia-300 ring-1 ring-inset ring-fuchsia-600/40",
    idleClasses:
      "text-muted-foreground hover:text-fuchsia-700 dark:hover:text-fuchsia-300 hover:bg-fuchsia-600/10",
  },
  positive: {
    label: "Pozytywne",
    shortLabel: "Poz.",
    href: "/pozytywne",
    Icon: Sun,
    activeClasses:
      "bg-lime-500/15 text-lime-800 dark:text-lime-300 ring-1 ring-inset ring-lime-500/50",
    idleClasses:
      "text-muted-foreground hover:text-lime-800 dark:hover:text-lime-300 hover:bg-lime-500/10",
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
export const ChannelSwitcher = () => {
  const location = useLocation();
  const active = detectChannel(location.pathname);

  return (
    <nav
      role="tablist"
      aria-label="Wybór kanału"
      className="inline-flex items-center gap-0.5 rounded-full border border-border/60 bg-background/60 p-0.5 backdrop-blur-sm"
    >
      {(Object.keys(CHANNELS) as ChannelKey[]).map((key) => {
        const c = CHANNELS[key];
        const isActive = key === active;
        return (
          <Link
            key={key}
            to={c.href}
            role="tab"
            aria-selected={isActive}
            aria-current={isActive ? "page" : undefined}
            aria-label={c.label}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full text-xs font-semibold transition-colors touch-manipulation",
              // Idle na mobile: kompaktowa ikonowa pigułka. Na desktop pełny padding.
              isActive
                ? "px-2.5 py-1.5"
                : "p-1.5 sm:px-2.5 sm:py-1.5",
              isActive ? c.activeClasses : c.idleClasses,
            )}
          >
            <c.Icon className="h-3.5 w-3.5 shrink-0" />
            {/* Aktywny: zawsze pokazuj label. Idle: tylko od sm w górę. */}
            {isActive ? (
              <span>{c.label}</span>
            ) : (
              <span className="hidden sm:inline">{c.label}</span>
            )}
          </Link>
        );
      })}

    </nav>
  );
};
