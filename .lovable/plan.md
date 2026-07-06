
## Cel

Kontrolować indeksowanie stron listingowych/pomocniczych przez `<meta name="robots">` obecny **w początkowej odpowiedzi HTML** (żeby Googlebot na pewno go zobaczył), plus ręczny override dla strategicznych tagów.

## Kontekst techniczny

Aplikacja to Vite SPA — `index.html` jest statyczny, więc `react-helmet-async` wstrzykuje tagi dopiero po hydratacji. Aby spełnić wymóg SSR, wykorzystamy istniejący **Cloudflare Worker** (ten sam, który obsługuje redirecty `/blink/*` i legacy `/news/*`) do przepisywania HTML zwracanego przez origin i wstrzykiwania `<meta name="robots">` przed `</head>`.

Dodatkowo ustawiamy ten sam tag przez Helmet po stronie klienta jako drugi tor (dla przeglądarek/narzędzi wykonujących JS oraz jako fallback, gdyby Worker akurat nie zadziałał).

## Zmiany

### 1. Baza danych — migracja

- `ALTER TABLE public.tags ADD COLUMN force_index boolean NOT NULL DEFAULT false;`
- Bez zmian w RLS/GRANTach (tabela `tags` już ma publiczny SELECT).

### 2. Edge function `robots-meta` (nowa, publiczna, bez JWT)

`GET /functions/v1/robots-meta?path=<pathname>` zwraca JSON:
```json
{ "robots": "noindex, follow" }   // lub null gdy strona ma być indeksowalna
```
Logika:
- Zawsze `noindex, follow` dla ścieżek pasujących do:
  - `/dzien/*`
  - `/podsumowanie/*`
  - `/archiwum` (dokładne)
  - `/tagi` (dokładne)
  - `/kategoria/wspo-praca-reklamowa` (dokładne)
- Dla `/tag/{slug}`:
  - `SELECT force_index, post_count FROM tags WHERE slug = $1` (channel-agnostic, bierzemy max post_count),
  - `force_index = true` → brak meta (indeksowalne),
  - w przeciwnym razie liczymy realnie opublikowane posty w tagu (published_at <= now(), is_hidden=false), aby nie polegać na potencjalnie nieaktualnym `post_count`,
  - `count < 4` → `noindex, follow`, inaczej brak meta.
- Wszystkie inne ścieżki → `null`.
- Krótki cache: `Cache-Control: public, max-age=60, s-maxage=60`.

### 3. Cloudflare Worker (rozszerzenie istniejącego)

Dołóż blok, który dla żądań `GET` z `Accept: text/html`:
1. Pobiera odpowiedź HTML z origina.
2. Woła `robots-meta?path=<url.pathname>` (z timeoutem ~200 ms; przy błędzie pomija).
3. Jeśli endpoint zwrócił wartość, używa `HTMLRewriter` i wstrzykuje przed `</head>`:
   ```html
   <meta name="robots" content="noindex, follow">
   ```
   Jednocześnie usuwa ewentualny istniejący `<meta name="robots">` z `index.html` (na wypadek gdyby był), żeby nie było duplikatów.
4. Zwraca zmodyfikowany HTML z nagłówkiem `X-Robots-Injected: 1` (do debugowania) oraz `Cache-Control` respektującym origin.

Snippet dostarczę do wklejenia (user samodzielnie wdroży w swoim Workerze — tak samo jak przy redirectach).

### 4. Fallback po stronie klienta (Helmet)

W komponentach stron:
- `src/pages/TagPage.tsx` — po pobraniu tagu i licznika postów: jeśli `!force_index && published_count < 4` → `<Helmet><meta name="robots" content="noindex, follow" /></Helmet>`.
- `src/pages/TagsListPage.tsx`, `src/pages/PozytywneArchive.tsx` (o ile odpowiada `/archiwum` — do potwierdzenia), strony `/dzien/:date` i `/podsumowanie/:date`, oraz strona kategorii, gdy `slug === 'wspo-praca-reklamowa'` — stały `noindex, follow`.
- Zapewnia to spójność dla Googlebota renderującego JS oraz jeśli Worker nie zdąży odpowiedzieć.

### 5. Panel admina — `force_index` na tagach

- W widoku zarządzania tagami (znajdę właściwy plik w `src/pages/admin/`): checkbox „Wymuś indeksowanie (force_index)" przy każdym tagu, zapis do Supabase.
- Podgląd: liczba opublikowanych postów + status („indeksowany" / „noindex — poniżej progu" / „noindex — wymuszone przez próg, ale force_index wyłączony").

### 6. Sitemap

- `supabase/functions/sitemap/index.ts`: wyklucz z sitemapy tagi, które byłyby `noindex` (czyli `force_index = false AND published_count < 4`). Strony `/dzien/*`, `/podsumowanie/*`, `/archiwum`, `/tagi`, `/kategoria/wspo-praca-reklamowa` też nie powinny w niej być — sprawdzę i w razie potrzeby usunę.

## Weryfikacja

- `curl -H "Accept: text/html" https://szortsy.pl/tagi | grep robots` — powinno pokazać `noindex, follow`.
- To samo dla `/tag/<slug-z-1-postem>` i `/dzien/2026-07-06`.
- Dla popularnego tagu (≥4 posty) meta nie powinno się pojawić.
- Po ustawieniu `force_index=true` na małym tagu meta znika bez deployu.

## Pliki

**Nowe:** `supabase/functions/robots-meta/index.ts`, migracja SQL.
**Edytowane:** `src/pages/TagPage.tsx`, `src/pages/TagsListPage.tsx`, `src/pages/PozytywneArchive.tsx` (lub właściwa strona `/archiwum`), strony `/dzien/*` i `/podsumowanie/*`, strona kategorii, panel admina tagów, `supabase/functions/sitemap/index.ts`.
**Do samodzielnego wdrożenia przez użytkownika:** rozszerzenie Cloudflare Workera (dostarczę gotowy snippet).

## Pytanie przed implementacją

Czy potwierdzasz, że rozszerzenie Cloudflare Workera wykonasz samodzielnie (jak przy redirectach z poprzedniego zadania), a ja dostarczę tylko snippet do wklejenia? Jeśli wolisz, mogę pominąć część workerową i zostać wyłącznie przy Helmecie — ale wtedy nie będzie to ściśle „server-side" (Google zwykle to i tak łapie, ale jest to mniej pewne).
