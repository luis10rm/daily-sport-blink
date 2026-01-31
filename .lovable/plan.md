
# Plan: Wdrożenie Google Indexing API

## Cel
Automatyczne powiadamianie Google o nowych artykułach po publikacji, przyspieszając ich indeksowanie w wynikach wyszukiwania.

---

## Przesłany plik Service Account

Otrzymałem plik `szortsy-new-1c6cb1ab50c3.json` z danymi:
- **Email Service Account:** `web-indexing-szortsy-new@szortsy-new.iam.gserviceaccount.com`
- **Projekt Google Cloud:** `szortsy-new`

Ten email musisz dodać jako **Właściciela** w Google Search Console (jeśli jeszcze nie zrobiłeś).

---

## Zakres wdrożenia

| Element | Opis |
|---------|------|
| Sekret | `GOOGLE_SERVICE_ACCOUNT_JSON` - klucz JSON z Google Cloud |
| Edge Function | `notify-google-index` - wywołuje Indexing API |
| Hook | Wywołanie w `PostEditor.tsx` po udanej publikacji |
| Domena | `https://szortsy.pl` |

---

## Szczegóły techniczne

### 1. Dodanie sekretu

Poproszę o zapisanie zawartości pliku JSON jako sekret `GOOGLE_SERVICE_ACCOUNT_JSON`.

### 2. Edge Function: `notify-google-index`

Struktura:
```text
supabase/functions/notify-google-index/index.ts
```

Funkcja będzie:
1. Przyjmować URL artykułu do zaindeksowania
2. Walidować uprawnienia użytkownika (admin/editor)
3. Parsować Service Account JSON z sekretu
4. Generować JWT token z odpowiednimi claims dla Google API
5. Wymieniać JWT na Access Token przez Google OAuth
6. Wysyłać żądanie `URL_UPDATED` do Google Indexing API
7. Logować rezultat operacji

Endpoint: `POST /notify-google-index`

Payload:
```json
{
  "url": "https://szortsy.pl/blink/artykul-slug",
  "type": "URL_UPDATED"
}
```

Obsługiwane typy:
- `URL_UPDATED` - nowy/zaktualizowany artykuł
- `URL_DELETED` - usunięty artykuł

### 3. Integracja z edytorem postów

W `PostEditor.tsx` - po udanej publikacji nowego posta:

1. Pobierz slug utworzonego posta
2. Zbuduj pełny URL: `https://szortsy.pl/blink/{slug}`
3. Wywołaj Edge Function `notify-google-index`
4. Wyświetl toast z informacją o statusie indeksowania

Wywołanie będzie **automatyczne** przy tworzeniu nowych postów, ale **nie** przy edycji (aby nie wyczerpać limitu).

### 4. Aktualizacja config.toml

```toml
[functions.notify-google-index]
verify_jwt = false
```

---

## Pliki do utworzenia

| Plik | Opis |
|------|------|
| `supabase/functions/notify-google-index/index.ts` | Edge Function z logiką JWT i wywołaniem Google API |

## Pliki do edycji

| Plik | Zmiana |
|------|--------|
| `supabase/config.toml` | Dodanie konfiguracji nowej funkcji |
| `src/pages/admin/PostEditor.tsx` | Hook wywołujący indeksowanie po publikacji |

---

## Flow działania

```text
┌─────────────────────────────────────────────────────────────────────┐
│                         PUBLIKACJA POSTA                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  PostEditor.tsx                                                     │
│       │                                                             │
│       ▼                                                             │
│  createPost.mutateAsync()                                           │
│       │                                                             │
│       ▼                                                             │
│  ┌─────────────────────────────────────┐                            │
│  │ Post zapisany w bazie               │                            │
│  │ (slug wygenerowany automatycznie)   │                            │
│  └─────────────────────────────────────┘                            │
│       │                                                             │
│       ▼                                                             │
│  Wywołanie notify-google-index                                      │
│  z URL: https://szortsy.pl/blink/{slug}                             │
│       │                                                             │
│       ▼                                                             │
│  ┌─────────────────────────────────────┐                            │
│  │ Edge Function:                      │                            │
│  │ 1. Parsuj Service Account JSON      │                            │
│  │ 2. Generuj JWT                      │                            │
│  │ 3. Wymień na Access Token           │                            │
│  │ 4. Wywołaj Indexing API             │                            │
│  └─────────────────────────────────────┘                            │
│       │                                                             │
│       ▼                                                             │
│  Toast: "Google zostało powiadomione o nowym artykule"              │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Limity Google Indexing API

- **200 żądań dziennie** (darmowy limit)
- Dla typowej redakcji sportowej to wystarczające
- Przy większej skali: wniosek do Google o zwiększenie limitu

---

## Kolejne kroki po zatwierdzeniu

1. Poproszę o zapisanie klucza JSON jako sekret
2. Utworzę Edge Function `notify-google-index`
3. Zaktualizuję `config.toml`
4. Zintegruję wywołanie w `PostEditor.tsx`

---

## Weryfikacja w Google Search Console

Upewnij się, że email Service Account:
```
web-indexing-szortsy-new@szortsy-new.iam.gserviceaccount.com
```

jest dodany jako **Właściciel** w Google Search Console dla domeny `szortsy.pl`.
