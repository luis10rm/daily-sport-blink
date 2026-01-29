
Cel: usunąć widoczne `**...**` (gwiazdki) zarówno na stronie artykułu (/blink/:id), jak i w edytorze WYSIWYG w panelu admina – także dla już zapisanych postów.

## Dlaczego nadal widać gwiazdki (prawdziwa przyczyna)
1) **Markdown w środku HTML nie jest parsowany tak, jak zakładaliśmy.**  
Twoja treść ma postać mieszaną, np.:
```html
<p>... **Liverpool FC** ...</p>
```
Markdown parsers (w tym `marked`) traktują blok HTML jako “surowy HTML” i **nie interpretują** `**...**` wewnątrz tagów HTML. Dlatego gwiazdki zostają.

2) **Prompt w backendzie jest nadpisany przez ustawienia w bazie (`settings`).**  
Funkcja generowania treści bierze `article_content_prompt` z bazy (jeśli istnieje), więc zmiana “DEFAULT_CONTENT_PROMPT” w kodzie nie zadziała, dopóki w ustawieniach jest stara wersja promptu.  
Potwierdziłem to: `article_content_prompt` istnieje i ma długi tekst (len ~1329), więc domyślny prompt z kodu nie jest używany.

3) Dane dla przykładowego posta faktycznie zawierają `**` w HTML.  
Dla posta `6f8133c3-ecf1-4010-bd25-d5a7da291314` w bazie wykryłem `**` (pozycja ~323), więc problem jest w treści, nie w samym CSS.

## Co robimy (naprawa “raz a dobrze”)
Wprowadzimy 2 poprawki: (A) renderowanie dla istniejących treści + (B) źródło generowania, żeby nowe treści już nie miały gwiazdek.

---

# A) Naprawa wyświetlania istniejących artykułów (frontend)
## A1. Zastępujemy obecną logikę `parseContent` w `src/pages/BlinkPage.tsx`
Zamiast `marked.parse(content)` dla wszystkiego, robimy:
- jeśli to **czysty Markdown** → `marked.parse(...)` (ok)
- jeśli to **HTML lub miks HTML+Markdown** → parsujemy HTML przez `DOMParser`, przechodzimy po **tekstowych węzłach** i na nich stosujemy `marked.parseInline(...)` (czyli Markdown inline zamieniamy na `<strong>`, `<em>` itp.) i podmieniamy te text-node’y na HTML

Efekt: nawet gdy masz `<p>**Liverpool**</p>`, wynik stanie się `<p><strong>Liverpool</strong></p>`.

## A2. Użyjemy tej samej normalizacji w edytorze admina
Problem “w edytorze też widać gwiazdki” wynika z tego, że Tiptap dostaje HTML z tekstem `**...**` jako zwykły tekst.  
Dlatego przed wstawieniem treści do edytora:
- przy ładowaniu posta do formularza (useEffect w `src/pages/admin/PostEditor.tsx`) normalizujemy `post.content`
- przy wypełnianiu treści z AI (w `handleAIExtract`) normalizujemy `extractedData.content` zanim `setValue("content", ...)`

To sprawi, że w panelu administracyjnym gwiazdki znikną “od razu” (a przy zapisie edytor zapisze już czysty HTML).

---

# B) Naprawa źródła (backend), żeby nowe artykuły już nie miały Markdown
## B1. Zmieniamy funkcję backendową `supabase/functions/extract-article/index.ts` tak, aby wymuszała HTML nawet przy promptach z ustawień
Dziś jest tak:
- pobiera `article_content_prompt` z bazy
- jeśli istnieje → używa go wprost (bez Twoich nowych zasad “nie używaj Markdown”)

Zrobimy funkcję typu `enforceHtmlFormattingRules(promptFromDb)`:
- jeśli prompt nie zawiera jasnych reguł HTML (np. brak `<strong>` / brak “NIE używaj Markdown”) → automatycznie **doklei** nasz blok “FORMATOWANIE (OBOWIĄZKOWE)” na końcu promptu
- dzięki temu nawet jeśli w ustawieniach jest rozbudowany prompt SEO/Discover, to zawsze dojdzie twarda instrukcja “tylko HTML, bez **”.

Opcjonalnie (ale polecam): po wygenerowaniu treści, jeśli nadal wykryjemy `**` / `*` → zalogujemy ostrzeżenie i (w razie potrzeby) dołożymy prostą korektę “ostatniej szansy” po stronie backendu (np. minimalna zamiana inline w tekście). To zabezpieczenie na wypadek “nieposłuszeństwa” modelu.

## B2. (Opcjonalnie) Uaktualniamy wpis w `settings.article_content_prompt`
Możemy:
- albo zostawić go (bo B1 i tak wymusi HTML),
- albo dodać w panelu admina przycisk “Wstaw rekomendowane FORMATOWANIE HTML do promptu”, który automatycznie dopisze sekcję – bez ręcznego grzebania.

---

# Test plan (konkretnie, żeby zakończyć temat)
1) Test istniejącego posta (ten problematyczny):
   - Otwórz w podglądzie/test: `/blink/6f8133c3-ecf1-4010-bd25-d5a7da291314`
   - Sprawdź, czy fragment “Liverpool FC” jest już pogrubiony i nie ma `**`.

2) Test w panelu admina:
   - Otwórz edycję tego posta.
   - W polu edytora “Pełna treść artykułu” sprawdź, czy gwiazdki zniknęły.
   - Kliknij “Pogrubienie” na fragmencie – upewnij się, że edytor działa normalnie (generuje `<strong>`).

3) Test generowania z linku WP:
   - Wklej URL i kliknij “Generuj AI”.
   - Sprawdź, czy wygenerowana treść w edytorze już od razu jest HTML (pogrubienia jako `<strong>`, bez `**`).
   - Zapisz post i sprawdź jego publiczny widok.

4) Jeśli testujesz na domenie publicznej `daily-sport-blink.lovable.app`, upewnij się, że zmiany zostały opublikowane (inaczej zobaczysz stary kod).

---

# Zakres zmian w plikach (do wdrożenia)
- `src/pages/BlinkPage.tsx`
  - zamiana `parseContent` na wersję “DOMParser + marked.parseInline dla text nodes”, z fallbackiem dla czystego Markdown
- `src/pages/admin/PostEditor.tsx`
  - normalizacja `post.content` przy `form.reset(...)`
  - normalizacja `extractedData.content` przy `form.setValue("content", ...)`
- `supabase/functions/extract-article/index.ts`
  - dodanie “enforceHtmlFormattingRules” i używanie jej dla promptu z bazy
  - (opcjonalnie) logika ostrzegania, jeśli model zwraca `**` mimo zakazu

---

# Ryzyka / uwagi
- To jest treść renderowana przez `dangerouslySetInnerHTML`. Ponieważ treść jest tworzona przez redakcję/AI, ryzyko XSS jest głównie “wewnętrzne”, ale nadal warto pilnować, żeby nie dopuszczać niechcianych tagów (jeśli będziesz chciał, kolejnym krokiem może być sanitizacja HTML).
- Normalizacja w edytorze zmienia wygląd treści “na wejściu”; faktyczna zmiana w bazie nastąpi po zapisaniu posta (co jest pożądane).

Po wdrożeniu powyższego gwiazdki znikną:
- natychmiast na stronie /blink (nawet dla starych postów),
- w edytorze dla starych postów (a zapis utrwali czysty HTML),
- oraz nowe generacje AI przestaną produkować Markdown (nawet jeśli prompt w ustawieniach był stary).
