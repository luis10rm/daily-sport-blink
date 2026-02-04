

# Automatyzacja publikacji na Facebook przez Make

## Architektura rozwiązania

```text
┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐
│  Panel Admin    │         │   Edge Function  │         │      Make       │
│  (PostEditor)   │────────▶│ publish-to-social│────────▶│    Webhook      │
│                 │         │                  │         │                 │
│ [✓] Opublikuj   │         │ - Generuje       │         │ - Formatuje     │
│     na FB       │         │   caption AI     │         │   post FB       │
│                 │         │ - Wysyła payload │         │ - Publikuje     │
└─────────────────┘         └─────────────────┘         └─────────────────┘
```

## Co zbudujemy

### 1. Tabela `social_posts` - śledzenie publikacji
Przechowuje historię publikacji na social media:
- `post_id` - powiązanie z postem
- `platform` - np. "facebook"  
- `status` - pending/published/failed
- `caption` - wygenerowana treść
- `webhook_response` - odpowiedź z Make

### 2. Edge Function `publish-to-social`
Obsługuje logikę wysyłania:
- Przyjmuje `post_id` i opcjonalny `custom_caption`
- Generuje caption AI (jeśli nie podano własnego)
- Wysyła dane do webhooka Make
- Zapisuje wynik w `social_posts`

### 3. UI w PostEditor
- Checkbox/switch "Opublikuj na Facebook"
- Opcjonalne pole na własny caption
- Przycisk "Wyślij na FB" dla istniejących postów

### 4. Ustawienia w Settings
- Pole na URL webhooka Make
- Zapisywane w tabeli `settings`

---

## Szczegóły techniczne

### Tabela `social_posts`

| Kolumna | Typ | Opis |
|---------|-----|------|
| id | uuid | Primary key |
| post_id | uuid | FK → posts |
| platform | text | "facebook" |
| status | text | pending/published/failed |
| caption | text | Treść posta FB |
| scheduled_at | timestamptz | Opcjonalne planowanie |
| published_at | timestamptz | Faktyczna publikacja |
| webhook_response | jsonb | Odpowiedź z Make |
| created_at | timestamptz | Timestamp |

### Edge Function `publish-to-social`

```text
Input:
{
  post_id: string,
  platform: "facebook",
  custom_caption?: string
}

Process:
1. Pobierz post z bazy (tytuł, excerpt, slug, image_url, kategoria)
2. Jeśli brak custom_caption → wygeneruj AI (Lovable AI)
3. Pobierz webhook URL z settings
4. Wyślij POST do Make z:
   - title
   - excerpt  
   - url (https://szortsy.pl/blink/{slug})
   - image_url
   - caption
   - category
   - tags
5. Zapisz wynik w social_posts
```

### Payload do Make

```json
{
  "post_title": "Lewandowski z dubletem!",
  "post_url": "https://szortsy.pl/blink/lewandowski-z-dubletem",
  "post_image": "https://...",
  "caption": "⚽ Lewandowski z dubletem! Polak znów błyszczy w La Liga...",
  "category": "Piłka nożna",
  "tags": ["lewandowski", "barcelona", "la-liga"]
}
```

### Format caption AI

Template dla generowania:
```text
{emoji dla kategorii} {Tytuł posta}

{Krótki opis (excerpt)}

👉 Czytaj więcej: {URL}

#szortsy #{tag1} #{tag2}
```

---

## Zmiany w plikach

| Plik | Zmiana |
|------|--------|
| `supabase/functions/publish-to-social/index.ts` | NOWY - edge function |
| `src/pages/admin/PostEditor.tsx` | Dodanie sekcji "Publikuj na Facebook" |
| `src/pages/admin/Settings.tsx` | Pole na webhook URL Make |
| `src/hooks/useSettings.ts` | Hook do pobierania webhook URL |
| Migracja SQL | Tabela `social_posts` |

---

## Flow użytkownika

### Przy tworzeniu nowego posta:
1. Wypełnia formularz jak zwykle
2. Zaznacza "Opublikuj na Facebook"
3. (Opcjonalnie) Wpisuje własny caption
4. Kliknięcie "Zapisz" → post zapisany + webhook do Make

### Dla istniejącego posta:
1. Otwiera edycję posta
2. Kliknięcie "Wyślij na Facebook"
3. Modal z podglądem caption (AI lub własny)
4. Potwierdzenie → webhook do Make

---

## Konfiguracja Make

Po stronie Make użytkownik musi:
1. Utworzyć nowy Scenario
2. Dodać trigger "Webhooks" → "Custom webhook"
3. Skopiować URL webhooka do ustawień Szortsy
4. Dodać moduł "Facebook Pages" → "Create a Post"
5. Zmapować pola z payload

---

## Bezpieczeństwo

- Webhook URL zapisany w bazie (nie w kodzie)
- Edge function wymaga autoryzacji (admin only)
- RLS na tabeli `social_posts`
- Logowanie każdej próby publikacji

