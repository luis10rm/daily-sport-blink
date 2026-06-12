# Problem

W artykule `/blink/10-mlodych-talentow-na-mundial-2026...` na końcu znajduje się link:

> **Nowy format Mistrzostw Świata 2026: Wszystko, co musisz wiedzieć**

prowadzący do `/blink/ms-2026-kontrowersyjne-czerwone-kartki-w-meczu-meksyk---rpa-629dbb25` — czyli do artykułu o czerwonych kartkach, nie o formacie MŚ.

## Przyczyna

W `supabase/functions/extract-article/index.ts` (linie 508-536) podczas generowania treści AI dostaje listę 10 powiązanych artykułów z tej samej kategorii w formacie:

```
- "Tytuł artykułu" → /blink/slug-artykulu
```

Model (Gemini/GPT) wstawia sekcję "Przeczytaj również", ale **halucynuje**: wymyśla atrakcyjny anchor text (np. "Nowy format MŚ 2026...") i **paruje go z losowym slugiem** z listy zamiast użyć dokładnego tytułu odpowiadającego temu slugowi. Efekt: link wygląda sensownie, ale prowadzi do zupełnie innego artykułu.

Problem dotyczy potencjalnie wszystkich artykułów MŚ (i innych kategorii) wygenerowanych przez `extract-article`.

# Plan naprawy

## 1. Wzmocnić prompt w `extract-article/index.ts`

W `DEFAULT_CONTENT_PROMPT` (linie 218-224) dodać twarde reguły:
- Anchor text MUSI być dosłownym (lub niemal dosłownym) skrótem tytułu z listy — nie wolno wymyślać nowego tytułu.
- Każda para (tekst, slug) musi pochodzić z TEJ SAMEJ linii z listy powiązanych artykułów.
- Jeśli żaden artykuł z listy nie pasuje tematycznie — pominąć sekcję "Przeczytaj również".

## 2. Walidacja po stronie serwera (krytyczne)

Po wygenerowaniu treści, przed zapisem, w `extract-article` przeparsować wszystkie `<a href="/blink/SLUG">TEXT</a>`:

- Jeśli `SLUG` nie istnieje na liście `relatedPosts` → usunąć cały tag `<a>` (zostawić sam tekst lub usunąć całe `<li>`).
- Jeśli `SLUG` istnieje, ale `TEXT` nie zawiera żadnego znaczącego słowa (≥4 znaki) z `relatedPosts[slug].title` → usunąć link (mismatch).
- Jeśli po czyszczeniu sekcja `<ul>` jest pusta → usunąć całą sekcję "Przeczytaj również".

To gwarantuje, że nawet jeśli AI dalej halucynuje, błędne linki nigdy nie trafią do bazy.

## 3. Jednorazowy fix istniejących artykułów

Stworzyć skrypt SQL/edge function `fix-internal-links` (uruchamiany ręcznie z admina), który:
- Pobiera wszystkie posty z `content` zawierającym `href="/blink/`.
- Dla każdego linku sprawdza, czy slug istnieje w `posts` i czy anchor text pasuje do `posts.title` (heurystyka: wspólne słowa kluczowe ≥2).
- Mismatch → usuwa `<a>` (zostawia goły tekst) i loguje do tabeli/konsoli.
- Update kolumny `content`.

Alternatywa minimalna: ręczny UPDATE SQL tylko dla zgłoszonego artykułu — szybkie, ale nie rozwiązuje pozostałych potencjalnie zepsutych linków.

# Szczegóły techniczne

Walidacja w TS (uproszczona):

```ts
const allowed = new Map(relatedPosts.map(p => [p.slug, p.title]));
content = content.replace(
  /<a\s+href="\/blink\/([^"]+)"[^>]*>([\s\S]*?)<\/a>/g,
  (full, slug, text) => {
    if (!allowed.has(slug)) return text; // unknown slug -> strip link
    const title = allowed.get(slug)!.toLowerCase();
    const words = text.toLowerCase().match(/\p{L}{4,}/gu) || [];
    const match = words.filter(w => title.includes(w)).length;
    return match >= 1 ? full : text; // mismatch -> strip link
  }
);
// then remove empty <ul></ul> and orphan "Przeczytaj również" header
```

# Pliki do zmiany

- `supabase/functions/extract-article/index.ts` — wzmocniony prompt + walidacja linków przed zapisem.
- (Opcjonalnie) `supabase/functions/fix-internal-links/index.ts` — nowa funkcja do jednorazowego sprzątania bazy + przycisk w `src/pages/admin/Settings.tsx` lub `PostsList.tsx`.

# Pytanie do decyzji

Czy chcesz pełny pakiet (1+2+3 z masowym fixem istniejących artykułów), czy minimum (1+2 — naprawa na przyszłość + ręczny UPDATE tego jednego artykułu)?
