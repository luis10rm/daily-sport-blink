
# Unikalne URL-e dla podsumowań dnia

## Problem
Wszystkie podsumowania dnia dostają identyczny `source_url`: `https://szortsy.pl/podsumowanie`. Choc kazde podsumowanie ma juz unikatowy slug (generowany z tytulu), statyczny source_url jest nieczytelny i nie pomaga w SEO.

## Rozwiazanie
Zmienic `source_url` tak, zeby zawieral date podsumowania, np. `https://szortsy.pl/podsumowanie/2026-02-08`. Dzieki temu kazde podsumowanie bedzie mialo unikatowy identyfikator zrodla.

## Zakres zmian

### 1. `src/pages/admin/PostEditor.tsx`
- Zmienic linie ustawiajaca `source_url` z `"https://szortsy.pl/podsumowanie"` na `"https://szortsy.pl/podsumowanie/YYYY-MM-DD"` gdzie data pochodzi z kontekstu prefill (z dashboardu przekazywana jest wybrana data)
- Aby uzyskac date, nalezy ja przekazac w obiekcie `prefill` z Dashboardu

### 2. `src/pages/admin/Dashboard.tsx`
- Dodac pole `date` do obiektu `prefill` przekazywanego przez `navigate()`, np. `date: format(selectedDate, "yyyy-MM-dd")`

### 3. `src/config/categoryImages.ts`
- Zaktualizowac warunek `post.source_url?.includes("/podsumowanie")` -- ten juz dziala poprawnie, bo `includes` znajdzie "/podsumowanie" rowniez w "/podsumowanie/2026-02-08"

## Efekt
- Kazde podsumowanie dnia bedzie mialo unikatowy `source_url` z data
- Slug w bazie danych jest juz unikatowy (generowany automatycznie z tytulu + ID)
- Lepsza indeksacja w Google -- kazda strona podsumowania jest traktowana jako osobny zasob
- Brak zmian w routingu -- podsumowania nadal dzialaja przez `/blink/:slug`
