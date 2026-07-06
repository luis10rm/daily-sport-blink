## Cel

Wyeliminować duplikaty typu `/blink/{tytuł}-{hash8}` publikowane w krótkim czasie o niemal identycznym tytule. Panel `Admin → Duplikaty` znajduje grupy, edytor wybiera kanoniczny URL, a Cloudflare Worker serwuje prawdziwe HTTP 301 do wersji kanonicznej. Duplikaty znikają z sitemapy i z publicznego API. **Redirecty są zawsze płaskie — nigdy nie tworzymy łańcuchów A→B→C.**

## Zakres i architektura

```text
[Admin/Duplikaty UI]  ──►  scan-duplicates (edge fn)  ──►  grupy podobnych postów
        │
        ▼
[Editor wybiera canonical]
        │
        ▼
merge-duplicates (edge fn)
        ├── RESOLVE canonical do finalnego celu (jeśli sam jest już from_slug)
        ├── RE-POINT wcześniejszych redirectów wskazujących na duplikaty → nowy canonical
        ├── posts.redirect_to_post_id = canonical.id
        ├── posts.is_hidden = true (na duplikatach)
        ├── INSERT/UPSERT post_redirects (from_slug, to_slug, from_url, to_url, reason)
        └── sitemap invalidate (naturalne — filtruje is_hidden)
        │
        ▼
[Cloudflare Worker]  GET /blink/{slug}
   ├── lookup post_redirects → 301 do /blink/{to_slug}
   └── brak trafienia → pass-through do SPA
```

## Zmiany w bazie (jedna migracja)

- `posts`:
  - `is_hidden boolean not null default false` — ukrywa post w feedach, kategoriach, kanałach, tagach, autorach, sitemapie.
  - `redirect_to_post_id uuid null references posts(id) on delete set null` — wskazuje canonical.
  - Częściowy indeks `where is_hidden = false` dla listingu.

- Nowa tabela `post_redirects` (log + źródło prawdy dla Workera):
  - `from_slug text primary key` — dokładny slug, który ma być przekierowany.
  - `to_slug text not null` — slug canonical (zawsze **final**, nigdy pośredni).
  - `from_url text not null`, `to_url text not null` — pełne URL-e (audyt, GSC).
  - `reason text not null default 'duplicate'`.
  - `created_at`, `updated_at`, `created_by uuid`, `hits int default 0`.
  - Indeks na `to_slug` (dla szybkiego re-pointingu istniejących redirectów).
  - CHECK: `from_slug <> to_slug` (nie da się utworzyć self-redirectu).
  - RLS: `select` — public (Worker odczytuje kluczem anon); `insert/update/delete` — tylko admin/editor przez `has_role`.
  - `GRANT select on post_redirects to anon, authenticated`, `GRANT all to service_role`.

- Sitemap: dokładam `.eq("is_hidden", false)` w funkcji `sitemap`.

## Edge functions

### 1. `scan-duplicates` (nowa)
- Wywołanie: admin/editor, POST `{ days?: 30, min_similarity?: 0.85, channel?: 'sport'|'positive'|'all' }`.
- Logika:
  1. Pobiera posty z ostatnich N dni, `is_hidden = false`, `redirect_to_post_id IS NULL`.
  2. Normalizuje slug — usuwa końcowe `-[0-9a-f]{6,10}`, `lower`, strip polskich znaków — jako klucz grupujący.
  3. Wstępnie grupuje po tym kluczu ORAZ po oknie 7 dni (`|Δpublished_at| ≤ 7d`).
  4. W obrębie klucza liczy Dice-bigram similarity tytułów (reużywam logiki z `src/lib/titleSimilarity.ts` — port do Deno inline). Grupuje transitively przy `≥ min_similarity`.
  5. Zwraca listę grup: `{ normalized_key, posts: [{ id, slug, title, published_at, updated_at, image_url, category, author, content_length, is_news_of_day }], suggested_canonical_id, tie_breaker_hints }`.
  6. `suggested_canonical_id` = najnowszy `updated_at`; `tie_breaker_hints` = najstarszy `published_at`, najdłuższy `content`.

