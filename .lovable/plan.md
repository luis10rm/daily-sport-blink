

## Nowa podstrona: Lista Autorów (`/autorzy`)

### Cel
Stworzyć dedykowaną podstronę `/autorzy` wyświetlającą wszystkich publicznych twórców serwisu w atrakcyjnej formie siatki/karuzeli.

---

### Projekt UI

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│  [Header nawigacji serwisu]                                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ══ Nasi Autorzy ═══════════════════════════════════════════════════════   │
│  Poznaj zespol tworcow, ktorzy dostarczaja Ci najswiezsze wiadomosci       │
│  sportowe kazdego dnia.                                                     │
│                                                                             │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐             │
│  │                 │  │                 │  │                 │             │
│  │   [Cover BG]    │  │   [Cover BG]    │  │   [Cover BG]    │             │
│  │                 │  │                 │  │                 │             │
│  │      [O]        │  │      [O]        │  │      [O]        │             │
│  │  Jan Kowalski   │  │  Anna Nowak     │  │  Piotr Wisniewski│            │
│  │ Redaktor sport. │  │  Ekspert F1     │  │  Analityk tenisa│            │
│  │                 │  │                 │  │                 │             │
│  │  "Pasjonat      │  │  "Sledze F1     │  │  "Tenis to moja │            │
│  │   pilki..."     │  │   od 10 lat..." │  │   pasja..."     │            │
│  │                 │  │                 │  │                 │             │
│  │  [47 artykulow] │  │  [23 artykuly]  │  │  [15 artykulow] │            │
│  │                 │  │                 │  │                 │             │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘             │
│         ↓                    ↓                    ↓                        │
│  /autor/jan-kowalski  /autor/anna-nowak  /autor/piotr-wisniewski          │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### Architektura rozwiazania

#### 1. Nowy hook do pobierania publicznych autorow

Rozszerzenie `useAuthors.tsx` o nowy hook:

```tsx
// Fetch all PUBLIC authors for public page
export const usePublicAuthors = () => {
  return useQuery({
    queryKey: ["public-authors"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("is_public", true)
        .not("slug", "is", null)
        .not("display_name", "is", null)
        .order("display_name", { ascending: true });

      if (error) throw error;
      return data as Author[];
    },
  });
};
```

#### 2. Nowy komponent karty autora (rozbudowany)

`AuthorProfileCard.tsx` - wieksza karta z cover image, bio i statystykami:

```tsx
interface AuthorProfileCardProps {
  author: Author;
  postsCount?: number;
}

// Renderuje:
// - Cover image jako tlo (lub gradient fallback)
// - Okragly avatar
// - Display name + role_title
// - Skrocone bio (max 100 znakow)
// - Liczba artykulow
// - Cale jako link do /autor/{slug}
```

#### 3. Nowa strona AuthorsList (publiczna)

`src/pages/AuthorsList.tsx` - publiczna lista autorow:

- Header serwisu
- Tytul sekcji z opisem
- Grid kart autorow (responsywny: 1-2-3 kolumny)
- Stan ladowania (skeleton)
- Stan pusty (brak autorow)

#### 4. Nawigacja

Aktualizacja `Header.tsx`:
- Dodanie linku "Autorzy" w naglowku prowadzacego do `/autorzy`

Aktualizacja `App.tsx`:
- Nowa trasa `/autorzy` -> `AuthorsList`

---

### Plan wdrozenia

| Krok | Plik | Zmiana |
|------|------|--------|
| 1 | `src/hooks/useAuthors.tsx` | Dodanie hooka `usePublicAuthors` |
| 2 | `src/components/AuthorProfileCard.tsx` | Nowy komponent rozbudowanej karty autora |
| 3 | `src/pages/AuthorsList.tsx` | Nowa publiczna strona z lista autorow |
| 4 | `src/App.tsx` | Dodanie trasy `/autorzy` |
| 5 | `src/components/Header.tsx` | Dodanie linku nawigacyjnego "Autorzy" |

---

### Efekt koncowy

Uzytkownicy beda mogli dotrzec do listy autorow poprzez:

1. **Klikniecie linku "Autorzy"** w naglowku strony
2. **Bezposrednie wejscie** na adres `/autorzy`

Na stronie zobacza wszystkich publicznych tworcow z ich zdjeciami, bio i liczba artykulow. Klikniecie karty przeniesie na pelny profil autora (`/autor/{slug}`).

