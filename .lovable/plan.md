## Cel

Kampania Google Ads Performance Max nastawiona na **ruch na artykuły / świadomość marki** dla szortsy.pl — agregatora sportowych newsów 60-sekundowych. Kampania powstanie jako pauzowana; budżet, płatność i uruchomienie zostaną w rękach użytkownika po stronie Google Ads.

## Materiały wyjściowe (już mam)

- Nazwa marki: **Szortsy**
- Logo: `logo-icon.png` (pomarańczowa ikonka "S" z megafonem) oraz `logo-text.png` (z wordmarkiem) — użyję ich do groundingu i jako logo kampanii
- Ton wizualny live'a: minimalistyczne białe/pastel tło, akcenty pomarańcz + emerald, ikony sportów w kółkach, mocno "sport-first"
- Brak własnych zdjęć / screenów — generuję wszystko od zera, grounding na loga i screencie strony

## Krok 1 — 3 kierunki kreacji (po jednym kadrze square na każdy)

Zaproponuję 3 wyraźnie różne podejścia, każde jako pojedynczy obrazek 1200x1200 do porównania. **Zatrzymam się i poczekam na Twój wybór** — dopiero potem rozbuduję pełny set.

- **Kierunek A — "Sport w 60 sekund"**: fotograficzny kadr sportowy (piłkarz, biegacz albo koszykarz w akcji) z subtelnym, naturalnym countdown-timerem 60s wpisanym w scenę. Emocja + obietnica krótkiego formatu.
- **Kierunek B — "Wszystkie dyscypliny w jednym miejscu"**: dynamiczny kolaż/mozaika kadrów z różnych sportów (piłka, F1, tenis, koszykówka, MŚ 2026) — pokazuje szerokość agregatora i wielosportowość.
- **Kierunek C — "Newsy w telefonie kibica"**: życiowa scena (osoba w metrze/kawiarni/na kanapie) z telefonem, na którym widać wystylizowany feed Szortsów. Buduje kontekst użycia i nawyk codziennego zaglądania.

Każdy kierunek trzyma spójną paletę marki (pomarańcz + granat/emerald), bez tekstów reklamowych na obrazie, bez fake screenshotów UI, bez znaków obcych brandów/lig/klubów.

## Krok 2 — po wyborze kierunku: pełny set obrazów

Pod wybrany kierunek wygeneruję zestaw pod Performance Max, każdy kadr komponowany osobno (nie ten sam obraz w 3 crop'ach):

- **4x square** 1200×1200
- **4x landscape** 1200×628 (komponowane na szeroko, potem docięte do dokładnie 1200×628 by uniknąć rundowania modelu)
- **2x portrait** 960×1200

Wszystkie pliki lądują w `/mnt/documents/ads/` z krótkimi nazwami typu `szortsy-stadium-square-1.jpg`. Pokażę je w galerii do akceptacji — będzie można podmienić pojedyncze kadry.

## Krok 3 — copy (osobno, po zamknięciu obrazów)

Wspólna pula tekstów (rotowana przez Google z każdym obrazem, po polsku):

- **11–15 headlines** (do 30 znaków, min. 2 krótsze niż 15)
- **2–5 long headlines** (do 90 znaków)
- **4–5 descriptions** (do 90 znaków)

Zaproponuję próbkę + tabelę, dopiszemy razem, dopiero potem zapiszę cały set.

## Krok 4 — dalsze kroki (poza tym planem, do zrobienia po akceptacji kreacji)

Robimy je dopiero jak reklamy są gotowe:

1. Podłączenie konta Google (jednorazowo, workspace-level) i założenie/przypisanie konta Google Ads dla projektu
2. Ustawienie pomiaru konwersji (dla awareness rekomenduję "wejście na artykuł + scroll/read" jako conversion event)
3. Publikacja szortsy.pl jest już aktywna (widzę live) — landing OK
4. Utworzenie kampanii **PAUSED** — budżet, waluta (PLN), rynek (Polska), sitelinki
5. Ty w panelu Google Ads: dodajesz płatność, weryfikujesz reklamodawcę, włączasz kampanię

## Uczciwe zastrzeżenia

- Szortsy to serwis darmowy bez „twardej" konwersji sprzedażowej — Google Ads dowiezie ruch, ale koszty potrafią rosnąć szybko. Kampania powstanie pauzowana, więc masz kontrolę.
- Bez wideo Ad Strength realistycznie sięgnie „Good", nie „Excellent" — to normalne dla PMax bez YouTube assets.
- Wszystkie kadry generowane; brak zdjęć konkretnych zawodników, klubów, lig, znaków MŚ / FIFA / UEFA (prawo autorskie/znaki towarowe).

## Co teraz

Klikasz **Implement plan** → przechodzę do trybu build, generuję 3 kadry (po jednym na kierunek) i wracam z galerią do wyboru.