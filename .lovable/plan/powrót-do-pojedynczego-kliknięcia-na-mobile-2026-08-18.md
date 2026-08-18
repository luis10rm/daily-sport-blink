# Powrót do pojedynczego kliknięcia na mobile

Cel: na telefonie każdy element ma reagować na pierwsze dotknięcie. Klikalne pozostają przyciski („Przeczytaj więcej", „Czytaj więcej", CTA banerów), nie całe kafelki.

## Co zmieniam

### 1. Zdejmuję warstwę JS z linków (główna zmiana)
Wszystkie miejsca, gdzie link ma `onClick(e.preventDefault()) + navigate(...)`, wracają do zwykłego linku (`<Link>` / `<a href>`) bez przechwytywania kliknięcia:
`NewsCard`, `NewsOfTheDay`, `ReviewCard`, `TodaysNewsBanner`, `TodaysMatchesBanner`, `AuthorCard`, `AuthorProfileCard`, `WorldCupBadge`, `NextMatchCountdown`, `WorldCupMatchCenter`, `WorldCupStoryPanels`, `Header`, `ReckiHeader`, `PozytywneHeader`, `ModeSwitcher`, `BlinkPage`, `CategoryPage`.

Dlaczego to pomaga: link bez `preventDefault` działa natychmiast, nawet zanim strona się „obudzi" po wczytaniu (SSR), i nie zależy od żadnego handlera. `useNavLink` zostaje usunięty jako niepotrzebna warstwa.

Nawigacja zostaje wyłącznie na przyciskach CTA — kafelek jako całość nie prowadzi nigdzie (bez zmiany względem obecnego zachowania w Tech).

### 2. Usuwam mobilne reguły CSS, które mogą wywoływać „pierwszy tap = tylko podświetlenie"
W `styles.css` w bloku `@media (hover: none) and (pointer: coarse)` jest `cursor: default` na `a, button, [role="button"]`. To nietypowy zapis, którego nie ma żadna typowa strona, a na iOS Safari wpływa na to, jak przeglądarka traktuje element jako klikalny. Usuwam `cursor: default`, zostawiam wyłączony szary tap-highlight i `touch-action: manipulation`.

### 3. Weryfikacja
- Test dotykowy (emulacja telefonu) na: kafelek sportowy → artykuł, kafelek Tech → „Czytaj więcej", baner dnia, mundial, menu w headerze, przełącznik Sport/Tech — każdy ma reagować na jedno dotknięcie, bez błędów w konsoli.
- Po wdrożeniu poproszę Cię o sprawdzenie na Twoim telefonie, bo część zachowań iOS Safari widać dopiero na realnym urządzeniu.

## Uwaga co do diagnozy
W emulacji telefonu (Chromium, touch) pojedyncze dotknięcie „Przeczytaj więcej" już teraz nawiguje poprawnie, więc dokładna przyczyna na Twoim urządzeniu nie jest jeszcze potwierdzona. Dlatego plan celowo usuwa całą nietypową warstwę (JS-owe przechwytywanie kliknięć + niestandardowe reguły CSS dla dotyku) i wraca do zachowania „jak na każdej innej stronie", zamiast zgadywać jeden pojedynczy winowajca.

## Szczegóły techniczne
- Bez zmian w logice danych, hookach i zapytaniach — tylko warstwa prezentacji/nawigacji.
- `navigate()` zostaje tam, gdzie nie ma adresu docelowego (np. `navigate(-1)`, akcje w StoriesViewer, przyciski w StartPage).
- Linki zewnętrzne (`source_url`) bez zmian: `target="_blank" rel="noopener noreferrer"`.
