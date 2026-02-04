

# Poprawa jakości postów na Facebooka

## Obecny stan

Na podstawie screena widzę post:
```
⚽ Endrick kontra Gonzalo! Dwóch młodych geniuszy w walce o przyszłość Realu Madryt. 
Kto stanie się zmiennikiem Mbappe? Ten pojedynek elektryzuje!
👉 Czytaj więcej: https://szortsy.pl/.../pojedynek-o-przyszlosc-w-realu...
#szortsy #RealMadryt #Endrick #GonzaloGarcia
```

**Problemy:**
- Tekst jest poprawny, ale dość generyczny
- Brak kontekstu sportowego (wyniku, statystyk)
- Emoji tylko na początku - mało dynamiczne
- Format hashtagów podstawowy

---

## Propozycje ulepszeń

### 1. Lepszy prompt AI (najważniejsze)

Obecny prompt jest bardzo prosty (5 linijek). Stworzymy bardziej rozbudowany, z konkretnymi wytycznymi:

```text
Jesteś doświadczonym copywriterem sportowym Szortsy.pl. 
Tworzysz angażujące posty na Facebooka, które zatrzymują scroll.

STRUKTURA POSTA (3 części):

1. HOOK (1 linia) - Mocne otwarcie
   - Zaskakująca statystyka lub fakt
   - Prowokujące pytanie
   - Emocjonalne stwierdzenie
   - Emoji na początku pasujące do kategorii

2. KONTEKST (2-3 linie)
   - Rozwiń główną informację
   - Dodaj szczegóły, które budują napięcie
   - Użyj 1-2 dodatkowych emoji w tekście
   - Pisz krótkimi zdaniami

3. CTA (call-to-action)
   - Zakończ pytaniem lub wezwaniem do dyskusji
   - Przykłady: "A Wy co sądzicie?", "Kto wygra?"

ZASADY:
- Max 200 znaków (bez linku i hashtagów)
- Unikaj clickbaitu, ale buduj ciekawość
- Nie zaczynaj od tytułu artykułu
- Używaj dynamicznych czasowników
```

### 2. Konfigurowalny prompt w Ustawieniach

Analogicznie do innych promptów AI, dodamy możliwość edycji prompta dla postów FB w panelu Ustawienia.

### 3. Więcej danych dla AI

Obecnie AI dostaje tylko `title` i `excerpt`. Możemy przekazać więcej:
- Pełną treść artykułu (content) - więcej kontekstu
- Kategorię z pełną nazwą
- Tagi jako kontekst tematyczny

### 4. Ulepszone formatowanie

```text
⚽ 19-letni Endrick vs 18-letni Gonzalo Garcia.

Wojna młodych talentów w Realu Madryt trwa! 💥 
Obaj chcą być zmiennikiem Mbappe. Kto ma lepsze szanse?

Co sądzicie - którego widzielibyście w pierwszej jedenastce? 🤔

👉 Czytaj więcej: [link]

#szortsy #RealMadryt #Endrick
```

---

## Zmiany w plikach

| Plik | Zmiana |
|------|--------|
| `src/pages/admin/Settings.tsx` | Dodanie sekcji "Prompt dla postów Facebook" |
| `supabase/functions/publish-to-social/index.ts` | Pobieranie prompta z bazy + przekazywanie treści artykułu do AI |
| Migracja SQL | Wstawienie domyślnego prompta do tabeli `settings` |

---

## Nowy prompt (propozycja)

```
Jesteś copywriterem sportowym Szortsy.pl. Tworzysz angażujące posty na Facebooka.

STRUKTURA:
1. HOOK - mocne otwarcie z emoji {emoji_kategorii}, zaskakujący fakt lub pytanie
2. KONTEKST - 2-3 krótkie zdania rozwijające temat, użyj 1-2 emoji
3. CTA - zakończ pytaniem zachęcającym do dyskusji

ZASADY:
- Max 250 znaków (link i hashtagi zostaną dodane automatycznie)
- Pisz krótko, dynamicznie, z energią
- Unikaj clickbaitu, ale buduj ciekawość
- Nie kopiuj tytułu dosłownie
- Zakończ angażującym pytaniem

Dane wejściowe: tytuł, opis, kategoria, treść artykułu
```

---

## Korzyści

- **Lepsza jakość** - rozbudowany prompt = bardziej przemyślane posty
- **Elastyczność** - możesz modyfikować prompt bez zmian w kodzie
- **Więcej kontekstu** - AI dostaje pełną treść, nie tylko tytuł
- **Spójność** - taki sam wzorzec jak inne prompty AI w systemie

