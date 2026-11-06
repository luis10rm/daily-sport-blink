// Splits a leading bullet summary ("Najważniejsze w skrócie:" + <ul>) from article HTML
// so it can be shown in a highlighted box. Content without it is returned untouched.
const LEADING_SUMMARY_RE =
  /^\s*(?:<p[^>]*>\s*(?:<strong>|<b>)?\s*([^<]{2,60}?)\s*:?\s*(?:<\/strong>|<\/b>)?\s*:?\s*<\/p>\s*)?(<ul[^>]*>[\s\S]*?<\/ul>)/i;

export interface SplitSummary {
  heading: string | null;
  summaryHtml: string | null;
  bodyHtml: string;
}

export const splitLeadingSummary = (html: string): SplitSummary => {
  const m = html.match(LEADING_SUMMARY_RE);
  if (!m) return { heading: null, summaryHtml: null, bodyHtml: html };
  const heading = m[1]?.trim().replace(/:$/, "") || null;
  if (heading && !/skr[oó]cie|najważniejsze|kluczowe|podsumowanie/i.test(heading)) {
    return { heading: null, summaryHtml: null, bodyHtml: html };
  }
  return { heading, summaryHtml: m[2], bodyHtml: html.slice(m[0].length) };
};
