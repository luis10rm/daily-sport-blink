import { useEffect } from "react";
import type { QueryClient } from "@tanstack/react-query";
import { QueryClientProvider } from "@tanstack/react-query";
import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRouteWithContext,
  useRouter,
} from "@tanstack/react-router";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import { WallpaperProvider } from "@/contexts/WallpaperContext";
import { ConditionalWallpaper } from "@/components/ConditionalWallpaper";
import { Analytics } from "@/components/Analytics";
import { TournamentTheme } from "@/components/TournamentTheme";
import NotFound from "@/pages/NotFound";
import { reportLovableError } from "@/lib/lovable-error-reporting";
import appCss from "../styles.css?url";

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "UTF-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1.0, maximum-scale=5.0" },
      { title: "Szortsy - Wiadomości sportowe krótko i na temat" },
      {
        name: "description",
        content:
          "Szortsy – najważniejsze wiadomości sportowe w 60 sekund. Piłka nożna, F1, tenis, MMA i więcej. Krótko, konkretnie, codziennie. Bądź na bieżąco!",
      },
      { name: "author", content: "Szortsy" },
      { name: "robots", content: "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" },
      { property: "og:title", content: "Szortsy - Wiadomości sportowe krótko i na temat" },
      {
        property: "og:description",
        content:
          "Szortsy – najważniejsze wiadomości sportowe w 60 sekund. Piłka nożna, F1, tenis, MMA i więcej. Krótko, konkretnie, codziennie. Bądź na bieżąco!",
      },
      { property: "og:image", content: "https://szortsy.pl/og-image.png" },
      { property: "og:locale", content: "pl_PL" },
      { property: "og:site_name", content: "Szortsy" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Szortsy - Wiadomości sportowe" },
      {
        name: "twitter:description",
        content:
          "Szortsy – wiadomości sportowe w 60 sekund. Piłka nożna, F1, MMA i więcej. Krótko, codziennie.",
      },
      { name: "twitter:image", content: "https://szortsy.pl/og-image.png" },
      { name: "theme-color", content: "#0f172a" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", type: "image/png", href: "/favicon.png" },
      { rel: "apple-touch-icon", href: "/favicon.png" },
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&display=swap",
      },
      { rel: "preconnect", href: "https://meczyki.pl" },
      { rel: "preconnect", href: "https://sportowefakty.wp.pl" },
      { rel: "preconnect", href: "https://ocdn.eu" },
      { rel: "dns-prefetch", href: "https://meczyki.pl" },
      { rel: "dns-prefetch", href: "https://sportowefakty.wp.pl" },
      { rel: "dns-prefetch", href: "https://ocdn.eu" },
    ],
    scripts: [
      // Google Analytics (ported from index.html)
      { src: "https://www.googletagmanager.com/gtag/js?id=G-F9QDLPXFGG", async: true },
      {
        children:
          "window.dataLayer = window.dataLayer || [];function gtag(){dataLayer.push(arguments);}gtag('js', new Date());gtag('config', 'G-F9QDLPXFGG', { send_page_view: false });",
      },
      // Meta Pixel (ported from index.html)
      {
        children:
          "!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window, document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init', '1440716734345408');fbq('track', 'PageView');",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFound,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pl" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      {/* onTouchStart: iOS Safari :active-state enabler (ported from <body ontouchstart="">) */}
      <body onTouchStart={() => {}}>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange={false}
      >
        <AuthProvider>
          <WallpaperProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <Analytics />
              <TournamentTheme />
              <ConditionalWallpaper />
              <Outlet />
            </TooltipProvider>
          </WallpaperProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="w-full max-w-md text-center">
        <h1 className="mb-2 text-xl font-semibold text-foreground">Ta strona się nie wczytała</h1>
        <p className="mb-6 text-muted-foreground">
          Coś poszło nie tak. Spróbuj ponownie albo wróć na stronę główną.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <button
            type="button"
            className="rounded-md bg-primary px-4 py-2 text-primary-foreground"
            onClick={() => {
              router.invalidate();
              reset();
            }}
          >
            Spróbuj ponownie
          </button>
          <a href="/" className="rounded-md border border-border bg-card px-4 py-2 text-foreground">
            Strona główna
          </a>
        </div>
      </div>
    </div>
  );
}
