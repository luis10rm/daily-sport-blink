

## Jak działa AI score (1-10) w propozycjach newsów

### Gdzie jest liczony
Edge function `scan-news-sources` — dla każdego nowego artykułu (po deduplikacji URL i tytułu) wysyła pojedyncze zapytanie do Lovable AI (`google/gemini-2.5-flash`), które zwraca JSON: `score`, `reasoning`, `category_id`, `tags`.

### Co dostaje AI jako wejście
- **Tytuł** artykułu (z Firecrawl scrape / OG meta)
- **Excerpt / opis** (pierwsze ~300-500 znaków treści lub meta description)
- **URL** źródła
- **Listę dostępnych kategorii sportowych** z bazy (żeby mogło dopasować)
- **Instrukcję systemową** definiującą kryteria oceny

### Kryteria oceny (prompt)
AI ocenia atrakcyjność newsa dla polskiego portalu sportowego pod kątem:
- **Świeżość / aktualność** — breaking news > zapowiedź > analiza historyczna
- **Zasięg / popularność dyscypliny** — piłka nożna (PL/top ligi), F1, NBA wyżej; nisze niżej
- **Nazwiska / kluby** — polscy zawodnicy, znane gwiazdy (Lewandowski, Świątek itp.) podbijają score
- **"Klikalność"** — transfery, kontuzje gwiazd, skandale, rekordy, wyniki kluczowych meczów
- **Unikalność** — exclusive / scoop > powtarzalna agencyjna depesza
- **Jakość źródła i tytułu** — clickbait bez treści obniża

### Skala (zgodnie z UI w `SuggestionsList.tsx`)
| Score | Znaczenie | Badge |
|-------|-----------|-------|
| **9-10** | Gorący temat, top priorytet — breaking, transfer gwiazdy, sensacja | `default` (mocny) |
| **5-8** | Solidny news warty publikacji | `secondary` |
| **1-4** | Słaby / niszowy / mało atrakcyjny | `outline` |
| **null** | AI nie zwróciło scoru (błąd / timeout) | `?/10` |

W filtrach admin może ustawić próg: „Każdy", „Min. 5", „Min. 7", „Min. 9 🔥".

### `ai_reasoning` (tooltip pod badge'em)
AI razem ze scorem zwraca 1-2 zdania uzasadnienia (np. „Transfer Lewandowskiego do Barcelony — top temat, polski zawodnik, gwiazda światowa"). Wyświetla się po najechaniu na badge w karcie propozycji.

### Sortowanie
Lista w `/admin/suggestions` jest posortowana po `ai_score DESC, discovered_at DESC` — najwyżej oceniane na górze.

### Ograniczenia / co warto wiedzieć
- **Subiektywność** — model ocenia na podstawie samego tytułu + krótkiego opisu, nie czyta pełnej treści (oszczędność tokenów). Dlatego clickbaitowy tytuł może dostać wyższy score niż zasługuje.
- **Brak feedback loop** — score nie uczy się z Twoich akceptacji/odrzuceń. Każdy news oceniany od zera.
- **Polski kontekst** — prompt jest po polsku i instruuje AI że to portal PL, więc news z Ekstraklasy zwykle dostanie wyższy score niż równoważny z ligi tureckiej.
- Jeśli Firecrawl nie wyciągnie excerptu, AI dostaje tylko tytuł → score mniej trafny.

### Możliwe ulepszenia (gdybyś chciał później)
1. **Personalizacja** — uczenie na bazie Twoich akceptacji/odrzuceń (które tematy faktycznie publikujesz)
2. **Boost za świeżość** — dodać `freshness_score` na podstawie `published_at` (news < 2h = +1)
3. **Boost za źródło** — premiowanie wybranych źródeł (np. weszlo.com +1)
4. **Pokazanie reasoning bezpośrednio** w karcie (nie tylko tooltip) — szybsze podejmowanie decyzji
5. **Próg auto-rejection** — np. score < 3 automatycznie do `rejected` żeby nie zaśmiecać listy

To jest odpowiedź na pytanie wyjaśniające — nie wymaga implementacji. Daj znać, czy chcesz żebym zaimplementował którekolwiek z ulepszeń.

