
# Plan: Programmatic SEO - Automatyczne strony dla piłkarzy i klubów

## Cel

Automatyczne generowanie stron SEO dla encji sportowych (piłkarzy, klubów, turniejów) na podstawie tagów w postach. Bez dodatkowej pracy redakcji - strony tworzą się "same" gdy pojawia się wystarczająca liczba postów z danym tagiem.

## Filozofia

Zamiast ręcznie tworzyć strony dla Lewandowskiego czy Barcelony:
1. AI już teraz generuje tagi przy ekstrakcji artykułów
2. System automatycznie wykrywa "popularne" tagi (np. min. 2 posty)
3. Tworzy dla nich dedykowane strony SEO z dynamicznie generowanym opisem

## Struktura URL

```text
/tag/robert-lewandowski     → Strona agregująca posty o Lewandowskim
/tag/real-madryt            → Strona agregująca posty o Realu
/tag/australian-open        → Strona agregująca posty o turnieju
```

Wybrano `/tag/` jako prefiks (nie `/pilkarz/` czy `/klub/`), ponieważ:
- Jeden tag może być piłkarzem, trenerem, lub osobą związaną z wieloma kontekstami
- Nie wymaga klasyfikacji typu encji
- Prostsza implementacja, mniejsze ryzyko błędów

## Strona tagu - zawartość

```text
┌─────────────────────────────────────────────────────────────┐
│ Breadcrumbs: Strona główna > Tagi > Robert Lewandowski     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  🏷️ Robert Lewandowski                                     │
│     12 artykułów w serwisie Szortsy                        │
│                                                             │
│  ┌─ Opis (generowany przez AI) ────────────────────────┐   │
│  │ Polski napastnik, obecnie w FC Barcelona.           │   │
│  │ Jeden z najlepszych strzelców w historii...         │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  [Grid z NewsCard - wszystkie posty z tym tagiem]          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Zmiany do wdrożenia

### 1. Nowa tabela: `tags` (encje)

Przechowuje unikalne tagi z opcjonalnym opisem generowanym przez AI:

| Kolumna | Typ | Opis |
|---------|-----|------|
| id | uuid | Klucz główny |
| name | text | Oryginalna nazwa tagu (np. "Robert Lewandowski") |
| slug | text | Slug do URL (np. "robert-lewandowski") |
| description | text | Opis AI (nullable, generowany na żądanie) |
| post_count | int | Liczba postów z tym tagiem (cache) |
| created_at | timestamp | Data utworzenia |
| updated_at | timestamp | Data ostatniej aktualizacji |

### 2. Automatyczna synchronizacja tagów

Trigger lub cron job, który:
- Skanuje unikalne tagi z tabeli `posts`
- Tworzy/aktualizuje rekordy w tabeli `tags`
- Aktualizuje `post_count` dla każdego tagu

### 3. Strona `/tag/:slug`

Nowa strona React wzorowana na `CategoryPage.tsx`:
- Wyświetla wszystkie posty z danym tagiem
- Pokazuje opis AI (jeśli istnieje)
- SEO: dynamiczny tytuł, JSON-LD ItemList

### 4. Lista tagów (opcjonalnie)

Strona `/tagi` z alfabetyczną listą wszystkich tagów (min. 2 posty).

### 5. Linki na tagach w NewsCard

Tagi w `NewsCard` stają się klikalnymi linkami do `/tag/:slug`.

---

## Sekcja techniczna

### Nowa tabela SQL

```sql
CREATE TABLE tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  description text,
  post_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Index dla szybkiego wyszukiwania po slug
CREATE INDEX idx_tags_slug ON tags(slug);

-- RLS: publiczny odczyt
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view tags" ON tags FOR SELECT USING (true);
CREATE POLICY "Admins can manage tags" ON tags FOR ALL USING (has_role(auth.uid(), 'admin'));
```

### Funkcja synchronizacji tagów

```sql
CREATE OR REPLACE FUNCTION sync_tags()
RETURNS void AS $$
BEGIN
  -- Wstaw nowe tagi
  INSERT INTO tags (name, slug, post_count)
  SELECT 
    tag,
    lower(regexp_replace(
      regexp_replace(tag, '[ąęóśłżźćń]', 
        CASE 
          WHEN tag ~ 'ą' THEN 'a'
          WHEN tag ~ 'ę' THEN 'e'
          -- etc
        END, 'g'),
      '[^a-z0-9]+', '-', 'g'
    )),
    count(*)
  FROM posts, unnest(tags) AS tag
  WHERE tags IS NOT NULL
  GROUP BY tag
  ON CONFLICT (name) DO UPDATE SET
    post_count = EXCLUDED.post_count,
    updated_at = now();
