## Wyniki audytu indeksacji: Tech i Pozytywne

### Co sprawdziłem
- Routing w `src/App.tsx` (Tech = `/tech/*`, Pozytywne = `/pozytywne/*`).
- Meta tagi na stronach (`useSEOMeta` / `useArticleSEOMeta`).
- Edge function `sitemap` i `robots-meta`.
- Live sitemap (1544 URL) i live `/tech` (HTML z serwera).
- `public/robots.txt` i `public/llms.txt`.

### Znalezione problemy

**1. Sitemap nie zawiera Tech ani Pozytywne (krytyczne)**
Sitemap generuje wyłącznie `/`, `/autorzy`, `/kategoria/*` (sport), `/redakcja/*`, `/tag/*` i `/blink/*`. Brak:
- `/tech`, `/tech/kategoria/{slug}`, `/tech/{category}/{slug}` — cały kanał Tech (recenzje z tabeli `reviews`) nie jest w ogóle w sitemap. Google nie ma jak ich znaleźć poza linkami wewnętrznymi.
- `/pozytywne`, `/pozytywne/kategoria/{slug}` — kanałowa strona główna i kategorie Pozytywnych.
- Query `posts` w sitemapie nie filtruje po `channel`, więc posty pozytywne trafiają do sitemap jako `/blink/{slug}` — działa, ale jest niespójne z kanałową nawigacją.

**2. Strony Tech nie mają meta SEO (krytyczne)**
`ReckiHome.tsx`, `ReckiReview.tsx`, `ReckiCategory.tsx` w ogóle nie wołają `useSEOMeta`. Skutek: title="Szortsy - Wiadomości sportowe...", brak `canonical`, brak `description` dostosowanego do treści, brak `og:*` dla recenzji. Potwierdzone `curl`em na `https://szortsy.pl/tech`.

**3. Duplikat URL dla postów Pozytywnych (średnie)**
Post pozytywny ma dwa działające adresy: `/blink/{slug}` (canonical z `useArticleSEOMeta`) i `/pozytywne/{category}/{slug}` (route w `App.tsx` → też renderuje `BlinkPage`). Bez `canonical` wskazującego jednoznacznie na jeden z nich ryzyko duplicate content.

**4. Brak Tech w robots-meta (mały)**
Edge function nie ma reguł dla `/tech/*` (domyślnie index, follow — OK), ale warto potwierdzić że `wspo-praca-reklamowa`-styl noindex nie ma odpowiednika np. dla ukrytych kategorii Tech (obecnie brak takiej potrzeby).

**5. `public/llms.txt` nieaktualne (mały)**
Wymienia tylko kanał sportowy — brak sekcji Tech i Pozytywne.

**6. Config OK ✅**
- `robots.txt` — wpuszcza Googlebot / Googlebot-News, wskazuje `sitemap.szortsy.pl`.
- `useSEOMeta` — poprawnie ustawia canonical, og, twitter, robots.
- `robots-meta` edge function — poprawnie obsługuje tag threshold i static noindex paths.

---

### Proponowane fixy (kolejność priorytetów)

**Krok 1 — Sitemap: dodać Tech i Pozytywne** (`supabase/functions/sitemap/index.ts`)
- Osobne query do tabeli `reviews` (published, nie ukryte) → wpisy `/tech/{category_slug}/{review_slug}` + strona główna `/tech` + `/tech/kategoria/{slug}` z `review_categories`.
- Osobne query `posts` z `channel = 'positive'` → wpisy `/pozytywne/{positive_category_slug}/{slug}` + `/pozytywne` + `/pozytywne/kategoria/{slug}` z `positive_categories`.
- Existing query postów zawęzić do `channel = 'sport'` (lub null dla legacy) żeby `/blink/*` = wyłącznie sportowe.

**Krok 2 — Meta SEO na stronach Tech** (nowe wywołania `useSEOMeta`)
- `ReckiHome` (bez kategorii): tytuł "Tech — recenzje sprzętu", canonical `https://szortsy.pl/tech`.
- `ReckiHome` (w kategorii): tytuł z nazwy kategorii, canonical `https://szortsy.pl/tech/kategoria/{slug}`.
- `ReckiReview`: użyć `useArticleSEOMeta`-analog (title=review.title, description=excerpt, og:image=review.image_url, canonical=`/tech/{category_slug}/{slug}`, ogType=article).

**Krok 3 — Canonical dla postów Pozytywnych** (`src/hooks/useSEOMeta.ts` + `src/pages/BlinkPage.tsx`)
- Rozszerzyć `useArticleSEOMeta` o opcjonalny `channel` / niestandardowy canonical.
- W `BlinkPage`, dla `post.channel === 'positive'`, canonical → `/pozytywne/{positive_category_slug}/{post.slug}`.
- Ujednolicić: sitemap emituje ten sam URL, `/blink/{slug}` nadal działa jako alias (bez zmiany URL).

**Krok 4 — Aktualizacja `public/llms.txt`**
Dodać sekcje o kanałach Tech (`/tech`, recenzje) i Pozytywne (`/pozytywne`).

### Poza zakresem tego kroku
- HTTP 301 z `/blink/{slug}` na canonical dla postów pozytywnych — wymagałoby Cloudflare Workera; wstępnie wystarczy tag canonical.
- Zmiana istniejących URL-i (zgodnie z wcześniejszą regułą: nie zmieniamy URL-i już wypuszczonych).

---

### Ryzyka
- Zmiana canonical dla postów pozytywnych = przekierowanie sygnału indeksacji na `/pozytywne/...`. Google potrzebuje ~kilka tygodni na przetworzenie. Aliasy `/blink/*` pozostają live.
- Sitemap size rośnie — obecnie 1544 wpisy, po dodaniu recenzji + pozytywnych spokojnie mieści się w 50k limicie.

Powiedz "buduj" (lub wskaż które kroki pominąć), zaczynam od Kroku 1.