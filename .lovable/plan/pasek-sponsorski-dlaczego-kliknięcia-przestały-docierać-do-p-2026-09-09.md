# Pasek sponsorski — dlaczego kliknięcia przestały docierać do partnera

## Tak, w tym okresie zmieniliśmy dokładnie mechanikę klikania

Sprawdziłem historię zmian. W dniach 18–22.08 dotknęliśmy paska patrona i banerów sponsorskich kilka razy:

- 18.08 — przebudowa reakcji na dotyk w banerach sponsorskich (kilka zmian w `SponsorBanner`).
- 22.08 — „Pasek sponsorski klikniesz raz”: pasek przestał być zwykłym linkiem, a otwiera się teraz przez skrypt (`window.open`), z zablokowaniem domyślnego działania linku.
- 22.08 — do paska i banerów dodaliśmy „strażnika dotyku” (rozpoznawanie przewijania od dotknięcia), żeby przewijanie nie otwierało linków.

To pokrywa się w czasie ze spadkiem u partnera i daje trzy realne mechanizmy utraty kliknięć:

1. **Otwieranie przez skrypt zamiast zwykłego linku.** Przeglądarki mobilne (szczególnie Safari) często blokują takie otwieranie jako wyskakujące okno — użytkownik klika, nic się nie dzieje, partner nie widzi wejścia.
2. **Strażnik dotyku jest zbyt surowy.** Ruch palca powyżej 10 px w trakcie dotknięcia unieważnia kliknięcie; przy dotknięciu przyklejonego paska na górze ekranu to bardzo łatwe. Dodatkowo przerwane dotknięcie na stałe blokuje otwarcie.
3. **Ukrywamy źródło ruchu.** Linki otwieramy z ustawieniem, które usuwa informację o stronie źródłowej. Statystyki partnera pokazują wtedy ruch jako „bezpośredni”, a nie jako wejścia z szortsy.pl — czyli „kliki do niego nie trafiają”, choć fizycznie trafiają. (To ustawienie jest starsze niż sierpień, ale wzmacnia obraz spadku.)

Osobno: pasek ma test dwóch wersji reklamy (A/B). Jeśli partner mierzy tylko jeden z dwóch adresów, połowa kliknięć jest u niego niewidoczna.

## Co zrobię

1. **Wrócę do prawdziwego linku.** Pasek patrona i banery będą normalnymi odsyłaczami, które przeglądarka otwiera sama — bez skryptu, bez blokad wyskakujących okien. Ochrona przed przypadkowym kliknięciem przy przewijaniu zostanie, ale będzie tylko *odwoływać* kliknięcie przy wyraźnym przewinięciu, a nie warunkować jego zadziałanie.
2. **Złagodzę strażnika dotyku** dla elementów reklamowych: większa tolerancja ruchu palca i brak trwałego blokowania po przerwanym dotknięciu.
3. **Przywrócę widoczność źródła ruchu** — partner znowu zobaczy szortsy.pl jako źródło (link pozostaje oznaczony jako sponsorowany, zgodnie z wymogami Google).
4. **Dodam własne liczenie kliknięć** paska i banerów (zapis w bazie + widok w panelu), żebyśmy mieli swoje liczby do porównania ze statystykami partnera — bez tego każda kolejna rozmowa to zgadywanie.
5. **Sprawdzę A/B** — jeśli partner mierzy tylko jeden adres, wyłączę drugą wersję albo dopiszę do obu ten sam parametr kampanii.
6. **Przetestuję** kliknięcie na telefonie i na komputerze (symulacja dotyku) i pokażę wynik.

## Szczegóły techniczne

- `src/components/PatronBar.tsx`: usunięcie `e.preventDefault()` + `window.open` na rzecz natywnej nawigacji `<a target="_blank">`; `rel="sponsored noopener"` (bez `noreferrer`); `onClick` blokuje nawigację tylko gdy ostatni gest był przewinięciem.
- `src/components/SponsorBanner.tsx`: zachowanie obejścia AdBlocka, ale otwieranie natywnym linkiem tam, gdzie adres nie jest z domeny reklamowej; dla adresów typu doubleclick zostaje `window.open`, ale bez `noreferrer` i uruchamiane w `onClick` (nie w `onTouchEnd`).
- `src/lib/tapGuard.ts`: `MOVE_TOLERANCE` 10 → 16 px, `touchcancel` nie ustawia trwale `moved`, dodanie `wasScroll()` używanego do anulowania zamiast gatingu.
- Nowa tabela `ad_clicks` (typ: `patron`/`banner`, `variant`, `target_url`, `path`, `created_at`) + GRANT/RLS: insert dla `anon` i `authenticated`, select tylko dla admina; zapis przez `supabase.from('ad_clicks').insert` w tle (nie blokuje nawigacji). Widok w panelu: liczba kliknięć dziennie.
- Weryfikacja Playwrightem: emulacja dotyku, klik w pasek → sprawdzenie otwarcia nowej karty i nagłówka źródła.
