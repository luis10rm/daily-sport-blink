

## Plan: Ujednolicenie one-click na mobile (onTouchEnd + touch-manipulation)

### Co brakuje
NewsCard stosuje wzorzec `onClick` + `onTouchEnd` + klasa CSS `touch-manipulation` na przyciskach CTA. Pozostałe komponenty mają tylko `onClick`, co na iOS może powodować 300ms opóźnienie.

### Zmiany

**1. `src/components/NewsOfTheDay.tsx`**
- Dodać `onTouchEnd` na obu przyciskach CTA (linie 92-107) — analogicznie jak w NewsCard
- Dodać klasę `touch-manipulation` do obu przycisków

**2. `src/pages/StartPage.tsx`**
- Dodać `onTouchEnd={goHome}` na przycisku X (linia 62)
- Dodać `touch-manipulation` do przycisku X
- Dodać `onTouchEnd={goHome}` na floating CTA i inline CTA (Button)
- Alternatywnie: dodać globalnie `touch-manipulation` do komponentu Button

**3. `src/pages/InstallPage.tsx`**
- Dodać `onTouchEnd` + `touch-manipulation` na: przycisk back, "Zainstaluj teraz", "Przejdź do newsów", "Wróć do newsów"

**4. `src/components/PWAInstallBanner.tsx`**
- Dodać `onTouchEnd={dismiss}` na przycisku X (linia 31)
- Dodać `onTouchEnd={handleInstall}` + `touch-manipulation` na przycisku CTA

**5. (Opcjonalnie) `src/components/ui/button.tsx`**
- Dodać `touch-manipulation` globalnie do bazowych klas Button — wtedy wszystkie przyciski w aplikacji automatycznie dostaną eliminację 300ms delay, bez konieczności dodawania ręcznie w każdym komponencie

### Zakres wpływu
Zmiana w `button.tsx` (punkt 5) jest najefektywniejsza — pokrywa StartPage, InstallPage, PWAInstallBanner i wszystkie inne miejsca jednym ruchem. Pozostałe zmiany (punkty 1-4) dotyczą `onTouchEnd` i niestandardowych przycisków (nie-Button).

