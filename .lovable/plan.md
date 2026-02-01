# Dynamiczna Sitemap

## Status: ✅ Zaimplementowane

Serwis używa dynamicznej sitemapy generowanej przez Edge Function.

## Architektura

- **Edge Function**: `supabase/functions/sitemap/index.ts`
- **URL**: `https://izyknazjzdkfdxnekvos.supabase.co/functions/v1/sitemap`
- **robots.txt**: wskazuje na dynamiczną sitemapę

## Jak to działa

1. Google/roboty pobierają sitemapę z Edge Function
2. Funkcja odpytuje bazę danych w czasie rzeczywistym
3. Zwraca aktualny XML z postami, kategoriami, tagami i autorami
4. Cache: 1 godzina (nagłówek `max-age=3600`)

## Zawartość sitemapy

- Strony statyczne (/, /archiwum, /autorzy, /tagi)
- Kategorie sportowe
- Profile autorów (publiczni)
- Tagi z postami
- Artykuły (z rozszerzeniem Google News dla ostatnich 48h)
