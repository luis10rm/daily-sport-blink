import DOMPurify from "dompurify";
import { sanitizeHtmlServer } from "./sanitizeHtmlServer";

const ALLOWED_TAGS = [
  "p", "h2", "h3", "strong", "em", "a", "ul", "ol", "li", "br",
  "blockquote", "u", "s", "iframe", "div", "table", "thead", "tbody", "tr", "th", "td",
];

const ALLOWED_ATTR = [
  "href", "target", "rel", "src", "width", "height", "frameborder",
  "allow", "allowfullscreen", "title", "class",
];

/**
 * Sanitizes article HTML for rendering. Uses DOMPurify in the browser and a
 * whitelist-based pure-JS sanitizer during SSR (no DOM available there).
 */
export const sanitizeArticleHtml = (html: string): string => {
  if (!html) return "";
  if (typeof window === "undefined" || typeof (DOMPurify as any)?.sanitize !== "function") {
    return sanitizeHtmlServer(html);
  }

  const clean = DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOW_DATA_ATTR: false,
    ADD_ATTR: ["allowfullscreen"],
  });

  try {
    const doc = new DOMParser().parseFromString(clean, "text/html");
    doc.querySelectorAll("iframe").forEach((iframe) => {
      const src = iframe.getAttribute("src") || "";
      try {
        const u = new URL(src, window.location.origin);
        const ok = /(^|\.)youtube\.com$|(^|\.)youtube-nocookie\.com$|(^|\.)youtu\.be$/.test(u.hostname);
        if (!ok) iframe.remove();
      } catch {
        iframe.remove();
      }
    });
    return doc.body.innerHTML;
  } catch {
    return clean;
  }
};
