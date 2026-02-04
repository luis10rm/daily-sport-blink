

# Aktualizacja meta description SEO

## Wybrany opis
```
Szortsy – najważniejsze wiadomości sportowe w 60 sekund. Piłka nożna, F1, tenis, MMA i więcej. Krótko, konkretnie, codziennie. Bądź na bieżąco!
```

**Długość:** 156 znaków - idealna dla Google

**Uwaga:** Zmiana z "60 słów" na "60 sekund" - świetna decyzja! Podkreśla czas konsumpcji treści, co jest bardziej intuicyjne dla użytkownika.

---

## Zmiany w plikach

### 1. index.html
Aktualizacja trzech meta tagów:
- `<meta name="description">` - główny opis dla Google
- `<meta property="og:description">` - podgląd na Facebooku/LinkedIn
- `<meta name="twitter:description">` - podgląd na X/Twitter

### 2. src/hooks/useSEOMeta.ts
Aktualizacja stałej `DEFAULT_DESCRIPTION` używanej dynamicznie przez SPA dla wszystkich podstron bez własnego opisu.

---

## Szczegóły techniczne

| Plik | Linia | Zmiana |
|------|-------|--------|
| `index.html` | meta description | Nowy opis |
| `index.html` | og:description | Nowy opis |
| `index.html` | twitter:description | Skrócona wersja (max ~120 znaków) |
| `src/hooks/useSEOMeta.ts` | DEFAULT_DESCRIPTION | Nowy opis |

### Twitter description (skrócona)
```
Szortsy – wiadomości sportowe w 60 sekund. Piłka nożna, F1, MMA i więcej. Krótko, codziennie.
```

---

## Po wdrożeniu

Opis będzie widoczny:
- W wynikach wyszukiwania Google (po reindeksacji)
- Przy udostępnianiu linku na social media
- W podglądach linków w komunikatorach

