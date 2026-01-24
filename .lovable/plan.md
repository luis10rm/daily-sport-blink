

## Dedykowane profile twórców treści

### Cel
Stworzyć system wyróżniający autorów postów poprzez dedykowaną podstronę profilu z dużą grafiką i bio, edytowalną z poziomu panelu admina.

---

### Projekt UI

**Publiczna strona profilu twórcy (`/autor/{slug}`):**

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│  [Header nawigacji serwisu]                                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                    COVER IMAGE (pelna szerokosc)                    │    │
│  │                         min. 300px wysokosci                        │    │
│  │                       z gradientowym overlayem                      │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                             │
│           ┌──────────┐                                                      │
│           │  AVATAR  │   <- okragly, wysuwa sie nad cover                  │
│           │  120x120 │      z biala ramka                                  │
│           └──────────┘                                                      │
│                                                                             │
│              Jan Kowalski                                                   │
│              Redaktor sportowy                                             │
│                                                                             │
│              [Twitter] [Instagram]                                         │
│                                                                             │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│  "Pasjonat pilki noznej i tenisa. Sledze sport od 15 lat.                  │
│   Specjalizuje sie w analizach taktycznych i wywiadach z zawodnikami."     │
│                                                                             │
│  ┌────────────────────────────────────────────────────────────────────┐     │
│  │  Statystyki autora                                                 │     │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐                         │     │
│  │  │    47    │  │ Pilka    │  │ Aktywny  │                         │     │
│  │  │artykulow │  │ nozna    │  │od 6 mies.│                         │     │
│  │  └──────────┘  └──────────┘  └──────────┘                         │     │
│  └────────────────────────────────────────────────────────────────────┘     │
│                                                                             │
│  == Artykuly autora ========================================================│
│                                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                          │
│  │  NewsCard   │  │  NewsCard   │  │  NewsCard   │                          │
│  └─────────────┘  └─────────────┘  └─────────────┘                          │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Mini-profil autora w NewsCard:**

```text
┌──────────────────────────────────────────┐
│  [Zdjecie artykulu]                      │
│                                          │
│  Pilka nozna • 24 stycznia 2026          │
│                                          │
│  Tytul artykulu...                       │
│  Zajawka artykulu...                     │
│                                          │
│  ┌─────────────────────────────────────┐ │
│  │  [O] Jan Kowalski                   │ │ <- klikniecie -> /autor/jan-kowalski
│  │      Redaktor sportowy              │ │
│  └─────────────────────────────────────┘ │
│                                          │
│  [Przeczytaj wiecej ->]                  │
└──────────────────────────────────────────┘
```

---

### Architektura rozwiazania

#### 1. Rozszerzenie bazy danych

Nowe kolumny w tabeli `profiles`:

| Kolumna | Typ | Opis |
|---------|-----|------|
| `slug` | text UNIQUE | URL-friendly identyfikator (np. "jan-kowalski") |
| `display_name` | text | Wyswietlana nazwa (np. "Jan Kowalski") |
| `bio` | text | Opis/biografia autora (do 500 znakow) |
| `cover_image_url` | text | URL duzego zdjecia w tle profilu |
| `role_title` | text | Tytul roli (np. "Redaktor sportowy") |
| `is_public` | boolean | Czy profil ma byc widoczny publicznie |
| `social_twitter` | text | Link do Twittera |
| `social_instagram` | text | Link do Instagrama |

**Nowa polityka RLS:**
- "Anyone can view public profiles" - SELECT dla `is_public = true`

**Nowy storage bucket:**
- `author-images` - dla avatarow i cover images

#### 2. Nowe pliki

| Plik | Opis |
|------|------|
| `src/pages/AuthorProfile.tsx` | Publiczna strona profilu autora |
| `src/pages/admin/AuthorEditor.tsx` | Edytor profilu w panelu admina |
| `src/pages/admin/AuthorsList.tsx` | Lista autorow w panelu admina |
| `src/components/AuthorCard.tsx` | Mini-karta autora do NewsCard |
| `src/components/AuthorHero.tsx` | Sekcja hero z cover image na profilu |
| `src/components/AuthorStats.tsx` | Statystyki autora na profilu |
| `src/hooks/useAuthors.tsx` | Hook do pobierania danych autorow |

#### 3. Routing

Nowe trasy:
- `/autor/:slug` - publiczny profil autora
- `/admin/authors` - lista autorow (admin)
- `/admin/authors/:id/edit` - edycja profilu autora

---

### Szczegoly techniczne

#### Migracja bazy danych

