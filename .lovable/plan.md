

# Plan: Naprawa błędu duplikacji slugów tagów

## Zidentyfikowany problem

Przy publikacji podsumowania dnia (lub dowolnego posta z tagami) trigger `sync_tags_on_post_change` wywołuje funkcję `sync_tags()`, która:

1. Próbuje wstawić tagi z postów do tabeli `tags`
2. Używa `ON CONFLICT (name)` aby obsłużyć duplikaty nazw
3. **ALE** tabela ma też constraint `UNIQUE (slug)` - `tags_slug_key`
4. Gdy dwa różne tagi generują ten sam slug (np. "Widzew Łódź" już istnieje → slug "widzew-lodz"), funkcja rzuca błąd

**Przykład z logów:**
```
Key (slug)=(widzew-lodz) already exists.
```

Tag "Widzew Łódź" już istnieje w tabeli `tags`. Gdy próbujesz opublikować post z tym tagiem, trigger próbuje go wstawić ponownie, ale slug "widzew-lodz" już istnieje.

## Rozwiązanie

Zmienić klauzulę `ON CONFLICT` w funkcji `sync_tags()` aby obsługiwała też konflikty slugów.

**Opcja A (zalecana):** Obsługa obu conflictów przez dodanie `ON CONFLICT ON CONSTRAINT` lub użycie `WHERE NOT EXISTS`:

```sql
INSERT INTO tags (name, slug, post_count)
SELECT 
  tag,
  generate_tag_slug(tag),
  count(*)::integer
FROM posts, unnest(tags) AS tag
WHERE tags IS NOT NULL 
  AND published_at <= now()
  AND NOT EXISTS (
    SELECT 1 FROM tags t 
    WHERE t.name = tag OR t.slug = generate_tag_slug(tag)
  )
GROUP BY tag;

-- Następnie zaktualizuj post_count dla istniejących tagów
UPDATE tags t SET
  post_count = (
    SELECT count(*)::integer 
    FROM posts p 
    WHERE t.name = ANY(p.tags) AND p.published_at <= now()
  ),
  updated_at = now()
WHERE EXISTS (
  SELECT 1 FROM posts p 
  WHERE t.name = ANY(p.tags) AND p.published_at <= now()
);
```

**Opcja B:** Użycie `ON CONFLICT (slug)` zamiast `ON CONFLICT (name)`:

```sql
ON CONFLICT (slug) DO UPDATE SET
  post_count = EXCLUDED.post_count,
  updated_at = now()
WHERE tags.name = EXCLUDED.name;
```

## Implementacja

Wykonam migrację bazy danych która zaktualizuje funkcję `sync_tags()`:

| Element | Zmiana |
|---------|--------|
| Funkcja `sync_tags()` | Zmiana logiki INSERT na bezpieczną dla obu constraintów |

## Sekcja techniczna

### Nowa wersja funkcji sync_tags()

```sql
CREATE OR REPLACE FUNCTION public.sync_tags()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Insert only truly new tags (not existing by name OR slug)
  INSERT INTO tags (name, slug, post_count)
  SELECT 
    tag,
    generate_tag_slug(tag),
    count(*)::integer
  FROM posts, unnest(tags) AS tag
  WHERE tags IS NOT NULL 
    AND published_at <= now()
  GROUP BY tag
  ON CONFLICT (name) DO UPDATE SET
    post_count = EXCLUDED.post_count,
    updated_at = now();
    
  -- Handle potential slug conflicts by updating existing tags
  -- (This catches cases where name is different but slug is the same)
  
  -- Update counts for all existing tags
  UPDATE tags t SET 
    post_count = COALESCE((
      SELECT count(*)::integer 
      FROM posts p 
      WHERE t.name = ANY(p.tags) AND p.published_at <= now()
    ), 0),
    updated_at = now();
END;
$function$;
```

**Alternatywnie** - bardziej bezpieczna wersja z pominięciem duplikatów slugów:

```sql
CREATE OR REPLACE FUNCTION public.sync_tags()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Insert new tags, ignoring any that would cause conflicts
  INSERT INTO tags (name, slug, post_count)
  SELECT 
    tag,
    generate_tag_slug(tag),
    count(*)::integer
  FROM posts, unnest(tags) AS tag
  WHERE tags IS NOT NULL 
    AND published_at <= now()
  GROUP BY tag
  ON CONFLICT (name) DO UPDATE SET
    post_count = EXCLUDED.post_count,
    updated_at = now()
  ON CONFLICT (slug) DO NOTHING;
    
  -- Update counts for all existing tags
  UPDATE tags t SET 
    post_count = COALESCE((
      SELECT count(*)::integer 
      FROM posts p 
      WHERE t.name = ANY(p.tags) AND p.published_at <= now()
    ), 0),
    updated_at = now();
END;
$function$;
```

**Uwaga:** PostgreSQL nie obsługuje wielu klauzul `ON CONFLICT` w jednym INSERT. Dlatego użyjemy podejścia z `WHERE NOT EXISTS`:

### Finalna wersja (rekomendowana)

```sql
CREATE OR REPLACE FUNCTION public.sync_tags()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  tag_record RECORD;
BEGIN
  -- Process each unique tag from posts
  FOR tag_record IN 
    SELECT 
      tag as name,
      generate_tag_slug(tag) as slug,
      count(*)::integer as post_count
    FROM posts, unnest(tags) AS tag
    WHERE tags IS NOT NULL AND published_at <= now()
    GROUP BY tag
  LOOP
    -- Try to insert, on name conflict update, on slug conflict skip
    INSERT INTO tags (name, slug, post_count)
    VALUES (tag_record.name, tag_record.slug, tag_record.post_count)
    ON CONFLICT (name) DO UPDATE SET
      post_count = EXCLUDED.post_count,
      updated_at = now();
  EXCEPTION WHEN unique_violation THEN
    -- Slug already exists with different name - just update the post_count
    UPDATE tags SET 
      post_count = tag_record.post_count,
      updated_at = now()
    WHERE slug = tag_record.slug;
  END LOOP;
    
  -- Update counts for tags that might have decreased
  UPDATE tags t SET 
    post_count = COALESCE((
      SELECT count(*)::integer 
      FROM posts p 
      WHERE t.name = ANY(p.tags) AND p.published_at <= now()
    ), 0),
    updated_at = now()
  WHERE NOT EXISTS (
    SELECT 1 FROM posts, unnest(tags) AS tag 
    WHERE tag = t.name AND published_at <= now()
  );
END;
$function$;
```

