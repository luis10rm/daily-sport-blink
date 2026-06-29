## Problem
W `src/components/PatronBar.tsx` cały pasek jest `<div role="link">` z `onClick` → `window.open(...)`. W Inspekcie nie ma żadnego `<a href="...">`, więc klient (ani Google, ani narzędzia SEO/audytowe) nie widzi rzeczywistego linku sponsorskiego — wygląda jakby przekierowanie było „ukryte” w JS.

Dodatkowo wewnętrzny „przycisk” CTA to `<span>` z `pointer-events: none`, więc też nie ma realnego linku.

## Cel
Pasek patrona ma mieć **prawdziwy, widoczny w DOM `<a href="...">`** prowadzący do `cta_url`, tak żeby:
- inspektor pokazywał `<a href="https://...partner..." target="_blank" rel="sponsored noopener noreferrer">`,
- crawler / klient mógł zweryfikować adres docelowy bez uruchamiania JS,
- zachowane były atrybuty wymagane dla treści sponsorowanej (`rel="sponsored"`).

## Zmiany w `src/components/PatronBar.tsx`

1. **Kontener paska**: zamienić zewnętrzny `<div role="link" onClick=... onTouchEnd=...>` na:
   - `<a href={ctaUrl} target="_blank" rel="sponsored noopener noreferrer" aria-label="...">` gdy `ctaUrl` istnieje,
   - `<div>` (bez interakcji) gdy `ctaUrl` brak.
   
   Zachować dotychczasowe klasy, style tła, animację fade-in, sticky pozycję i wariant A/B (`data-patron-variant`).

2. **Usunąć** ręczne handlery `handleBarClick`, `handleBarTouchEnd`, `onKeyDown` z elementu głównego — natywny `<a target="_blank">` obsłuży to bez double-tap na iOS (Safari traktuje `<a href>` jako natywny link, więc problem „first tap focus, second tap click” nie wystąpi, podobnie jak rozwiązaliśmy to wcześniej dla `Header`/`NewsCard`).

3. **CTA „pill”**: pozostaje wizualnie jako `<span>` wewnątrz `<a>` (nie zagnieżdżamy linku w linku) — dzięki temu cały pasek jest jednym, czytelnym linkiem `<a href>`.

4. **Przycisk X (dismiss)**: pozostaje `<button>`, ale musi mieć `e.stopPropagation()` i `e.preventDefault()` zarówno w `onClick`, jak i `onTouchEnd`, żeby nie wywołać nawigacji linka rodzica. To już jest — tylko upewniamy się, że działa po zmianie na `<a>`.

5. **Tracking**: jeśli w przyszłości będziemy chcieli logować klik w `cta_url` per wariant A/B, dodamy `onClick` na `<a>` bez `preventDefault` (tylko fire-and-forget). W tej iteracji zostawiamy bez trackingu — priorytetem jest widoczny link.

## Efekt w Inspekcie

Po zmianie klient zobaczy w DOM dokładnie:

```html
<a
  href="https://partner.example.com/..."
  target="_blank"
  rel="sponsored noopener noreferrer"
  aria-label="Nazwa Patrona — Sprawdź"
  data-patron-variant="A"
  class="sticky top-16 z-40 w-full h-10 ..."
>
  ...logo + nazwa + pill CTA...
</a>
```

co jednoznacznie potwierdza poprawnie zaimplementowane przekierowanie sponsorskie.

## Zakres
Tylko jeden plik: `src/components/PatronBar.tsx`. Bez zmian w bazie, hookach, ani innych komponentach.
