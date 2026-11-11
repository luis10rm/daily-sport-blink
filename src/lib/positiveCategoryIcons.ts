const defaults: Record<string, string> = {
  nauka: "FlaskConical", ludzie: "Users", natura: "Leaf", miasta: "Building2",
  zdrowie: "HeartPulse", swiat: "Globe", biznes: "TrendingUp", technologia: "Cpu", tech: "Cpu",
  polska: "MapPin", polityka: "Landmark", ekologia: "Sprout", kultura: "Palette",
  sport: "Medal", edukacja: "GraduationCap", zwierzeta: "PawPrint", inne: "Sun",
};

export function positiveCategoryIconName(category?: { slug?: string; icon_name?: string | null } | null) {
  const name = category?.icon_name?.trim();
  if (name) return name.split("-").map(part => part.charAt(0).toUpperCase() + part.slice(1)).join("");
  return defaults[category?.slug || ""] || "Sun";
}