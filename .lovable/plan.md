

# Dodanie prompta podsumowania dnia do ustawień

## Cel

Umożliwienie edycji prompta generującego podsumowania dnia bezpośrednio z panelu ustawień administracyjnych.

## Aktualny stan

- Edge function `generate-daily-summary` już obsługuje klucz `daily_summary_prompt` z tabeli settings
- Jeśli klucz nie istnieje, funkcja używa domyślnego prompta wbudowanego w kod
- Strona Settings.tsx zawiera dwa prompty: ekstrakcji metadanych i generowania treści artykułu
- Brak wpisu `daily_summary_prompt` w tabeli `settings`

## Zmiany do wprowadzenia

### 1. Dodanie wpisu do bazy danych

Utworzenie rekordu w tabeli `settings` z kluczem `daily_summary_prompt` i domyślną wartością (taką samą jak w edge function).

### 2. Aktualizacja strony Settings.tsx

Dodanie trzeciej sekcji w karcie "Ustawienia AI" z:
- Pole Textarea dla prompta podsumowania dnia
- Przycisk "Zapisz" i "Przywróć domyślny"
- Opis funkcjonalności

### 3. Aktualizacja hooka useSettings

Dodanie stanu i logiki dla nowego prompta (wzorowane na istniejących promptach).

## Szczegóły techniczne

### Nowy prompt domyślny (z edge function):

```
Jesteś redaktorem sportowym Daily Sport Blink. Napisz profesjonalne podsumowanie dnia sportowego w języku polskim.

DANE WEJŚCIOWE:
Otrzymasz listę newsów opublikowanych danego dnia w formacie JSON (title, excerpt, category, id).

WYMAGANIA TREŚCI:
- Napisz artykuł o długości 1500-2500 słów
- Podziel na sekcje według kategorii sportowych (każda kategoria to osobny nagłówek H2)
- Każda sekcja: 2-4 akapity streszczające i analizujące newsy z tej kategorii
- Dodaj kontekst, analizę i opinie eksperta sportowego
- Ton: profesjonalny, angażujący, dziennikarski
- Rozpocznij od krótkiego wprowadzenia witającego czytelników
- Zakończ krótkim podsumowaniem i zapowiedzią kolejnego dnia

SEO:
- Tytuł: max 60 znaków, musi zawierać datę i główne sporty dnia
- Meta description (excerpt): max 155 znaków, zachęcający do przeczytania
- Naturalne użycie słów kluczowych sportowych
- Dla każdego wspomnianego newsa dodaj wewnętrzny link w formacie: <a href="/blink/ID">tekst linku</a>

FORMATOWANIE (OBOWIĄZKOWE):
- Używaj TYLKO tagów HTML: <h2>, <p>, <strong>, <em>, <a href="/blink/ID">
- NIE używaj składni Markdown (**, *, #, ## itp.)
- Pogrubienia: <strong>tekst</strong>
- Kursywa: <em>tekst</em>
- Nagłówki sekcji: <h2>Nazwa kategorii</h2>
- Akapity: <p>treść</p>

STRUKTURA ODPOWIEDZI:
Odpowiedz w formacie JSON:
{
  "title": "Tytuł SEO (max 60 znaków)",
  "excerpt": "Meta description (max 155 znaków)",
  "content": "<p>Wprowadzenie...</p><h2>Piłka nożna</h2><p>Treść...</p>...",
  "suggested_tags": ["tag1", "tag2", "podsumowanie dnia"]
}
```

### Struktura UI

Nowa sekcja zostanie dodana pod istniejącymi promptami w karcie "Ustawienia AI":

```
┌─────────────────────────────────────────────────────────────────┐
│ Ustawienia AI                                                   │
├─────────────────────────────────────────────────────────────────┤
│ [📝 Prompt ekstrakcji metadanych]                               │
│ [Textarea]                                                      │
│ [Zapisz] [Przywróć domyślny]                                   │
├─────────────────────────────────────────────────────────────────┤
│ [✨ Prompt generowania treści artykułu]                         │
│ [Textarea]                                                      │
│ [Zapisz] [Przywróć domyślny]                                   │
├─────────────────────────────────────────────────────────────────┤
│ [📅 Prompt podsumowania dnia] ← NOWY                            │
│ [Textarea]                                                      │
│ Ten prompt określa jak AI generuje podsumowania dnia sportowego │
│ [Zapisz] [Przywróć domyślny]                                   │
└─────────────────────────────────────────────────────────────────┘
```

## Pliki do modyfikacji

1. `src/pages/admin/Settings.tsx` - dodanie nowej sekcji UI
2. Migracja bazy danych - dodanie rekordu `daily_summary_prompt`

