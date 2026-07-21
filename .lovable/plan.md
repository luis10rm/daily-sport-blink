# Cross-promocja kanałów: Tabs + Cross-channel Strip

Cel: dać użytkownikom sport.szortsy.pl widoczną, ale nienachalną świadomość kanałów Tech i Pozytywne oraz łatwą nawigację między nimi — bez uszczerbku dla ruchu sportowego.

## 1) Header: `ChannelSwitcher` → 3 widoczne taby

Zamiana obecnego dropdownu (jeden pill z chevronem) na 3 równorzędne, widoczne pigułki: **Sport · Tech · Pozytywne**. Aktywny kanał podświetlony kolorem kanału, nieaktywne w wersji ghost/outline z ikoną i etykietą.

- Zachowujemy istniejący komponent `src/components/ChannelSwitcher.tsx` — przepisujemy render z `DropdownMenu` na segmentowany kontrolkę (3 × `Link`).
- Desktop (≥ md): wszystkie 3 etykiety + ikony widoczne (`Sport`, `Tech`, `Pozytywne`).
- Mobile (< md): 3 ikony + krótkie etykiety (`Sport / Tech / Poz.`) — lub same ikony jeśli brakuje miejsca w headerze; aktywna zawsze z etykietą.
- Semantyka: `role="tablist"` z `aria-current="page"` na aktywnym.
- Zero zmian w logice detekcji kanału (`detectChannel`) i w miejscach użycia (`Header`, `PozytywneHeader`, `ReckiHeader`) — kontrakt komponentu ten sam.

Efekt: świadomość istnienia Tech/Pozytywne w każdej sesji, bez dodatkowego kliknięcia w dropdown.

## 2) Cross-channel Strip pod hero (tylko strona sportowa)

Nowa sekcja poniżej `NewsOfTheDay` w `src/pages/Index.tsx`, prezentująca najświeższy kontent z pozostałych 2 kanałów. Umieszczenie: **po `NewsOfTheDay`, przed `MatchOfTheDay` / `FeedbackBox`**, żeby nie konkurować z hero i nie rozbijać głównego feedu sportowego.

Layout desktop: dwie równe kolumny (Tech | Pozytywne), każda z:
- nagłówkiem sekcji z ikoną i kolorem kanału ("Świeżo w Tech" / "Świeżo w Pozytywnych") + małym linkiem "Zobacz wszystko →" prowadzącym do `/tech` lub `/pozytywne`,
- listą **2 najnowszych** artykułów z danego kanału (mały thumbnail + tytuł + data), klikalnych do `/blink/{slug}`.

Layout mobile: kolumny układają się jedna pod drugą (`grid-cols-1 md:grid-cols-2`), po 2 karty na kanał — bez horyzontalnego scrolla, żeby uniknąć „carousel blindness”.

Wizualnie: subtelny border/tło w kolorze kanału (fuchsia dla Tech, lime dla Pozytywne) tak, by strip był rozpoznawalny jako „inny kanał”, ale nie krzyczał. Karty mniejsze niż główne `NewsCard` — to sygnał, że to sekundarny kontent.

Nowy komponent: `src/components/CrossChannelStrip.tsx`
- Pobiera po 2 najnowsze `published` posty dla `channel = 'tech'` i `channel = 'positive'` z ostatnich 14 dni.
- Reużywa istniejących hooków: `usePostsFeed` (dodajemy opcjonalny arg `channel` + `limit`) lub — jeśli hook nie jest sparametryzowany — dedykowane query przez `supabase` w komponencie.
- Ukrywa całą sekcję, jeśli oba kanały są puste (fail-safe).

Nie ruszamy: feedu głównego, StoriesRow, banerów, headerów kanałów Tech/Pozytywne.

## Zakres techniczny

Pliki do zmiany / utworzenia:
- `src/components/ChannelSwitcher.tsx` — przepisanie renderu na segmentowane taby (bez zmian API).
- `src/pages/Index.tsx` — wstawienie `<CrossChannelStrip />` po `NewsOfTheDay`.
- `src/components/CrossChannelStrip.tsx` — nowy komponent (klient-side query, skeleton, empty-safe).
- Opcjonalnie: mały helper w `src/hooks/usePosts.tsx` do pobrania „latest by channel, limit N”, jeśli nie ma już takiego.

Poza zakresem (świadomie):
- Nie ruszamy `PozytywneHome` ani `ReckiHome` — chcemy najpierw zwalidować mechanikę na największym ruchu (Sport), potem ewentualnie zreplikować.
- Brak zmian w SEO/robots, sitemapie, edge functions.

## Metryki sukcesu (do obserwacji po wdrożeniu)

- CTR z tabów Tech/Pozytywne w headerze (event na klik).
- CTR ze strip’a (osobne eventy per kanał + per pozycja karty).
- Utrzymanie / brak spadku CTR w głównym feedzie sportowym (kontrola kanibalizacji).

Instrumentacja analityczna zostaje dodana w kolejnym kroku, o ile potwierdzisz jaki system eventów preferujesz (GA4 event names).
