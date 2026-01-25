import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { supabase } from "@/integrations/supabase/client";
import { Upload, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { ImageCropModal } from "./ImageCropModal";

interface ImageUploaderProps {
  value?: string;
  onChange: (url: string) => void;
  onRemove: () => void;
  disabled?: boolean;
  enableCrop?: boolean;
  cropAspect?: number;
  storageBucket?: string;
  storagePath?: string;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_TYPES = {
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "image/webp": [".webp"],
};

export const ImageUploader = ({
  value,
  onChange,
  onRemove,
  disabled,
  enableCrop = false,
  cropAspect = 1,
  storageBucket = "post-images",
  storagePath = "posts",
}: ImageUploaderProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [pendingImage, setPendingImage] = useState<string | null>(null);

  const uploadFile = async (file: File) => {
    setIsUploading(true);
    try {
      const fileExt = file.name.split(".").pop() || "jpg";
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const filePath = `${storagePath}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from(storageBucket)
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data } = supabase.storage
        .from(storageBucket)
        .getPublicUrl(filePath);

      onChange(data.publicUrl);
      toast.success("Obrazek został przesłany");
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error(`Błąd przesyłania: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        const file = acceptedFiles[0];
        if (file.size > MAX_FILE_SIZE) {
          toast.error("Plik jest za duży. Maksymalny rozmiar to 5MB.");
          return;
        }

        if (enableCrop) {
          const reader = new FileReader();
          reader.onload = () => {
            setPendingImage(reader.result as string);
            setCropModalOpen(true);
          };
          reader.readAsDataURL(file);
        } else {
          uploadFile(file);
        }
      }
    },
    [enableCrop]
  );

  const handleCropComplete = async (croppedBlob: Blob) => {
    setCropModalOpen(false);
    setPendingImage(null);

    const file = new File([croppedBlob], `cropped-${Date.now()}.jpg`, {
      type: "image/jpeg",
    });
    await uploadFile(file);
  };

  const handleCropClose = () => {
    setCropModalOpen(false);
    setPendingImage(null);
  };

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
          src={value}
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
      </div>
    );
  }

  return (
    <>
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
                  : "Przeciągnij plik lub kliknij aby wybrać"}
              </p>
              <p className="text-xs text-muted-foreground">
                JPG, PNG, WebP - max 5MB
              </p>
            </>
          )}
        </div>
      </div>

      {enableCrop && pendingImage && (
        <ImageCropModal
          open={cropModalOpen}
          onClose={handleCropClose}
          imageSrc={pendingImage}
          aspect={cropAspect}
          onCropComplete={handleCropComplete}
        />
      )}
    </>
  );
};
