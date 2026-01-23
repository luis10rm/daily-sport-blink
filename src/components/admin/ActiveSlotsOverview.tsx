import { useNavigate } from "react-router-dom";
import { useActiveBanner, BannerPosition } from "@/hooks/useBanners";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Pencil, Plus, CheckCircle2, XCircle } from "lucide-react";

interface SlotInfo {
  position: BannerPosition;
  label: string;
  description: string;
}

const slots: SlotInfo[] = [
  { position: "home_top", label: "Góra strony", description: "Wyświetla się nad sekcją 'Dzisiejsze wiadomości'" },
  { position: "home_middle", label: "Środek strony", description: "Wyświetla się między newsem dnia a listą artykułów" },
  { position: "home_bottom", label: "Dół strony", description: "Wyświetla się pod listą artykułów" },
];

const SlotItem = ({ slot }: { slot: SlotInfo }) => {
  const navigate = useNavigate();
  const { data: banner, isLoading } = useActiveBanner(slot.position);

  return (
    <div className="flex items-center justify-between gap-4 p-4 rounded-lg border bg-card">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium">{slot.label}</span>
          {isLoading ? (
            <Badge variant="outline" className="text-xs">Ładowanie...</Badge>
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
        <p className="text-sm text-muted-foreground truncate">
          {isLoading ? "..." : banner ? banner.title : "Brak aktywnego banera – widoczny placeholder"}
        </p>
        <p className="text-xs text-muted-foreground/70 mt-0.5">{slot.description}</p>
      </div>
      <div>
        {banner ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/admin/banners/${banner.id}/edit`)}
          >
            <Pencil className="h-3.5 w-3.5 mr-1.5" />
            Edytuj
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/admin/banners/new")}
          >
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            Dodaj
          </Button>
        )}
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
      </CardHeader>
      <CardContent className="space-y-3">
        {slots.map((slot) => (
          <SlotItem key={slot.position} slot={slot} />
        ))}
      </CardContent>
    </Card>
  );
};
