import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { PatronBar } from "@/components/PatronBar";
import { WorldCupHero } from "@/components/worldcup/WorldCupHero";
import { NextMatchCountdown } from "@/components/worldcup/NextMatchCountdown";
import { WorldCupMatchesWidget } from "@/components/worldcup/WorldCupMatchesWidget";
import { WorldCupStandings } from "@/components/worldcup/WorldCupStandings";
import { WorldCupTopScorers } from "@/components/worldcup/WorldCupTopScorers";
import { WorldCupNewsAggregator } from "@/components/worldcup/WorldCupNewsAggregator";
import { useSEOMeta } from "@/hooks/useSEOMeta";
import { WORLD_CUP_START, WORLD_CUP_END } from "@/lib/worldCupTheme";
import { useEffect } from "react";

const HUB_URL = "https://szortsy.pl/mistrzostwa-swiata-2026";

const WorldCup2026 = () => {
  useSEOMeta({
    title: "Mistrzostwa Świata 2026 — wyniki, tabele, terminarz",
    description:
      "Wszystko o FIFA World Cup 2026: live wyniki, tabele grup, najlepsi strzelcy i nasze artykuły o mundialu. Aktualizacje co minutę.",
    canonical: HUB_URL,
  });

  // SportsEvent JSON-LD
  useEffect(() => {
    const id = "wc-sportsevent-ld";
    const old = document.getElementById(id);
    if (old) old.remove();
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.id = id;
    script.text = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "SportsEvent",
      name: "Mistrzostwa Świata w Piłce Nożnej 2026",
      startDate: WORLD_CUP_START.toISOString().slice(0, 10),
      endDate: WORLD_CUP_END.toISOString().slice(0, 10),
      eventStatus: "https://schema.org/EventScheduled",
      eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
      sport: "Football",
      url: HUB_URL,
      location: [
        { "@type": "Country", name: "Stany Zjednoczone" },
        { "@type": "Country", name: "Kanada" },
        { "@type": "Country", name: "Meksyk" },
      ],
      organizer: { "@type": "Organization", name: "FIFA", url: "https://www.fifa.com" },
    });
    document.head.appendChild(script);
    return () => { script.remove(); };
  }, []);

  return (
    <div className="min-h-screen bg-background relative z-10">
      <Header />
      <PatronBar />
      <main id="main-content" className="container py-6 md:py-10">
        <WorldCupHero />
        <NextMatchCountdown />
        <div id="terminarz" />
        <WorldCupMatchesWidget />
        <WorldCupStandings />
        <WorldCupTopScorers />
        <WorldCupNewsAggregator />
      </main>
      <Footer />
    </div>
  );
};

export default WorldCup2026;
