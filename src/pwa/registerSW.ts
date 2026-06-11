/// <reference types="vite-plugin-pwa/client" />
import { registerSW } from "virtual:pwa-register";

/**
 * Single, guarded service-worker registration.
 *
 * Refuses to register in dev, iframes, and Lovable preview hosts, and in
 * any "refused" context proactively unregisters a previously-registered
 * /sw.js so stale workers from earlier builds don't keep serving the app.
 *
 * In production it uses `virtual:pwa-register` with `immediate: true` and
 * auto-applies updates the moment a new SW is detected. A `controllerchange`
 * listener then reloads the tab as soon as the new SW takes control — this
 * is what makes iOS Safari pick up changes within seconds of publishing,
 * instead of waiting until the user fully kills the app.
 *
 * Kill switch: visiting any URL with `?sw=off` unregisters the worker.
 */
export function registerAppSW() {
  if (typeof window === "undefined") return;
  if (!("serviceWorker" in navigator)) return;

  const host = window.location.hostname;
  const inIframe = (() => {
    try {
      return window.self !== window.top;
    } catch {
      return true;
    }
  })();

  const isPreviewHost =
    host.startsWith("id-preview--") ||
    host.startsWith("preview--") ||
    host === "lovableproject.com" ||
    host.endsWith(".lovableproject.com") ||
    host === "lovableproject-dev.com" ||
    host.endsWith(".lovableproject-dev.com") ||
    host === "beta.lovable.dev" ||
    host.endsWith(".beta.lovable.dev");

  const killSwitch = new URLSearchParams(window.location.search).get("sw") === "off";
  const refused = !import.meta.env.PROD || inIframe || isPreviewHost || killSwitch;

  if (refused) {
    // Best-effort cleanup of any previously registered app worker.
    navigator.serviceWorker
      .getRegistrations()
      .then((regs) => {
        regs.forEach((reg) => {
          const url = reg.active?.scriptURL || reg.installing?.scriptURL || reg.waiting?.scriptURL || "";
          if (url.endsWith("/sw.js") || url.endsWith("/service-worker.js")) {
            reg.unregister().catch(() => {});
          }
        });
      })
      .catch(() => {});
    return;
  }

  // Reload as soon as a new SW takes control of this page.
  let reloading = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (reloading) return;
    reloading = true;
    window.location.reload();
  });

  const updateSW = registerSW({
    immediate: true,
    onNeedRefresh() {
      // Auto-apply: skipWaiting + clientsClaim are on, so the new SW will
      // take control immediately and our controllerchange listener reloads.
      updateSW(true).catch(() => {});
    },
    onRegisteredSW(_swUrl, registration) {
      if (!registration) return;
      // Poll for updates every 30 minutes while the app is open.
      setInterval(() => {
        registration.update().catch(() => {});
      }, 30 * 60 * 1000);
      // Also check on tab focus — cheap and catches users coming back.
      window.addEventListener("focus", () => {
        registration.update().catch(() => {});
      });
    },
  });
}
