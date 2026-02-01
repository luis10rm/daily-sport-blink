

# Naprawa ekstrakcji dla stron z JavaScript (weszlo.com)

## Problem

Weszło.com (i podobne strony) używa renderowania JavaScript. Standardowy `fetch()` zwraca pustą stronę (35 znaków), ale z kodem HTTP 200 OK - więc obecny fallback do Firecrawl się nie uruchamia.

AI próbuje wygenerować artykuł z prawie pustego tekstu i "halucynuje" zupełnie inną treść.

## Rozwiązanie

Dodać sprawdzenie długości tekstu po ekstrakcji. Jeśli tekst ma mniej niż 100 znaków, automatycznie użyć Firecrawl (który renderuje JavaScript).

```text
AKTUALNIE:
fetch(url) → 200 OK → pusty tekst → AI halucynuje

PO ZMIANIE:  
fetch(url) → 200 OK → pusty tekst → wykrycie problemu → Firecrawl → pełna treść → poprawny artykuł
```

## Szczegóły techniczne

### Plik do edycji

`supabase/functions/extract-article/index.ts`

### Zmiany

1. Dodać stałą `MIN_TEXT_LENGTH = 100`
2. Po ekstrakcji tekstu sprawdzić jego długość
3. Jeśli tekst za krótki i Firecrawl skonfigurowany → pobrać stronę przez Firecrawl
4. Użyć treści z Firecrawl do generowania artykułu

### Wynik

| Strona | Tekst z fetch | Firecrawl? | Rezultat |
|--------|---------------|------------|----------|
| thesport.pl | 2227 znaków | Nie | OK |
| weszlo.com | 35 znaków | Tak | Naprawione |
| sport.fakt.pl | 6000 znaków | Nie | OK |

## Podsumowanie

| Plik | Zmiana |
|------|--------|
| `supabase/functions/extract-article/index.ts` | Fallback do Firecrawl gdy tekst < 100 znaków |

