## Stan obecny (`src/pages/Index.tsx`)

Kolejność na stronie głównej sportu:

1. Stories
2. **Top banner** (`home_top`, slot 300x250 na mobile) — linia 78
3. `TodaysMatchesBanner`, `TodaysNewsBanner`, `WorldCupHomeBanner`
4. **News of the Day** — linia 106
5. `CrossChannelStrip`, `MatchOfTheDay`, `FeedbackBox`, middle banner, feed…

Czyli reklama jest **nad** newsem dnia, tak jak wcześniej było w Tech.

## Zmiana

Analogicznie do Tech:

- Wyciągnąć blok `topBanner` do zmiennej `topBannerBlock` (renderowanej **tylko raz**, żeby nie dublować odsłon i pikseli `impression_tag`).
- Na **desktopie** zostaje w obecnym miejscu (nad `TodaysMatchesBanner`).
- Na **mobile** (`useIsMobile()`, już dostępne w komponencie) renderować go **bezpośrednio pod `NewsOfTheDay`**, przed `CrossChannelStrip`.
- Odstępy: `mb-8` w obu przypadkach, żeby rytm strony się nie zmienił; na mobile banner nie pojawia się w trakcie ładowania newsa dnia (zostaje po skeletonie, w tym samym miejscu w drzewie).

## Weryfikacja

Playwright 393×852: sprawdzić, że banner `home_top` występuje dokładnie raz i jest w DOM po sekcji newsa dnia; zrzut ekranu. Dodatkowo szybki sprawdzian desktop 1280px, że pozycja nad kafelkami nie zmieniła się.

## Szczegóły techniczne

- Plik: `src/pages/Index.tsx` — wyłącznie zmiana kolejności renderowania warunkowego, bez zmian w `useBanners`, w danych ani w slotach reklamowych w panelu admina.
