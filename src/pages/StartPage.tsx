import { useNavigate } from "@/lib/router-compat";
import { useRef, useState, useEffect } from "react";
import { X, Timer, ShieldOff, Smartphone, FileText, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSEOMeta } from "@/hooks/useSEOMeta";

const features = [
  {
    icon: Timer,
    title: "Krótko lub na spokojnie",
    description: "Masz minutę? Przeczytaj blink. Masz więcej? Zanurz się w pełnym artykule. Ty decydujesz.",
  },
  {
    icon: ShieldOff,
    title: "Zero irytujących reklam",
    description: "Jedyny portal sportowy, gdzie reklamy nie zasłaniają treści i nie wyskakują znikąd.",
  },
  {
    icon: Smartphone,
    title: "Przeglądaj jak social media",
    description: "Przewijaj newsy jak stories. Każdy artykuł skrócony do esencji — swipe i wiesz.",
  },
  {
    icon: FileText,
    title: "Podsumowanie dnia",
    description: "Nie masz czasu śledzić wszystkiego? Dostaniesz obszerne podsumowanie najważniejszych wydarzeń.",
  },
  {
    icon: Clock,
    title: "Briefing na osi czasu",
    description: "Wszystkie newsy dnia ułożone chronologicznie. Jeden rzut oka i jesteś na bieżąco.",
  },
];

const StartPage = () => {
  const navigate = useNavigate();
  const inlineCtaRef = useRef<HTMLButtonElement>(null);
  const [showFloatingCta, setShowFloatingCta] = useState(true);

  useSEOMeta({
    title: "Rozpocznij",
    description: "Odkryj Szortsy — sportowe newsy w nowej formie. Krótko, bez reklam, na Twoich zasadach.",
    robots: "noindex, nofollow",
  });

  useEffect(() => {
    const el = inlineCtaRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setShowFloatingCta(!entry.isIntersecting),
      { threshold: 0.5 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const goHome = () => navigate("/");

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 overflow-y-auto" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
      {/* Close button */}
      <button
        onClick={goHome}
        onTouchEnd={(e) => { e.preventDefault(); goHome(); }}
        className="fixed top-4 right-4 z-10 rounded-full p-2 text-white/60 transition-colors"
        style={{ top: 'calc(1rem + env(safe-area-inset-top))' }}
        aria-label="Zamknij"
      >
        <X className="h-6 w-6" />
      </button>

      <div className="w-full max-w-2xl mx-auto px-6 pt-14 pb-32 sm:pt-12 sm:pb-12 flex flex-col items-center gap-8">
        {/* Logo / Header */}
        <div className="text-center space-y-3 animate-fade-in">
          <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
            Witaj na <span className="text-primary">Szortsy</span>
          </h1>
          <p className="text-white/60 text-lg">Sportowe newsy. Inaczej.</p>
          {/* Desktop CTA in header */}
          <Button
            onClick={goHome}
            size="default"
            className="hidden sm:inline-flex mt-2 px-8"
          >
            Sprawdzam →
          </Button>
        </div>

        {/* Features */}
        <div className="w-full space-y-4">
          {features.map((feature, i) => (
            <div
              key={feature.title}
              className="flex items-start gap-4 rounded-2xl bg-white/5 border border-white/10 p-5 backdrop-blur-sm animate-fade-in"
              style={{ animationDelay: `${(i + 1) * 120}ms`, animationFillMode: "both" }}
            >
              <div className="flex-shrink-0 rounded-xl bg-primary/20 p-3">
                <feature.icon className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h2 className="font-semibold text-white text-base">{feature.title}</h2>
                <p className="text-white/60 text-sm mt-1 leading-relaxed">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Inline CTA */}
        <Button
          ref={inlineCtaRef}
          onClick={goHome}
          size="lg"
          className="w-full sm:w-auto px-12 text-base animate-fade-in"
          style={{ animationDelay: "750ms", animationFillMode: "both" }}
        >
          Sprawdzam →
        </Button>
      </div>

      {/* Mobile floating CTA */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-20 sm:hidden transition-all duration-300 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent backdrop-blur-md pt-6 px-6 ${
          showFloatingCta ? "opacity-100 translate-y-0" : "opacity-0 translate-y-full pointer-events-none"
        }`}
        style={{ paddingBottom: 'calc(2rem + env(safe-area-inset-bottom))' }}
      >
        <Button
          onClick={goHome}
          size="lg"
          className="w-full text-base shadow-lg"
        >
          Sprawdzam →
        </Button>
      </div>
    </div>
  );
};

export default StartPage;
