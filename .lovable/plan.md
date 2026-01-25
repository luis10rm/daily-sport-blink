
# Plan: Niezależne profile autorów z opcjonalnym powiązaniem z kontem

## Cel
Umożliwić administratorowi tworzenie i zarządzanie profilami autorów niezależnie od kont użytkowników, z opcją przypisania profilu do konkretnego adresu email.

## Obecna architektura (problem)
- Tabela `profiles` jest powiązana 1:1 z `auth.users` (profile.id = auth.users.id)
- Profile są tworzone automatycznie przez trigger `handle_new_user` przy rejestracji
- Posty są przypisywane do zalogowanego użytkownika (`created_by = user.id`)
- Nie można utworzyć profilu autora bez wcześniejszej rejestracji konta

## Nowa architektura

### Opcja 1: Niezależna tabela `authors` (zalecana)
Utworzenie osobnej tabeli `authors` oddzielonej od `profiles`:

```text
┌─────────────────────────────┐     ┌──────────────────────────────┐
│       auth.users            │     │          authors             │
├─────────────────────────────┤     ├──────────────────────────────┤
│ id (UUID)                   │◄────│ linked_user_id (UUID, NULL)  │
│ email                       │     │ id (UUID, auto)              │
│ ...                         │     │ display_name                 │
└─────────────────────────────┘     │ slug                         │
                                    │ bio                          │
                                    │ avatar_url                   │
                                    │ cover_image_url              │
                                    │ role_title                   │
                                    │ is_public                    │
                                    │ social_twitter               │
                                    │ social_instagram             │
                                    │ linked_email (TEXT, NULL)    │
                                    └──────────────────────────────┘
```

**Zalety:**
- Pełna elastyczność - autorzy mogą istnieć bez konta
- Można tworzyć profile "zarezerwowane" pod przyszłe konta
- Pole `linked_email` umożliwia pokazanie jakiego emaila dotyczy profil
- Pole `linked_user_id` łączy autora z kontem gdy użytkownik się zarejestruje

**Przepływ:**
1. Admin tworzy autora z `linked_email = "jan@example.com"`
2. Jan rejestruje się na platformie
3. System (trigger lub ręcznie) aktualizuje `linked_user_id` w tabeli `authors`
4. Gdy Jan pisze post, system automatycznie przypisuje go do jego profilu autora

### Opcja 2: Rozszerzenie obecnej tabeli `profiles` (prostsza)
Dodanie pola `linked_email` do istniejącej tabeli `profiles` i możliwość tworzenia rekordów bez powiązania z `auth.users.id`:

**Problem:** Obecna struktura wymusza `profiles.id = auth.users.id`, co uniemożliwia tworzenie niezależnych profili.

---

## Rekomendacja: Opcja 1 (nowa tabela `authors`)

### Zmiany w bazie danych

1. **Nowa tabela `authors`:**
   - `id` (UUID, klucz główny)
   - `linked_user_id` (UUID, opcjonalne, referencja do auth.users)
   - `linked_email` (TEXT, opcjonalne - email do którego profil ma być przypisany)
   - `display_name`, `slug`, `bio`, `avatar_url`, `cover_image_url`, `role_title`, `is_public`, `social_twitter`, `social_instagram`
   - `created_at`, `updated_at`

2. **Migracja danych:**
   - Przeniesienie istniejących profili autorów z `profiles` do `authors`
   - Ustawienie `linked_user_id` dla profili które mają powiązane konta

3. **Aktualizacja tabeli `posts`:**
   - Zmiana referencji `created_by` z `profiles.id` na `authors.id`
   - LUB dodanie nowego pola `author_id` wskazującego na `authors`

4. **Polityki RLS:**
   - Publiczny odczyt dla `is_public = true`
   - Pełny CRUD dla administratorów
   - Edycja własnego profilu dla użytkowników z `linked_user_id`

### Zmiany w kodzie

1. **Nowy hook `useAuthors.tsx`:**
   - `useCreateAuthor()` - tworzenie nowego autora
   - Aktualizacja pozostałych hooków do pracy z nową tabelą

