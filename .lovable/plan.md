

## A/B testing CTA w pasku patrona

### Cel
W ustawieniach patrona dodać drugi link CTA (URL B). Gdy oba są wypełnione, `PatronBar` losuje 50/50 który link pokazać użytkownikowi przy każdej odsłonie strony — analogicznie do rotacji banerów.

### Zmiany

**1. `src/hooks/usePatronSettings.ts`**
- Rozszerzyć interfejs `PatronSettings` o pola: `cta_url_b?: string` i `cta_text_b?: string` (opcjonalne — wstecznie kompatybilne).
- Dodać do `DEFAULT_PATRON_SETTINGS` puste stringi.

**2. `src/pages/admin/Settings.tsx` — sekcja Patron Bar**
- Pod istniejącymi polami CTA dodać drugi blok: "Wariant B (A/B test)" z polami `cta_text_b` i `cta_url_b`.
- Krótki helper text: „Jeśli wypełnisz wariant B, ruch będzie dzielony losowo 50/50 między wariant A i B na każdą odsłonę strony."
- Walidacja: jeśli podany `cta_url_b`, musi być poprawnym URL (jak istniejące `cta_url`).
- Aktualizacja `PatronBarPreview` — bez zmian wizualnych, podgląd nadal pokazuje wariant A (bo na żywo by skakał).

**3. `src/components/PatronBar.tsx` — losowanie wariantu**
- Przy każdym mount komponentu losować `useMemo(() => Math.random() < 0.5 ? 'A' : 'B', [])` — wariant ustalany raz na sesję wyświetlenia (żeby nie skakał między re-renderami).
- Jeśli `cta_url_b` i `cta_text_b` są wypełnione, użyć wylosowanego wariantu (A lub B) do `href` i etykiety przycisku CTA. W przeciwnym razie fallback do wariantu A (obecne zachowanie).
- Dodać atrybut `data-patron-variant="A"` / `"B"` na elemencie `<a>` CTA — żeby w przyszłości łatwo wpiąć analitykę / GA4 event tracking.

### Co dostaje użytkownik
- W panelu `/admin/settings` w sekcji Patron Bar zobaczy dwa zestawy pól CTA (A i B).
- Po zapisaniu, na stronie głównej połowa odsłon kliknie w landing A, połowa w B — gotowy do A/B testów po stronie klienta (np. Google Analytics z parametrem `?variant=a/b` w URL-u).

### Pliki do edycji
- `src/hooks/usePatronSettings.ts` — rozszerzenie interfejsu
- `src/pages/admin/Settings.tsx` — pola formularza dla wariantu B
- `src/components/PatronBar.tsx` — losowanie 50/50 i `data-patron-variant`

