import { useState, useEffect, useCallback } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const VISIT_COUNT_KEY = "szortsy_visit_count";
const DISMISS_KEY = "szortsy_pwa_dismiss_ts";
const INSTALLED_KEY = "szortsy_pwa_installed";
const DISMISS_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const MIN_VISITS = 2;

function getIsIOS() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
}

function getIsStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as any).standalone === true
  );
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [canShow, setCanShow] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    setIsIOS(getIsIOS());
    setIsStandalone(getIsStandalone());
    setIsInstalled(localStorage.getItem(INSTALLED_KEY) === "true");

    // Increment visit count
    const count = parseInt(localStorage.getItem(VISIT_COUNT_KEY) || "0", 10) + 1;
    localStorage.setItem(VISIT_COUNT_KEY, String(count));

    // Check if we can show the banner
    const dismissTs = localStorage.getItem(DISMISS_KEY);
    const cooledDown = !dismissTs || Date.now() - parseInt(dismissTs, 10) > DISMISS_COOLDOWN_MS;
    const enoughVisits = count >= MIN_VISITS;
    const notInstalled = localStorage.getItem(INSTALLED_KEY) !== "true";

    setCanShow(enoughVisits && cooledDown && notInstalled && !getIsStandalone());
  }, []);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const installedHandler = () => {
      setIsInstalled(true);
      setCanShow(false);
      localStorage.setItem(INSTALLED_KEY, "true");
    };

    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", installedHandler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", installedHandler);
    };
  }, []);

  const install = useCallback(async () => {
    if (!deferredPrompt) return false;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    if (outcome === "accepted") {
      localStorage.setItem(INSTALLED_KEY, "true");
      setIsInstalled(true);
      setCanShow(false);
      return true;
    }
    return false;
  }, [deferredPrompt]);

  const dismiss = useCallback(() => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setCanShow(false);
  }, []);

  return {
    canShow,
    isIOS,
    isStandalone,
    isInstalled,
    canInstallNative: !!deferredPrompt,
    install,
    dismiss,
  };
}
