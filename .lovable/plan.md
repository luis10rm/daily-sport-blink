
# Statyczna sitemap - ZREALIZOWANO ✅

## Wdrożone rozwiązanie

### 1. Statyczny plik `public/sitemap.xml`
- Zawiera wszystkie posty, kategorie, tagi i autorów z bazy
- Dostępny pod `https://szortsy.pl/sitemap.xml`
- Google Search Console zaakceptuje ten URL

### 2. Edge Function `regenerate-sitemap`
- Wywołaj gdy dodasz nowe posty: `POST /functions/v1/regenerate-sitemap`
- Zwraca aktualny XML sitemapy - skopiuj i zastąp `public/sitemap.xml`
- Alternatywnie: mogę dodać automatyczną aktualizację przy publikacji posta

### 3. Zaktualizowany `robots.txt`
```
Sitemap: https://szortsy.pl/sitemap.xml
```

## Kolejne kroki

1. **Opublikuj zmiany** → sitemap będzie dostępna pod `szortsy.pl/sitemap.xml`
2. **Zgłoś w GSC** → Sitemaps → Dodaj `/sitemap.xml`
3. **Regeneruj sitemapę** → po dodaniu nowych postów wywołaj Edge Function i zaktualizuj plik
