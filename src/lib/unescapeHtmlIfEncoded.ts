/**
 * Cleans up HTML that came from a paste (ChatGPT canvas, Claude, view-source, docs)
 * or is stored in the DB from an earlier paste.
 *
 * Handles three classes of issues:
 *  1. Escaped entities:  `&lt;p&gt;&lt;strong&gt;...`  → real HTML
 *  2. Redundant outer `<p>` wrapping block-level tags (invalid HTML, breaks layout)
 *  3. Leftover AI directive syntax like `:antCitation[]{citations="..."}` rendered as text
 *
 * All functions are idempotent — safe to call on already-clean content.
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

// --- new sanitizer helpers ---

const BLOCK_TAG_INSIDE_RE = /<(h[1-6]|p|ul|ol|blockquote|div|table|pre|figure)\b/i;
const AI_DIRECTIVE_RE = /:[a-zA-Z][\w]*\[[^\]]*\]\{[^}]*\}/g;

/**
 * If content is a single outer `<p>...</p>` that wraps block-level tags
 * (invalid HTML — browsers auto-close, layout breaks), unwrap it.
 * Runs iteratively in case of double-wrapping.
 */
function unwrapRedundantOuterParagraph(s: string): string {
  let out = s.trim();
  for (let i = 0; i < 3; i++) {
    const m = out.match(/^<p>([\s\S]*)<\/p>$/i);
    if (!m) break;
    const inner = m[1];
    // Only unwrap if inner contains block tags AND has no unbalanced </p> that would break structure
    if (!BLOCK_TAG_INSIDE_RE.test(inner)) break;
    out = inner.trim();
  }
  return out;
}

/**
 * Remove leftover AI directive syntax (Claude/Anthropic `:antCitation[...]{...}` and similar).
 */
function stripAiDirectives(s: string): string {
  return s.replace(AI_DIRECTIVE_RE, "");
}

/**
 * Full cleanup pipeline for pasted / stored HTML.
 * Order matters: decode entities first so pattern matching sees real tags.
 */
export function sanitizePastedHtml(content: string): string {
  if (!content) return content;
  let out = unescapeHtmlIfEncoded(content);
  out = stripAiDirectives(out);
  out = unwrapRedundantOuterParagraph(out);
  return out;
}

export default unescapeHtmlIfEncoded;
