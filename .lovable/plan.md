

## News Discovery — automatyczne propozycje newsów z monitorowanych źródeł

### Cel
Admin dodaje listę zaufanych źródeł sportowych (np. sport.pl, meczyki.pl, weszlo.com). System cyklicznie skanuje te strony, wyciąga najnowsze artykuły, AI ocenia ich atrakcyjność, a admin w panelu jednym kliknięciem akceptuje propozycję — co automatycznie tworzy szkic posta (z gotowym tytułem, treścią, kategorią, tagami, obrazkiem) gotowy do publikacji.

### Architektura

```text
[news_sources]  ──cron co 1h──>  [scan-news-sources]  ──Firecrawl──>  surowa lista artykułów
                                          │
                                          ▼
                                 [news_suggestions]  <──AI ocena (score 1-10)
                                          │
                                          ▼
                          Panel admina /admin/suggestions
                                          │
                          [Zaakceptuj] ──> extract-article (istniejący) ──> PostEditor (prefill)
                          [Odrzuć]    ──> status: rejected
```

### Zmiany w bazie

**Tabela `news_sources`** — lista monitorowanych portali
- `id`, `name`, `url` (np. https://sport.pl), `list_selector` (opcjonalnie CSS dla listy), `is_active`, `last_scanned_at`, `created_at`

**Tabela `news_suggestions`** — propozycje newsów
- `id`, `source_id`, `article_url` (unique), `title`, `excerpt`, `image_url`, `published_at`
- `ai_score` (1-10), `ai_reasoning`, `suggested_category_id`, `suggested_tags`
- `status` ('pending' | 'accepted' | 'rejected' | 'published')
- `accepted_post_id` (FK do posts po publikacji)
- `discovered_at`, `created_at`

RLS: tylko admin/editor mogą czytać/zapisywać.

### Edge functions

**1. `scan-news-sources`** (nowa, cron co 1h)
- Pobiera aktywne źródła z `news_sources`
- Dla każdego źródła używa **Firecrawl `/map` lub `/scrape` z formatem `links`** żeby pobrać listę URL-i artykułów
- Filtruje URL-e które już są w `news_suggestions` (deduplikacja po `article_url`)
- Dla nowych: scrape metadata (title, excerpt, image, date) — Firecrawl `scrape` z `formats: ['markdown', 'json']`
- Wywołuje Lovable AI (gemini-2.5-flash) — ocena atrakcyjności + sugerowana kategoria + tagi
- Zapisuje do `news_suggestions` ze statusem `pending`

**2. Schedule** — `pg_cron` co 1h wywołuje `scan-news-sources`

### Panel admina — nowa strona `/admin/suggestions`

**Layout**: lista kart propozycji posortowana po `ai_score DESC, discovered_at DESC`

Każda karta:
- Miniatura + tytuł + excerpt + źródło + data
- Badge ze score AI (np. „⭐ 9/10 — gorący temat") + tooltip z `ai_reasoning`
- Sugerowana kategoria + tagi (chip)
- Przyciski:
  - **„Przygotuj artykuł"** → nawiguje do `/admin/posts/new` z prefillem przez istniejący flow `useExtractArticle` (URL źródła auto-wypełniony, AI generuje treść)
  - **„Odrzuć"** → status `rejected`
  - **„Otwórz źródło"** → link zewnętrzny

Filtry: status (pending/rejected/all), źródło, min. score, dzisiejsze.

**Sidebar nawigacja**: dodać link „Propozycje newsów" z badge'em pokazującym liczbę pending.

### Sub-strona `/admin/sources` — zarządzanie źródłami

Prosta CRUD-owa lista:
- Tabela: nazwa, URL, status (aktywny/nie), ostatni skan, liczba propozycji
- Modal dodawania: nazwa + URL + opcjonalny CSS selector
- Przycisk „Skanuj teraz" — manual trigger `scan-news-sources` dla pojedynczego źródła

### Integracja z istniejącym flow

Przycisk „Przygotuj artykuł" w propozycji **NIE** generuje wszystkiego automatycznie — wykorzystuje istniejący `useExtractArticle` w `PostEditor`, czyli:
1. Otwiera `/admin/posts/new`
2. Pole `source_url` jest auto-wypełnione
3. Auto-uruchamia AI extraction (jak teraz po kliknięciu „Generuj AI")
4. Admin może edytować przed publikacją
5. Po zapisie posta → aktualizuje `news_suggestions.status = 'published'` + `accepted_post_id`

### Wymagania techniczne

- **Firecrawl** — już połączony (widzę `FIRECRAWL_API_KEY` w sekretach + użycie w `extract-article`)
- **Lovable AI** — już używany (`gemini-2.5-flash` do oceny — tani, szybki)
- **pg_cron + pg_net** — do enable'a (jeśli jeszcze nie aktywne) dla harmonogramu
- Brak nowych sekretów

### Kluczowe pytania przed implementacją

Trzy decyzje wpłyną na zakres MVP:
