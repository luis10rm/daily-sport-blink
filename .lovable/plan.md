
# Plan: Automatyczne wyświetlanie źródła przy każdym newsie

## Cel

Wyświetlić nazwę źródła (domenę) przy każdym newsie, automatycznie wyciąganą z `source_url`. Zero dodatkowej pracy dla redakcji.

## Rozwiązanie

Utworzymy prostą funkcję pomocniczą `getSourceName(url)`, która wyciąga czytelną nazwę domeny z URL. Następnie użyjemy jej w komponentach `NewsCard` i `NewsOfTheDay`.

---

## Wizualne zmiany

### NewsCard
Dodanie nazwy źródła przy przycisku CTA:

```
┌─────────────────────────────────────────┐
│ [Obrazek]                               │
├─────────────────────────────────────────┤
│ ⚽ PIŁKA NOŻNA            25 stycznia   │
│                                         │
│ Tytuł newsa...                          │
│ Krótki opis...                          │
│                                         │
│ 👤 Jan Kowalski                         │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │  Przeczytaj więcej →                │ │
│ └─────────────────────────────────────┘ │
│     Źródło: sportowefakty.wp.pl         │  ← NOWE
└─────────────────────────────────────────┘
```

### NewsOfTheDay
Podobnie - nazwa źródła pod przyciskiem.

---

## Sekcja techniczna

### 1. Nowa funkcja pomocnicza `src/lib/utils.ts`

```typescript
/**
 * Extracts a readable source name from a URL
 * Examples:
 *   https://www.sportowefakty.wp.pl/... → sportowefakty.wp.pl
 *   https://sport.pl/artykul/123       → sport.pl
 *   https://goal.com/news/...           → goal.com
 */
export function getSourceName(url: string): string {
  try {
    const hostname = new URL(url).hostname;
    // Remove 'www.' prefix if present
    return hostname.replace(/^www\./, "");
  } catch {
    return "Źródło zewnętrzne";
  }
}
```

### 2. Modyfikacja `src/components/NewsCard.tsx`

```typescript
import { getSourceName } from "@/lib/utils";

// W komponencie, pod przyciskiem "Przeczytaj więcej":
<a href={sourceUrl} ...>
  Przeczytaj więcej
  <ExternalLink className="h-4 w-4" />
</a>
<span className="text-xs text-muted-foreground text-center">
  Źródło: {getSourceName(sourceUrl)}
</span>
```

### 3. Modyfikacja `src/components/NewsOfTheDay.tsx`

```typescript
import { getSourceName } from "@/lib/utils";

// Pod przyciskiem CTA:
<a href={post.source_url} ...>
  Przeczytaj więcej
  <ExternalLink className="h-5 w-5" />
</a>
<span className="text-sm text-muted-foreground mt-2">
  Źródło: {getSourceName(post.source_url)}
</span>
```

---

## Pliki do modyfikacji

| Plik | Zmiana |
|------|--------|
| `src/lib/utils.ts` | Dodanie funkcji `getSourceName()` |
| `src/components/NewsCard.tsx` | Wyświetlenie źródła pod przyciskiem |
| `src/components/NewsOfTheDay.tsx` | Wyświetlenie źródła pod przyciskiem |

---

## Korzyści SEO

1. **Transparentność** - użytkownicy i wyszukiwarki widzą, że to agregator linkujący do źródeł
2. **Wiarygodność** - podanie źródła buduje zaufanie
3. **Zgodność z prawem** - jasne wskazanie, że treść pochodzi z zewnątrz
4. **Zero dodatkowej pracy** - wszystko dzieje się automatycznie

---

## Przykłady transformacji domen

| URL źródłowy | Wyświetlana nazwa |
|--------------|-------------------|
| `https://www.sportowefakty.wp.pl/pilka-nozna/123` | sportowefakty.wp.pl |
| `https://sport.pl/pilka-nozna/artykul/456` | sport.pl |
| `https://www.goal.com/en/news/789` | goal.com |
| `https://transfermarkt.com/news/abc` | transfermarkt.com |
| `https://www.przegladsportowy.onet.pl/xyz` | przegladsportowy.onet.pl |
