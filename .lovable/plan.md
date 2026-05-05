## Problem
Newsy publikowane przez bulk publish (z `/admin/suggestions`) nie mają przypisanego autora. W pojedynczym flow (`PostEditor`) autor jest automatycznie ustawiany na profil autora powiązany z zalogowanym userem (`authors.linked_user_id = auth.uid()`). Edge function `bulk-prepare-suggestions` tego nie robi — wstawia post bez `author_id`.

## Rozwiązanie
W edge function `bulk-prepare-suggestions` przed pętlą przetwarzania:
1. Pobrać z tabeli `authors` rekord, gdzie `linked_user_id = userId` (zalogowany admin/editor wykonujący akcję).
2. Jeśli istnieje — dodać `author_id: author.id` do `insertPayload` przy tworzeniu posta.
3. Jeśli nie istnieje (admin nie ma profilu autora) — zostawić `null` (zachowanie jak dziś, brak crashu).

## Plik do edycji
- `supabase/functions/bulk-prepare-suggestions/index.ts` — jeden dodatkowy SELECT po sprawdzeniu ról + jedno pole więcej w insert payload.

## Brak innych zmian
- Brak migracji DB.
- Brak zmian w UI ani hooku — toast i flow działają tak samo.
- Frontendowy `usePosts` już selectuje `author:authors(...)` więc karta od razu pokaże autora po invalidate cache.
