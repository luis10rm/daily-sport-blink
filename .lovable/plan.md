

## Równomierna rotacja banerów w slocie (50/50)

### Problem
W `useActiveBannerForDevice` zawsze zwracany jest pierwszy poprawny baner (sortowanie po `updated_at`). Gdy w slocie jest kilka aktywnych banerów, drugi nigdy się nie wyświetla.

### Rozwiązanie
Zwracać **wszystkich** kandydatów spełniających kryteria, a następnie po stronie klienta wybierać losowo jednego per odsłona. Przy 2 banerach losowanie z rozkładu jednostajnego daje ~50/50 ruchu w długim okresie. Dla N banerów — równomiernie 1/N każdy.

### Zmiany

**1. `src/hooks/useBanners.tsx` — `useActiveBannerForDevice`**
- Zmienić nazwę logiki: zamiast `find()` używać `filter()` żeby zwrócić tablicę wszystkich poprawnych banerów dla pozycji + urządzenia.
- W `queryFn` po pobraniu i przefiltrowaniu po datach/obrazach, losować jeden baner: `validBanners[Math.floor(Math.random() * validBanners.length)]`.
- Losowanie w `queryFn` (a nie w komponencie) działa naturalnie — każde świeże wywołanie zapytania = nowa odsłona = nowy los.
- Ustawić `staleTime: 0` i `gcTime: 0` dla tego query żeby React Query nie cache'ował wyniku między mountami strony (każde wejście = nowa odsłona = nowy los). Alternatywnie — losowanie dopiero w komponencie, ale wtedy hook musi zwracać tablicę. Wybieram opcję z `staleTime: 0`, bo nie zmienia API hooka i nie wymaga modyfikacji `Index.tsx` ani `ActiveSlotsOverview.tsx`.

**2. `src/components/admin/ActiveSlotsOverview.tsx`**
- Bez zmian funkcjonalnych — nadal pokazuje "Aktywny" + tytuł jednego banera. Dodać małą informację `(rotacja: N banerów)` jeśli w slocie jest więcej niż jeden aktywny baner — wymaga osobnego zapytania liczącego kandydatów. Opcjonalne, ale przydatne UX.

### Szczegóły techniczne (rotacja vs cache)
- Tracking impresji (`impression_tag`) jest już zaimplementowany w `SponsorBanner` per render — czyli każdy wybór = jeden impression pixel. Działa out-of-the-box.
- React Query z `staleTime: 0` przelosuje przy każdym mount strony głównej. Jeden użytkownik wracający 10× zobaczy ~5×A i ~5×B.
- W ramach jednej sesji bez przeładowania (SPA navigation) hook nie jest re-mountowany na tej samej stronie, więc baner się nie zmieni — to pożądane, żeby nie "skakał" w trakcie czytania.

### Pliki do edycji
- `src/hooks/useBanners.tsx` — modyfikacja `useActiveBannerForDevice`
- `src/components/admin/ActiveSlotsOverview.tsx` — opcjonalny licznik "rotacja: N"

