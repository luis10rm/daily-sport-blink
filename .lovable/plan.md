

# Plan: Konwersja Markdown do HTML przy wyświetlaniu artykułów

## Zidentyfikowany problem

Treści generowane przez AI używają składni Markdown (`**pogrubienie**`, `*kursywa*`), ale strona BlinkPage nie rozpoznaje tego formatu i wyświetla gwiazdki dosłownie.

```text
OBECNY STAN:
┌─────────────────────────────────────────────────────────────┐
│ AI generuje: **Liverpool FC** wygrał mecz                   │
│                                                             │
│ Strona wyświetla: **Liverpool FC** wygrał mecz              │
│                   ↑↑ gwiazdki widoczne ↑↑                   │
└─────────────────────────────────────────────────────────────┘

PO NAPRAWIE:
┌─────────────────────────────────────────────────────────────┐
│ AI generuje: **Liverpool FC** wygrał mecz                   │
│                                                             │
│ Strona wyświetla: Liverpool FC wygrał mecz                  │
│                   ↑↑ pogrubienie ↑↑                         │
└─────────────────────────────────────────────────────────────┘
```

## Rozwiązanie

Dodanie konwersji Markdown do HTML przy użyciu biblioteki `marked` (lekka, popularny parser Markdown).

## Zmiany w plikach

### 1. Nowa zależność

```bash
npm install marked
```

### 2. Aktualizacja BlinkPage.tsx

Dodanie funkcji konwertującej Markdown do HTML:

```tsx
import { marked } from 'marked';

// Funkcja wykrywająca format treści
const isHtml = (text: string) => /<[^>]+>/.test(text);
const isMarkdown = (text: string) => /\*\*[^*]+\*\*|\*[^*]+\*|^#{1,6}\s|^[-*]\s|\n\n/.test(text);

// Konwersja Markdown do HTML
const parseContent = (content: string): string => {
  if (isHtml(content)) {
    return content; // Już HTML
  }
  if (isMarkdown(content)) {
    return marked.parse(content); // Konwertuj Markdown
  }
  // Fallback - plain text, wrap w <p>
  return content.split(/\n+/)
    .filter(p => p.trim())
    .map(p => `<p>${p}</p>`)
    .join('');
};
```

## Logika wykrywania formatu

| Format | Wzorzec | Obsługa |
|--------|---------|---------|
| HTML | `<p>`, `<strong>`, etc. | Renderuj bezpośrednio |
| Markdown | `**bold**`, `*italic*`, `##` | Konwertuj przez `marked` |
| Plain text | Brak formatowania | Dziel na akapity, wrap w `<p>` |

## Korzyści

- Stare artykuły z Markdown będą wyświetlane poprawnie
- Nowe artykuły z edytora WYSIWYG (HTML) nadal działają
- Przyszłe artykuły generowane przez AI będą automatycznie konwertowane

## Alternatywna opcja (bez nowej biblioteki)

Możemy też zaktualizować prompt AI, aby generował HTML zamiast Markdown:

```text
WAŻNE: Używaj tagów HTML do formatowania:
- <strong>tekst</strong> dla pogrubienia (nie **)
- <em>tekst</em> dla kursywy (nie *)
```

Jednak biblioteka `marked` jest bardziej elastyczna i obsłuży wszystkie istniejące artykuły.

