import { X, Download, Share } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import { useIsMobile } from "@/hooks/use-mobile";
import { useNavigate } from "react-router-dom";
import logoIcon from "@/assets/logo-icon.png";

export const PWAInstallBanner = () => {
  const { canShow, isIOS, canInstallNative, install, dismiss } = usePWAInstall();
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  if (!canShow || !isMobile) return null;

  const handleInstall = async () => {
    if (canInstallNative) {
      await install();
    } else {
      navigate("/zainstaluj");
      dismiss();
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 animate-fade-in sm:hidden">
      <div
        className="mx-3 mb-3 rounded-2xl border border-border bg-card/95 backdrop-blur-lg shadow-xl p-4"
        style={{ marginBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
      >
        <button
          onClick={dismiss}
          className="absolute top-3 right-3 p-1 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Zamknij"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-3">
          <img src={logoIcon} alt="Szortsy" className="h-10 w-10 rounded-xl" />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-foreground">Dodaj Szortsy na ekran główny</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isIOS
                ? "Newsy sportowe zawsze pod ręką"
                : "Szybki dostęp, zero reklam przeglądarki"}
            </p>
          </div>
        </div>

        <Button
          onClick={handleInstall}
          size="sm"
          className="w-full mt-3 gap-2"
        >
          {isIOS ? (
            <>
              <Share className="h-4 w-4" />
              Jak zainstalować?
            </>
          ) : (
            <>
              <Download className="h-4 w-4" />
              Zainstaluj
            </>
          )}
        </Button>
      </div>
    </div>
  );
};
