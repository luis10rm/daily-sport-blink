## Cel
W sekcji TECH zmienić zachowanie kafelków recenzji: cała karta przestaje być klikalna, a nawigację przejmuje wyłącznie przycisk **„Czytaj więcej →"** umieszczony w stopce każdego wariantu kafelka.

## Zakres zmian (frontend only)

### `src/components/recki/ReviewCard.tsx`
Przepisać wszystkie trzy warianty (`hero`, `compact`, `default`):

- Zamienić zewnętrzny `<a {...navLink(to)}>` na `<article>` (lub `<div>`) — karta nie jest już linkiem.
- Usunąć `group-hover` efekty zoomu obrazu i podświetlania tytułu (skoro karta nie jest klikalna, hover na całości nie ma sensu).
- W stopce każdego wariantu dodać przycisk:
  ```tsx
  <a {...navLink(to)} className="...">
    Czytaj więcej →
  </a>
  ```
  z hookiem `useNavLink` (już używany w pliku) — to gwarantuje poprawną nawigację na iOS Safari bez double-tapa.

### Warianty i miejsce CTA

- **`hero`**: CTA jako solidny przycisk fuksjowy (`bg-fuchsia-600 text-white`) pod excerptem, w prawym dolnym rogu treści.
- **`default`**: CTA jako link-przycisk z fuksjową ramką lub tekstem `text-fuchsia-600 hover:text-fuchsia-700` z ikoną `ArrowRight` z `lucide-react`, wyrównany do lewej pod excerptem.
- **`compact`**: mały tekstowy link `Czytaj →` po prawej stronie zamiast całej karty jako linku. `ScoreBadge` pozostaje po prawej, CTA pod tytułem lub jako ikonka strzałki obok wyniku.

### Spójność z resztą serwisu
- Sport (NewsCard) ma klikalną całą kartę — TECH świadomie pójdzie inną drogą (przycisk-only) zgodnie z prośbą.
- Kursor na karcie wraca do `default`; tylko przycisk ma `cursor: pointer`.
- Karta zachowuje hover na cieniu (`hover:shadow-lg`) jako subtelny feedback, ale bez sugestii klikalności.

## Pliki, które nie wymagają zmian
- `useNavLink` — bez zmian, używany dalej w CTA.
- `ReckiHome.tsx`, `ReckiCategory.tsx` — używają `ReviewCard` jako black-box; zmiana jest transparentna.

## Test po wdrożeniu
- `/tech` — hero + sidebar + grid: tylko przyciski klikalne.
- `/tech/kategoria/:slug` — grid wariantów `default`: tylko przyciski.
- iOS Safari: pojedyncze tapnięcie na CTA przechodzi do recenzji.
