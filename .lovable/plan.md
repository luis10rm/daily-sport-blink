

## Rozmyte tło pod floating CTA na mobile

Aktualnie pływający przycisk "Sprawdzam →" na mobile jest umieszczony bezpośrednio nad treścią bez żadnego tła, co wygląda "surowo" — tekst pod spodem prześwituje.

### Plan

Dodam pod przyciskiem warstwę z rozmytym tłem (gradient + backdrop-blur), która będzie płynnie zanikać ku górze. Dzięki temu przycisk będzie wyraźnie oddzielony od treści poniżej.

### Szczegóły techniczne

**Plik: `src/pages/StartPage.tsx`** — modyfikacja sekcji floating CTA (linie ~109-120):

- Zamienię kontener `div` na wersję z:
  - `bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent` — gradient od dołu ku górze
  - `backdrop-blur-md` — rozmycie treści pod spodem
  - Większy padding (`pb-8 pt-6`) żeby przycisk miał "oddech"
  - `bottom-0 left-0 right-0` zamiast `bottom-8 left-6 right-6` — gradient na całą szerokość, przycisk z marginesami wewnętrznymi
  - Obsługa safe area na dole: `paddingBottom: 'calc(2rem + env(safe-area-inset-bottom))'`

Efekt: przycisk będzie wyglądał jakby "unosił się" nad rozmytą warstwą, a tekst pod spodem nie będzie przeszkadzał wizualnie.

