
# Plan optymalizacji Core Web Vitals na mobile

## Zidentyfikowane problemy

### 1. LCP (Largest Contentful Paint)
- **Font Outfit** ładowany przez Google Fonts CSS bez `font-display: swap` - powoduje FOIT (Flash of Invisible Text)
- **NewsOfTheDay** - obraz "wiadomości dnia" nie ma `loading="eager"` ani `fetchPriority="high"`
- **Animacja `opacity-0 animate-fade-in`** na NewsOfTheDay opóźnia widoczność LCP elementu o ~500ms

### 2. CLS (Cumulative Layout Shift)
- **Stories Row** - brak zdefiniowanej wysokości kontenera powoduje przeskok layoutu po załadowaniu
- **TodaysNewsBanner** - brak placeholder z ustaloną wysokością w czasie ładowania
- **NewsOfTheDay** - aspect-ratio może powodować shift przy wolnym połączeniu

### 3. INP (Interaction to Next Paint)
- **Lucide Icons** - dynamiczny import całej biblioteki w `DynamicStoriesCircle.tsx` (import * as LucideIcons)
- **Animacja `animate-bounce`** w ScrollProgress działa ciągle - zużywa zasoby CPU
- **Backdrop blur** na Header sticky (`backdrop-blur-sm`) - kosztowny efekt na słabszych urządzeniach

---

## Proponowane optymalizacje

### Etap 1: Font Loading (LCP)
Zmiana sposobu ładowania fontu Outfit:
- Preload fontu w `index.html` z `font-display: swap`
- Dodanie lokalnego fallback fontu systemowego

```html
<!-- Preload najczęściej używanych wag fontu -->
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&display=swap" rel="stylesheet" media="print" onload="this.media='all'" />
```

### Etap 2: LCP Element Optimization
**NewsOfTheDay.tsx:**
- Dodać `loading="eager"` i `fetchPriority="high"` dla obrazu
- Usunąć `opacity-0 animate-fade-in` - LCP element musi być od razu widoczny
- Dodać `decoding="async"` dla obrazu

### Etap 3: CLS Fixes
**StoriesRow.tsx:**
- Dodać minimalną wysokość `min-h-[88px] md:min-h-[96px]` do kontenera

**TodaysNewsBanner.tsx:**
- Skeleton ma już dobrą wysokość - ok
- Dodać `min-h` do sekcji głównej

### Etap 4: INP / Performance
**DynamicStoriesCircle.tsx:**
- Zmienić z `import * as LucideIcons` na jawny import potrzebnych ikon
- Użyć lazy loading dla dynamicznych ikon

**ScrollProgress.tsx:**
- Zmienić `animate-bounce` na CSS animation z `will-change: transform`
- Dodać `animation-play-state: paused` gdy element nie jest widoczny

**Header.tsx:**
- Zamienić `backdrop-blur-sm` na lżejszy efekt lub tylko solid bg na mobile
- Opcjonalnie: użyć `@supports` dla urządzeń z prefers-reduced-motion

### Etap 5: Image Optimization
**NewsCard.tsx - już zoptymalizowany:**
- Pierwszy element ma `loading="eager"` i `fetchPriority="high"` ✓
- Pozostałe mają `loading="lazy"` ✓

**Dodatkowe:**
- Rozważyć srcset dla obrazów kategorii (różne rozmiary na mobile/desktop)

---

## Szczegóły techniczne

### Zmiany w plikach:

| Plik | Typ zmiany |
|------|-----------|
| `index.html` | Preload fontu, async loading |
| `src/components/NewsOfTheDay.tsx` | LCP optymalizacja obrazu, usunięcie animacji |
| `src/components/StoriesRow.tsx` | Dodanie min-height |
| `src/components/DynamicStoriesCircle.tsx` | Optymalizacja importu ikon |
| `src/components/ScrollProgress.tsx` | Lepsza animacja |
| `src/components/Header.tsx` | Lżejszy blur na mobile |
| `src/index.css` | Font-display fallback |

### Szacowany wpływ:
- **LCP**: -200-400ms (font swap + usunięcie animacji)
- **CLS**: ~0 (stabilne layouty)
- **INP**: -50-100ms (mniejszy bundle ikon, lżejsze efekty)

---

## Kolejność implementacji
1. Font loading (największy wpływ na LCP)
2. NewsOfTheDay optymalizacja
3. StoriesRow min-height
4. Header blur reduction (mobile)
5. Lucide Icons tree-shaking (opcjonalne - wymaga więcej zmian)
