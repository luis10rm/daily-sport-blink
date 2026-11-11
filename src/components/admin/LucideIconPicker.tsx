import { useState } from "react";
import { icons } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { positiveCategoryIconName } from "@/lib/positiveCategoryIcons";

const popular = ["Sun", "Heart", "Smile", "Sparkles", "Leaf", "Sprout", "FlaskConical", "Users", "Globe", "Building2", "Cpu", "TrendingUp", "HandHeart", "Lightbulb", "MapPin", "Landmark", "HeartPulse", "Palette", "GraduationCap", "PawPrint", "Medal", "BookOpen", "TreePine", "Rocket"];
const names = Object.keys(icons).filter(name => !name.endsWith("Icon")).sort();

export function LucideIconPicker({ value, onChange }: { value?: string; onChange: (name: string) => void }) {
  const [query, setQuery] = useState("");
  const selected = positiveCategoryIconName({ icon_name: value });
  const matches = query.trim() ? names.filter(name => name.toLowerCase().includes(query.trim().toLowerCase())) : popular;
  return (
    <div className="space-y-3">
      <Input aria-label="Szukaj ikony Lucide" placeholder="Szukaj ikony, np. Heart, Leaf, Globe…" value={query} onChange={event => setQuery(event.target.value)} />
      <div className="grid max-h-64 grid-cols-4 gap-2 overflow-y-auto p-1 sm:grid-cols-8" role="group" aria-label="Paleta ikon Lucide">
        {matches.map(name => {
          const Icon = icons[name as keyof typeof icons];
          return (
            <Button key={name} type="button" variant="outline" aria-label={`Wybierz ikonę ${name}`} title={name} aria-pressed={selected === name} onClick={() => onChange(name)}
              className={cn("h-12 min-w-11 px-0", selected === name && "border-primary bg-primary/10 text-link")}>
              <Icon className="h-5 w-5" />
            </Button>
          );
        })}
      </div>
      {matches.length === 0 && <p className="text-sm text-muted-foreground">Brak pasujących ikon.</p>}
    </div>
  );
}