## Cel
Podnieść „ciepłotę" strony `/pozytywne` czterema mikrogestami w hero — bez backendu, bez nowych zależności, jedna iteracja.

## Zmiany

### 1. Powitanie zależne od pory dnia (A1)
Nad H1 pojawia się mały, ciepły nagłówek zamiast statycznego układu:
- 05:00–11:59 — „Dzień dobry ☀️"
- 12:00–17:59 — „Miłego popołudnia 🌿"
- 18:00–22:59 — „Dobry wieczór ✨"
- 23:00–04:59 — „Dobrej nocy 🌙"
Renderowany jako `<p className="text-sm font-semibold text-lime-700 dark:text-lime-300 mb-1">`. Liczone raz przy montowaniu (bez tickera — pora dnia nie zmienia się co sekundę).

### 2. Mantra dnia (A2)
Pod paragrafem opisowym hero dochodzi cytat dnia w cudzysłowie drukarskim, wybierany deterministycznie po dacie (`Math.abs(hash(YYYY-MM-DD)) % QUOTES.length`) — ten sam cytat dla wszystkich odwiedzin w danym dniu.
- Pula 20 krótkich zdań w `src/lib/positiveQuotes.ts` (np. „Dziś świat zrobił krok w dobrą stronę.", „Dobre wiadomości też są prawdziwe.", „Zwolnij — coś dobrego chce zostać zauważone.").
- Wygląd: subtelny italic, przed cytatem cienki lime bar `border-l-2 border-lime-400/60 pl-3`.
- Nie pokazujemy w widoku pojedynczej kategorii — tylko na `/pozytywne` (główna).

### 3. Confetti-tap w liczniku „Dziś w Pozytywnych" (A3)
Chip „Dziś w Pozytywnych: X" staje się `button`. Pierwszy klik w sesji sypie limonkowo-białe confetti z pozycji chipa i lekko go „popsuwa" scale animacją.
- Bez biblioteki: własna funkcja `burstConfetti(x, y)` — tworzy 24 divy z random `translate/rotate` + `animate-[confetti_900ms_ease-out_forwards]`, cleanup po 1 s. Zdefiniuję keyframes `confetti` w `tailwind.config.ts` (opad z rotacją + fade).
- Guard: `sessionStorage.setItem('pozytywne-confetti', '1')`; po odświeżeniu można znów. Kolejne kliknięcia w tej samej sesji tylko lekki wobble (`animate-[wiggle_400ms_ease-in-out]`), bez confetti — nie irytuje.
- Respektuje `prefers-reduced-motion` (matchMedia): confetti wyłączone, tylko toast-badge „+1 dobra wiadomość dziś ✨" na 1.5 s.

### 4. Miękkie bloby w tle hero (A5)
W sekcji hero (`rounded-2xl` z lime gradientem) dochodzą dwa duże, rozmyte, niskoopacityowe koła lime, powoli dryfujące.
- `absolute inset-0 overflow-hidden pointer-events-none` na wrapperze; wewnątrz 2 divy `bg-lime-300/30 dark:bg-lime-500/15 blur-3xl w-72 h-72 rounded-full` z keyframami `float-slow-a` (20 s) i `float-slow-b` (28 s) — przesunięcie ±40 px + skala 1↔1.05.
- Nowe keyframes `float-slow-a/b` w `tailwind.config.ts`.
- Cała warstwa schowana pod `motion-safe:` — użytkownicy z `prefers-reduced-motion` widzą statyczne, delikatne kółka bez ruchu.
- Hero dostaje `relative overflow-hidden`, treść w `relative z-10`.

## Pliki
- **Nowe:** `src/lib/positiveQuotes.ts` (pula 20 mantr + helper `getQuoteOfDay(date=new Date())`), `src/lib/confetti.ts` (funkcja `burstConfetti(x, y, opts?)`).
- **Edytowane:** `src/pages/PozytywneHome.tsx` (powitanie, mantra tylko gdy `!inCategory`, chip → button z handlerem, bloby w tle hero), `tailwind.config.ts` (keyframes: `confetti`, `wiggle`, `float-slow-a`, `float-slow-b` + odpowiadające `animation:`).

## Poza zakresem
- Emoji-reactions, streak, mood filter, pick of the week, CTA-box, kalendarz — pozostają w backlogu do kolejnych iteracji.