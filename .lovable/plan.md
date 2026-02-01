

# Dodanie statycznej sitemapy do katalogu public

## Cel

Utworzenie pliku `public/sitemap.xml` z aktualną zawartością, który będzie dostępny pod adresem `https://szortsy.pl/sitemap.xml`.

## Zmiany do wprowadzenia

### 1. Utworzenie pliku `public/sitemap.xml`

Plik będzie zawierał:
- **Strony statyczne**: `/`, `/archiwum`, `/autorzy`, `/tagi`
- **18 kategorii sportowych**: lyzwiarstwo, pilka-reczna, f1, mma, tenis, i inne
- **4 autorów publicznych**: redakcja główna i redaktorzy
- **55+ tagów**: najpopularniejsze tagi z postami
- **30 najnowszych artykułów**: z priorytetem 0.9 i częstotliwością hourly

### 2. Link po wdrożeniu

Po zatwierdzeniu planu i opublikowaniu zmian, sitemap będzie dostępna pod:

```
https://szortsy.pl/sitemap.xml
```

## Uwaga

Ta statyczna sitemap wymaga ręcznej aktualizacji przy dodawaniu nowych postów. Dynamiczna sitemap z Edge Function (`/functions/v1/sitemap`) jest nadal aktywna i automatycznie aktualna.

