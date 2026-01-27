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