2. **Aktualizacja `AuthorsList.tsx`:**
   - Przycisk "Dodaj autora" 
   - Wyświetlanie `linked_email` w tabeli

3. **Aktualizacja `AuthorEditor.tsx`:**
   - Obsługa tworzenia nowego autora (route `/admin/authors/new`)
   - Nowe pole "Email powiązany" z podpowiedzią
   - Dropdown z listą zarejestrowanych użytkowników (opcjonalnie)

4. **Aktualizacja `PostEditor.tsx`:**
   - Dropdown wyboru autora zamiast automatycznego przypisania
   - Domyślnie wybrany autor powiązany z zalogowanym użytkownikiem

5. **Aktualizacja wszystkich hooków i komponentów:**
   - `usePosts.tsx` - pobieranie autora z nowej tabeli
   - `AuthorCard.tsx`, `NewsCard.tsx`, `NewsOfTheDay.tsx` - bez zmian w logice wyświetlania

### Przepływ użytkownika (admin)

1. Wchodzi w `/admin/authors` → widzi listę autorów
2. Klika "Dodaj autora" → formularz tworzenia
3. Wypełnia dane profilu + opcjonalnie wpisuje email (np. "jan@przyklad.pl")
4. Zapisuje → autor pojawia się na liście
5. Gdy Jan się zarejestruje, admin może "podpiąć" jego konto do profilu

---

## Sekcja techniczna

### Migracja SQL

```sql
-- Tworzenie tabeli authors
CREATE TABLE public.authors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  linked_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  linked_email TEXT,
  display_name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  bio TEXT,
  avatar_url TEXT,
  cover_image_url TEXT,
  role_title TEXT DEFAULT 'Autor',
  is_public BOOLEAN DEFAULT false,
  social_twitter TEXT,
  social_instagram TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indeksy
CREATE INDEX idx_authors_linked_user_id ON public.authors(linked_user_id);
CREATE INDEX idx_authors_slug ON public.authors(slug);
CREATE INDEX idx_authors_is_public ON public.authors(is_public);

-- RLS
ALTER TABLE public.authors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view public authors" ON public.authors
  FOR SELECT USING (is_public = true);

CREATE POLICY "Admins can do everything" ON public.authors
  FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can update their linked profile" ON public.authors
  FOR UPDATE USING (linked_user_id = auth.uid());

-- Migracja danych z profiles
INSERT INTO public.authors (id, linked_user_id, display_name, slug, bio, avatar_url, cover_image_url, role_title, is_public, social_twitter, social_instagram, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  id,
  COALESCE(display_name, full_name, 'Autor'),
  COALESCE(slug, 'autor-' || substr(id::text, 1, 8)),
  bio,
  avatar_url,
  cover_image_url,
  role_title,
  is_public,
  social_twitter,
  social_instagram,
  created_at,
  updated_at
FROM profiles
WHERE display_name IS NOT NULL OR slug IS NOT NULL;

-- Dodanie author_id do posts (opcjonalnie)
ALTER TABLE public.posts ADD COLUMN author_id UUID REFERENCES public.authors(id);
```

### Pliki do modyfikacji

1. **`src/hooks/useAuthors.tsx`** - dodanie `useCreateAuthor`, aktualizacja zapytań
2. **`src/pages/admin/AuthorsList.tsx`** - przycisk "Dodaj autora", kolumna email
3. **`src/pages/admin/AuthorEditor.tsx`** - obsługa tworzenia, pole email
4. **`src/App.tsx`** - nowa route `/admin/authors/new`
5. **`src/pages/admin/PostEditor.tsx`** - dropdown wyboru autora
6. **`src/hooks/usePosts.tsx`** - aktualizacja joinów do nowej tabeli

### Szacowany nakład pracy
- Migracja bazy: 1 migracja SQL
- Frontend: ~6 plików do modyfikacji
- Testowanie: weryfikacja postów, profili publicznych, panelu admin
