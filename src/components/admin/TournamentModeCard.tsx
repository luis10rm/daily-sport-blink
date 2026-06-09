import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Trophy } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useSetting, useUpdateSetting } from "@/hooks/useSettings";
import { WORLD_CUP_START, WORLD_CUP_END } from "@/lib/worldCupTheme";

const fmt = (d: Date) =>
  d.toLocaleDateString("pl-PL", { day: "numeric", month: "long", year: "numeric" });

export const TournamentModeCard = () => {
  const { data: rawValue, isLoading } = useSetting("tournament_mode");
  const updateSetting = useUpdateSetting();

  const current = (rawValue || "off").replace(/^"|"$/g, "");
  const isOn = current === "worldcup_2026";

  const handleToggle = (checked: boolean) => {
    updateSetting.mutate({
      key: "tournament_mode",
      value: checked ? "worldcup_2026" : "off",
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-amber-500" />
          Tryb mundialowy 2026
        </CardTitle>
        <CardDescription>
          Włącza złoty re-skin serwisu, sticky pasek live i sekcję meczów dnia na czas MŚ.
          Działa tylko między {fmt(WORLD_CUP_START)} a {fmt(WORLD_CUP_END)} — po tej dacie
          tryb wyłącza się automatycznie.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-12 w-full" />
        ) : (
          <div className="flex items-center justify-between rounded-lg border border-border bg-card/40 p-4">
            <div>
              <Label htmlFor="tournament-mode" className="text-base font-semibold cursor-pointer">
                {isOn ? "Tryb mundialowy AKTYWNY" : "Tryb mundialowy wyłączony"}
              </Label>
              <p className="text-sm text-muted-foreground mt-1">
                {isOn
                  ? "Serwis wyświetla złotą kolorystykę i widgety MŚ. Wyłącz, by wrócić do normalnego wyglądu."
                  : "Po włączeniu cały serwis przejdzie w klimat mundialu. Możesz wyłączyć w 1 sekundzie."}
              </p>
            </div>
            <Switch
              id="tournament-mode"
              checked={isOn}
              onCheckedChange={handleToggle}
              disabled={updateSetting.isPending}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
};