END;
$$ LANGUAGE plpgsql;
```

### Nowy hook: `useTagBySlug`

```typescript
export const useTagBySlug = (slug: string) => {
  return useQuery({
    queryKey: ["tag", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tags")
        .select("*")
        .eq("slug", slug)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!slug,
  });
};

export const usePostsByTag = (tagName: string) => {
  return useQuery({
    queryKey: ["posts", "tag", tagName],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("posts")
        .select(POST_SELECT)
        .contains("tags", [tagName])
        .order("published_at", { ascending: false });
      
      if (error) throw error;
      return data as Post[];
    },
    enabled: !!tagName,
  });
};
```

### Strona TagPage.tsx

```typescript
const TagPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data: tag, isLoading: tagLoading } = useTagBySlug(slug);
  const { data: posts = [], isLoading: postsLoading } = usePostsByTag(tag?.name || "");

  useDocumentTitle(tag?.name || "Tag");

  // SEO JSON-LD
  const seoData = getItemListSEO(
    `Artykuły: ${tag?.name || "Tag"}`,
    posts.map((post) => ({
      headline: post.title,
      datePublished: post.published_at,
    }))
  );

  return (
    <div className="min-h-screen bg-background">
      <SEO {...seoData} />
      <Header />
      <PatronBar />

      <main className="container py-8 md:py-12">
        <Breadcrumb>...</Breadcrumb>

        <div className="flex items-center gap-4 mb-8">
          <Tag className="h-10 w-10 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">{tag?.name}</h1>
            <p className="text-muted-foreground">
              {tag?.post_count} artykułów w serwisie Szortsy
            </p>
          </div>
        </div>

        {tag?.description && (
          <div className="mb-8 rounded-lg bg-muted/50 p-4 text-sm">
            {tag.description}
          </div>
        )}

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => <NewsCard ... />)}
        </div>
      </main>
    </div>
  );
};
```

### Modyfikacja NewsCard - linki na tagach

```typescript
// Zamiana statycznych tagów na linki
{tags?.slice(0, 3).map((tag) => (
  <Link
    key={tag}
    to={`/tag/${generateSlug(tag)}`}
    className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium 
               text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
  >
    {tag}
  </Link>
))}
```

### Generowanie opisu AI (opcjonalne rozszerzenie)

Edge function `generate-tag-description`:
- Wywoływana gdy admin klika "Generuj opis" lub automatycznie dla tagów z >5 postami
- AI generuje 2-3 zdania opisu na podstawie nazwy tagu i kontekstu postów

---

## Pliki do utworzenia/modyfikacji

| Plik | Akcja |
|------|-------|
| Migracja SQL | Tabela `tags` + funkcja sync |
| `src/hooks/useTags.tsx` | **Nowy** - hooki dla tagów |
| `src/pages/TagPage.tsx` | **Nowy** - strona tagu |
| `src/pages/TagsListPage.tsx` | **Nowy** (opcjonalnie) - lista tagów |
| `src/components/NewsCard.tsx` | Tagi jako linki |
| `src/App.tsx` | Nowe trasy `/tag/:slug` i `/tagi` |
| `public/sitemap.xml` | Dodanie popularnych tagów |
| `src/lib/utils.ts` | Funkcja `generateSlug()` |

---

## Efekt końcowy

1. **Masa krytyczna** - każdy post automatycznie wzbogaca strony tagów
2. **Zero pracy redakcji** - AI generuje tagi przy dodawaniu posta
3. **Long-tail SEO** - strony dla "Iga Świątek", "Australian Open", "Real Madryt"
4. **Wewnętrzne linkowanie** - tagi linkują między sobą, budując strukturę serwisu
5. **Skalowalność** - im więcej postów, tym więcej stron SEO

## Przykładowe URL-e (na podstawie obecnych tagów)

```text
/tag/iga-swiatek           (3 posty)
/tag/real-madryt           (5 postów)
/tag/australian-open       (7 postów)
/tag/kylian-mbappe         (2 posty)
/tag/premier-league        (2 posty)
```
