
# Plan: Kadrowanie zdjęć profilowych i tła autorów

## Cel

Dodanie funkcji kadrowania (crop) dla:
1. **Zdjęcia profilowego (avatar)** - okrągły podgląd, proporcje 1:1
2. **Zdjęcia w tle (cover)** - panoramiczny format, proporcje 5:1

## Rozwiązanie

Wykorzystamy bibliotekę **react-easy-crop** - popularną, lekką (12KB gzipped) i łatwą w integracji. Po wybraniu pliku użytkownik zobaczy modal z możliwością:
- Przesuwania obrazka (drag)
- Powiększania (zoom slider)
- Zapisania przyciętego obrazka

---

## Zmiany do wdrożenia

### 1. Nowy komponent `ImageCropModal`

Modal z funkcją kadrowania:
- Wyświetla `Cropper` z react-easy-crop
- Slider do zoomu
- Przyciski "Anuluj" i "Zapisz"
- Po zapisie: generuje przycięty obraz jako Blob, uploaduje do storage

### 2. Modyfikacja `ImageUploader`

Rozszerzenie o opcjonalne kadrowanie:
- Nowe propsy: `enableCrop`, `cropAspect` (np. 1 dla avatara, 5 dla covera)
- Po wybraniu pliku → otwiera modal cropera zamiast od razu uploadować
- Po zatwierdzeniu cropa → upload przyciętego obrazka

### 3. Aktualizacja `AuthorEditor`

Dodanie propsów kadrowania:
- Avatar: `cropAspect={1}` (kwadrat, wyświetlany jako okrąg)
- Cover: `cropAspect={5}` (panorama 5:1)

---

## Sekcja techniczna

### Nowa zależność

```bash
npm install react-easy-crop
```

### Nowy plik: `src/components/admin/ImageCropModal.tsx`

```typescript
import { useState, useCallback } from "react";
import Cropper, { Area } from "react-easy-crop";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Loader2 } from "lucide-react";

interface ImageCropModalProps {
  open: boolean;
  onClose: () => void;
  imageSrc: string;
  aspect: number;         // 1 = kwadrat, 5 = panorama
  onCropComplete: (croppedBlob: Blob) => void;
}

export const ImageCropModal = ({
  open,
  onClose,
  imageSrc,
  aspect,
  onCropComplete,
}: ImageCropModalProps) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const onCropAreaChange = useCallback((_: Area, areaPixels: Area) => {
    setCroppedAreaPixels(areaPixels);
  }, []);

  const handleSave = async () => {
    if (!croppedAreaPixels) return;
    setIsProcessing(true);
    
    const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
    onCropComplete(croppedBlob);
    setIsProcessing(false);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Kadruj zdjęcie</DialogTitle>
        </DialogHeader>

        <div className="relative h-80 w-full bg-muted rounded-lg overflow-hidden">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropAreaChange}
            cropShape={aspect === 1 ? "round" : "rect"}
            showGrid={false}
          />
        </div>

        <div className="flex items-center gap-4 px-2">
          <span className="text-sm text-muted-foreground">Zoom</span>
          <Slider
            value={[zoom]}
            onValueChange={([v]) => setZoom(v)}
            min={1}
            max={3}
            step={0.1}
            className="flex-1"
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Anuluj
          </Button>
          <Button onClick={handleSave} disabled={isProcessing}>
            {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Zapisz
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Funkcja pomocnicza - generuje przycięty obraz jako Blob
async function getCroppedImg(imageSrc: string, pixelCrop: Area): Promise<Blob> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob!), "image/jpeg", 0.9);
  });
}

function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = url;
  });
}
```

### Modyfikacja: `src/components/admin/ImageUploader.tsx`

