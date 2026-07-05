## Co jest nie tak z tą recenzją

Sprawdziłem treść w bazie. Tym razem **to nie są escape'owane encje** (`&lt;`) — HTML jest prawdziwy, ale ma dwa inne problemy:

### Problem 1 — podwójne opakowanie `<p>` wokół bloków
Zapisana treść zaczyna się tak:
```
<p><p>NuPhy to marka...</p> <h2>Pierwsze wrażenie...</h2> <p>Na papierze...</p> ...</p>
```
Zewnętrzny `<p>` obejmuje `<h2>`, `<ul>`, kolejne `<p>` — a przeglądarka **nie może** zagnieżdżać bloków w `<p>`, więc automatycznie zamyka pierwszy `<p>` przed każdym `<h2>`/`<p>`, potem pojawia się „osierocony" `</p>`, i cały układ typograficzny (odstępy, drop cap, marginesy) się rozjeżdża. To efekt uboczny wklejenia HTML-a do TipTapa, który sam owija wstawkę w akapit.

### Problem 2 — leftover z AI: `:antCitation[]{...}`
W treści są fragmenty w stylu:
```
:antCitation[]{citations="8e95cf57-..." injected="space"}
```
To składnia „directive" z outputu Claude/Anthropic — nasz renderer nie zna jej, więc **wyświetla ją dosłownie** w tekście. Wygląda jak śmieć.

Skala w bazie: 2 recenzje z podwójnym `<p>`, 1 recenzja z artefaktami cytowań, 0 postów.

---

## Proponowane fixy (3 warstwy — spójne z tym co już zrobiliśmy dla escape'owanych encji)

### A. Sanityzacja przy zapisie (`ReviewEditor.tsx`, `PostEditor.tsx`)
Rozszerzyć obecny `unescapeHtmlIfEncoded` o nowy helper `sanitizePastedHtml(content)`, który dodatkowo:
1. **Rozpakowuje zewnętrzny `<p>...</p>`**, jeśli w środku są tagi blokowe (`<h2>`, `<h3>`, `<p>`, `<ul>`, `<ol>`, `<blockquote>`). Regex: dopasuj `^<p>\s*(.*)\s*</p>$` i tylko wtedy, gdy wnętrze zawiera `<(h[1-6]|p|ul|ol|blockquote|div)\b`.
2. **Usuwa dyrektywy AI** typu `:antCitation[...]{...}`, `:cite[...]{...}` — regex `/:ant[A-Za-z]+\[[^\]]*\]\{[^}]*\}/g` oraz ogólniejszy `/:\w+\[[^\]]*\]\{[^}]*\}/g`.
3. Trim wielokrotnych spacji między tagami blokowymi (kosmetyka).

Helper trafia do `src/lib/unescapeHtmlIfEncoded.ts` → przemianować mentalnie na „sanitizer" albo dodać nowy plik `src/lib/sanitizePastedHtml.ts` i wołać obie funkcje razem.

### B. Warstwa renderująca (`ReckiReview.tsx`, `BlinkPage.tsx`)
W `parseContent` — po `unescapeHtmlIfEncoded`, przed `normalizeMarkdownInHtml` — wywołać ten sam `sanitizePastedHtml`. Dzięki temu stare rekordy w bazie od razu wyglądają dobrze bez migracji, a nowe zapisy też są bezpieczne (defense-in-depth).

### C. Handler wklejania (`RichTextEditor.tsx`)
W `handlePaste`, w gałęziach „encoded HTML" i „raw HTML", przed wstawieniem do TipTapa również przepuścić przez `sanitizePastedHtml`. Wtedy edytor od początku pokazuje czystą treść, a autor widzi to samo co czytelnik.

### D. Migracja czyszcząca istniejące rekordy (jednorazowa)
SQL na `reviews` i `posts`:
- usunięcie dyrektyw `:antXxx[...]{...}` przez `regexp_replace`,
- rozpakowanie zewnętrznego `<p>...</p>` gdy w środku jest `<h2|<h3|<p |<ul|<ol` — warunek `content ~ '^<p>\s*<'` i `content ~ '</p>\s*$'` + wewnątrz są bloki.

Migracja idempotentna, dotknie tylko rzędów pasujących do wzorca (dziś: 2 recenzje + 1 z cytacjami).

---

## Pliki do zmiany
- `src/lib/unescapeHtmlIfEncoded.ts` — dodać `sanitizePastedHtml` (albo nowy plik)
- `src/components/admin/RichTextEditor.tsx` — użyć sanitizera w `handlePaste` i w dialogu „Wklej HTML"
- `src/pages/admin/ReviewEditor.tsx`, `src/pages/admin/PostEditor.tsx` — sanitizer przed zapisem
- `src/pages/ReckiReview.tsx`, `src/pages/BlinkPage.tsx` — sanitizer w `parseContent` i w `dangerouslySetInnerHTML`
- Migracja SQL — cleanup `reviews` + `posts`

## Efekt
- Recenzja Nuphy Air75 V2 wyświetli się z prawidłowymi nagłówkami, akapitami i odstępami.
- Znika tekst `:antCitation[]{...}`.
- Przyszłe wklejki (z ChatGPT / Claude / Docs / view-source) same się czyszczą na trzech warstwach.
