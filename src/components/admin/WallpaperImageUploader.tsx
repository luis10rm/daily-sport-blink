import { optimizeImageUrl } from "@/lib/imageUrl";
import { compressImageFile } from "@/lib/compressImage";
import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface WallpaperImageUploaderProps {
  value?: string;
  onChange: (url: string) => void;
  onRemove: () => void;
  onUploadFile: (file: File) => Promise<void>;
  disabled?: boolean;
  aspectHint?: string;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB for wallpapers
const ACCEPTED_TYPES = {
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "image/webp": [".webp"],
};

export const WallpaperImageUploader = ({
  value,
  onChange,
  onRemove,
  onUploadFile,
  disabled,
  aspectHint,
}: WallpaperImageUploaderProps) => {
  const [isUploading, setIsUploading] = useState(false);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        const file = acceptedFiles[0];
        if (file.size > MAX_FILE_SIZE) {
          toast.error("Plik jest za duży. Maksymalny rozmiar to 10MB.");
          return;
        }
        setIsUploading(true);
        try {
          const optimized = await compressImageFile(file, { maxWidth: 2560, quality: 0.82 });
          await onUploadFile(optimized);
        } finally {
          setIsUploading(false);
        }
      }
    },
    [onUploadFile]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_TYPES,
    maxFiles: 1,
    disabled: disabled || isUploading,
  });

  if (value) {
    return (
      <div className="relative rounded-lg border overflow-hidden">
        <img
          src={optimizeImageUrl(value, { width: 800, quality: 70 })}
          loading="lazy"
          alt="Podgląd"
          className="w-full aspect-video object-cover"
        />
        <Button
          type="button"
          variant="destructive"
          size="icon"
          className="absolute top-2 right-2"
          onClick={onRemove}
          disabled={disabled}
        >
          <X className="h-4 w-4" />
        </Button>
        {aspectHint && (
          <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-1 text-center">
            {aspectHint}
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      {...getRootProps()}
      className={cn(
        "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
        isDragActive
          ? "border-primary bg-primary/5"
          : "border-muted-foreground/25 hover:border-primary/50",
        (disabled || isUploading) && "opacity-50 cursor-not-allowed"
      )}
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center gap-2">
        {isUploading ? (
          <>
            <Loader2 className="h-10 w-10 text-muted-foreground animate-spin" />
            <p className="text-sm text-muted-foreground">Przesyłanie...</p>
          </>
        ) : (
          <>
            <Upload className="h-10 w-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              {isDragActive
                ? "Upuść plik tutaj..."
                : "Przeciągnij lub kliknij"}
            </p>
            {aspectHint && (
              <p className="text-xs text-muted-foreground">{aspectHint}</p>
            )}
            <p className="text-xs text-muted-foreground">
              JPG, PNG, WebP - max 10MB
            </p>
          </>
        )}
      </div>
    </div>
  );
};
