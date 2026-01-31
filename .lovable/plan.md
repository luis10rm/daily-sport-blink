

# Propozycja Dark Mode dla Szortsy

## Obecny stan

Serwis posiada już **zdefiniowane zmienne CSS dla dark mode** w `index.css` (linie 65-102), ale nie ma jeszcze:
- Przełącznika do zmiany motywu
- Persistencji wyboru użytkownika
- Integracji z preferencjami systemowymi

## Wizualna koncepcja Dark Mode

### Paleta kolorów

| Element | Light Mode | Dark Mode |
|---------|-----------|-----------|
| Tło strony | `#FFFEF8` (kremowy) | `#141A1F` (głęboki granat) |
| Karty | `#FFFFFF` (biały) | `#1C252D` (ciemny szary-niebieski) |
| Tekst główny | `#1A2027` (prawie czarny) | `#FAFBF8` (kremowa biel) |
| Tekst pomocniczy | `#6B7280` (szary) | `#8B9299` (jaśniejszy szary) |
| Akcent (primary) | `#10B981` (szmaragd) | `#22D3A0` (jaśniejszy szmaragd) |
| Ramki | `#E5E7EB` (jasny szary) | `#2D3742` (ciemny szary) |

### Mockup komponentów

```text
┌─────────────────────────────────────────────────────────────────┐
│  HEADER (Dark Mode)                                             │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ [🟢] Szortsy   O sporcie: krótko...   Kategorie ▾  🌙/☀️ │  │
│  └──────────────────────────────────────────────────────────┘  │
│  Tło: #1C252D z subtelną przezroczystością                      │
│  Logo: szmaragdowy kwadrat świeci intensywniej                  │
│  Przełącznik: ikona słońca/księżyca w prawym rogu               │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  NEWS CARD (Dark Mode)                                          │
│  ┌───────────────────────────┐                                  │
│  │  [Obraz artykułu]         │                                  │
│  │                           │  - Obrazy pozostają bez zmian    │
│  ├───────────────────────────┤  - Subtelna poświata na hover    │
│  │  🟢 PIŁKA NOŻNA  3 sty    │                                  │
│  │                           │                                  │
│  │  Lewandowski z hat-      │  Tekst: kremowa biel #FAFBF8     │
│  │  trickiem w El Clasico   │                                  │
│  │                           │                                  │
│  │  Barcelona pokonała...   │  Excerpt: #8B9299                │
│  │                           │                                  │
│  │  ┌─────────────────────┐ │                                  │
│  │  │  Przeczytaj więcej  │ │  Przycisk: szmaragd na ciemnym   │
│  │  └─────────────────────┘ │                                  │
│  └───────────────────────────┘                                  │
│  Tło karty: #1C252D | Ramka: #2D3742                            │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  NEWS OF THE DAY (Dark Mode)                                    │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  🏆 Wiadomość dnia  ← złoty badge pozostaje                │ │
│  │                                                            │ │
│  │  [Duży obraz]         │  Tytuł: #FAFBF8                   │ │
│  │                       │  Excerpt: #8B9299                  │ │
│  │                       │                                    │ │
│  │                       │  ┌────────────────────┐           │ │
│  │                       │  │ Przeczytaj więcej │           │ │
│  │                       │  └────────────────────┘           │ │
│  └───────────────────────────────────────────────────────────┘ │
│  Ramka: złota #F59E0B | Tło: #1C252D                            │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  STORIES ROW (Dark Mode)                                        │
│                                                                  │
│   (○)      (○)      (○)      (○)      (○)                       │
│   ⚽️      🏀       🎾       🏎️       🥊                        │
│  Piłka   Koszyk   Tenis    F1      MMA                         │
│                                                                  │
│  Kółka: gradient szmaragdowy świeci jaśniej                     │
│  Ikony: zachowują swoje kolory kategorii                        │
│  Podpisy: #8B9299                                               │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  SCROLL PROGRESS (Dark Mode)                                    │
│                                                                  │
│              ┌─────────────────────────────────┐                │
│              │ 📰 12 newsów z dzisiaj  Scrolluj ▼│              │
│              └─────────────────────────────────┘                │
│                                                                  │
│  Tło: #1C252D z backdrop-blur                                   │
│  Tekst: kremowa biel                                            │
│  Ikona: szmaragd                                                │
└─────────────────────────────────────────────────────────────────┘
```

### Specjalne efekty Dark Mode

1. **Świecące akcenty** - szmaragdowy kolor primary będzie miał subtelną poświatę (`box-shadow: 0 0 20px rgba(16, 185, 129, 0.3)`)

2. **Glassmorphism na Header** - `backdrop-blur-md` z `bg-card/80` tworzy efekt "matowego szkła"

3. **Karty z głębią** - subtelny cień na kartach: `shadow-lg shadow-black/30`

4. **Hover glow** - przy najechaniu na kartę, delikatna szmaragdowa obwódka

5. **Obrazy bez zmian** - zdjęcia sportowców i grafiki pozostają w oryginalnych kolorach

## Implementacja

### Przełącznik motywu

Przełącznik zostanie umieszczony w **prawym górnym rogu Headera** jako ikona słońca (light) lub księżyca (dark):

```text
Header: [Logo] Szortsy   [Kategorie ▾] [Archiwum] [Autorzy] [🌙]
```

### Zachowanie

| Scenariusz | Działanie |
|------------|-----------|
| Pierwsza wizyta | Użyj preferencji systemowych (prefers-color-scheme) |
| Kliknięcie przełącznika | Zmiana motywu + zapis do localStorage |
| Kolejna wizyta | Odczytaj z localStorage, fallback do systemu |

### Animacja przejścia

Płynna tranzycja 200ms przy zmianie między trybami - wszystkie kolory zmienią się jednocześnie.

---

## Sekcja techniczna

### Pliki do modyfikacji

1. **`src/index.css`** - drobne poprawki istniejących zmiennych dark (np. jaśniejszy primary)

2. **`src/components/Header.tsx`** - dodanie przycisku przełącznika motywu

3. **`src/components/ThemeToggle.tsx`** (nowy) - komponent przełącznika z ikoną

4. **`src/hooks/useTheme.ts`** (nowy) - hook do zarządzania motywem z localStorage

5. **`src/App.tsx`** - wrapper ThemeProvider z next-themes (już zainstalowane)

### Biblioteka next-themes

Projekt już ma zainstalowany pakiet `next-themes`, który obsłuży:
- Persistencję wyboru w localStorage
- Wykrywanie preferencji systemowych
- Unikanie "flash of unstyled content"

### Zmiany w komponentach

Wszystkie komponenty już używają zmiennych CSS (`bg-card`, `text-foreground`, `border-border`), więc **automatycznie** dostosują się do dark mode po dodaniu klasy `.dark` do `<html>`.

