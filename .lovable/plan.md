

# Dedykowane obrazy kategorii dla Facebooka

## Cel

Zamiast używać statycznych grafik (football.webp, basketball.webp), każda kategoria sportowa będzie miała dedykowany, atrakcyjny obraz wygenerowany przez AI, który będzie używany jako miniaturka postów na Facebooku.

## Zmiany w bazie danych

Dodanie nowej kolumny do tabeli `sport_categories`:

| Kolumna | Typ | Opis |
|---------|-----|------|
| `social_image_url` | text | URL dużego obrazu do mediów społecznościowych |

## Zmiany w edytorze kategorii

W `CategoryEditor.tsx` dodanie nowej sekcji:

```text
┌─────────────────────────────────────────────────┐
│  🖼️ Obraz dla mediów społecznościowych         │
├─────────────────────────────────────────────────┤
│  [Podgląd aktualnego obrazu 1200x630]           │
│                                                 │
│  [ Generuj z AI ]  [ Prześlij własny ]          │
│                                                 │
│  Ten obraz będzie używany jako miniaturka       │
│  postów na Facebooku bez własnego zdjęcia.      │
└─────────────────────────────────────────────────┘
```

## Generator AI dla obrazów społecznościowych

Nowy generator w `CategoryEditor.tsx` z promptem zoptymalizowanym pod duże grafiki:

```text
Wygeneruj dynamiczną, profesjonalną ilustrację sportową dla kategorii [nazwa].

STYL:
- Żywe, nasycone kolory
- Dynamiczna kompozycja z ruchem
- Rozmiar 1200x630px (format OG dla Facebooka)
- Bez tekstu, bez logo
- Fotorealistyczny lub high-quality 3D render

TEMATYKA dla [kategoria]:
- Football: piłka w ruchu, stadion, dynamiczne ujęcie
- Basketball: wsad, piłka przy obręczy
- F1: bolid w akcji, tor wyścigowy
- Tennis: serwis, kort
- MMA: oktagon, dynamiczna poza
```

## Aktualizacja Edge Function

W `publish-to-social` zmiana priorytetu wyboru obrazu:

```text
1. post.image_url (własne zdjęcie posta)
      ↓ jeśli brak
2. category.social_image_url (obraz AI kategorii z bazy)
      ↓ jeśli brak  
3. categoryDefaultImages[slug] (statyczny fallback)
```

## Pliki do zmiany

| Plik | Zmiana |
|------|--------|
| Migracja SQL | Dodanie kolumny `social_image_url` |
| `src/pages/admin/CategoryEditor.tsx` | Nowa sekcja z generatorem obrazów społecznościowych |
| `supabase/functions/publish-to-social/index.ts` | Pobieranie `social_image_url` z kategorii, nowy priorytet wyboru obrazu |

## Korzyści

- **Unikalne obrazy** - każda kategoria ma swój charakterystyczny, profesjonalny obraz
- **Łatwa edycja** - możesz wygenerować nowy obraz lub przesłać własny
- **Spójność wizualna** - wszystkie posty bez zdjęcia wyglądają profesjonalnie
- **Optymalizacja pod FB** - rozmiar 1200x630px to idealny format dla Open Graph

