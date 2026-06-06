## Diagnoza

W logach `bulk-prepare-suggestions` powtarza się dokładnie ten sam błąd:

```
Insert posta: canceling statement due to statement timeout
```

Czyli **AI generuje treść poprawnie**, ale wywala się dopiero `INSERT INTO posts`. Dlaczego pojedynczy insert pada na timeout?

Sprawdziłem triggery na `posts`:

```
sync_tags_on_post_change  AFTER INSERT OR DELETE OR UPDATE  FOR EACH STATEMENT  EXECUTE sync_tags()
```

A funkcja `sync_tags()`:
1. Robi `SELECT … FROM posts, unnest(tags)` po **wszystkich opublikowanych postach** (z każdym dniem coraz większy zbiór).
2. Dla każdego unikalnego tagu wykonuje `INSERT … ON CONFLICT … UPDATE`.
3. Na koniec robi `UPDATE tags SET post_count = (SELECT count(*) FROM posts WHERE name = ANY(tags))` — czyli **N razy pełny skan tabeli posts** (jeden subselect per wiersz w `tags`).

Czyli każdy pojedynczy INSERT do `posts` triggeruje pełny przeskan ~setek postów i kilkuset tagów. Plus `bulk-prepare` puszcza **3 wstawki równolegle** (`CONCURRENCY = 3`), więc trzy ciężkie sync_tags() łapią się nawzajem za locki na tabeli `tags` → statement timeout.

To wyjaśnia wzorzec, który widać w logach: pierwsza wstawka czasem przechodzi (`✓`), a druga/trzecia z tej samej trójki padają (`✗ statement timeout`). Im więcej postów w DB, tym częściej.

## Plan naprawy

### 1. Przepisać `sync_tags()` na inkrementalny per-row trigger (główny fix)

Zamiast pełnego skanu wszystkich postów po każdym INSERT, trigger powinien przetwarzać tylko tagi z `NEW`/`OLD` aktualnego wiersza:

- Zmiana trigger z `FOR EACH STATEMENT` → `FOR EACH ROW`.
- Nowa funkcja `sync_tags_for_row(NEW, OLD)`:
  - Dla każdego tagu w `NEW.tags` (jeśli `published_at <= now()`): `INSERT … ON CONFLICT (name) DO UPDATE SET post_count = post_count + 1`.
  - Dla każdego tagu w `OLD.tags` którego nie ma w `NEW.tags` (lub przy DELETE): `UPDATE tags SET post_count = post_count - 1` (i ewentualnie `DELETE WHERE post_count <= 0`).
- Funkcja `sync_tags()` zostaje jako narzędzie do ręcznego pełnego rebuildu (admin może wywołać po imporcie), ale **nie jest** już wołana z triggera.

Zysk: INSERT do `posts` przestaje być O(N²) i wykonuje się w milisekundach niezależnie od liczby postów.

### 2. Zmniejszyć `CONCURRENCY` w bulk-prepare (defensywnie)

W `supabase/functions/bulk-prepare-suggestions/index.ts`:
- `CONCURRENCY = 3` → `CONCURRENCY = 2`. Trzymanie 3 równoległych wywołań do `extract-article` (które samo woła Gemini + Firecrawl) i jednoczesnych INSERT-ów do tej samej tabeli to dodatkowy presja na locki i na limit Lovable AI. Po fixie #1 wąskim gardłem stanie się AI, więc 2 wystarczy i da bardziej przewidywalne timingi.

### 3. Retry na timeout w bulk-prepare

Wokół samego `admin.from("posts").insert(...)` dodać 1 ponowienie, gdy `insertErr.message` zawiera `statement timeout` albo `deadlock detected`. Po fixie #1 nie powinno się zdarzać, ale to tani safety net — usuwa losowe „znikające" pozycje z listy zaznaczonych.

### 4. Czytelniejszy komunikat błędu w UI

W `useBulkPrepareSuggestions.ts` (`onSuccess`, gałąź „część się nie udała") obecnie pokazuje surowe `Insert posta: canceling statement due to statement timeout`, co adminowi nic nie mówi. Zmapować typowe błędy na PL:
- `statement timeout` → „Baza była przeciążona, spróbuj ponownie dla tych pozycji."
- `extract-article` 5xx → „Nie udało się wyciągnąć treści ze źródła."

Mapowanie po stronie hooka, bez dotykania edge funkcji.

## Pliki do zmiany

- **Migracja SQL** — nowa funkcja `sync_tags_for_row()`, podmiana triggera `sync_tags_on_post_change` (`FOR EACH STATEMENT` → `FOR EACH ROW` + nowa funkcja). `sync_tags()` zostaje jako helper.
- `supabase/functions/bulk-prepare-suggestions/index.ts` — `CONCURRENCY = 2`, retry na timeout w insert.
- `src/hooks/useBulkPrepareSuggestions.ts` — mapowanie komunikatów błędów na PL.

## Test po wdrożeniu

1. Zaznaczyć 6 propozycji i kliknąć „Opublikuj zaznaczone". Wszystkie 6 powinno przejść w `✓`.
2. Sprawdzić w `tags`, że `post_count` zgadza się z `SELECT count(*) FROM posts WHERE name = ANY(tags)` dla paru próbek.
3. W logach edge-funkcji: brak `statement timeout`, czas pojedynczego inserta < 500 ms.

## Zakres pominięty

- Nie dotykamy logiki ekstrakcji/AI ani `scan-news-sources`.
- Nie zwiększamy `MAX_BATCH` — najpierw stabilizujemy obecne 6.
- Nie kasujemy starej `sync_tags()` — zostaje jako narzędzie ręczne dla admina.
