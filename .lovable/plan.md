

## Landing Page `/start` — Onboarding Banner dla nowych użytkowników z kampanii

### Cel
Stworzenie dedykowanej strony `/start`, która wita nowych użytkowników z kampanii reklamowych atrakcyjnym, pełnoekranowym banerem prezentującym wartości Szortsy. Po zamknięciu (CTA lub X) użytkownik trafia na stronę główną.

### Co powstanie

Pełnoekranowy overlay/modal z 5 sekcjami ułożonymi pionowo, każda z ikoną i krótkim hasłem. Styl: ciemne tło z gradientem, duże ikony z Lucide, animowane wejścia sekcji.

**Treści na banerze (zredagowane):**

1. **⏱ Krótko lub na spokojnie** — Masz minutę? Przeczytaj blink. Masz więcej? Zanurz się w pełnym artykule. Ty decydujesz.

2. **🚫 Zero irytujących reklam** — Jedyny portal sportowy, gdzie reklamy nie zasłaniają treści i nie wyskakują znikąd.

3. **📱 Przeglądaj jak social media** — Przewijaj newsy jak stories. Każdy artykuł skrócony do esencji — swipe i wiesz.

4. **📋 Podsumowanie dnia** — Nie masz czasu śledzić wszystkiego? Dostaniesz obszerne podsumowanie najważniejszych wydarzeń.

5. **⏰ Briefing na osi czasu** — Wszystkie newsy dnia ułożone chronologicznie. Jeden rzut oka i jesteś na bieżąco.

Na dole: przycisk CTA **"Sprawdzam →"** (prowadzi do `/`).
W prawym górnym rogu: przycisk **X** (też prowadzi do `/`).

### Szczegóły techniczne

**Nowe pliki:**
- `src/pages/StartPage.tsx` — komponent strony z pełnoekranowym banerem
- Animacje wejścia sekcji przez CSS (staggered fade-in + slide-up)

**Modyfikacje:**
- `src/App.tsx` — dodanie trasy `<Route path="/start" element={<StartPage />} />`

**Zachowanie:**
- Kliknięcie CTA lub X → `navigate("/")` (React Router)
- Strona nie wymaga autentykacji ani backendu
- SEO: meta tag `noindex` (strona kampanijna, nie do indeksowania)
- Responsywna: na mobile sekcje w jednej kolumnie, na desktop 2-3 kolumny lub centered single column

