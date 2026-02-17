
# Animacja gratyfikacyjna po przeczytaniu wszystkich newsow

## Obecny stan

Statyczna ikona `PartyPopper` z prostym fade-in i tekst. Malo efektowne.

## Propozycja

Wieloetapowa animacja "celebration" z konfetti i pulsujaca ikona trofeum:

### Elementy animacji

1. **Pulsujace trofeum** -- ikona Trophy z animacja scale (powiekszenie od 0 do 1 z odbiciem sprężystym) + zloty gradient
2. **Konfetti CSS** -- 8-12 malych kwadracikow/koleczek rozlatujacych sie z centrum w rozne strony (czyste CSS keyframes, bez bibliotek)
3. **Tekst wchodzacy z opoznieniem** -- naglowek pojawia sie 0.3s po ikonie, podtekst 0.5s po

### Nowe keyframes w `tailwind.config.ts`

```
"celebration-pop": scale 0 -> 1.2 -> 1 (cubic-bezier spring)
"confetti-fall": translateY + rotate + opacity (kazde z losowym kierunkiem)
"celebration-text": opacity 0 -> 1, translateY 20px -> 0 z opoznieniem
```

### Zmiany w plikach

| Plik | Zmiana |
|------|--------|
| `tailwind.config.ts` | 3 nowe keyframes + animacje: `celebration-pop`, `confetti-1` do `confetti-6`, `celebration-text` |
| `src/pages/DailyPage.tsx` | Nowy blok completion z konfetti divami, ikona Trophy zamiast PartyPopper, opoznione teksty |

### Struktura HTML completion

```text
<div className="relative">
  <!-- 6-8 confetti dots rozlatujacych sie -->
  <div className="confetti confetti-1" />
  <div className="confetti confetti-2" />
  ...
  
  <!-- Trophy z pop animation -->
  <Trophy className="animate-celebration-pop text-yellow-500" />
  
  <!-- Tekst z delay -->
  <p className="animate-celebration-text" style="delay: 0.3s">
    Przeczytales wszystkie newsy!
  </p>
  <p className="animate-celebration-text" style="delay: 0.5s">
    Wroc jutro po nowa dawke sportu
  </p>
</div>
```

Konfetti to czyste CSS (6 malych `<span>` z roznymi kolorami i kierunkami animacji), bez dodatkowych bibliotek. Animacja odpala sie jednorazowo gdy `progress >= 90`.