### 2. `merge-duplicates` (nowa) — **z ochroną przed łańcuchami**
- Wywołanie: admin/editor, POST `{ canonical_id, duplicate_ids: string[], google_canonical_url? }`.
- Walidacje wstępne: wszystkie ID istnieją; `canonical_id ∉ duplicate_ids`; canonical nie jest `is_hidden`.
- **Krok A — resolve canonical do FINAL target (brak łańcuchów wychodzących):**
  1. Pobierz `canonical` (`id, slug`).
  2. `SELECT to_slug FROM post_redirects WHERE from_slug = canonical.slug`.
  3. Jeśli wpis istnieje — canonical sam był już duplikatem. Ostrzegam w response (`canonical_was_redirected: true`) i **podstawiam final target**: pobieram post po `to_slug`, jeśli istnieje i nie jest `is_hidden` → to jest nowy `effective_canonical`. Wszystkie dalsze operacje używają `effective_canonical.id/slug`.
  4. Sanity: pętla resolvująca max 5 skoków (defense-in-depth, w praktyce zawsze 1); jeśli po 5 skokach dalej jest hit → return 409 z jasnym błędem.
- **Krok B — re-point wcześniejszych redirectów wskazujących na duplikaty (brak łańcuchów przychodzących):**
  1. `duplicate_slugs := SELECT slug FROM posts WHERE id = ANY(:duplicate_ids)`.
  2. `UPDATE post_redirects SET to_slug = :effective_canonical.slug, to_url = :effective_canonical_url, reason = 'rechained', updated_at = now() WHERE to_slug = ANY(:duplicate_slugs)`.
  3. Zwracam w response `rechained_count`.
- **Krok C — właściwy merge:**
  1. `UPDATE posts SET is_hidden = true, redirect_to_post_id = :effective_canonical.id, updated_at = now() WHERE id = ANY(:duplicate_ids)`.
  2. Dla każdego duplikatu: `INSERT INTO post_redirects (from_slug, to_slug, from_url, to_url, reason, created_by) VALUES (...) ON CONFLICT (from_slug) DO UPDATE SET to_slug = EXCLUDED.to_slug, to_url = EXCLUDED.to_url, reason = 'duplicate', updated_at = now()`. Upsert = safety net gdyby duplikat już był redirectem w innej grupie.
  3. Guard: `INSERT` pomija wiersze gdzie `from_slug = effective_canonical.slug` (nie może być self-redirect — CHECK i tak by odrzucił).
