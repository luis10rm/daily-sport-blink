/**
 * Normalizes mixed HTML + Markdown content.
 * Converts Markdown syntax (like **bold**, *italic*) inside HTML tags to proper HTML.
 * 
 * Problem: When AI generates content like `<p>**Liverpool FC**</p>`, 
 * standard Markdown parsers don't process Markdown inside HTML blocks.
 * 
 * Solution: Parse HTML, traverse text nodes, apply inline Markdown conversion.
 */

/**
 * Convert inline Markdown patterns to HTML
 * Handles: **bold**, *italic*, ***bold italic***
 */
function convertInlineMarkdown(text: string): string {
  // Order matters: check *** first (bold+italic), then ** (bold), then * (italic)
  
  // Bold + italic: ***text***
  text = text.replace(/\*\*\*([^*]+)\*\*\*/g, '<strong><em>$1</em></strong>');
  
  // Bold: **text**
  text = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  
  // Italic: *text* (but not when inside a word like "can*t")
  // Only match when * is at word boundary or start/end
  text = text.replace(/(?<![a-zA-Z0-9])\*([^*]+)\*(?![a-zA-Z0-9])/g, '<em>$1</em>');
  
  return text;
}

/**
 * Check if content contains HTML tags
 */
function containsHtmlTags(content: string): boolean {
  return /<[a-z][^>]*>/i.test(content);
}

/**
 * Check if content contains Markdown bold/italic patterns
 */
function containsMarkdownPatterns(content: string): boolean {
  // Match **text** or *text* patterns
  return /\*\*([^*]+)\*\*|\*([^*]+)\*/.test(content);
}

/**
 * Normalize content by converting any Markdown syntax inside HTML to proper HTML tags.
 * 
 * @param content - The raw content (may be HTML, Markdown, or mixed)
 * @returns Clean HTML with all Markdown converted
 */
export function normalizeMarkdownInHtml(content: string): string {
  if (!content) return "";
  
  // If no Markdown patterns, return as-is (fast path)
  if (!containsMarkdownPatterns(content)) {
    return content;
  }
  
  // If it's pure Markdown (no HTML tags), just convert inline patterns
  if (!containsHtmlTags(content)) {
    return convertInlineMarkdown(content);
  }
  
  // Mixed HTML + Markdown: need to process text nodes only
  // Strategy: Use regex to find text between HTML tags and convert Markdown there
  
  // Split by HTML tags, process text parts, rejoin
  // This regex captures: (tag)(text between tags)
  const tagPattern = /(<[^>]+>)/g;
  const parts = content.split(tagPattern);
  
  const result = parts.map((part, index) => {
    // If it's an HTML tag (starts with <), keep as-is
    if (part.startsWith('<')) {
      return part;
    }
    // It's text content - convert Markdown
    return convertInlineMarkdown(part);
  });
  
  return result.join('');
}

export default normalizeMarkdownInHtml;
