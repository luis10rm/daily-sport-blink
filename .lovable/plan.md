

## Integracja profili autorów z widokami postów

### Obecny stan
Strona profilu autora (`/autor/:slug`) jest gotowa, ale użytkownicy nie mają do niej dostępu, ponieważ mini-karta autora (`AuthorCard`) nie jest jeszcze zintegrowana z komponentami wyświetlającymi posty.

### Propozycja: 3 punkty dostępu do profilu autora

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│  PUNKT 1: NewsCard (każdy artykuł na stronie głównej)                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────────────────────────────┐                                   │
│  │  [Zdjęcie artykułu]                  │                                   │
│  │                                      │                                   │
│  │  Piłka nożna • 24 stycznia 2026      │                                   │
│  │                                      │                                   │
│  │  Tytuł artykułu...                   │                                   │
│  │  Zajawka artykułu...                 │                                   │
│  │                                      │                                   │
│  │  ┌─────────────────────────────────┐ │                                   │
│  │  │  [O] Jan Kowalski              →│ │  ← NOWE: mini-karta autora       │
│  │  │      Redaktor sportowy          │ │    kliknięcie → /autor/slug      │
│  │  └─────────────────────────────────┘ │                                   │
│  │                                      │                                   │
│  │  [Przeczytaj więcej →]               │                                   │
│  └──────────────────────────────────────┘                                   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│  PUNKT 2: NewsOfTheDay (wyróżniony artykuł dnia)                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │  🏆 Wiadomość dnia                                                    │  │
│  │                                                                       │  │
│  │  [Duże zdjęcie]  │  Tytuł artykułu...                                │  │
│  │                  │  Zajawka...                                        │  │
│  │                  │                                                    │  │
│  │                  │  ┌─────────────────────────────┐                   │  │
│  │                  │  │  [O] Jan Kowalski          →│  ← NOWE          │  │
│  │                  │  │      Redaktor sportowy      │                   │  │
│  │                  │  └─────────────────────────────┘                   │  │
│  │                  │                                                    │  │
│  │                  │  [Przeczytaj więcej →]                             │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│  PUNKT 3 (opcjonalnie): Dedykowana sekcja "Nasi Autorzy" na stronie głównej │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ══ Nasi Autorzy ═══════════════════════════════════════════════════════   │
│                                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │    [O]      │  │    [O]      │  │    [O]      │  │    [O]      │        │
│  │ Jan Kowal.  │  │ Anna Nowak  │  │ Piotr Wiśn. │  │ Maria Ziel. │        │
│  │ Redaktor    │  │ Ekspert F1  │  │ Tenis       │  │ MMA         │        │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘        │
│       ↓                ↓                ↓                ↓                  │
│  /autor/jan-k...  /autor/anna-n...  /autor/piotr-w... /autor/maria-z...    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### Szczegóły techniczne

#### 1. Aktualizacja NewsCard.tsx

Dodanie nowego propsa `author` i renderowanie AuthorCard:

```tsx
interface NewsCardProps {
  // ... istniejące propsy
  author?: {
    id: string;
    display_name: string | null;
    avatar_url: string | null;
    slug: string | null;
    role_title: string | null;
  } | null;
}

// W komponencie, przed CTA:
{author && <AuthorCard author={author} />}
```

#### 2. Aktualizacja NewsOfTheDay.tsx

Wykorzystanie `post.author` do wyświetlenia mini-karty autora.

#### 3. Aktualizacja Index.tsx

Przekazanie danych autora do komponentów NewsCard i NewsOfTheDay.

#### 4. (Opcjonalnie) Sekcja "Nasi Autorzy"

Nowy komponent `AuthorsShowcase.tsx` wyświetlający wszystkich publicznych autorów w formie karuzeli lub grida.

---

### Plan wdrożenia

| Krok | Plik | Zmiana |
|------|------|--------|
| 1 | `NewsCard.tsx` | Dodanie propsa `author` i renderowanie `AuthorCard` |
| 2 | `NewsOfTheDay.tsx` | Dodanie `AuthorCard` przed przyciskiem CTA |
| 3 | `Index.tsx` | Przekazanie `post.author` do NewsCard i NewsOfTheDay |
| 4 | (opcja) `AuthorsShowcase.tsx` | Nowy komponent z listą autorów |
| 5 | (opcja) `Index.tsx` | Dodanie sekcji "Nasi Autorzy" na stronie głównej |

---

### Efekt końcowy

Po wdrożeniu użytkownicy będą mogli dotrzeć do profilu autora poprzez:

1. **Kliknięcie mini-karty autora** przy dowolnym artykule
2. **Kliknięcie mini-karty autora** w "Wiadomości dnia"
3. **(Opcjonalnie) Sekcję "Nasi Autorzy"** na stronie głównej

Każde kliknięcie przeniesie na `/autor/{slug}` gdzie zobaczą pełny profil z cover image, bio, statystykami i listą artykułów.

