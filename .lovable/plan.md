## Problem

Wklejanie HTML do edytora recenzji/artykułów wciąż daje "brzydki" wynik. W DB dla Nuphy Air75 V2 widać:

```
<p>&lt;p&gt;&lt;strong&gt;NuPhy Air75 V2&lt;/strong&gt;...
```

Zewnętrzny `<p>` jest prawdziwy (dodał go TipTap), a środek to **zakodowane encje HTML** (`&lt;`, `&gt;`, `&quot;`). Nasza obecna heurystyka `looksLikeHtml` sprawdza tylko `<tag>` — encji nie wykrywa, więc TipTap traktuje wklejkę jako zwykły tekst i wpisuje ją dosłownie.

Prawdziwa przyczyna: **użytkownik kopiuje HTML z miejsca, które podaje go już jako escapowany tekst** (np. widok źródła strony, blok `<code>` w dokumentacji AI, ChatGPT canvas). Trzeba temu przypadkowi zawsze zaradzić po stronie edytora — a nie po fakcie w bazie.

## Rozwiązania (do wyboru)

### Opcja A — Najprostsza: rozszerzyć detekcję o encje + auto-dekodowanie (rekomendowane)

W `handlePaste` w `RichTextEditor.tsx`:

1. Pobrać `text/plain`.
2. Wykryć czy tekst wygląda na **escapowany HTML** — regex `/&lt;\/?[a-z][^&]*&gt;/i` (znajdzie `&lt;p&gt;`, `&lt;strong&gt;` itd.).
3. Jeśli tak — jednokrotnie zdekodować encje (`&lt;`→`<`, `&gt;`→`>`, `&quot;`→`"`, `&#39;`→`'`, `&amp;`→`&`) i przekazać do TipTap jako HTML (z `parseOptions`).
4. Jeśli nie — obecna ścieżka (surowy HTML → TipTap, potem fallback do natywnego wklejania).

Zaleta: użytkownik nic nie musi robić — po prostu Ctrl+V działa w każdym wariancie źródła (renderowany HTML, źródło z encjami, mieszane).

### Opcja B — Warstwa ochronna przy zapisie

Dodać w `ReviewEditor.tsx` (i `PostEditor.tsx`) sanitizer, który **przed** wysłaniem do bazy sprawdza, czy `content` zawiera `&lt;p&gt;`/`&lt;strong&gt;` itp. i dekoduje encje. To siatka bezpieczeństwa gdyby edytor coś przepuścił.

Zaleta: chroni nawet gdy ktoś ręcznie wprowadzi zły content przez API/import.

### Opcja C — Naprawa przy renderowaniu (`BlinkPage` / `ReckiReview`)

W `parseContent` wykrywać zakodowane tagi w treści i dekodować przed przekazaniem do `marked`/DOMPurify.

Zaleta: naprawia też **historyczne** wpisy w DB bez migracji.
Wada: leczy objawy, nie przyczynę — content w bazie zostaje "brudny".

### Opcja rekomendowana

**A + B + C jednocześnie** — trzy niezależne warstwy, każda tania:
- **A** naprawia wklejanie na przyszłość (główna).
- **B** chroni zapis (belt-and-suspenders).
- **C** naprawia wstecznie wszystkie istniejące artykuły bez migracji SQL — nie będziemy już musieli ręcznie robić UPDATE dla każdego zepsutego wpisu.

Dodatkowo: **jednorazowa migracja** czyszcząca wszystkie istniejące recenzje/posty, gdzie `content ILIKE '%&lt;p&gt;%'` lub `%&lt;strong&gt;%` — jednym UPDATE naprawimy Nuphy + wszystko co inne jeszcze siedzi w bazie.

## Pliki do zmiany

- `src/components/admin/RichTextEditor.tsx` — rozszerzona detekcja + dekoder encji w `handlePaste`.
- `src/pages/admin/ReviewEditor.tsx` i `src/pages/admin/PostEditor.tsx` — sanitizer przy zapisie (mały helper `src/lib/unescapeHtmlIfEncoded.ts`).
- `src/pages/BlinkPage.tsx` i `src/pages/ReckiReview.tsx` — użycie tego samego helpera w `parseContent`.
- Migracja SQL — jednorazowy UPDATE na `posts` i `reviews` z zakodowanymi tagami.

## Pytanie do Ciebie

Idziemy w **rekomendowane A+B+C + jednorazowe czyszczenie DB**, czy wolisz najpierw tylko **A** (fix wklejania) i zobaczyć czy wystarczy?