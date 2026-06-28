## Cel

Rozszerzenie szortsy.pl o sekcję recenzji tech/lifestyle pod `/recki` jako osobny sub-brand (inny kolor akcentu + własne logo), z możliwością przełączania się między trybami **Sport ↔ Recki** w nagłówku.

---

## 1. Sub-brand „Recki"

- **Kolor akcentu:** głęboki magenta/fiolet (`#A855F7` → HSL `271 91% 65%`) — wyraźny kontrast vs. emerald sportowej części.
- **Logo:** generujemy nowe „Recki" (litera R w fioletowym kafelku) + tekstowe „Recki by Szortsy"; logo Szortsy nadal w stopce.
- **Klasa motywu:** na trasach `/recki*` dodajemy do `<html>` klasę `.mode-recki`, która nadpisuje `--primary`, `--ring`, `--gradient-primary` i tło hero (subtelny gradient fioletowy zamiast murawy stadionu).
- **Czcionka:** ta sama Outfit (spójność), ale nagłówki w `font-weight: 800` z większym tracking dla „premium tech" vibe.

## 2. Przełącznik trybu w headerze

- Nowy komponent `ModeSwitcher` w `Header.tsx`: pigułka `[Sport | Recki]`, aktywna sekcja podświetlona kolorem trybu.
- Na `/recki*` header zmienia tytuł na **„Recki"** z podtytułem „Recenzje sprzętu i technologii".
- Kategorie w dropdownie przełączają się odpowiednio (sportowe vs. tech).
- Stopka, PatronBar, banery reklamowe — wspólne (te same `banners` slots: `home_top/middle/bottom`).

## 3. Strona główna `/recki`

Inspiracja OneTech, ale lżej:

```text
┌──────────────────────────────────────┐
│ Header (tryb Recki, fiolet)          │
├──────────────────────────────────────┤
│ HERO: karuzela 4 najnowszych recek   │
│ (duże zdjęcia + tytuł + score)       │
├──────────────────────────────────────┤
│ Banner reklamowy (home_top)          │
├──────────────────────────────────────┤
│ "Najnowsze recenzje" — grid 3×N      │
│ (karta: zdjęcie / kategoria / score) │
├──────────────────────────────────────┤
│ Sekcja kategorii (smartfony, audio…) │
├──────────────────────────────────────┤
│ Banner (home_middle)                 │
├──────────────────────────────────────┤
│ "Najwyżej oceniane" — top 6 recek    │
├──────────────────────────────────────┤
│ Footer wspólny                       │
└──────────────────────────────────────┘
```

## 4. Strona recenzji `/recki/:kategoria/:slug`

- **Hero:** duże zdjęcie produktu + tytuł + score (duża, kolorowa plakietka 8.5/10) + werdykt jednym zdaniem.
- **Meta-bar:** kategoria, autor, data, czas czytania.
- **Galeria:** sekcja z 3-6 zdjęciami produktu (komponent `ReviewGallery` z lightboxem).
- **Treść:** sekcje H2/H3 (Wykonanie, Wydajność, Bateria, Cena…) — Tiptap jak w sporcie.
- **Plusy / Minusy:** dwie kolumny z ikonami ✓ / ✗ (kolor zielony/czerwony).
- **Werdykt:** wyróżniony blok z dużym score + 2-3 zdania podsumowania.
- **Inline banner reklamowy** w środku treści (slot `review_inline`).
- **Powiązane recenzje:** 3 karty z tej samej kategorii.
- **BRAK sekcji komentarzy.**

## 5. CMS — osobne miejsce dla recek

Nowy podmenu w panelu admina: **„Recki"** (oddzielnie od „Posty"):

- `/admin/reviews` — lista recenzji z filtrami (kategoria, score, status).
- `/admin/reviews/new` i `/admin/reviews/:id/edit` — edytor:
  - Pola podstawowe (tytuł, slug, kategoria recek, autor, status).
  - **Score 1-10** (suwak + werdykt jednym zdaniem).
  - **Plusy / Minusy** — dwa pola listowe (dodawanie/usuwanie wierszy).
  - **Galeria** — multi-upload do bucketu `review-images` (drag & drop, reorder).
  - **Treść** — Tiptap (jak w postach).
  - **AI generator** — przycisk „Wygeneruj treść" oparty na obecnej funkcji `extract-article`, ale z trybem `review` (prompt zwraca: sekcje wykonanie/wydajność/cena, listę plusów/minusów, score sugerowany, werdykt). Nowa edge function `generate-review` lub flaga `mode: 'review'` w istniejącej.
  - **AI obraz** — reuse `generate-article-image` z innym promptem (produkt na neutralnym tle).
- Role: admin + editor jak obecnie.

## 6. Reklamy

