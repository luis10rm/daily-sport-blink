import { useState, useCallback, useEffect } from "react";
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
import { Loader2, RotateCcw, RotateCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImageCropModalProps {
  open: boolean;
  onClose: () => void;
  imageSrc: string;
  aspect: number;
  /** Let the editor switch the crop ratio (cover images). */
  allowAspectChange?: boolean;
  onCropComplete: (croppedBlob: Blob) => void;
}

const ASPECTS: { label: string; value: number }[] = [
  { label: "16:9", value: 16 / 9 },
  { label: "4:3", value: 4 / 3 },
  { label: "3:2", value: 3 / 2 },
  { label: "1:1", value: 1 },
  { label: "4:5", value: 4 / 5 },
  { label: "9:16", value: 9 / 16 },
];

export const ImageCropModal = ({
  open,
  onClose,
  imageSrc,
  aspect,
  allowAspectChange = false,
  onCropComplete,
}: ImageCropModalProps) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [activeAspect, setActiveAspect] = useState(aspect);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (open) setActiveAspect(aspect);
  }, [open, aspect]);

  const onCropAreaChange = useCallback((_: Area, areaPixels: Area) => {
    setCroppedAreaPixels(areaPixels);
  }, []);

  const handleSave = async () => {
    if (!croppedAreaPixels) return;
    setIsProcessing(true);

    try {
      const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels, rotation);
      onCropComplete(croppedBlob);
    } finally {
      setIsProcessing(false);
    }
  };

  const reset = () => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
    setCroppedAreaPixels(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Kadruj zdjęcie</DialogTitle>
        </DialogHeader>

        <div className="relative h-[22rem] w-full overflow-hidden rounded-lg bg-muted sm:h-[26rem]">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            rotation={rotation}
            aspect={activeAspect}
            minZoom={0.4}
            maxZoom={5}
            zoomSpeed={0.25}
            restrictPosition={false}
            objectFit="contain"
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onRotationChange={setRotation}
            onCropComplete={onCropAreaChange}
            cropShape={!allowAspectChange && aspect === 1 ? "round" : "rect"}
            showGrid
          />
        </div>

        {allowAspectChange && (
          <div className="flex flex-wrap gap-1.5 px-1">
            {ASPECTS.map((a) => (
              <button
                key={a.label}
                type="button"
                onClick={() => setActiveAspect(a.value)}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                  Math.abs(activeAspect - a.value) < 0.001
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border text-muted-foreground hover:bg-muted"
                )}
              >
                {a.label}
              </button>
            ))}
          </div>
        )}

        <div className="space-y-3 px-1">
          <div className="flex items-center gap-4">
            <span className="w-16 shrink-0 text-sm text-muted-foreground">Zoom</span>
            <Slider
              value={[zoom]}
              onValueChange={([v]) => setZoom(v)}
              min={0.4}
              max={5}
              step={0.05}
              className="flex-1"
            />
            <span className="w-12 shrink-0 text-right text-xs text-muted-foreground">
              {zoom.toFixed(2)}×
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="w-16 shrink-0 text-sm text-muted-foreground">Obrót</span>
            <Slider
              value={[rotation]}
              onValueChange={([v]) => setRotation(v)}
              min={-180}
              max={180}
              step={1}
              className="flex-1"
            />
            <div className="flex shrink-0 gap-1">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setRotation((r) => r - 90)}
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setRotation((r) => r + 90)}
              >
                <RotateCw className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Możesz oddalić poniżej 1× — puste miejsca zostaną wypełnione białym tłem, więc całe
            zdjęcie zmieści się w kadrze.
          </p>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button type="button" variant="ghost" onClick={reset}>
            Reset
          </Button>
          <Button type="button" variant="outline" onClick={handleClose}>
            Anuluj
          </Button>
          <Button type="button" onClick={handleSave} disabled={isProcessing}>
            {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Zapisz
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

async function getCroppedImg(
  imageSrc: string,
  pixelCrop: Area,
  rotation = 0
): Promise<Blob> {
  const image = await createImage(imageSrc);
  const rad = (rotation * Math.PI) / 180;

  // Draw the rotated image onto a canvas big enough to hold it.
  const bBoxWidth =
    Math.abs(Math.cos(rad) * image.width) + Math.abs(Math.sin(rad) * image.height);
  const bBoxHeight =
    Math.abs(Math.sin(rad) * image.width) + Math.abs(Math.cos(rad) * image.height);

  const stage = document.createElement("canvas");
  const stageCtx = stage.getContext("2d")!;
  stage.width = bBoxWidth;
  stage.height = bBoxHeight;
  stageCtx.fillStyle = "#ffffff";
  stageCtx.fillRect(0, 0, stage.width, stage.height);
  stageCtx.translate(bBoxWidth / 2, bBoxHeight / 2);
  stageCtx.rotate(rad);
  stageCtx.drawImage(image, -image.width / 2, -image.height / 2);

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;
  canvas.width = Math.max(1, Math.round(pixelCrop.width));
  canvas.height = Math.max(1, Math.round(pixelCrop.height));
  // Crop can extend past the image when zoomed out — keep it white, not transparent.
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(
    stage,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    canvas.width,
    canvas.height
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Failed to create blob"))),
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
