# Plan: Sitemap + /autor redirect + Google News

## 1. Sitemap edge function (`supabase/functions/sitemap/index.ts`)

- **Autorzy → `/autor/`**: linia 160 zamienia `${SITE_URL}/redakcja/${author.slug}` na `${SITE_URL}/autor/${author.slug}`.
- **Brakujące strony statyczne** (dodać do sekcji Static pages, obok istniejących `/`, `/autorzy`, `/tech`, `/pozytywne`):
  - `/mistrzostwa-swiata-2026` (priority 0.9, changefreq daily)
  - `/archiwum` (priority 0.7, changefreq daily)
  - `/tagi` (priority 0.6, changefreq weekly)
  - `/pozytywne/archiwum` (priority 0.6, changefreq daily)
- **Weryfikacja Tech/Pozytywne**: sekcje `/tech`, `/tech/kategoria/*`, `/tech/{cat}/{slug}`, `/pozytywne`, `/pozytywne/kategoria/*`, `/pozytywne/{cat}/{slug}` już są — bez zmian.
- **Google News `<news:news>`** dla postów sportowych <48h:
  - Rozszerzyć SELECT postów sportowych o kolumnę `title`.
  - Dla każdego posta z `publishedDate > now - 48h` dołączyć wewnątrz `<url>` blok:
    ```xml
    <news:news>
      <news:publication>
        <news:name>Szortsy</news:name>
        <news:language>pl</news:language>
      </news:publication>
      <news:publication_date>{published_at ISO 8601}</news:publication_date>
      <news:title>{escaped title}</news:title>
    </news:news>
    ```
  - Dodać mały helper `escapeXml()` dla `&<>"'` w tytule.
  - Namespace `xmlns:news` już zadeklarowany w root `<urlset>`.

## 2. Redirect 301 dla `/redakcja/{slug}` → `/autor/{slug}`

Brak istniejącej route → obecnie 404. React SPA nie zwróci prawdziwego HTTP 301, ale mamy dwie warstwy:

- **Cloudflare Worker (rzeczywisty 301)** — dostarczę snippet do wklejenia w Workerze (który już obsługuje HTTP 410 dla `/news/*`):
  ```js
  const m = url.pathname.match(/^\/redakcja\/(.+)$/);
  if (m) return Response.redirect(`${url.origin}/autor/${m[1]}${url.search}`, 301);
  ```
  Wykonuje się przed serwowaniem strony, prawdziwy 301 dla Googlebota.
- **Fallback w React (`src/App.tsx`)** — na wypadek gdyby ktoś ominął Workera (preview, dev, custom domain bez Workera), dodać:
  ```tsx
  <Route path="/redakcja/:slug" element={<Navigate to="/autor/:slug" replace />} />
  ```
  Właściwie użyć wrappera bo React Router nie interpoluje `:slug` w `to` — komponent `<RedirectRedakcjaToAutor />` który czyta `useParams()` i robi `<Navigate to={"/autor/"+slug} replace />`. To client-side 302, ale Googlebot i tak zobaczy 301 z Workera.

## 3. Weryfikacja po deployu

- `curl https://<project>.functions.supabase.co/sitemap` → walid XML, obecny `/autor/`, brak `/redakcja/`, obecne `/mistrzostwa-swiata-2026`, `/archiwum`, `/tagi`, `/pozytywne/archiwum`, i bloki `<news:news>` dla świeżych postów.
- Otworzyć `/redakcja/<istniejacy-slug>` w preview → powinno zredirectować na `/autor/<slug>`.

## Szczegóły techniczne

- Sitemap: jedna zmiana w `supabase/functions/sitemap/index.ts` (posts SELECT + title escape helper + kilka bloków static + rename authors URL). Deploy auto.
- Redirect route: nowy plik `src/pages/RedakcjaRedirect.tsx` (~10 linii) + wpis w `src/App.tsx`.
- Worker snippet: dostarczę do wklejenia — użytkownik sam aktualizuje kod Cloudflare Workera.

## Poza scope

- Naprawa `worldcup-data` (502) — parkujemy, obsłużymy w osobnym kroku.
- Migracja/redirecty dla starych URL-i innych niż `/redakcja/*`.