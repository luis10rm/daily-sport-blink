
# Dzienny briefing sportowy -- `/dzien/YYYY-MM-DD`

## Co robimy

Nowa podstrona z unikatowym URL na kazdy dzien (np. `/dzien/2026-02-17`) wyswietlajaca wszystkie newsy z danego dnia w formacie timeline. Przycisk do niej pojawi sie w banerze `TodaysNewsBanner`.

---

## Zmiany

### 1. Nowy hook: `usePostsByDate` w `src/hooks/usePosts.tsx`

Dodanie nowego hooka pobierajacego posty z konkretnego dnia (na podstawie parametru `date` w formacie YYYY-MM-DD). Logika analogiczna do `useTodaysPosts`, ale z dynamiczna data.

### 2. Nowa strona: `src/pages/DailyPage.tsx`

Layout w stylu "timeline briefing":

```text
+--------------------------------------------------+
|  Header + PatronBar                              |
+--------------------------------------------------+
|  Briefing sportowy                               |
|  Poniedzialek, 17 lutego 2026                    |
|  12 newsow · Nawigacja < Wczoraj | Jutro >      |
+--------------------------------------------------+
|  Progress bar: 0% =========> 100%                |
+--------------------------------------------------+
|                                                  |
|  14:30  [icon Pilka nozna]                       |
|  |      Tytul newsa                              |
|  |      Krotki excerpt...                        |
|  |      [Czytaj wiecej ->]                       |
|  |                                               |
|  12:15  [icon F1]                                |
|  |      Inny tytul                               |
|  |      Krotki opis...                           |
|  |      [Czytaj wiecej ->]                       |
|  |                                               |
|  09:00  [icon Tenis]                             |
|         Jeszcze jeden news                       |
|         Krotki opis...                           |
|         [Czytaj wiecej ->]                       |
|                                                  |
+--------------------------------------------------+
|  "Przeczytales wszystkie newsy z tego dnia!"     |
+--------------------------------------------------+
|  Footer                                          |
+--------------------------------------------------+
```

Elementy strony:
- Naglowek z pelna data po polsku i liczba newsow
- Nawigacja miedzy dniami (strzalki do poprzedniego/nastepnego dnia) -- blokada przyszlych dat
- Progress bar (Radix Progress) sledzacy scroll -- ile newsow uzytkownik "minal"
- Lista newsow w formacie timeline z godzina publikacji, ikona kategorii, tytlem, excerptem i przyciskiem CTA
- Inteligentne linkowanie: posty z trescia -> `/blink/:slug`, bez tresci -> zewnetrzny URL
- Komunikat koncowy po dotarciu na dol
- SEO: `<title>Briefing sportowy -- 17 lutego 2026 | Szortsy</title>`, meta description, canonical URL
- Obsluga pustego dnia (brak newsow) -- komunikat z propozycja powrotu
- Walidacja daty w URL -- nieprawidlowa data przekierowuje na dzisiejszy dzien

### 3. Zmiana: `src/components/TodaysNewsBanner.tsx`

Dodanie przycisku-linku "Zobacz briefing" obok istniejacego contentu:
- Na mobile: maly przycisk ze strzalka pod tekstem, Link do `/dzien/YYYY-MM-DD`
- Na desktop: przycisk w linii obok tekstu
- Przycisk uzywa komponentu `Link` z react-router-dom (wewnetrzna nawigacja)
- Styl: subtelny outline lub ghost, zeby nie konkurowal z glownym banerem

### 4. Zmiana: `src/App.tsx`

Dodanie nowej publicznej trasy:
```
<Route path="/dzien/:date" element={<DailyPage />} />
```

---

## Pliki

| Plik | Akcja |
|------|-------|
| `src/hooks/usePosts.tsx` | Dodanie `usePostsByDate(date)` |
| `src/pages/DailyPage.tsx` | Nowy plik -- strona briefingu |
| `src/components/TodaysNewsBanner.tsx` | Przycisk "Zobacz briefing" |
| `src/App.tsx` | Nowy route `/dzien/:date` |
