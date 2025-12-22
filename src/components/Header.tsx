import { Zap } from "lucide-react";

export const Header = () => {
  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Zap className="h-5 w-5" />
          </div>
          <span className="font-heading text-xl font-semibold text-foreground">
            SportFlash
          </span>
        </div>
        <p className="hidden text-sm text-muted-foreground sm:block">
          Najważniejsze ze sportu w 60 sekund
        </p>
      </div>
    </header>
  );
};
