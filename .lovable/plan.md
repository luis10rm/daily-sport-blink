

## Wyłączenie Wallpapera w panelu admina

### Problem
Komponent `WallpaperBackground` jest renderowany globalnie w `App.tsx`, **poza routerem**. Przez to:
1. Wallpaper wyświetla się na wszystkich stronach, włącznie z `/admin/*`
2. Klikalne skrzydła (`z-[1]`) przechwytują kliknięcia w panelu admina
3. Każde kliknięcie w obszar skrzydeł otwiera link kampanii

### Rozwiązanie

Przenieść komponent `WallpaperBackground` **do środka routera** i renderować go warunkowo - tylko na stronach publicznych (strona główna `/`).

### Zmiany w `src/App.tsx`

**1. Usunięcie globalnego renderowania:**

```tsx
// Usunąć (linia 36):
<WallpaperBackground />
```

**2. Przeniesienie do konkretnych tras:**

Dodać `WallpaperBackground` tylko tam, gdzie ma być widoczny - w komponencie `Index`:

```tsx
// W src/pages/Index.tsx dodać:
import { WallpaperBackground } from "@/components/WallpaperBackground";

// I renderować przed <Header />:
return (
  <div className={cn(...)}>
    <WallpaperBackground />
    <Header />
    ...
  </div>
);
```

### Alternatywne rozwiązanie (bez przenoszenia)

Jeśli chcemy zachować `WallpaperBackground` w `App.tsx`, można dodać warunek sprawdzający ścieżkę URL:

**W `src/components/WallpaperBackground.tsx`:**

```tsx
import { useLocation } from "react-router-dom";

export function WallpaperBackground() {
  const location = useLocation();
  const { wallpaper, isTakeoverActive } = useWallpaperContext();

  // Wyłącz na stronach admina
  const isAdminRoute = location.pathname.startsWith("/admin");
  
  if (!isTakeoverActive || !wallpaper || isAdminRoute) {
    return null;
  }
  // ... reszta kodu
}
```

**Problem:** `useLocation` wymaga, aby komponent był wewnątrz `BrowserRouter`. Obecnie `WallpaperBackground` jest **poza** routerem.

### Rekomendowane rozwiązanie

Przenieść `WallpaperBackground` **do środka routera** i dodać warunek na ścieżkę:

**`src/App.tsx`:**

```tsx
// Przed (linia 36-37):
<WallpaperBackground />
<BrowserRouter>

// Po:
<BrowserRouter>
  <ConditionalWallpaper />
```

Gdzie `ConditionalWallpaper` to nowy wrapper:

**`src/components/ConditionalWallpaper.tsx`:**

```tsx
import { useLocation } from "react-router-dom";
import { WallpaperBackground } from "./WallpaperBackground";

export function ConditionalWallpaper() {
  const location = useLocation();
  
  // Nie renderuj wallpapera na stronach admina i auth
  if (location.pathname.startsWith("/admin") || location.pathname === "/auth") {
    return null;
  }
  
  return <WallpaperBackground />;
}
```

### Podsumowanie zmian

| Plik | Zmiana |
|------|--------|
| `src/App.tsx` | Przenieść `WallpaperBackground` do środka `BrowserRouter` |
| `src/components/ConditionalWallpaper.tsx` | **Nowy plik** - wrapper sprawdzający ścieżkę |
| `src/components/WallpaperBackground.tsx` | Bez zmian |

### Efekt

- Strona główna (`/`): Wallpaper aktywny, skrzydła klikalne
- Panel admina (`/admin/*`): Brak wallpapera, normalna obsługa kliknięć
- Strona logowania (`/auth`): Brak wallpapera

