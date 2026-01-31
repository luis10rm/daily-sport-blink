
# Plan: Naprawa widoczności paska Patrona dla użytkowników publicznych

## Problem
Pasek patrona (PatronBar) nie wyświetla się dla niezalogowanych użytkowników, ponieważ tabela `settings` ma restrykcyjną politykę RLS - tylko administratorzy i edytorzy mogą odczytywać dane.

**Dowód z logów sieciowych:**
- Zapytanie: `GET /settings?key=eq.site_patron`
- Odpowiedź: `[]` (pusta tablica)
- Powód: brak uprawnień SELECT dla anonimowych użytkowników

## Rozwiązanie
Dodać politykę RLS która pozwala na **publiczny odczyt** ustawienia `site_patron` - to jedyne ustawienie które powinno być widoczne publicznie.

## Implementacja

| Element | Zmiana |
|---------|--------|
| Tabela `settings` | Nowa polityka RLS dla publicznego odczytu `site_patron` |

---

## Szczegóły techniczne

### Nowa polityka RLS

```sql
CREATE POLICY "Public can read site_patron setting"
  ON public.settings
  FOR SELECT
  TO public
  USING (key = 'site_patron');
```

Ta polityka:
- Pozwala **każdemu** (włącznie z niezalogowanymi) na odczyt
- Ogranicza dostęp **tylko** do wiersza z `key = 'site_patron'`
- Nie wpływa na inne ustawienia (prompty AI, konfiguracja) - te pozostają chronione

### Dlaczego to bezpieczne?
- Ustawienie `site_patron` zawiera tylko publiczne dane marketingowe (nazwa partnera, kolor, URL)
- Nie zawiera żadnych wrażliwych informacji
- Inne ustawienia (np. prompty AI) pozostają niedostępne publicznie
