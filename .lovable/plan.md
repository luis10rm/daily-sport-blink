

# Minimalistyczny Formularz Feedbacku

## Koncept

Prosty, dyskretny formularz w jednej linii - tylko textarea i przycisk. Bez zbędnych elementów, pasujący do minimalistycznego stylu serwisu.

## Wizualizacja

```text
┌─────────────────────────────────────────────────────────────────┐
│  💬  Podziel się opinią o serwisie...          [ Wyślij ]      │
└─────────────────────────────────────────────────────────────────┘
```

Po wysłaniu:
```text
┌─────────────────────────────────────────────────────────────────┐
│  ✓  Dziękujemy za opinię!                                       │
└─────────────────────────────────────────────────────────────────┘
```

## Co zostanie zrobione

### 1. Tabela w bazie danych

Prosta tabela `feedback`:
- `id`, `message`, `created_at`, `is_read`
- Bez pola email (minimalizm)
- RLS: publiczny INSERT, reszta tylko dla adminów

### 2. Komponent `FeedbackBox.tsx`

Maksymalnie uproszczony:
- Jedna linia: ikona + textarea + przycisk
- Textarea rozszerza się podczas pisania
- Po wysłaniu: krótki komunikat "Dziękujemy!"
- Subtelne obramowanie i tło `bg-muted/50`
- Walidacja: min 5 znaków

### 3. Strona główna

Dodanie pod NewsOfTheDay - przed środkowym banerem.

### 4. Panel admina

Prosta lista feedbacku w `/admin/feedback`:
- Data + treść + status (przeczytane/nie)
- Możliwość oznaczenia jako przeczytane

## Pliki do utworzenia/edycji

| Plik | Akcja |
|------|-------|
| Migracja SQL | Nowa tabela `feedback` |
| `src/hooks/useFeedback.tsx` | Nowy hook |
| `src/components/FeedbackBox.tsx` | Nowy komponent |
| `src/pages/Index.tsx` | Dodanie FeedbackBox |
| `src/pages/admin/FeedbackList.tsx` | Nowa strona admina |
| `src/components/admin/AdminLayout.tsx` | Link w nawigacji |

