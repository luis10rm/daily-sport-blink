/**
 * Pure-JS HTML sanitizer used during SSR, where DOMPurify has no DOM available.
 * On the client DOMPurify is still used; this is a whitelist-based fallback so
 * the server can render article content into the first HTML response.
 */

const ALLOWED_TAGS = new Set([
  "p", "h2", "h3", "strong", "em", "a", "ul", "ol", "li", "br",
  "blockquote", "u", "s", "iframe", "div",
]);

const ALLOWED_ATTR = new Set([
  "href", "target", "rel", "src", "width", "height", "frameborder",
  "allow", "allowfullscreen", "title", "class",
]);

const YT_HOST = /^(www\.)?(youtube\.com|youtube-nocookie\.com|youtu\.be)$/i;

const isSafeUrl = (value: string) => {
  const v = value.trim().toLowerCase();
  if (v.startsWith("javascript:") || v.startsWith("data:") || v.startsWith("vbscript:")) return false;
  return true;
};

const isYouTubeSrc = (value: string) => {
  const m = value.trim().match(/^https?:\/\/([^/?#]+)/i);
  return !!m && YT_HOST.test(m[1]);
};

export const sanitizeHtmlServer = (html: string): string => {
  // Drop dangerous elements including their content.
  let out = html.replace(
    /<(script|style|iframe|object|embed|svg|math|form|input|button|textarea|link|meta)\b[\s\S]*?<\/\1\s*>/gi,
    (match, tag: string) => (tag.toLowerCase() === "iframe" ? match : ""),
  );

  // Rebuild every tag from the whitelist.
  out = out.replace(/<\/?([a-zA-Z0-9-]+)((?:[^>"']|"[^"]*"|'[^']*')*)\/?>/g, (_full, rawTag: string, rawAttrs: string) => {
    const tag = rawTag.toLowerCase();
    if (!ALLOWED_TAGS.has(tag)) return "";
    const isClosing = /^<\//.test(_full);
    if (isClosing) return `</${tag}>`;

    const attrs: string[] = [];
    const attrRe = /([a-zA-Z-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g;
    let m: RegExpExecArray | null;
    while ((m = attrRe.exec(rawAttrs))) {
      const name = m[1].toLowerCase();
      const value = m[2] ?? m[3] ?? m[4] ?? "";
      if (!ALLOWED_ATTR.has(name)) continue;
      if (name.startsWith("on")) continue;
      if ((name === "href" || name === "src") && !isSafeUrl(value)) continue;
      if (tag === "iframe" && name === "src" && !isYouTubeSrc(value)) return "";
      attrs.push(value ? `${name}="${value.replace(/"/g, "&quot;")}"` : name);
    }

    if (tag === "iframe" && !attrs.some((a) => a.startsWith("src="))) return "";
    const selfClosing = tag === "br";
    return `<${tag}${attrs.length ? " " + attrs.join(" ") : ""}${selfClosing ? " /" : ""}>`;
  });

  return out;
};
