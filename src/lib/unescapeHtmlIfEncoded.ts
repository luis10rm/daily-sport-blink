/**
 * Detects HTML that was pasted/stored with escaped entities (e.g. `&lt;p&gt;&lt;strong&gt;...`)
 * and decodes it back to real HTML. Idempotent — safe to call on already-clean content.
 *
 * Handles the common case where a user copies HTML from "view source" / a code block
 * (ChatGPT canvas, docs, GitHub) and the clipboard delivers already-escaped markup.
 */

const ENCODED_TAG_RE = /&lt;\/?[a-z][^&]{0,200}&gt;/i;

export function looksLikeEncodedHtml(s: string): boolean {
  if (!s) return false;
  return ENCODED_TAG_RE.test(s);
}

function decodeEntitiesOnce(s: string): string {
  return s
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&");
}

/**
 * If the content contains encoded HTML tags (like `&lt;p&gt;`), decode entities and
 * return real HTML. Otherwise return the input unchanged.
 * Runs iteratively (max 3 passes) to handle double-encoding.
 */
export function unescapeHtmlIfEncoded(content: string): string {
  if (!content) return content;
  let out = content;
  let passes = 0;
  while (looksLikeEncodedHtml(out) && passes < 3) {
    out = decodeEntitiesOnce(out);
    passes++;
  }
  return out;
}

export default unescapeHtmlIfEncoded;
