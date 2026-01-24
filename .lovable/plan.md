

## Format reklamowy: Patron Serwisu

### Koncepcja

Dodatkowy, natywny pasek pod headerem, który towarzyszy użytkownikowi podczas scrollowania. Format premium dla marek chcących długoterminowej ekspozycji i budowania skojarzeń z serwisem.

---

### Projekt UI

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│  DOMYŚLNY STAN (przykład z kolorem marki)                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ [⭐ Głównym patronem serwisu jest] [LOGO?] NAZWA MARKI  [CTA?] [X] │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  Wysokość: ~40px (h-10)                                                     │
│  Pozycja: sticky, top-16 (pod headerem)                                     │
│  Tło: konfigurowalny kolor + opcjonalny gradient                            │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│  WARIANTY STYLIZACJI                                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  1. Solid Color:                                                            │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │████████████████████████████████████████████████████████████████████│   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  2. Gradient:                                                               │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │░░░▒▒▒▓▓▓████████████████████████████████████████████▓▓▓▒▒▒░░░│   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  3. Glassmorphism (backdrop-blur):                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │▓▓▓▓▓▓▓▓ półprzezroczysty + blur ▓▓▓▓▓▓▓▓│   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### Struktura danych (tabela settings)

Konfiguracja jako JSON w `settings` z kluczem `site_patron`:

```json
{
  "enabled": true,
  "prefix_text": "Głównym patronem serwisu jest",
  "patron_name": "Red Bull",
  "patron_logo_url": "https://...",
  "cta_text": "Sprawdź ofertę",
  "cta_url": "https://redbull.pl",
  "background_color": "#1e3a5f",
  "text_color": "#ffffff",
  "style": "solid",
  "dismissible": true
}
```

---

### Architektura techniczna

#### 1. Nowy hook: usePatronSettings

```tsx
// src/hooks/usePatronSettings.ts
export interface PatronSettings {
  enabled: boolean;
  prefix_text: string;
  patron_name: string;
  patron_logo_url?: string;
  cta_text?: string;
  cta_url?: string;
  background_color: string;
  text_color: string;
  style: "solid" | "gradient" | "glass";
  dismissible: boolean;
}

export const usePatronSettings = () => {
  // Pobiera z settings gdzie key = 'site_patron'
  // Parsuje JSON i zwraca typowany obiekt
};
```

#### 2. Nowy komponent: PatronBar

```tsx
// src/components/PatronBar.tsx
export const PatronBar = () => {
  const { data: patron } = usePatronSettings();
  const [dismissed, setDismissed] = useState(false);

  // Sprawdza sessionStorage dla stanu zamknięcia
  // Renderuje pasek tylko jeśli enabled && !dismissed
  // Sticky positioning: top-16 (pod headerem)
};
```

#### 3. Panel admina: Sekcja Patron Serwisu

Rozszerzenie `Settings.tsx` o nową kartę konfiguracyjną:
- Toggle włącz/wyłącz
- Pola tekstowe (prefix, nazwa, CTA)
- Upload logo (opcjonalnie)
- Color picker dla tła i tekstu
- Wybór stylu (solid/gradient/glass)
- Toggle "możliwość zamknięcia"
- Podgląd na żywo

---

### Plan wdrożenia

| Krok | Plik | Opis |
|------|------|------|
| 1 | Migracja SQL | Dodanie rekordu `site_patron` z domyślną konfiguracją (wyłączony) |
| 2 | `usePatronSettings.ts` | Nowy hook do pobierania/aktualizacji konfiguracji patrona |
| 3 | `PatronBar.tsx` | Nowy komponent paska patrona |
| 4 | `Index.tsx` | Integracja PatronBar pod headerem |
| 5 | `AuthorsPage.tsx` | Integracja PatronBar (spójność między stronami) |
| 6 | `Settings.tsx` | Sekcja konfiguracji patrona w panelu admina |

---

### Funkcjonalności UX

| Funkcja | Opis |
|---------|------|
| Sticky position | Pasek przyklejony pod headerem, podąża za scrollem |
| Dismissible | Użytkownik może zamknąć (X), wraca po odświeżeniu |
| Animacja wejścia | Subtelne "fade-in" lub "slide-down" po załadowaniu |
| Mobile-friendly | Responsywny tekst, mniejsze paddingi na mobile |
| AdBlock-proof | Natywny CSS + tekst, nie jest blokowany |
| Live preview | Podgląd w panelu admina przed zapisaniem |

---

### Efekt końcowy

Po wdrożeniu administrator będzie mógł:
1. Włączyć/wyłączyć pasek patrona jednym kliknięciem
2. Skonfigurować tekst, kolory i styl wizualny
3. Opcjonalnie dodać logo i CTA
4. Zobaczyć podgląd przed publikacją

Użytkownicy zobaczą elegancki, natywny pasek budujący skojarzenie marki z serwisem.

