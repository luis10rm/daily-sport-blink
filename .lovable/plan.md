

## Kompaktowy TodaysNewsBanner dla Desktop

### Problem
Obecnie banner zajmuje zbyt dużo przestrzeni - użytkownik widząc stronę po raz pierwszy widzi tylko reklamę i komunikat, bez żadnych newsów. To osłabia pierwsze wrażenie i może zniechęcać do scrollowania.

### Rozwiązanie
Zredukować wysokość bannera na desktop poprzez:
1. Zmianę layoutu z **wertykalnego** (elementy jeden pod drugim) na **horyzontalny** (elementy obok siebie)
2. Zmniejszenie rozmiaru liczby
3. Zredukowanie paddingów i marginesów

### Porównanie wizualne

**PRZED (obecna wersja ~220px):**
```text
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  🗞️  Dzisiaj mamy dla Ciebie                                   │
│                                                                 │
│                          7                                      │
│                                                                 │
│           starannie wybranych newsów sportowych                 │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│  Przygotowaliśmy je z myślą o Tobie • Piątek, 24 stycznia       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**PO (nowa kompaktowa wersja ~80-90px):**
```text
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  🗞️  Dzisiaj mamy dla Ciebie  ██ 7 ██  newsów sportowych       │
│      Piątek, 24 stycznia                                        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Szczegóły zmian

| Element | Przed | Po |
|---------|-------|-----|
| **Layout** | Wertykalny (text-center, elementy pod sobą) | Horyzontalny (flex, elementy w linii) |
| **Liczba** | `text-6xl md:text-7xl` (~72-96px) | `text-4xl` (~36px) |
| **Padding** | `p-8` (32px) | `py-4 px-6` (16px/24px) |
| **Margin-bottom** | `mb-10` (40px) | `mb-6` (24px) |
| **Divider + footer** | Osobna sekcja z datą | Data inline pod tekstem |

### Nowa struktura HTML

```tsx
// Desktop compact version
<section className="mb-6 rounded-xl border border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10 py-4 px-6 animate-fade-in">
  <div className="flex items-center justify-center gap-4 flex-wrap">
    {/* Left: Icon + intro text */}
    <div className="flex items-center gap-2">
      <Newspaper className="h-5 w-5 text-primary" />
      <span className="text-base text-muted-foreground">{variant.before}</span>
    </div>

    {/* Center: Big number */}
    <span className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
      {displayCount}
    </span>

    {/* Right: After text */}
    <span className="text-base text-foreground font-medium">
      {variant.after}
    </span>
  </div>

  {/* Date below, smaller */}
  <p className="text-center text-xs text-muted-foreground mt-2">
    {capitalizedDate}
  </p>
</section>
```

### Korzyści

| Aspekt | Efekt |
|--------|-------|
| **Wysokość** | Redukcja z ~220px do ~80px (oszczędność ~140px) |
| **Above the fold** | Użytkownik zobaczy pierwszy news bez scrollowania |
| **Czytelność** | Zachowana - wszystkie informacje nadal widoczne |
| **Animacja** | Count-up nadal działa |
| **Estetyka** | Nadal elegancki gradient i styling |

### Plan implementacji

| Krok | Plik | Zmiana |
|------|------|--------|
| 1 | `src/components/TodaysNewsBanner.tsx` | Przepisanie sekcji desktop (linie 113-147) na layout horyzontalny |
| 2 | Testowanie | Weryfikacja że News of the Day jest widoczny bez scrollowania |

### Alternatywna opcja (do dyskusji)

Jeśli chcesz zachować większy efekt "wow" dla liczby, możemy też:
- Przenieść banner **poniżej** News of the Day
- Użyć sticky header z mini-wskaźnikiem

Ale podstawowa propozycja to kompaktowa wersja inline, która jest wystarczająco widoczna a nie blokuje contentu.

