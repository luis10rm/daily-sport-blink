

## Naprawa SEO canonical i og:url

### Diagnoza

| Źródło problemu | Szczegół |
|---|---|
| `index.html` linia 34 | Statyczny `<link rel="canonical" href="https://szortsy.pl" />` — ładuje się przed React i **nigdy nie jest usuwany** |
| `useSEOMeta.ts` linia 62 | Hook poprawnie buduje `canonical = SITE_URL + location.pathname`, ale tag z `index.html` pozostaje jako duplikat |
| Strony bez `useSEOMeta` | `AuthorProfile`, `AuthorsPage`, `DailyPage`, `TagsListPage` używają tylko `useDocumentTitle` — nie ustawiają canonical/og:url wcale |

**Efekt**: Google widzi stały `canonical = https://szortsy.pl` na każdej podstronie (statyczny tag z HTML wygrywa lub tworzy duplikat).

### Zmiany

**1. `index.html`** — usunąć statyczny canonical (linia 34)
```
PRZED:  <link rel="canonical" href="https://szortsy.pl" />
PO:     (usunięte)
```

**2. `src/hooks/useSEOMeta.ts`** — bez zmian w logice (już działa poprawnie), ale upewnić się że `setLink("canonical", ...)` nadpisuje istniejący tag a nie tworzy drugi — obecna implementacja jest OK.

**3. Strony bez `useSEOMeta` — dodać hook**:

- **`src/pages/AuthorProfile.tsx`** — dodać `useSEOMeta({ title: author?.display_name, canonical: https://szortsy.pl/redakcja/${slug} })`
- **`src/pages/AuthorsPage.tsx`** — dodać `useSEOMeta({ title: "Nasi autorzy" })` (zastąpi `useDocumentTitle`)
- **`src/pages/DailyPage.tsx`** — dodać `useSEOMeta({ title: "Briefing sportowy — ..." })` (zastąpi `useDocumentTitle`)
- **`src/pages/TagsListPage.tsx`** — dodać `useSEOMeta({ title: "Tagi" })` (zastąpi `useDocumentTitle`)

### Podsumowanie zmian

| Plik | Zmiana |
|---|---|
| `index.html` | Usunięcie `<link rel="canonical">` (1 linia) |
| `AuthorProfile.tsx` | `useDocumentTitle` → `useSEOMeta` z title + canonical |
| `AuthorsPage.tsx` | `useDocumentTitle` → `useSEOMeta` z title |
| `DailyPage.tsx` | `useDocumentTitle` → `useSEOMeta` z title |
| `TagsListPage.tsx` | `useDocumentTitle` → `useSEOMeta` z title |

Po tych zmianach każda strona będzie miała dokładnie 1 tag canonical i og:url odpowiadający bieżącemu URL.

