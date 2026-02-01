

# Usunięcie statycznej sitemapy

## Cel

Usunięcie pliku `public/sitemap.xml` i przejście na dynamiczną sitemapę z Edge Function.

## Zmiany do wprowadzenia

### 1. Usunięcie pliku
- **Plik**: `public/sitemap.xml`
- **Akcja**: Usunięcie

### 2. Aktualizacja `robots.txt`
Zmiana wskazania sitemapy z obecnego URL Edge Function na ten sam (bez zmian, już wskazuje na dynamiczną):
```
Sitemap: https://izyknazjzdkfdxnekvos.supabase.co/functions/v1/sitemap
```

### 3. Aktualizacja dokumentacji
Usunięcie lub aktualizacja pliku `.lovable/plan.md` który opisuje poprzednie rozwiązanie ze statyczną sitemapą.

## Rezultat

Po tej zmianie:
- Google Search Console będzie pobierać sitemapę bezpośrednio z Edge Function
- Sitemap będzie zawsze aktualna (generowana dynamicznie z bazy danych)
- Brak potrzeby ręcznej regeneracji po dodaniu nowych postów

