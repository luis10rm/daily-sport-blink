## Cel
Skonfigurować Vercel tak, by żądanie `GET /sitemap.xml` zwracało dynamiczną mapę strony z Supabase Edge Function (`https://izyknazjzdkfdxnekvos.supabase.co/functions/v1/sitemap`), a nie statyczny plik ani SPA fallback.

## Sprawdzony obecny stan
- `vercel.json` ma tylko jeden rewrite: catch-all `/(.*)` → `/index.html`, który pochłonie `/sitemap.xml` jeśli zostanie ustawiony jako pierwszy.
- `public/robots.txt` wskazuje `Sitemap: https://sitemap.szortsy.pl/` — domena prawdopodobnie nie istnieje/wskazuje na martwy endpoint (z poprzedniego audytu SEO).
- `public/sitemap.xml` to przestarzały statyczny plik (zawiera jeszcze `/redakcja/`, brak Tech/Pozytywne), który obecnie jest serwowany zamiast dynamicznej wersji.

## Plan działania

1. **Dodać dedykowany rewrite w `vercel.json`**
   - W sekcji `rewrites` przed catch-all `/(.*)` → `/index.html` dodać:
     ```json
     {
       "source": "/sitemap.xml",
       "destination": "https://izyknazjzdkfdxnekvos.supabase.co/functions/v1/sitemap"
     }
     ```
   - Kolejność jest kluczowa: Vercel dopasowuje rewrites od góry, więc `/sitemap.xml` musi być pierwsze, inaczej catch-all przechwyci ścieżkę.

2. **Zaktualizować `public/robots.txt`**
   - Zmienić `Sitemap: https://sitemap.szortsy.pl/` na `Sitemap: https://szortsy.pl/sitemap.xml`.
   - Dzięki temu Googlebot i inne crawlery trafią na dynamiczną wersję zamiast martwego/pustego subdomainu.

3. **Usunąć/przenieść statyczny `public/sitemap.xml`**
   - Statyczny plik może być mylący podczas debugowania i w niektórych konfiguracjach może konkurować z rewrite.
   - Najbezpieczniej go usunąć (lub zarchiwizować jako `public/sitemap.xml.static`), bo Vercel powinien obsługiwać rewrite jako pierwszy, ale brak pliku eliminuje ryzyko dublowania.

4. **Weryfikacja po wdrożeniu**
   - `curl -I https://szortsy.pl/sitemap.xml` powinien zwrócić `200 OK` i `Content-Type: application/xml`.
   - Treść XML powinna zawierać aktualne URL-e z Edge Function (sport, tech, pozytywne, autorzy, tagi, kategorie, news sitemap dla artykułów <2 dni).
   - `curl -I https://www.szortsy.pl/sitemap.xml` powinien nadal 301 redirectować na `https://szortsy.pl/sitemap.xml` (istniejące przekierowanie www).

## Zakres
Tylko zmiany konfiguracyjne Vercel + statyczne pliki. Bez zmian w kodzie aplikacji, bazie danych ani Edge Function (zakładam, że `/functions/v1/sitemap` już działa poprawnie).