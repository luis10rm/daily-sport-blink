import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// Keep the production UI independent from a separate CSS request. Some mobile
// networks have been observed returning the stylesheet successfully without
// Safari applying it, leaving the app rendered as raw HTML. Inlining the
// generated stylesheet costs little after Brotli compression and removes that
// network/cache failure point entirely.
const inlineProductionCss = (): Plugin => ({
  name: "inline-production-css",
  apply: "build",
  enforce: "post",
  generateBundle(_options, bundle) {
    const htmlEntry = bundle["index.html"];
    if (!htmlEntry || htmlEntry.type !== "asset" || typeof htmlEntry.source !== "string") return;

    const cssFiles = Object.entries(bundle).filter(
      ([fileName, output]) => fileName.endsWith(".css") && output.type === "asset",
    );

    let html = htmlEntry.source;
    for (const [fileName, output] of cssFiles) {
      if (output.type !== "asset") continue;
      const css = typeof output.source === "string" ? output.source : new TextDecoder().decode(output.source);
      const escapedFileName = fileName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const stylesheetPattern = new RegExp(
        `<link\\s+rel=["']stylesheet["'][^>]*href=["']/<?${escapedFileName}["'][^>]*>`,
        "g",
      );

      if (!stylesheetPattern.test(html)) continue;
      html = html.replace(stylesheetPattern, `<style data-inline-app-css>${css}</style>`);
      delete bundle[fileName];
    }

    htmlEntry.source = html;
  },
});

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    VitePWA({
      selfDestroying: true,
      registerType: "autoUpdate",
      injectRegister: null,
      devOptions: { enabled: false },
      includeAssets: ["favicon.png", "favicon.ico", "favicon.svg", "logo-seo.png"],
      workbox: {
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
        globPatterns: ["**/*.{js,css,html,ico,png,svg,webp,woff2}"],
        navigateFallbackDenylist: [/^\/~oauth/],
        skipWaiting: true,
        clientsClaim: true,
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            // HTML navigations: always try network first so freshly-published
            // pages reach users without waiting for cache invalidation.
            urlPattern: ({ request }) => request.mode === "navigate",
            handler: "NetworkFirst",
            options: {
              cacheName: "html-navigations",
              networkTimeoutSeconds: 3,
              expiration: { maxEntries: 32, maxAgeSeconds: 60 * 60 * 24 },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-cache",
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "gstatic-fonts-cache",
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
        ],
      },
      manifest: {
        name: "Szortsy — Sportowe newsy w 60 sekund",
        short_name: "Szortsy",
        description: "Najważniejsze wiadomości sportowe w 60 sekund. Krótko, konkretnie, codziennie.",
        theme_color: "#0f172a",
        background_color: "#0f172a",
        display: "standalone",
        orientation: "portrait",
        scope: "/",
        start_url: "/",
        lang: "pl",
        categories: ["news", "sports"],
        icons: [
          {
            src: "/favicon.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/logo-seo.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "/logo-seo.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
    }),
    inlineProductionCss(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
