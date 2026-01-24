
Cel: przywrócić działanie postów i kategorii po zmianach w bazie (usunięcie enuma) bez “cofania” historii, bo problem jest techniczny i da się go naprawić.

Diagnoza (co się faktycznie stało)
- Dane nie zniknęły: w bazie nadal jest ~20 postów i 8 kategorii.
- Frontend nie pokazuje postów, bo zapytania o posty kończą się błędem backendu `PGRST201` (status ~300) o treści: “Could not embed because more than one relationship was found…”.
- Powód: w tabeli `posts` są DWIE relacje (dwa klucze obce) prowadzące z `posts.category_id` do `sport_categories.id`:
  - `fk_posts_category` (z ON DELETE SET NULL) — dodany w migracji
  - `posts_category_id_fkey` — już istniał wcześniej
- To powoduje, że backend nie wie, której relacji użyć przy “embed” kategorii do postów (czyli `sport_category:sport_categories!...`) i odrzuca zapytanie. Stąd “brak postów” i “kategorie nie działają” w miejscach zależnych od listy postów.

Strategia naprawy (2 warstwy: szybka + docelowa)
A) Szybka naprawa w kodzie (żeby natychmiast odblokować UI)
1) Zmienić selekty w zapytaniach o posty tak, aby wskazywały KONKRETNĄ relację po nazwie constraintu, np.:
   - `sport_category:sport_categories!fk_posts_category(...)`
2) Dotyczy to co najmniej:
   - `src/hooks/usePosts.tsx` (stała `POST_SELECT` używana na stronie głównej + w adminie)
   - `src/hooks/useAuthors.tsx` (zapytania o posty autora i statystyki autora)
Efekt: nawet przy dwóch constraintach aplikacja znów pobierze posty i wszystko wróci w UI.

B) Docelowa naprawa w bazie (żeby problem nie wrócił)
3) Dodać migrację, która usuwa duplikat constraintu:
   - `ALTER TABLE public.posts DROP CONSTRAINT IF EXISTS posts_category_id_fkey;`
4) Zostawić `fk_posts_category` jako jedyny FK, bo ma poprawne zachowanie `ON DELETE SET NULL`.
Efekt: backend znów będzie miał tylko jedną relację, a integracje “embed” będą jednoznaczne.

Walidacja po wdrożeniu
5) Sprawdzić w praktyce (manualnie w podglądzie):
   - Strona główna `/` pokazuje feed postów (bez “pustki”).
   - Admin → Posts list ładuje listę postów.
   - Admin → Post editor: można wybrać kategorię “Skoki narciarskie” i zapisać post.
   - Strony autora (jeśli używasz) znów pokazują posty/statystyki.
6) Potwierdzić technicznie (pośrednio):
   - requesty do `/rest/v1/posts?...select=...,sport_category:...` wracają z 200 zamiast błędu `PGRST201`.

Dlaczego nie da się łatwo “cofnąć” tej zmiany w historii
- Zmiana dotknęła bazy danych. Niektóre platformy blokują automatyczne “Restore”/rollback, gdy schemat bazy już się zmienił (żeby nie doprowadzić do niespójności kod↔baza). Dlatego przycisk może być wyszarzony.
- Naprawa powyżej jest bezpieczniejsza niż próba cofania, bo zachowuje aktualną architekturę “dynamicznych kategorii” (czyli dokładnie to, czego chcesz: tworzyć nowe kategorie i używać ich w postach).

Ryzyka i edge-case’y
- Jeśli ktoś kiedyś znów doda drugi FK na `posts.category_id`, problem może wrócić. Dlatego:
  - usuwamy duplikat w bazie (krok B),
  - a w kodzie możemy na stałe pozostać przy `!fk_posts_category` (najbardziej odporne).

Co zrobię po Twojej akceptacji (w trybie wdrożeniowym)
- Wprowadzę poprawki w 2 plikach hooków (usePosts, useAuthors), żeby wskazywać konkretny FK w embed.
- Dodam migrację usuwającą `posts_category_id_fkey`.
- Zweryfikuję na podglądzie, że feed, admin i wybór kategorii wróciły do działania.
