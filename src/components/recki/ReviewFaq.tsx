import { useEffect } from "react";
import { HelpCircle, ChevronDown } from "lucide-react";

export interface FaqItem {
  q: string;
  a: string;
}

/** Normalizuje wartość z bazy (jsonb) do listy pełnych par pytanie/odpowiedź. */
export const normalizeFaq = (raw: unknown): FaqItem[] => {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item: any) => ({
      q: typeof item?.q === "string" ? item.q.trim() : "",
      a: typeof item?.a === "string" ? item.a.trim() : "",
    }))
    .filter((item) => item.q && item.a);
};

interface Props {
  items: FaqItem[];
  /** URL strony — używany w JSON-LD */
  canonicalUrl?: string;
}

export const ReviewFaq = ({ items, canonicalUrl }: Props) => {
  // FAQPage JSON-LD
  useEffect(() => {
    if (items.length === 0) return;
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.dataset.faqSchema = "true";
    script.text = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      ...(canonicalUrl ? { url: canonicalUrl } : {}),
      mainEntity: items.map((item) => ({
        "@type": "Question",
        name: item.q,
        acceptedAnswer: { "@type": "Answer", text: item.a },
      })),
    });
    document.head.appendChild(script);
    return () => {
      script.remove();
    };
  }, [items, canonicalUrl]);

  if (items.length === 0) return null;

  return (
    <section className="mb-8 rounded-2xl border border-fuchsia-500/30 bg-fuchsia-500/[0.04] p-5 sm:p-6">
      <h2 className="flex items-center gap-2 text-xl font-bold text-fuchsia-700 dark:text-fuchsia-300">
        <HelpCircle className="h-5 w-5 shrink-0" />
        Najczęstsze pytania
      </h2>
      <div className="mt-4 divide-y divide-fuchsia-500/15">
        {items.map((item, idx) => (
          <details
            key={idx}
            open={idx === 0}
            className="group py-3 first:pt-0 last:pb-0"
          >
            <summary className="flex cursor-pointer list-none items-start justify-between gap-3 font-semibold text-foreground marker:hidden">
              <h3 className="text-base leading-snug">{item.q}</h3>
              <ChevronDown className="mt-0.5 h-4 w-4 shrink-0 text-fuchsia-600 transition-transform group-open:rotate-180 dark:text-fuchsia-300" />
            </summary>
            <p className="mt-2 whitespace-pre-line pr-7 leading-relaxed text-muted-foreground">
              {item.a}
            </p>
          </details>
        ))}
      </div>
    </section>
  );
};
