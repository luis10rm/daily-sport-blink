# Zagospodarowanie luki pod tematem dnia na /tech

## Cel
Pod kaflem tematu dnia (lewa kolumna hero na /tech) zostaje ~360 px pustej przestrzeni, bo kolumna boczna z 3 kafelkami jest wyższa. Lukę wypełniamy istniejącym widgetem „Jakiej recenzji szukasz?", który zyska ekspozycję wysoko na stronie.

## Zmiany

### `src/pages/ReckiHome.tsx`
- Widget `ReviewRequestsWidget` trafia do lewej kolumny siatki hero, **pod** kartą tematu dnia:
  - desktop: lewa kolumna (`lg:col-span-2`) = kafel tematu dnia + widget pod spodem; prawa kolumna = 3 kafelki `mini` (bez zmian)
  - mobile: układ kolumnowy się spłaszcza, więc kolejność na mobile pozostaje taka sama jak obecnie (hero → widget → reszta)
- Usuwam dotychczasowy, samodzielny wiersz `<ReviewRequestsWidget />` pod hero.

### `src/components/recki/ReviewRequestsWidget.tsx`
- Drobne dostosowanie do węższej kolumny (2/3 szerokości na desktopie): zostaje jednokolumnowy, bez zmian struktury — pełna funkcjonalność (zgłaszanie, „Czy chodzi Ci o…", Top 4 z głosowaniem) działa identycznie.

## Weryfikacja
- Typecheck + zrzut ekranu /tech na desktopie (1440 px) i mobile (390 px): brak pustki pod tematem dnia, widget klikalny, głosowanie działa.
