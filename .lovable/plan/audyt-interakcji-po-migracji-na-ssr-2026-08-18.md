# Audyt interakcji po migracji na SSR

Przejrzałem kod nawigacji i zdarzeń. Poza naprawionym już hoverem Stories widzę kilka miejsc, gdzie zachowanie kliknięć jest ryzykowne albo zmieniło się przy migracji. Poniżej co proponuję sprawdzić i naprawić.

## 1. Nawigacja na `onTouchEnd` (główne ryzyko)

Wzorzec `<a href> + onClick(preventDefault) + onTouchEnd(preventDefault) + navigate()` występuje w:
`NewsCard`, `NewsOfTheDay`, `TodaysNewsBanner` (2x), `MatchTicker`, `WorldCupHomeBanner`, `Header` (nawigacja), `StartPage`, `InstallPage`, `PWAInstallBanner`.

Problemy:
- `touchend` odpala się także wtedy, gdy palec tylko przesunął się po elemencie przy scrollu → przypadkowe przejścia na artykuł podczas przewijania.
- `preventDefault()` na `touchend` blokuje naturalne zachowanie linku, więc gdy JS jeszcze się nie zhydratował (SSR!), kliknięcie w ogóle nie działa lub działa niespójnie.
- Podwójne odpalenie (`touchend` + `click`) w części przeglądarek = dwie nawigacje / migający ekran.

Fix: zamienić te miejsca na zwykły `<Link>` z compat-shimu (renderuje `<a href>`, obsługuje ctrl/middle-click, preload i działa przed hydratacją). Handler `onTouchEnd` usuwamy; tam gdzie potrzebne jest ograniczenie klikalności do przycisku (Tech), zostaje sam `<Link>` na przycisku.

## 2. Kliknięcia przed hydratacją

Po migracji serwer oddaje pełny HTML, ale elementy oparte wyłącznie na `onClick`/`navigate` są martwe do momentu hydratacji (na mobile to ~1–2 s). Dotyczy m.in. przycisków „Przeczytaj więcej", banerów i menu w `Header`.

Fix: wszędzie, gdzie celem jest adres wewnętrzny, `<Link>`/`<a href>` zamiast czystego `onClick` — link jest klikalny natychmiast, bez JS.

## 3. Hover przypięty do zbyt szerokiego `.group`

W `styles.css` został jeszcze selektor `.group:hover .card-img-hover`. To ten sam wzorzec, który powodował błąd Stories. Sprawdzę kontenery z klasą `group`, które zawierają więcej niż jeden obrazek (`SponsorBanner`, `CrossChannelStrip`, listy kafelków) i w razie potrzeby zawężę do klasy pojedynczego kafelka (`.card-item:hover .card-img-hover`), analogicznie do `.story-item`.

## 4. Nawigacja ze stanem w adminie

`Dashboard` i `SuggestionsList` przekazują `state` (`sourceUrl`, `autoExtract`) do `PostEditor`. W TanStack Router stan przeżywa nawigację kliknięciem, ale ginie przy odświeżeniu strony — wtedy edytor otworzy się pusty bez auto-ekstrakcji.

Fix: przenieść te wartości do parametrów zapytania (`?sourceUrl=...&suggestionId=...`) z `state` jako fallbackiem, żeby przepływ „Wyciągnij artykuł" był odporny na reload.

## 5. Weryfikacja na żywo

Po zmianach przejdę Playwrightem po: strona główna → kafelek → artykuł, Tech → „Czytaj więcej", banery (dzień, mundial), menu w headerze, oraz sprawdzę scroll na wejściu w artykuł i brak błędów w konsoli — desktop i mobilny viewport.

## Szczegóły techniczne

- Bez zmian w `router-compat` API — tylko podmiana wzorca wywołań w komponentach.
- `navigate(-1)` (`InstallPage`) działa przez `router.history.go`, zostaje.
- Zmiany wyłącznie w warstwie prezentacji/nawigacji; logika danych bez zmian.
