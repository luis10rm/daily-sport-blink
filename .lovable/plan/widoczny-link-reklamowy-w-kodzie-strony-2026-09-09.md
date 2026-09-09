# Widoczny link reklamowy w kodzie strony

Cel: partner reklamowy, który otwiera podgląd kodu strony (inspect), ma zobaczyć prawdziwy adres docelowy przy pasku patrona, banerze i tapecie — dziś część miejsc otwiera kampanię skryptem i w kodzie nie ma żadnego adresu.

## Co się zmieni

1. **Pasek patrona** — zawsze zwykły link `<a href="...">` z prawdziwym adresem kampanii, także dla adresów systemów reklamowych (DoubleClick, Adform, Gemius, AdOcean). Znika wariant bez adresu w kodzie.
2. **Baner sponsorski** — dziś cały klikalny obszar to zwykły blok bez adresu. Zamieniamy go na link `<a href="...">` (grafika desktop i mobile oraz przycisk CTA), zachowując wygląd bez zmian.
3. **Tapeta (wallpaper)** — te same dwa klikalne obszary po bokach dostają prawdziwy `href`.
4. **Zachowujemy wszystko, co działa dzisiaj**: liczenie kliknięć, `rel="sponsored noopener"` (partner nadal widzi szortsy.pl jako źródło), otwieranie w nowej karcie, awaryjne przejście w tej samej karcie, ochronę przed przypadkowym kliknięciem przy przewijaniu.

## Kompromis, o którym warto wiedzieć

Adres w kodzie oznacza, że blokery reklam znów mogą rozpoznać i ukryć te elementy u części użytkowników z AdBlockiem (dokładnie dlatego adres był wcześniej chowany). W zamian klient widzi link w inspekcji, a linki działają natywnie i niezawodnie na mobile. Jeśli po kilku dniach zobaczymy spadek kliknięć, mogę wrócić do wersji mieszanej.

## Szczegóły techniczne

- `src/components/PatronBar.tsx`: usunięcie gałęzi `isAdTrackerUrl` z `role="link"`; jedna ścieżka renderowania `<a href={ctaUrl} target="_blank" rel="sponsored noopener">` z `logAdClick` w `onClick` i strażnikiem `wasScrollGesture()`.
- `src/components/SponsorBanner.tsx`: `div[role="link"]` → `<a href={safeCtaUrl}>` w trybie takeover, w wariancie z grafiką i w wariancie tekstowym; przyciski CTA (`<button>`) → `<a>` ze stylem przycisku; `handleClick` zostaje tylko do logowania kliknięcia i anulowania przy przewijaniu (bez `window.open`).
- `src/components/WallpaperBackground.tsx`: oba `role="link"` → `<a href={wallpaper.click_url} target="_blank" rel="sponsored noopener">`, logowanie kliknięcia bez zmian.
- `src/lib/adUrl.ts` przestaje być używany przez `PatronBar` (plik zostaje, gdyby był potrzebny do powrotu).
- Weryfikacja: Playwright — sprawdzenie, że w HTML paska, banera i tapety jest atrybut `href` z adresem kampanii oraz że kliknięcie prowadzi do partnera i zapisuje wpis w `ad_clicks`.
