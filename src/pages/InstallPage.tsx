import { useNavigate } from "react-router-dom";
import { ArrowLeft, Share, Plus, MoreVertical, Download, CheckCircle2, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSEOMeta } from "@/hooks/useSEOMeta";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import logoIcon from "@/assets/logo-icon.png";

const benefits = [
  "Błyskawiczny dostęp z ekranu głównego",
  "Zero pasków przeglądarki — pełen ekran",
  "Działa nawet przy słabym internecie",
  "Brak irytujących reklam przeglądarki",
];

const InstallPage = () => {
  const navigate = useNavigate();
  const { isIOS, canInstallNative, install, isStandalone, isInstalled } = usePWAInstall();

  useSEOMeta({
    title: "Zainstaluj Szortsy",
    description: "Dodaj Szortsy do ekranu głównego swojego telefonu. Szybki dostęp do newsów sportowych bez otwierania przeglądarki.",
    robots: "noindex, nofollow",
  });

  const handleNativeInstall = async () => {
    await install();
  };

  if (isStandalone || isInstalled) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="text-center space-y-4 max-w-sm">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
            <CheckCircle2 className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Już zainstalowane!</h1>
          <p className="text-muted-foreground">
            Szortsy jest już na Twoim ekranie głównym. Korzystaj z pełnych możliwości.
          </p>
          <Button onClick={() => navigate("/")} className="mt-4">
            Przejdź do newsów
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="container flex items-center gap-3 h-14 px-4">
          <button
            onClick={() => navigate(-1)}
            onTouchEnd={(e) => { e.preventDefault(); navigate(-1); }}
            className="p-2 -ml-2 text-muted-foreground transition-colors touch-manipulation"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="font-semibold text-foreground">Zainstaluj Szortsy</h1>
        </div>
      </div>

      <div className="container max-w-lg mx-auto px-4 py-8 space-y-8">
        {/* Hero */}
        <div className="text-center space-y-4">
          <img src={logoIcon} alt="Szortsy" className="h-20 w-20 mx-auto rounded-2xl shadow-lg" />
          <div>
            <h2 className="text-2xl font-bold text-foreground">Szortsy na Twoim telefonie</h2>
            <p className="text-muted-foreground mt-2">
              Dodaj do ekranu głównego i czytaj newsy sportowe jak w natywnej aplikacji.
            </p>
          </div>
        </div>

        {/* Benefits */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Dlaczego warto?</h3>
          <div className="space-y-2">
            {benefits.map((b) => (
              <div key={b} className="flex items-center gap-3 rounded-xl bg-card border border-border p-3">
                <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                <span className="text-sm text-foreground">{b}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Native install button (Android/Chrome) */}
        {canInstallNative && (
          <Button onClick={handleNativeInstall} size="lg" className="w-full gap-2 text-base">
            <Download className="h-5 w-5" />
            Zainstaluj teraz
          </Button>
        )}

        {/* iOS instructions */}
        {isIOS && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Jak zainstalować na iPhone?
            </h3>
            <div className="space-y-3">
              <Step number={1} icon={<Share className="h-5 w-5" />}>
                Kliknij ikonę <strong>Udostępnij</strong> <Share className="h-4 w-4 inline" /> — w Safari na dole ekranu, w Chrome na górze (ikona strzałki)
              </Step>
              <Step number={2} icon={<Plus className="h-5 w-5" />}>
                Przewiń w dół i wybierz <strong>"Dodaj do ekranu początkowego"</strong> (Add to Home Screen)
              </Step>
              <Step number={3} icon={<Smartphone className="h-5 w-5" />}>
                Kliknij <strong>"Dodaj"</strong> w prawym górnym rogu
              </Step>
            </div>
          </div>
        )}

        {/* Android instructions (when native prompt not available) */}
        {!isIOS && !canInstallNative && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Jak zainstalować na Androidzie?
            </h3>
            <div className="space-y-3">
              <Step number={1} icon={<MoreVertical className="h-5 w-5" />}>
                Kliknij <strong>menu</strong> <MoreVertical className="h-4 w-4 inline" /> (trzy kropki) w prawym górnym rogu przeglądarki
              </Step>
              <Step number={2} icon={<Download className="h-5 w-5" />}>
                Wybierz <strong>"Zainstaluj aplikację"</strong> lub <strong>"Dodaj do ekranu głównego"</strong>
              </Step>
              <Step number={3} icon={<Smartphone className="h-5 w-5" />}>
                Potwierdź instalację klikając <strong>"Zainstaluj"</strong>
              </Step>
            </div>
          </div>
        )}

        {/* Back */}
        <div className="text-center pt-4">
          <Button variant="ghost" onClick={() => navigate("/")} className="text-muted-foreground">
            Wróć do newsów
          </Button>
        </div>
      </div>
    </div>
  );
};

const Step = ({
  number,
  icon,
  children,
}: {
  number: number;
  icon: React.ReactNode;
  children: React.ReactNode;
}) => (
  <div className="flex items-start gap-4 rounded-xl bg-card border border-border p-4">
    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
      {number}
    </div>
    <p className="text-sm text-foreground leading-relaxed pt-1">{children}</p>
  </div>
);

export default InstallPage;