- Reusujemy istniejącą tabelę `banners` i komponent `SponsorBanner`.
- Dodajemy nowe sloty do enum/typu `placement`:
  - `recki_home_top`, `recki_home_middle`, `recki_home_bottom`
  - `recki_inline` (środek artykułu)
- W adminie banerów wybór slotu z dropdownu obejmie nowe pozycje.
- Opcjonalnie: checkbox „Pokazuj również w sekcji Recki" → automatycznie kopiuje powiązanie ze slotami sportowymi.

## 7. Routing

```text
/recki                        → ReckiHome
/recki/kategoria/:catSlug     → ReckiCategory
/recki/:catSlug/:slug         → ReviewPage   (kategoria + slug w URL — SEO)
```

Wybrana struktura `/recki/:kategoria/:slug` — kategoria jako pierwszy segment, slug jako drugi. Walidacja w loaderze: jeśli kategoria nie pasuje do recenzji → redirect 301 na poprawny URL.

## 8. SEO

- Sitemap `/sitemap.xml` rozszerzony o `/recki*` (edge function `sitemap` aktualizujemy).
- `Review` schema (JSON-LD) z `aggregateRating`, `Product`, `Brand`.
- Tag `og:type=article`, dedykowany `og:image` (zdjęcie produktu).
- `robots.txt` bez zmian (już zezwala na całość).

---

## Detale techniczne

### Baza danych (1 migracja)

```sql
CREATE TABLE public.review_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  icon_url text,
  sort_order int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  excerpt text,
  content text,
  verdict text,             -- 1-2 zdania
  score numeric(3,1),       -- 0.0 - 10.0
  pros text[] DEFAULT '{}',
  cons text[] DEFAULT '{}',
  gallery text[] DEFAULT '{}', -- URL-e zdjęć
  cover_image_url text,
  product_name text,
  product_brand text,
  category_id uuid REFERENCES public.review_categories(id),
  author_id uuid REFERENCES public.authors(id),
  status text DEFAULT 'draft', -- draft|published
  published_at timestamptz,
  source_url text,
  is_ai_generated boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- + GRANT-y (anon SELECT na published, authenticated all, service_role all)
-- + RLS: public read tylko opublikowanych; admin/editor full
-- + trigger updated_at
-- + storage bucket "review-images" (public)
-- + rozszerzenie enum placement banners o recki_* slots
```

### Frontend (nowe pliki)

- `src/pages/ReckiHome.tsx`, `ReviewPage.tsx`, `ReckiCategory.tsx`
- `src/pages/admin/ReviewsList.tsx`, `ReviewEditor.tsx`
- `src/components/recki/ModeSwitcher.tsx`, `ReviewCard.tsx`, `ReviewHero.tsx`, `ReviewGallery.tsx`, `ScoreBadge.tsx`, `ProsConsBox.tsx`, `VerdictBox.tsx`
- `src/hooks/useReviews.ts`, `useReviewCategories.ts`
- `src/hooks/useModeTheme.ts` — wykrywa `/recki*` i dodaje `.mode-recki` na `<html>`
- `src/index.css` — blok `.mode-recki { --primary: ...; --ring: ...; }`
- Routing w `App.tsx`: 3 nowe trasy publiczne + 3 admin (chronione `requireEditor`).

### Edge functions

- Nowa: `generate-review` (na bazie `extract-article`) — prompt zwraca JSON ze score, pros, cons, sekcjami treści, werdyktem.
- Reuse: `generate-article-image`, `notify-google-index`, `sitemap` (rozszerzony o URL-e recek).

### Admin menu

- `AdminLayout.tsx` — dodać sekcję „Recki" (Reviews, Review Categories) tuż pod „Posty".

---

## Plan wdrożenia (kolejność)

1. **Migracja DB** — tabele, bucket, sloty banerów.
2. **Sub-brand i przełącznik trybu** — `ModeSwitcher`, `useModeTheme`, motyw `.mode-recki`, nowe logo (AI).
3. **CMS** — `ReviewsList`, `ReviewEditor` (bez AI), kategorie recek.
4. **Public pages** — `ReckiHome`, `ReviewPage`, `ReckiCategory`.
5. **AI generator + obraz** — edge function `generate-review`, integracja w edytorze.
6. **Reklamy** — sloty recki, integracja z istniejącym `SponsorBanner`.
7. **SEO** — sitemap, Review schema, OG tagi.

---

## Otwarte kwestie (mogę przyjąć domyślne, ale daj znać)

- **Kategorie startowe Recki:** Smartfony, Audio, Laptopy, Gaming, Smart Home, Akcesoria — OK?
- **Logo:** wygenerować AI (fioletowe „R" w stylu minimal tech) czy wgrasz własne później?
- **Tryb mundialowy:** czy ma być widoczny w `/recki` (raczej nie — to inny sub-brand)? Domyślnie: WYŁĄCZONY w trybie Recki.