- **Krok D — invariant check (po commicie, best-effort):**
  - `SELECT count(*) FROM post_redirects r1 JOIN post_redirects r2 ON r1.to_slug = r2.from_slug` — jeśli > 0, loguję warning z listą (nie fail — Worker i tak zawsze cache'uje ≤60s).
- **Krok E — powiadomienia:**
  - `notify-google-index`: `URL_UPDATED` dla `effective_canonical`, `URL_DELETED` dla duplikatów. Best-effort, nie blokuje sukcesu.
- Zwraca `{ effective_canonical_slug, canonical_was_redirected, redirected: n, rechained_count, log_entries }`.

Wszystko w jednej fn, sekwencyjnie z service_role — jeśli którykolwiek `UPDATE`/`INSERT` failuje, zwracam 500 z podsumowaniem co się udało (idempotentne: UPSERT + `is_hidden = true` można bezpiecznie powtórzyć).

### 3. `sitemap` (edycja)
- Dokładam `.eq("is_hidden", false)`. Nic więcej.

## Cloudflare Worker (rozszerzenie istniejącego)

Fragment do wklejenia w istniejącego Workera obsługującego `/news/*` — dokładamy blok `/blink/*` PRZED handlerem SPA:

```js
// Wymaga zmiennych: SUPABASE_URL, SUPABASE_ANON_KEY.
// Cache na krawędzi 60s.
if (url.pathname.startsWith("/blink/")) {
  const slug = url.pathname.slice("/blink/".length).split("/")[0];
  if (slug) {
    const cacheKey = new Request(`https://cache/redirects/${slug}`, request);
    const cache = caches.default;
    let cached = await cache.match(cacheKey);
    if (!cached) {
      const r = await fetch(
        `${env.SUPABASE_URL}/rest/v1/post_redirects?from_slug=eq.${encodeURIComponent(slug)}&select=to_slug`,
        { headers: { apikey: env.SUPABASE_ANON_KEY, Authorization: `Bearer ${env.SUPABASE_ANON_KEY}` } }
      );
      const rows = r.ok ? await r.json() : [];
      cached = new Response(JSON.stringify(rows[0] || null), {
        headers: { "content-type": "application/json", "cache-control": "public, max-age=60" },
      });
      ctx.waitUntil(cache.put(cacheKey, cached.clone()));
    }
    const hit = await cached.json();
    if (hit?.to_slug && hit.to_slug !== slug) {
      return Response.redirect(`${url.origin}/blink/${hit.to_slug}`, 301);
    }
  }
  // brak trafienia → pass-through do SPA
}
```

Ponieważ `merge-duplicates` gwarantuje płaskość, Worker robi **dokładnie jeden lookup** i nigdy nie musi rekursywnie resolvować. Cache 60s = redirecty aktywne w ≤60s od merge.

## UI — `Admin → Duplikaty` (`/admin/duplikaty`)

- Nowa pozycja w `AdminLayout` (ikona `Copy`), route w `App.tsx` pod `ProtectedRoute` (admin+editor).
- Strona:
  - Filtry: `Okres` (7/14/30/90d), `Próg podobieństwa` (slider 70–99%, domyślnie 85%), `Kanał` (Sport/Pozytywne/Wszystkie), przycisk **Skanuj**.
  - Lista grup (Card per grupa): znormalizowany klucz, zakres dat, liczba duplikatów.
  - Side-by-side 2–N postów: miniatura, tytuł (link → `/blink/{slug}` w nowej karcie), data publikacji, ostatnia edycja, autor, kategoria, długość treści, badge `is_news_of_day`.
  - Radio "Kanoniczny" (default = `suggested_canonical_id`) + widoczne tie-breaker hints.
  - Opcjonalny input **Google canonical URL** — walidowany: slug w URL musi należeć do postu w grupie.
  - **Warning inline** jeśli po stronie API canonical wskazuje na wcześniejszy redirect: "Wybrany kanoniczny został wcześniej scalony do X — redirecty utworzą się bezpośrednio do X, żeby uniknąć łańcuchów."
  - Przycisk **Scal grupę** → `AlertDialog` z podsumowaniem ("Utworzę N redirectów 301, przepnę M starszych redirectów, ukryję N postów. Operacja odwracalna z bazy."). Po sukcesie karta zwija się na zielono ("N→1, redirect aktywny za ≤60s, przepiętych: M").
  - Sekcja **Log przekierowań** poniżej: tabela `post_redirects` (from → to, `reason`, kiedy, kto, hits) z filtrem i paginacją.

## Zmiany po stronie aplikacji (poza panelem)

- Wszystkie zapytania publiczne do `posts` dostają `.eq("is_hidden", false)`: `src/hooks/usePosts.tsx`, `usePositivePosts.tsx`, `usePostsByCategory.ts`, `useWorldCupPosts.ts`, `useNewsDiscovery.ts`.
- `usePostBySlug` **nie** filtruje `is_hidden` — post pozostaje pobieralny, żeby admin/podgląd działał; `BlinkPage` dla `is_hidden && redirect_to_post_id` renderuje komunikat "Ten artykuł został przeniesiony" + `<link rel="canonical">` + `<meta http-equiv="refresh">` jako fallback dla preview `*.lovable.app`.
- Sitemap: `is_hidden = false`.

## Bezpieczeństwo i integralność

- Migracja: `GRANT`i + RLS na `post_redirects` (insert/update/delete tylko admin/editor przez `has_role`).
- Nie usuwamy postów — wszystko odwracalne.
- Guard w `merge-duplicates`: canonical nie może być `is_hidden`; resolve chain limit 5 skoków; CHECK `from_slug <> to_slug`; UPSERT po `from_slug`.
- Invariant: po każdym merge sprawdzam `JOIN` na łańcuchy — loguję jeśli wykryte.

## Co użytkownik musi zrobić poza Lovable

1. Zaktualizować Cloudflare Workera o blok `/blink/*` (kod wyżej) i zdeployować.
2. Upewnić się, że Worker ma zmienne `SUPABASE_URL` i `SUPABASE_ANON_KEY`.

## Poza zakresem tej iteracji

- Auto-wykrywanie duplikatów przy tworzeniu (istnieje już safeguard 72h w `PostEditor`).
- Cross-channel duplikaty (Sport ↔ Pozytywne).
- Merge treści (kopiowanie tagów/tekstu duplikatu do canonical).
- Bulk-akceptacja wielu grup jednym kliknięciem.
