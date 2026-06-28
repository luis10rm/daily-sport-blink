import { cn } from "@/lib/utils";

interface Props {
  score: number | null | undefined;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const colorFor = (s: number) => {
  if (s >= 8.5) return "from-emerald-500 to-emerald-600";
  if (s >= 7) return "from-fuchsia-600 to-pink-600";
  if (s >= 5) return "from-amber-500 to-orange-500";
  return "from-rose-500 to-rose-600";
};

const sizes = {
  sm: "h-9 w-9 text-sm",
  md: "h-12 w-12 text-base",
  lg: "h-16 w-16 text-xl",
  xl: "h-24 w-24 text-3xl",
};

export const ScoreBadge = ({ score, size = "md", className }: Props) => {
  if (score === null || score === undefined) return null;
  return (
    <div
      className={cn(
        "inline-flex items-center justify-center rounded-2xl font-bold text-white shadow-lg bg-gradient-to-br",
        colorFor(score),
        sizes[size],
        className
      )}
      aria-label={`Ocena ${score} na 10`}
    >
      {Number(score).toFixed(1)}
    </div>
  );
};
