import { useState, useCallback } from "react";
import Cropper, { Area } from "react-easy-crop";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Loader2 } from "lucide-react";

interface ImageCropModalProps {
  open: boolean;
  onClose: () => void;
  imageSrc: string;
  aspect: number;
  onCropComplete: (croppedBlob: Blob, dimensions: { width: number; height: number }) => void;
  /** Reject crops narrower than this many source pixels (Discover needs 1200px). */
  minWidth?: number;
  /** Cap the exported width so a huge crop doesn't produce a heavy file. */
  maxWidth?: number;
}

export const ImageCropModal = ({
  open,
  onClose,
  imageSrc,
  aspect,
  onCropComplete,
  minWidth,
  maxWidth = 2000,
}: ImageCropModalProps) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const onCropAreaChange = useCallback((_: Area, areaPixels: Area) => {
    setCroppedAreaPixels(areaPixels);
  }, []);

  const tooNarrow =
    !!minWidth && !!croppedAreaPixels && Math.round(croppedAreaPixels.width) < minWidth;

  const handleSave = async () => {
    if (!croppedAreaPixels) return;
    if (tooNarrow) {
      toast.error(
        `Wykadrowany obszar ma ${Math.round(croppedAreaPixels.width)} px szerokości. Google Discover wymaga min. ${minWidth} px — zmniejsz zoom lub użyj większego pliku.`,
      );
      return;
    }
    setIsProcessing(true);

    try {
      const { blob, width, height } = await getCroppedImg(imageSrc, croppedAreaPixels, maxWidth);
      onCropComplete(blob, { width, height });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Kadruj zdjęcie</DialogTitle>
        </DialogHeader>

        <div className="relative h-80 w-full rounded-lg overflow-hidden bg-muted">
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
          <span className="text-sm text-muted-foreground whitespace-nowrap">Zoom</span>
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
          <Button variant="outline" onClick={handleClose}>
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

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error("Failed to create blob"));
        }
      },
      "image/jpeg",
      0.9
    );
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
