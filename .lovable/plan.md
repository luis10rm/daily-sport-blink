# Detekcja "tego samego newsa innymi słowami"

## Stan obecny (krótka diagnoza)

W `scan-news-sources` duplikaty wykrywamy tylko na 2 sposoby:

1. **URL match** — `postUrlMap` po znormalizowanym `source_url`.
2. **Jaccard tokenów tytułu** ≥ 0.6 vs posty z ostatnich 30 dni.

Słabe strony — i odpowiedź na Twoje pytanie:

- Jaccard porównuje **dosłowne słowa** tytułu. "Lewandowski z dubletem w Lidze Mistrzów" vs "Dwa gole Polaka w meczu Barcelony" → ~10% podobieństwa, mimo że to ten sam news. Próg 0.6 odsiewa tylko bardzo podobne sformułowania.
- Porównujemy **tylko vs opublikowane posty**, nie vs inne sugestie z tego samego skanu. Dwa źródła piszą o tym samym → obie sugestie wpadną jako nowe.
- Nie używamy **excerptu** ani treści — tylko tytuł.
- Brak warstwy **semantycznej** (AI / embeddingi).

## Plan poprawy (3 warstwy, tania → droga)

### 1. Rozszerzony fingerprint tekstowy (deterministyczny, darmowy)
- Tokeny liczone z **tytuł + excerpt** (nie tylko tytuł).
- Stop-words PL/EN filtrowane (`w`, `na`, `the`, `vs`, `i`, itd.) — zostają tylko "treściwe" słowa.
- Ekstrakcja **nazw własnych** (słowa zaczynające się wielką literą w oryginale, ≥3 znaki) → osobny zbiór "entities" (Lewandowski, Barcelona, Real, Świątek, MŚ).
- Match: jeśli **≥3 wspólne entities** + jaccard treści ≥ 0.35 → duplikat.
- Próg ogólnego jaccarda obniżony do **0.45** (z 0.6).

### 2. Dedup w obrębie skanu (cross-source)
- Po zebraniu wszystkich `processOne` w danym przebiegu, budujemy `seenInThisScan` (entities + tytuł).
- Druga i kolejne sugestie o tym samym secie entities → oznaczone jako `dup` z `dupReason: "Inne źródło opisuje to samo wydarzenie (już w tej sesji skanu): <tytuł>"`.
- Zachowujemy ten z wyższym `ai.score` jako kanoniczny, resztę odrzucamy.

### 3. Warstwa semantyczna AI (opcjonalna, włączana flagą)
- Tylko dla kandydatów, które **przeszły** warstwy 1+2 i mają już opublikowany post o **≥2 wspólnych entities** w ostatnich 7 dniach → wołamy `google/gemini-2.5-flash` przez Lovable AI Gateway z krótkim promptem: "Czy te dwa newsy opisują to samo wydarzenie? TAK/NIE".
- Koszt: tylko gdy istnieje sensowny kandydat (rzadko), więc kilka–kilkanaście wywołań na skan.
- Flagę `useSemanticDedup: true` przekazujemy z UI (checkbox w skanerze, domyślnie ON).

## Co się zmienia w UI

- `dupReason` w `news_suggestions` będzie bardziej precyzyjny (entities + score + warstwa, która zdecydowała).
- W `SuggestionsList.tsx` badge "✅ Już na stronie" bez zmian — działa na `accepted_post_id`, który już ustawiamy.
- Dodajemy w panelu skanera mały toggle: **"Wykrywaj semantycznie ten sam temat (AI)"** — domyślnie ON.

## Pliki do zmiany

- `supabase/functions/scan-news-sources/index.ts` — helpers (`stopwords`, `extractEntities`, `contentTokens`), warstwa 2 (post-batch dedup), warstwa 3 (AI gate), parametr `useSemanticDedup`.
- `src/pages/admin/` (komponent triggera skanu) — checkbox + przekazanie flagi.

## Czego NIE zmieniamy

- Schemy DB (`accepted_post_id` już mamy).
- Logiki publikacji ani `bulk-prepare-suggestions`.
- Hooka `useExistingPostsByUrls` — dotyczy tylko URL.

## Pytanie do Ciebie

Czy chcesz od razu wszystkie 3 warstwy, czy zaczynamy od 1+2 (deterministyczne, zero kosztu AI), a semantykę dorzucamy później jeśli wciąż prześlizgują się duplikaty?
