
# Plan: Sitemap dostępna pod szortsy.pl/sitemap.xml

## Problem
Google Search Console odrzuca adres sitemapy z innej domeny (supabase.co). Sitemap musi być dostępna bezpośrednio pod `https://szortsy.pl/sitemap.xml`.

## Rozwiązanie: Przekierowanie na poziomie hostingu

Ponieważ Lovable hostuje aplikację, **najczystszym rozwiązaniem** jest skonfigurowanie przekierowania URL na poziomie dostawcy domeny lub CDN:

```
szortsy.pl/sitemap.xml → https://izyknazjzdkfdxnekvos.supabase.co/functions/v1/sitemap
```

### Jak to zrobić

Zależy od tego, gdzie zarządzasz domeną:

**Jeśli używasz Cloudflare:**
1. Przejdź do **Rules** → **Page Rules** lub **Redirect Rules**
2. Dodaj regułę:
   - URL: `szortsy.pl/sitemap.xml`
   - Przekierowanie 301 do: `https://izyknazjzdkfdxnekvos.supabase.co/functions/v1/sitemap`

**Jeśli używasz innego dostawcy DNS:**
Sprawdź opcje "URL Redirect" lub "Forwarding" w panelu administracyjnym domeny.

## Alternatywa: Statyczna sitemap (jeśli przekierowanie niemożliwe)

Jeśli nie masz możliwości ustawienia przekierowania, mogę stworzyć:
1. Statyczny plik `public/sitemap.xml` 
2. Edge Function `regenerate-sitemap` wywoływaną ręcznie lub przez cron

**Wada:** Sitemap nie będzie aktualizowana w czasie rzeczywistym - tylko przy regeneracji.

## Aktualizacja robots.txt

Po skonfigurowaniu przekierowania, zaktualizuję `robots.txt`:

```text
Sitemap: https://szortsy.pl/sitemap.xml
```

## Kolejne kroki

1. **Ty:** Skonfiguruj przekierowanie u dostawcy domeny (lub powiedz mi, że to niemożliwe)
2. **Ja:** Zaktualizuję robots.txt na nowy adres sitemapy
3. **Ty:** Zgłoś `/sitemap.xml` w Google Search Console

---

**Którą opcję wybierasz?**
- Masz dostęp do konfiguracji przekierowań domeny (Cloudflare, etc.)?
- Czy wolisz statyczną sitemapę z ręczną regeneracją?
