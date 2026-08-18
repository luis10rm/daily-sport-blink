import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { PatronBar } from "@/components/PatronBar";
import { WorldCupHero } from "@/components/worldcup/WorldCupHero";
import { NextMatchCountdown } from "@/components/worldcup/NextMatchCountdown";
import { WorldCupBracket } from "@/components/worldcup/WorldCupBracket";
import { WorldCupMatchesWidget } from "@/components/worldcup/WorldCupMatchesWidget";
import { WorldCupStandings } from "@/components/worldcup/WorldCupStandings";
import { WorldCupTopScorers } from "@/components/worldcup/WorldCupTopScorers";
import { WorldCupNewsAggregator } from "@/components/worldcup/WorldCupNewsAggregator";
import { useState } from "react";
import { ChevronDown, Table2 } from "lucide-react";

// Title, description, canonical i JSON-LD są ustawiane server-side
// w src/routes/mistrzostwa-swiata-2026.tsx (head()), żeby Google widział je bez JS.

const WorldCup2026 = () => {
  const [groupsOpen, setGroupsOpen] = useState(false);


  return (
    <div className="min-h-screen bg-background relative z-10">
      <Header />
      <PatronBar />
      <main id="main-content" className="container py-6 md:py-10">
        <WorldCupHero />
        <NextMatchCountdown />
        <div id="drabinka" />
        <WorldCupBracket />
        <div id="terminarz" />
        <WorldCupMatchesWidget />

        {/* Tabele grup — archiwum, domyślnie zwinięte */}
        <section className="mb-12 rounded-xl border border-border bg-card/40">
          <button
            type="button"
            onClick={() => setGroupsOpen((v) => !v)}
            aria-expanded={groupsOpen}
            aria-controls="wc-groups-panel"
            className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-card/70"
          >
            <span className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/15 text-amber-500">
                <Table2 className="h-4 w-4" />
              </span>
              <span>
                <span className="block text-sm font-bold text-foreground">Tabele fazy grupowej</span>
                <span className="block text-xs text-muted-foreground">Archiwum — grupy A–L</span>
              </span>
            </span>
            <ChevronDown
              className={`h-5 w-5 shrink-0 text-muted-foreground transition-transform ${
                groupsOpen ? "rotate-180" : ""
              }`}
            />
          </button>
          {groupsOpen && (
            <div id="wc-groups-panel" className="border-t border-border/60 p-4 md:p-6">
              <WorldCupStandings />
            </div>
          )}
        </section>

        <WorldCupTopScorers />
        <WorldCupNewsAggregator />
      </main>
      <Footer />
    </div>
  );
};

export default WorldCup2026;

