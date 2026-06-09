## Cel
Zamienić obecne subtelne radialne poświaty w trybie `tournament-worldcup` na tło przypominające murawę stadionu — głębokie zielenie z delikatnymi pasami koszenia i złotymi akcentami u góry/dołu.

## Paleta (zatwierdzona)
- `#0a1f14` — najgłębszy cień murawy
- `#0f3320` — baza zielona
- `#1a5c3a` — jaśniejszy pas koszenia
- `#c9a84c` — złoto MŚ (akcent reflektorów)

## Zmiany (tylko `src/index.css`)

### 1. Light mode (`.tournament-worldcup body`)
Zastąpić obecne radial-gradients tłem murawy:
- Bazowy `linear-gradient` w odcieniach `#0f3320 → #0a1f14` (delikatny, jasny wariant dla light mode: lekko jaśniejsze zielenie ok. 30-35% lightness)
- Pasy koszenia: `repeating-linear-gradient` pod kątem 100°, naprzemienne paski `transparent` i `hsl(150 55% 18% / 0.35)` co ~120px — efekt koszonej trawy widocznej z trybun
- Górna złota poświata reflektorów: `radial-gradient(ellipse 60% 30% at 50% 0%, hsl(43 96% 56% / 0.12), transparent 70%)`
- `background-attachment: fixed` — pasy nie przewijają się z treścią

### 2. Dark mode + Stadium night
Te same warstwy, ciemniejsza baza (`#0a1f14`), mocniejszy kontrast pasów (alpha ~0.45) i wyraźniejsze złote reflektory (alpha ~0.18). W `stadium-night` dodać dwa boczne snopy światła z górnych rogów (jak dziś), ale na zielonej bazie zamiast granatowej.

### 3. Zmienna `--background` w tournament dark
Przesunąć z granatu (`215 35% 7%`) na ciemną zieleń (`150 35% 6%`), żeby karty i obszary bez tła body też miały spójny ton murawy.

### 4. Subtelna tekstura (opcjonalnie, czysty CSS)
Dodać cienką warstwę `radial-gradient` o bardzo niskiej alphie powtarzaną przez `background-size: 3px 3px` — daje wrażenie ziarna trawy bez obrazka i bez kosztu wydajnościowego.

## Co NIE zmienia się
- Złote akcenty (`--primary`, ringi kart, ribbon countdown) zostają — kontrast złota na zieleni jest mocniejszy niż na granacie.
- Logika `useStadiumNight` i klasy `.stadium-night` bez zmian.
- Komponenty React (MatchTicker, banner, story circle) — bez edycji.
- Mobile: brak `backdrop-blur`, pasy koszenia to czysty gradient — zero kosztu renderu.

## Weryfikacja
Po wdrożeniu sprawdzę preview na 390×844 i desktop: czytelność tekstu na zielonej bazie (szczególnie muted-foreground), kontrast kart, brak efektu „moiré" przy pasach na retina/1.6 DPR.
