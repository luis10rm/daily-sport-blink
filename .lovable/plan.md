

# Plan: Naprawa promptu article_content_prompt

## Problem

Aktualny prompt `article_content_prompt` zawiera sekcję **"3. Optymalizacja techniczna"**, która instruuje AI, aby generowała:
- Meta Description
- Encje (Keywords)  
- Alt Text dla grafiki

Te dane są wyświetlane na żywo w treści artykułu na stronie `/blink/:id`, co wygląda nieprofesjonalnie i myli czytelników.

## Dlaczego to jest bezpieczne do usunięcia

| Pole | Skąd pochodzi obecnie | Gdzie jest używane w SEO |
|------|----------------------|-------------------------|
| Meta Description | Generowane w treści (błąd) | Pole `excerpt` → meta tag + JSON-LD |
| Keywords/Encje | Generowane w treści (błąd) | Pole `tags[]` → JSON-LD keywords |
| Alt Text | Generowane w treści (błąd) | `post.title` → atrybut alt obrazka |

Wszystkie te dane są już automatycznie pobierane z dedykowanych pól bazy danych i wstrzykiwane do meta tagów oraz JSON-LD przez komponent `BlinkPage.tsx`. Usunięcie ich z treści **nie wpłynie na SEO**.

## Rozwiązanie

Zaktualizować wartość `article_content_prompt` w tabeli `settings`, usuwając sekcję 3 ("Optymalizacja techniczna") i modyfikując instrukcje formatowania.

## Nowa treść promptu

```text
1. Generowanie Nagłówków (Stwórz 2 wersje):

SEO Title: Max 60 znaków, musi zawierać główną encję (nazwisko/klub) na początku. Format: [Kategoria] Encja: Akcja | Daily Sport.

Discover Headline: Agresywny (ale nie kłamliwy), budujący ciekawość, dynamiczny. Użyj emocjonalnych czasowników (np. "szokuje", "uderza", "przełom").

2. Treść artykułu (300-500 słów):

Lead (Akapit 1): Najważniejsza informacja ("co, kto, gdzie, kiedy"). Musi być unikatowy względem źródła.

Rozwinięcie (2-3 akapity): Wyciągnij esencję faktów, ale dodaj szerszy kontekst (np. przypomnij poprzedni wynik drużyny lub pozycję w tabeli).

Wzbogacenie (Sekcja "Warto wiedzieć"): Dodaj 2-3 zdania dodatkowego kontekstu, których NIE MA w oryginale (wykorzystaj swoją wiedzę ogólną o sporcie), aby uniknąć kary za "duplicate content".

Na końcu dodaj informację: "Opracowano na podstawie: [Nazwa Źródła]".

Wytyczne stylu:

Używaj pogrubień (<strong>) dla nazwisk sportowców i nazw klubów (bardzo ważne dla botów Google).

Ton: pilny, ekspercki, ale przystępny.

Język: polski, naturalny, unikaj "korpomowy" AI.

FORMATOWANIE (OBOWIĄZKOWE):
- Używaj TYLKO tagów HTML, NIE składni Markdown!
- <strong>tekst</strong> dla pogrubienia (NIE ** **)
- <em>tekst</em> dla kursywy (NIE * *)
- Każdy akapit otocz tagiem <p>...</p>
```

## Co zostanie zmienione

1. **Usunięta sekcja 3** - "Optymalizacja techniczna" z Meta Description, Encjami i Alt Text
2. **Przeniesione wytyczne stylu** - teraz są na końcu, zamiast być osobną sekcją
3. **Dodane jasne instrukcje HTML** - aby zapobiec używaniu Markdown przez AI

## Kroki implementacji

1. Zaktualizować rekord w tabeli `settings` z kluczem `article_content_prompt`
2. Unieważnić cache React Query dla ustawień (automatyczne przy zapisie)
3. Przetestować generowanie nowego artykułu - upewnić się, że nie pojawiają się już meta dane w treści

## Sekcja techniczna

Zmiana zostanie wykonana poprzez aktualizację rekordu w bazie danych:

```sql
UPDATE settings 
SET value = '[nowa treść promptu]', 
    updated_at = NOW() 
WHERE key = 'article_content_prompt';
```

Alternatywnie, administrator może zaktualizować prompt bezpośrednio w panelu admina w zakładce "Ustawienia" (Settings), jeśli taka opcja jest dostępna.

