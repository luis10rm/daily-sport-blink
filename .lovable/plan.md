
# Plan: Naprawa renderowania mieszanego formatu HTML + Markdown

## Zidentyfikowany problem

Treść artykułu w bazie danych zawiera **mieszany format**:
```html
<p>Poznaliśmy pełny zestaw drużyn... **Liverpool FC**, **Bayern Monachium**...</p>
```

AI generuje tag `<p>` ale używa wewnątrz składni Markdown (`**bold**`).

Obecna logika wykrywa tag `<p>` → traktuje całość jako HTML → nie konwertuje gwiazdek.

## Rozwiązanie dwutorowe

### Opcja A: Naprawić renderowanie (szybkie, natychmiastowe)

Zmienić logikę `parseContent` tak, aby **zawsze** konwertowała Markdown wewnątrz HTML:

```typescript
const parseContent = (content: string): string => {
  // Zawsze przetwórz przez marked - obsługuje zarówno czysty Markdown,
  // jak i mieszany HTML+Markdown
  return marked.parse(content, { async: false }) as string;
};
```

Biblioteka `marked` jest w stanie przetwarzać HTML z Markdownem w środku - pozostawi tagi HTML bez zmian, ale skonwertuje `**bold**` na `<strong>`.

### Opcja B: Naprawić źródło (trwałe rozwiązanie)

Zaktualizować prompt w edge function, aby AI generował **czysty HTML**:

```text
FORMATOWANIE:
- Używaj tagów HTML do formatowania tekstu
- <strong>tekst</strong> dla pogrubienia (NIE **)
- <em>tekst</em> dla kursywy (NIE *)
- <p>...</p> dla akapitów
- NIE używaj składni Markdown!
```

## Rekomendacja

**Wykonać obie opcje**:
1. Najpierw naprawić renderowanie - natychmiast naprawia istniejące artykuły
2. Potem zaktualizować prompt - nowe artykuły będą w czystym HTML

## Zmiany w plikach

| Plik | Zmiana |
|------|--------|
| `src/pages/BlinkPage.tsx` | Uproszczenie `parseContent` - zawsze przez `marked` |
| `supabase/functions/extract-article/index.ts` | Dodanie instrukcji formatowania HTML do promptu |

## Szczegóły techniczne

### BlinkPage.tsx - nowa logika

```typescript
const parseContent = (content: string): string => {
  if (!content) return "";
  
  // marked.parse() obsługuje:
  // - Czysty Markdown: **bold** → <strong>bold</strong>
  // - Czysty HTML: <p>text</p> → <p>text</p> (bez zmian)
  // - Mieszany: <p>**bold**</p> → <p><strong>bold</strong></p>
  return marked.parse(content, { async: false }) as string;
};
```

### extract-article/index.ts - zaktualizowany prompt

```typescript
const DEFAULT_CONTENT_PROMPT = `Na podstawie oryginalnego artykułu napisz unikatową, skróconą wersję newsa sportowego w języku polskim.

ZASADY TREŚCI:
- 300-500 słów
- Prosty, angażujący język
- Wszystkie kluczowe fakty z oryginału
- Dynamiczny, dziennikarski ton
- 3-5 akapitów (każdy 2-4 zdania)
- Bez powtarzania tytułu na początku

FORMATOWANIE (OBOWIĄZKOWE):
- Używaj TYLKO tagów HTML, NIE składni Markdown!
- <strong>tekst</strong> dla pogrubienia (NIE ** **)
- <em>tekst</em> dla kursywy (NIE * *)
- Każdy akapit otocz tagiem <p>...</p>
- Oddzielaj akapity pustą linią dla czytelności`;
```

## Efekt po naprawie

| Sytuacja | Przed | Po |
|----------|-------|-----|
| Istniejące artykuły z `<p>**bold**</p>` | Gwiazdki widoczne | Tekst pogrubiony |
| Nowe artykuły z edytora WYSIWYG | Działa | Działa (bez zmian) |
| Nowe artykuły z AI | Mieszany format | Czysty HTML |