```typescript
interface ImageUploaderProps {
  value?: string;
  onChange: (url: string) => void;
  onRemove: () => void;
  disabled?: boolean;
  enableCrop?: boolean;      // NOWE - włącza kadrowanie
  cropAspect?: number;       // NOWE - proporcje (1 = avatar, 5 = cover)
  storageBucket?: string;    // NOWE - docelowy bucket
  storagePath?: string;      // NOWE - ścieżka w buckecie
}

// Wewnątrz komponentu:
const [cropModalOpen, setCropModalOpen] = useState(false);
const [pendingImage, setPendingImage] = useState<string | null>(null);

const onDrop = useCallback((acceptedFiles: File[]) => {
  if (acceptedFiles.length > 0) {
    const file = acceptedFiles[0];
    
    if (enableCrop) {
      // Otwórz modal cropera z podglądem obrazka
      const reader = new FileReader();
      reader.onload = () => {
        setPendingImage(reader.result as string);
        setCropModalOpen(true);
      };
      reader.readAsDataURL(file);
    } else {
      // Standardowy upload bez cropowania
      uploadFile(file);
    }
  }
}, [enableCrop]);

const handleCropComplete = async (croppedBlob: Blob) => {
  setCropModalOpen(false);
  setPendingImage(null);
  
  // Utwórz plik z Blob i uploaduj
  const file = new File([croppedBlob], `cropped-${Date.now()}.jpg`, { 
    type: "image/jpeg" 
  });
  await uploadFile(file);
};

// W renderze - dodaj modal:
{enableCrop && pendingImage && (
  <ImageCropModal
    open={cropModalOpen}
    onClose={() => {
      setCropModalOpen(false);
      setPendingImage(null);
    }}
    imageSrc={pendingImage}
    aspect={cropAspect || 1}
    onCropComplete={handleCropComplete}
  />
)}
```

### Modyfikacja: `src/pages/admin/AuthorEditor.tsx`

```typescript
{/* Cover image - z cropowaniem */}
<FormField
  control={form.control}
  name="cover_image_url"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Zdjęcie w tle (cover)</FormLabel>
      <FormDescription>
        Duże zdjęcie wyświetlane na górze profilu. 
        Po wybraniu pliku będziesz mógł je przyciąć.
      </FormDescription>
      <FormControl>
        <ImageUploader
          value={field.value || undefined}
          onChange={field.onChange}
          onRemove={() => field.onChange(null)}
          enableCrop          // NOWE
          cropAspect={5}      // NOWE - panorama 5:1
        />
      </FormControl>
    </FormItem>
  )}
/>

{/* Avatar - z cropowaniem */}
<FormField
  control={form.control}
  name="avatar_url"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Avatar</FormLabel>
      <FormDescription>
        Okrągłe zdjęcie profilowe. Po wybraniu pliku będziesz mógł je przyciąć.
      </FormDescription>
      <FormControl>
        <ImageUploader
          value={field.value || undefined}
          onChange={field.onChange}
          onRemove={() => field.onChange(null)}
          enableCrop          // NOWE
          cropAspect={1}      // NOWE - kwadrat 1:1 (wyświetlany jako okrąg)
        />
      </FormControl>
    </FormItem>
  )}
/>
```

---

## Pliki do modyfikacji

| Plik | Akcja |
|------|-------|
| `package.json` | Dodanie zależności `react-easy-crop` |
| `src/components/admin/ImageCropModal.tsx` | **Nowy** - modal z cropperem |
| `src/components/admin/ImageUploader.tsx` | Rozszerzenie o integrację z cropperem |
| `src/pages/admin/AuthorEditor.tsx` | Dodanie propsów `enableCrop` i `cropAspect` |

---

## UX Flow

```text
1. Admin wybiera plik (drag & drop lub klik)
         ↓
2. Otwiera się modal z podglądem cropera
         ↓
3. Admin przesuwa/zoomuje obrazek
         ↓
4. Klik "Zapisz" → wycina fragment → upload do storage
         ↓
5. URL zapisany w formularzu, modal zamknięty
```

## Zalety rozwiązania

- **Przy okazji** - cropowanie wbudowane w istniejący flow uploadu
- **Uniwersalne** - ten sam komponent dla avatara i covera (różne proporcje)
- **Lekkie** - react-easy-crop to tylko 12KB
- **Intuicyjne** - drag to move, slider to zoom
- **Okrągły podgląd** dla avatara - użytkownik od razu widzi jak będzie wyglądać
