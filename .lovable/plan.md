
## Kompaktowy baner dla użytkowników AdBlocka

### Problem
Gdy AdBlock ukrywa główny kontener banera, pozostaje pełnowymiarowy pusty slot (970x250px / 300x250px), co wygląda niechlujnie i zajmuje dużo miejsca na stronie.

### Rozwiązanie
Dodać detekcję widoczności banera i wyświetlić kompaktową wersję gdy główny slot jest niewidoczny.

### Architektura

```text
┌─────────────────────────────────────────────────────┐
│  BANER NORMALNY (gdy widoczny)                      │
│  ┌───────────────────────────────────────────────┐  │
│  │ Partner Szortsy                               │  │
│  ├───────────────────────────────────────────────┤  │
│  │                                               │  │
│  │            GRAFIKA 970x250                    │  │
│  │                                               │  │
│  ├───────────────────────────────────────────────┤  │
│  │ [Sprawdź ofertę →]                            │  │
│  └───────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘

                       ↓ AdBlock ukrywa główny slot

┌─────────────────────────────────────────────────────┐
│  BANER KOMPAKTOWY (gdy ukryty przez AdBlock)        │
│  ┌───────────────────────────────────────────────┐  │
│  │ 🎯 Partner Szortsy · Twoja reklama może tu    │  │
│  │    być · [Zostań partnerem]                   │  │
│  └───────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

### Zmiany w plikach

**`src/components/SponsorBanner.tsx`**

1. Dodać state do śledzenia widoczności:
   ```typescript
   const [isHidden, setIsHidden] = useState(false);
   const bannerRef = useRef<HTMLDivElement>(null);
   ```

2. Dodać useEffect do detekcji ukrycia przez AdBlock:
   ```typescript
   useEffect(() => {
     const checkVisibility = () => {
       if (bannerRef.current) {
         const rect = bannerRef.current.getBoundingClientRect();
         // AdBlock często ustawia display:none lub height:0
         if (rect.height === 0 || rect.width === 0) {
           setIsHidden(true);
         }
       }
     };
     
     // Sprawdź po małym opóźnieniu (AdBlock może działać asynchronicznie)
     const timer = setTimeout(checkVisibility, 100);
     return () => clearTimeout(timer);
   }, []);
   ```

3. Dodać warunkowy render kompaktowej wersji:
   ```tsx
   if (isHidden) {
     return (
       <div className={cn("flex justify-center", className)}>
         <div className="inline-flex items-center gap-3 px-4 py-2 
                         rounded-full bg-muted/50 border border-border">
           <span className="text-xs text-muted-foreground">
             Partner Szortsy
           </span>
           <span className="text-xs text-muted-foreground/50">·</span>
           <span className="text-xs text-muted-foreground">
             {description || "To miejsce może być Twoje"}
           </span>
           {ctaText && (
             <>
               <span className="text-xs text-muted-foreground/50">·</span>
               <button
                 onClick={handleClick}
                 className="text-xs font-medium text-primary hover:underline"
               >
                 {ctaText}
               </button>
             </>
           )}
         </div>
       </div>
     );
   }
   ```

4. Dodać `ref={bannerRef}` do głównego kontenera banera (który może być ukryty przez AdBlock)

### Wygląd kompaktowej wersji

Zamiast pełnego slotu reklamowego:
- Jeden wiersz tekstu w formie "pill/badge"
- Wysokość ~40px zamiast 250px
- Zawiera: etykietę "Partner Szortsy" + komunikat + link CTA
- Subtelne tło i ramka pasujące do designu

### Efekt końcowy

| Scenariusz | Wyświetlenie |
|------------|--------------|
| Brak AdBlocka | Pełny baner 970x250 / 300x250 |
| AdBlock ukrywa slot | Kompaktowy pill ~40px wysokości |
| Brak aktywnego banera | Placeholder z komunikatem (bez zmian) |

### Uwagi techniczne

- Detekcja odbywa się po 100ms od renderowania (czas na działanie AdBlocka)
- Używamy `getBoundingClientRect()` zamiast `offsetHeight` dla większej dokładności
- Kompaktowa wersja jest odporna na AdBlock bo nie zawiera podejrzanych klas CSS ani atrybutów