```sql
-- Rozszerzenie tabeli profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS slug text UNIQUE,
ADD COLUMN IF NOT EXISTS display_name text,
ADD COLUMN IF NOT EXISTS bio text,
ADD COLUMN IF NOT EXISTS cover_image_url text,
ADD COLUMN IF NOT EXISTS role_title text DEFAULT 'Autor',
ADD COLUMN IF NOT EXISTS is_public boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS social_twitter text,
ADD COLUMN IF NOT EXISTS social_instagram text;

-- Indeks dla szybkiego wyszukiwania po slug
CREATE INDEX IF NOT EXISTS idx_profiles_slug ON profiles(slug);

-- Polityka RLS dla publicznego dostepu do profili
CREATE POLICY "Anyone can view public profiles" ON profiles
FOR SELECT USING (is_public = true);
```

#### Hook useAuthors

```tsx
export interface Author {
  id: string;
  slug: string;
  display_name: string;
  bio: string | null;
  avatar_url: string | null;
  cover_image_url: string | null;
  role_title: string;
  is_public: boolean;
  social_twitter: string | null;
  social_instagram: string | null;
}

export const useAuthor = (slug: string) => {
  return useQuery({
    queryKey: ["author", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("slug", slug)
        .eq("is_public", true)
        .maybeSingle();
      
      if (error) throw error;
      return data as Author | null;
    },
  });
};

export const useAuthorPosts = (authorId: string) => {
  return useQuery({
    queryKey: ["author-posts", authorId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("posts")
        .select("*, sport_category:sport_categories(*)")
        .eq("created_by", authorId)
        .order("published_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!authorId,
  });
};
```

#### Strona profilu AuthorProfile.tsx

Kluczowe elementy:
- **Hero section** z cover image i overlay gradientowym
- **Avatar** wystajacy ponad cover (transform: translateY(-50%))
- **Statystyki** w grid: liczba artykulow, ulubiona kategoria, czas od pierwszego postu
- **Social links** z ikonami Twittera i Instagrama
- **Grid postow** autora z komponentami NewsCard

#### Mini-karta autora w NewsCard

Nowy props w NewsCard:
```tsx
author?: {
  id: string;
  display_name: string;
  avatar_url: string | null;
  slug: string;
  role_title: string;
} | null;
```

Renderowanie przed CTA:
```tsx
{author && (
  <Link to={`/autor/${author.slug}`} 
    className="flex items-center gap-2 mt-2 p-2 -mx-2 rounded-lg hover:bg-muted/50 transition-colors">
    <Avatar className="h-8 w-8">
      <AvatarImage src={author.avatar_url || undefined} />
      <AvatarFallback>{author.display_name?.charAt(0)}</AvatarFallback>
    </Avatar>
    <div className="text-sm">
      <p className="font-medium">{author.display_name}</p>
      <p className="text-xs text-muted-foreground">{author.role_title}</p>
    </div>
  </Link>
)}
```

#### Edytor profilu w adminie

Formularz z polami:
- Display Name (wymagane)
- Slug (auto-generowany z nazwy)
- Bio (textarea, max 500 znakow)
- Avatar (ImageUploader)
- Cover Image (ImageUploader z podgladem szerokosci)
- Role Title (np. "Redaktor sportowy")
- Is Public (switch - czy pokazywac na stronie)
- Social links (Twitter, Instagram)

---

### Nawigacja admina

Dodanie do `AdminLayout.tsx`:

```tsx
{ href: "/admin/authors", label: "Autorzy", icon: UserPen },
```

---

### Plan wdrozenia (kolejnosc)

| Krok | Opis |
|------|------|
| 1 | Migracja bazy danych - rozszerzenie tabeli `profiles` |
| 2 | Utworzenie bucketu `author-images` w storage |
| 3 | Utworzenie `src/hooks/useAuthors.tsx` |
| 4 | Utworzenie `src/components/AuthorCard.tsx` |
| 5 | Utworzenie `src/components/AuthorHero.tsx` |
| 6 | Utworzenie `src/components/AuthorStats.tsx` |
| 7 | Utworzenie `src/pages/AuthorProfile.tsx` |
| 8 | Utworzenie `src/pages/admin/AuthorsList.tsx` |
| 9 | Utworzenie `src/pages/admin/AuthorEditor.tsx` |
| 10 | Aktualizacja `AdminLayout.tsx` - dodanie linku |
| 11 | Aktualizacja `App.tsx` - nowe trasy |
| 12 | Aktualizacja `usePosts.tsx` - fetch danych autora z postami |
| 13 | Aktualizacja `NewsCard.tsx` - integracja mini-karty autora |
| 14 | Aktualizacja `NewsOfTheDay.tsx` - integracja mini-karty autora |

---

### Efekt koncowy

1. **Wyroznienie tworcow**: Kazdy autor ma swoja dedykowana strone z duza grafika, bio i statystykami
2. **Budowanie marki osobistej**: Linki do social media, profesjonalny tytul roli
3. **Engagement**: Uzytkownicy moga przegladac artykuly ulubionego autora
4. **Latwa edycja**: Admin moze zarzadzac profilami bezposrednio z panelu

