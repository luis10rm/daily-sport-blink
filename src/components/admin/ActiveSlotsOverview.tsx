import { useNavigate } from "react-router-dom";
import { useActiveBannerForDevice, useActiveBannersCountForDevice, BannerPosition } from "@/hooks/useBanners";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Pencil, Plus, CheckCircle2, XCircle, Monitor, Smartphone } from "lucide-react";

interface SlotInfo {
  position: BannerPosition;
  label: string;
  description: string;
}

const slots: SlotInfo[] = [
  { position: "home_top", label: "Góra strony", description: "Nad sekcją 'Dzisiejsze wiadomości'" },
  { position: "home_middle", label: "Środek strony", description: "Między newsem dnia a listą artykułów" },
  { position: "home_bottom", label: "Dół strony", description: "Pod listą artykułów" },
];

const DeviceSlotStatus = ({ 
  slot, 
  device 
}: { 
  slot: SlotInfo; 
  device: "desktop" | "mobile" 
}) => {
  const navigate = useNavigate();
  const { data: banner, isLoading } = useActiveBannerForDevice(slot.position, device);

  const Icon = device === "desktop" ? Monitor : Smartphone;
  const deviceLabel = device === "desktop" ? "Desktop" : "Mobile";

  return (
    <div className="flex items-center justify-between gap-3 py-2 border-b last:border-b-0">
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <Icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        <span className="text-sm font-medium">{deviceLabel}</span>
        {isLoading ? (
          <Badge variant="outline" className="text-xs">...</Badge>
        ) : banner ? (
          <Badge className="bg-green-500/10 text-green-600 text-xs">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Aktywny
          </Badge>
        ) : (
          <Badge variant="secondary" className="text-xs">
            <XCircle className="h-3 w-3 mr-1" />
            Placeholder
          </Badge>
        )}
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground truncate max-w-[120px]">
          {isLoading ? "" : banner ? banner.title : "Brak"}
        </span>
        {banner ? (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2"
            onClick={() => navigate(`/admin/banners/${banner.id}/edit`)}
          >
            <Pencil className="h-3 w-3" />
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2"
            onClick={() => navigate("/admin/banners/new")}
          >
            <Plus className="h-3 w-3" />
          </Button>
        )}
      </div>
    </div>
  );
};

const SlotItem = ({ slot }: { slot: SlotInfo }) => {
  return (
    <div className="p-4 rounded-lg border bg-card">
      <div className="mb-2">
        <span className="font-medium">{slot.label}</span>
        <p className="text-xs text-muted-foreground">{slot.description}</p>
      </div>
      <div className="mt-3">
        <DeviceSlotStatus slot={slot} device="desktop" />
        <DeviceSlotStatus slot={slot} device="mobile" />
      </div>
    </div>
  );
};

export const ActiveSlotsOverview = () => {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          Aktywne sloty na stronie głównej
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Status banerów dla każdej pozycji i urządzenia
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {slots.map((slot) => (
          <SlotItem key={slot.position} slot={slot} />
        ))}
      </CardContent>
    </Card>
  );
};
