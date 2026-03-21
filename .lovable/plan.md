

## Diagnoza: "Nie udało się przeanalizować artykułu"

### Problem
Funkcja `extract-article` wykonuje **dwa sekwencyjne wywołania AI** (metadata + content generation). Logi kończą się na "Using prompts from settings" — brak logów z odpowiedzi AI. Oznacza to, że AI Gateway albo:
1. **Timeout** — edge function przekracza limit czasu (~60s) zanim AI zdąży odpowiedzieć
2. **Błąd AI Gateway** — odpowiedź wraca, ale catch w linii 583 łapie błąd i zwraca generyczny "Unknown error"

Toast na froncie wyświetla ogólny komunikat, bo błąd nie pasuje do żadnego ze spec