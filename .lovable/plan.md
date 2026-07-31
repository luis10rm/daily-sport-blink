## Cel
Dziś hero na `/tech` to po prostu najnowszy opublikowany artykuł (`ReckiHome.tsx` bierze `reviews[0]`). Chcesz móc ręcznie decydować, co jest tematem dnia — tak jak „News dnia” działa w kanale sportowym.

## Jak to zadziała
- W edytorze artykułu Tech (`/admin/recki/...`) pojawia się przełącznik **„Temat dnia”**.
- Tylko jeden artykuł Tech może być tematem dnia — włączenie flagi automatycznie zdejmuje ją z poprzedniego.
- Na `/tech` wybrany artykuł zawsze ląduje w dużym kafelku hero (z plakietką „Temat dnia”), niezależnie od daty publikacji. Trzy mini-karty obok to kolejne najnowsze artykuły.
- Jeśli nic nie jest zaznaczone albo wybrany artykuł nie jest opublikowany — działa dotychczasowe zachowanie (hero = najnowszy).
- Na liście artykułów Tech w panelu widać oznaczenie, który jest tematem dnia (analogicznie do „News dnia” w postach sportowych).

## Zakres techniczny
1. **Baza:** dodanie kolumny `is_topic_of_day boolean not null default false` do tabeli `reviews` + częściowy unikalny indeks gwarantujący maks. jeden wpis `true`.
2. **Hooki (`src/hooks/useReviews.tsx`):** pobieranie flagi w zapytaniach, nowy `useTechTopicOfDay()`, oraz mutacja ustawiająca flagę (najpierw czyści poprzednią, potem ustawia nową).
3. **Panel:** przełącznik w `ReviewEditor.tsx` (Zod + formularz), plakietka w `ReviewsList.tsx`.
4. **Frontend:** `ReckiHome.tsx` — hero = temat dnia (fallback: najnowszy), wykluczenie go z dalszych sekcji, plakietka „Temat dnia” w `ReviewCard` (wariant `hero`) w kolorystyce Tech (fuchsia/pink).

## Uwaga
Sekcja Tech opiera się na tabeli `reviews` (recenzje/newsy tech), a nie na `posts`, więc flagę dodaję tam — nie ruszam logiki „News dnia” w sporcie.
