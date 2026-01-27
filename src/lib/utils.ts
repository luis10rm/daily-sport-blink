import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Extracts a readable source name from a URL
 * @example getSourceName("https://www.sportowefakty.wp.pl/...") → "sportowefakty.wp.pl"
 */
export function getSourceName(url: string): string {
  try {
    const hostname = new URL(url).hostname;
    return hostname.replace(/^www\./, "");
  } catch {
    return "Źródło zewnętrzne";
  }
}

/**
 * Generates a URL-friendly slug from Polish text
 * @example generateSlug("Robert Lewandowski") → "robert-lewandowski"
 * @example generateSlug("Iga Świątek") → "iga-swiatek"
 */
export function generateSlug(text: string): string {
  const polishChars: Record<string, string> = {
    ą: "a", ć: "c", ę: "e", ł: "l", ń: "n",
    ó: "o", ś: "s", ź: "z", ż: "z",
    Ą: "a", Ć: "c", Ę: "e", Ł: "l", Ń: "n",
    Ó: "o", Ś: "s", Ź: "z", Ż: "z",
  };

  return text
    .split("")
    .map((char) => polishChars[char] || char)
    .join("")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}
