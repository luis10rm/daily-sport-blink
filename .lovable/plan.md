

## Wallpaper/Screening Premium - Spójny Design

### Problem do rozwiązania
Gdy aktywny jest wallpaper (np. czerwone tło klienta), baner w środku strony ma własne białe tło z ramką, co tworzy efekt "wycięcia" i brak spójności wizualnej.

### Rozwiązanie: Tryb "Takeover"

Wprowadzić tryb kampanii premium, w którym:
1. Wallpaper przejmuje tło całej strony (klikalne boczne obszary)
2. Baner środkowy automatycznie przełącza się w tryb "borderless" - bez ramek, bez tła

### Architektura wizualna

```text
NORMALNY TRYB:
┌─────────────────────────────────────────────────────────────────┐
│                     BIAŁE TŁO STRONY                            │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ ╭──────────────────────────────────────────────────────╮│    │
│  │ │ Partner Szortsy                           (ramka)    ││    │
│  │ ├──────────────────────────────────────────────────────┤│    │
│  │ │            BANER 970x250                             ││    │
│  │ ├──────────────────────────────────────────────────────┤│    │
│  │ │ [CTA]                                     (ramka)    ││    │
│  │ ╰──────────────────────────────────────────────────────╯│    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘

TRYB TAKEOVER (wallpaper aktywny):
┌─────────────────────────────────────────────────────────────────┐
│ ████████                  CONTENT                    ████████   │
│ ████████                                             ████████   │
│ ██ KLIK ██  ┌─────────────────────────────────────┐ ██ KLIK ██  │
│ ██ LEFT ██  │                                     │ ██ RIGHT██  │
│ ████████    │            BANER 970x250            │ ████████    │
│ ████████    │         (bez ramki, bez tła!)       │ ████████    │
│ ████████    │                                     │ ████████    │
│ ████████    └─────────────────────────────────────┘ ████████    │
│ ████████           CTA wycentrowany poniżej         ████████    │
│ ████████                                             ████████   │
└─────────────────────────────────────────────────────────────────┘
  └───────┘                                           └───────┘
   Klikalne                                            Klikalne
```

### Struktura bazy danych

Nowa tabela `wallpapers`:

| Kolumna | Typ | Opis |
|---------|-----|------|
| id | uuid | Klucz główny |
| name | text | Nazwa kampanii (np. "Black Friday 2026") |
| background_image_url | text | Główna grafika tła (rozciągana) |
| left_wing_url | text | Opcjonalna grafika lewa (fixed) |
| right_wing_url | text | Opcjonalna grafika prawa (fixed) |
| background_color | text | Kolor fallback (np. "#ff0000") |
| click_url | text | URL po kliknięciu w boczne obszary |
| linked_banner_id | uuid | FK do banners - który baner jest częścią kampanii |
| is_active | boolean | Czy aktywny |
| start_date | timestamptz | Początek emisji |
| end_date | timestamptz | Koniec emisji |
| min_screen_width | integer | Min. szerokość ekranu (default 1280px) |

### Komponenty

**1. `WallpaperProvider.tsx`** - Context Provider
- Pobiera aktywny wallpaper z bazy
- Udostępnia info czy tryb takeover jest włączony
- Przekazuje `linkedBannerId` do wykrycia przez SponsorBanner

**2. `WallpaperBackground.tsx`** - Komponent tła
- Renderuje się na poziomie App.tsx, poniżej contentu
- Zawiera klikalne obszary left/right z `position: fixed`
- Ustawia `background-image` lub `background-color` na body

**3. Modyfikacja `SponsorBanner.tsx`**
- Nowy prop `isTakeoverMode?: boolean` (lub z contextu)
- Gdy aktywny: usuwa ramki, header "Partner Szortsy", footer z CTA
- Renderuje czystą grafikę 970x250 bez obramowania
- CTA przeniesiony jako overlay lub poniżej (prosty tekst)

### Flow renderowania

```text
┌─────────────────────────────────────────────────────┐
│ App.tsx                                             │
│   └─ WallpaperProvider                              │
│        └─ WallpaperBackground (fixed, z-index: -1)  │
│        └─ Index.tsx                                 │
│             └─ SponsorBanner                        │
│                  → sprawdza: czy mój banner_id      │
│                    === wallpaper.linked_banner_id?  │
│                  → jeśli TAK → tryb borderless      │
└─────────────────────────────────────────────────────┘
```

### Wygląd SponsorBanner w trybie Takeover

**Normalny:**
```tsx
<div className="rounded-2xl border border-border bg-card">
  <div className="bg-muted/50">Partner Szortsy</div>
  <img src={banner} />
  <div className="bg-muted/50"><button>CTA</button></div>
</div>
```

**Takeover (borderless):**
```tsx
<div className="flex flex-col items-center">
  <img 
    src={banner} 
    className="cursor-pointer" 
    onClick={handleClick}
  />
  <span className="text-xs text-white/80 mt-2">
    Reklama · {title}
  </span>
</div>
```

### Zmiany w plikach

| Plik | Akcja |
|------|-------|
| `supabase/migrations/` | Utworzenie tabeli `wallpapers` |
| `src/hooks/useWallpaper.tsx` | Hook do pobierania aktywnego wallpapera |
| `src/components/WallpaperBackground.tsx` | Komponent renderujący tło i klikalne skrzydła |
| `src/contexts/WallpaperContext.tsx` | Context z info o aktywnej kampanii |
| `src/components/SponsorBanner.tsx` | Dodanie trybu `isTakeoverMode` |
| `src/App.tsx` | Wrapper z WallpaperProvider |
| `src/pages/admin/WallpaperEditor.tsx` | Panel admina do zarządzania |
| `src/pages/admin/WallpapersList.tsx` | Lista kampanii wallpaper |

### Responsywność

| Breakpoint | Zachowanie |
|------------|------------|
| Desktop (>1280px) | Pełny efekt wallpaper + borderless banner |
| Tablet (768-1280px) | Tylko background-color, baner normalny |
| Mobile (<768px) | Brak wallpapera, baner normalny |

### Uwagi techniczne

- Wallpaper renderowany z `position: fixed`, `inset: 0`, `z-index: -1`
- Klikalne obszary mają `pointer-events: auto` tylko na bokach
- Główny content ma `pointer-events: auto` i `position: relative`
- Grafiki boczne mogą być typu `background-attachment: fixed` dla efektu parallax

